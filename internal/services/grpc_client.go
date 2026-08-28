package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"telepresence-gui/internal/models"
	"time"

	"github.com/telepresenceio/telepresence/rpc/v2/connector"
	"github.com/telepresenceio/telepresence/rpc/v2/daemon"
	"github.com/telepresenceio/telepresence/rpc/v2/manager"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/types/known/emptypb"
)

// DaemonPortInfo represents rootd daemon.json content
type DaemonPortInfo struct {
	DaemonPort int `json:"daemon_port"`
}

type TelepresenceGRPCClient struct {
	mu           sync.RWMutex
	conn         *grpc.ClientConn
	daemonConn   *grpc.ClientConn
	client       connector.ConnectorClient
	daemonClient daemon.DaemonClient
	activeSocket string
	isConnected  bool

	watchCancel context.CancelFunc
	watchMu     sync.Mutex
}

func NewTelepresenceGRPCClient() *TelepresenceGRPCClient {
	return &TelepresenceGRPCClient{}
}

// LocatePossibleSockets returns candidate socket paths based on the operating system
func (g *TelepresenceGRPCClient) LocatePossibleSockets() []string {
	var candidates []string

	if runtime.GOOS == "windows" {
		localAppData := os.Getenv("LOCALAPPDATA")
		if localAppData != "" {
			candidates = append(candidates,
				filepath.Join(localAppData, "telepresence", "userd.socket"),
				filepath.Join(localAppData, "telepresence", "connector.socket"),
				filepath.Join(localAppData, "telepresence", "userd", "userd.socket"),
			)
		}
		appData := os.Getenv("APPDATA")
		if appData != "" {
			candidates = append(candidates,
				filepath.Join(appData, "telepresence", "userd.socket"),
			)
		}
		tempDir := os.TempDir()
		candidates = append(candidates,
			filepath.Join(tempDir, "telepresence-connector.socket"),
			filepath.Join(tempDir, "userd.socket"),
		)
	} else {
		candidates = append(candidates,
			"/tmp/telepresence-connector.socket",
			"/tmp/userd.socket",
		)
		if xdgRuntime := os.Getenv("XDG_RUNTIME_DIR"); xdgRuntime != "" {
			candidates = append(candidates,
				filepath.Join(xdgRuntime, "telepresence", "connector.socket"),
				filepath.Join(xdgRuntime, "telepresence", "userd.socket"),
			)
		}
		if home := os.Getenv("HOME"); home != "" {
			candidates = append(candidates,
				filepath.Join(home, ".cache", "telepresence", "userd.socket"),
				filepath.Join(home, ".cache", "telepresence", "connector.socket"),
			)
		}
	}

	return candidates
}

// LocateRootDaemonPort checks rootd/daemon.json for active root daemon port
func (g *TelepresenceGRPCClient) LocateRootDaemonPort() int {
	var daemonJsonPath string
	if runtime.GOOS == "windows" {
		localAppData := os.Getenv("LOCALAPPDATA")
		if localAppData != "" {
			daemonJsonPath = filepath.Join(localAppData, "telepresence", "rootd", "daemon.json")
		}
	} else {
		if xdgRuntime := os.Getenv("XDG_RUNTIME_DIR"); xdgRuntime != "" {
			daemonJsonPath = filepath.Join(xdgRuntime, "telepresence", "rootd", "daemon.json")
		}
		if daemonJsonPath == "" || !fileExists(daemonJsonPath) {
			if home := os.Getenv("HOME"); home != "" {
				daemonJsonPath = filepath.Join(home, ".cache", "telepresence", "rootd", "daemon.json")
			}
		}
	}

	if daemonJsonPath != "" && fileExists(daemonJsonPath) {
		data, err := os.ReadFile(daemonJsonPath)
		if err == nil {
			var info DaemonPortInfo
			if err := json.Unmarshal(data, &info); err == nil && info.DaemonPort > 0 {
				return info.DaemonPort
			}
		}
	}
	return 0
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

// Connect attempts to connect to the Telepresence User Daemon gRPC server
func (g *TelepresenceGRPCClient) Connect(ctx context.Context) error {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.isConnected && g.client != nil {
		return nil
	}

	candidates := g.LocatePossibleSockets()
	var dialErr error
	var connectedConn *grpc.ClientConn
	var matchedSocket string

	for _, socketPath := range candidates {
		if !fileExists(socketPath) {
			continue
		}

		dialCtx, cancel := context.WithTimeout(ctx, 1500*time.Millisecond)
		conn, err := grpc.DialContext(
			dialCtx,
			"passthrough:///userd",
			grpc.WithTransportCredentials(insecure.NewCredentials()),
			grpc.WithBlock(),
			grpc.WithContextDialer(func(ctx context.Context, _ string) (net.Conn, error) {
				var d net.Dialer
				return d.DialContext(ctx, "unix", socketPath)
			}),
		)
		cancel()

		if err == nil {
			// Verify by calling Version or Status
			client := connector.NewConnectorClient(conn)
			testCtx, testCancel := context.WithTimeout(ctx, 1500*time.Millisecond)
			_, testErr := client.Version(testCtx, &emptypb.Empty{})
			testCancel()

			if testErr == nil {
				connectedConn = conn
				matchedSocket = socketPath
				g.client = client
				break
			}
			_ = conn.Close()
		} else {
			dialErr = err
		}
	}

	if connectedConn == nil {
		if dialErr != nil {
			return fmt.Errorf("unable to connect to telepresence user daemon: %w", dialErr)
		}
		return errors.New("telepresence user daemon socket not found or not active")
	}

	g.conn = connectedConn
	g.activeSocket = matchedSocket
	g.isConnected = true

	// Also try connecting to Root Daemon if port is available
	if rootPort := g.LocateRootDaemonPort(); rootPort > 0 {
		rootTarget := fmt.Sprintf("127.0.0.1:%d", rootPort)
		rootCtx, rootCancel := context.WithTimeout(ctx, 1500*time.Millisecond)
		dConn, dErr := grpc.DialContext(
			rootCtx,
			rootTarget,
			grpc.WithTransportCredentials(insecure.NewCredentials()),
			grpc.WithBlock(),
		)
		rootCancel()
		if dErr == nil {
			g.daemonConn = dConn
			g.daemonClient = daemon.NewDaemonClient(dConn)
		}
	}

	return nil
}

// Disconnect closes gRPC connections and cancels streams
func (g *TelepresenceGRPCClient) Disconnect() {
	g.StopWatchWorkloads()

	g.mu.Lock()
	defer g.mu.Unlock()

	if g.conn != nil {
		_ = g.conn.Close()
		g.conn = nil
	}
	if g.daemonConn != nil {
		_ = g.daemonConn.Close()
		g.daemonConn = nil
	}
	g.client = nil
	g.daemonClient = nil
	g.isConnected = false
	g.activeSocket = ""
}

func (g *TelepresenceGRPCClient) IsConnected() bool {
	g.mu.RLock()
	defer g.mu.RUnlock()
	return g.isConnected && g.client != nil
}

// GetStatus queries connector and root daemon status directly via gRPC
func (g *TelepresenceGRPCClient) GetStatus(ctx context.Context) (*models.TelepresenceStatusOutput, error) {
	g.mu.RLock()
	client := g.client
	daemonCli := g.daemonClient
	g.mu.RUnlock()

	if client == nil {
		return nil, errors.New("telepresence gRPC client is not connected")
	}

	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	connectInfo, err := client.Status(ctx, &emptypb.Empty{})
	if err != nil {
		return nil, fmt.Errorf("failed to query connector status via gRPC: %w", err)
	}

	status := &models.TelepresenceStatusOutput{}
	status.UserDaemon.Running = true
	status.UserDaemon.Status = "Connected"
	if connectInfo.ClusterContext != "" {
		status.UserDaemon.KubernetesContext = connectInfo.ClusterContext
	}
	if connectInfo.Namespace != "" {
		status.UserDaemon.Namespace = connectInfo.Namespace
	}
	if connectInfo.ManagerNamespace != "" {
		status.UserDaemon.ManagerNamespace = connectInfo.ManagerNamespace
	}

	if connectInfo.ManagerVersion != nil {
		status.TrafficManager.Name = "Traffic Manager"
		status.TrafficManager.Version = connectInfo.ManagerVersion.Version
	}

	if daemonCli != nil {
		dStatus, dErr := daemonCli.Status(ctx, &emptypb.Empty{})
		if dErr == nil && dStatus != nil {
			status.RootDaemon.Running = true
			status.RootDaemon.Name = "Root Daemon"
			if dVer, vErr := daemonCli.Version(ctx, &emptypb.Empty{}); vErr == nil && dVer != nil {
				status.RootDaemon.Version = dVer.Version
			}
		}
	} else if connectInfo.DaemonStatus != nil {
		status.RootDaemon.Running = true
		status.RootDaemon.Name = "Root Daemon"
	}

	return status, nil
}

// ListWorkloads queries workloads directly via gRPC List
func (g *TelepresenceGRPCClient) ListWorkloads(ctx context.Context, namespace string) ([]models.Workload, error) {
	g.mu.RLock()
	client := g.client
	g.mu.RUnlock()

	if client == nil {
		return nil, errors.New("telepresence gRPC client is not connected")
	}

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	snapshot, err := client.List(ctx, &connector.ListRequest{
		Namespace: namespace,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list workloads via gRPC: %w", err)
	}

	return ConvertProtoSnapshot(snapshot), nil
}

// StartWatchWorkloads subscribes to real-time workload stream from User Daemon
func (g *TelepresenceGRPCClient) StartWatchWorkloads(
	parentCtx context.Context,
	namespaces []string,
	onUpdate func([]models.Workload),
	onError func(error),
) error {
	g.watchMu.Lock()
	if g.watchCancel != nil {
		g.watchCancel()
	}

	g.mu.RLock()
	client := g.client
	g.mu.RUnlock()

	if client == nil {
		g.watchMu.Unlock()
		return errors.New("telepresence gRPC client is not connected")
	}

	ctx, cancel := context.WithCancel(parentCtx)
	g.watchCancel = cancel
	g.watchMu.Unlock()

	go func() {
		defer cancel()

		stream, err := client.WatchWorkloads(ctx, &connector.WatchWorkloadsRequest{
			Namespaces: namespaces,
		})
		if err != nil {
			if onError != nil {
				onError(err)
			}
			return
		}

		for {
			select {
			case <-ctx.Done():
				return
			default:
			}

			snapshot, err := stream.Recv()
			if err != nil {
				if errors.Is(err, io.EOF) || errors.Is(err, context.Canceled) {
					return
				}
				if onError != nil {
					onError(err)
				}
				return
			}

			workloads := ConvertProtoSnapshot(snapshot)
			if onUpdate != nil {
				onUpdate(workloads)
			}
		}
	}()

	return nil
}

// StopWatchWorkloads cancels active workload stream
func (g *TelepresenceGRPCClient) StopWatchWorkloads() {
	g.watchMu.Lock()
	defer g.watchMu.Unlock()
	if g.watchCancel != nil {
		g.watchCancel()
		g.watchCancel = nil
	}
}

// Model conversions from Telepresence Protobuf to application models

func ConvertProtoSnapshot(snapshot *connector.WorkloadInfoSnapshot) []models.Workload {
	if snapshot == nil || snapshot.Workloads == nil {
		return []models.Workload{}
	}

	workloads := make([]models.Workload, 0, len(snapshot.Workloads))
	for _, wl := range snapshot.Workloads {
		workloads = append(workloads, ConvertProtoWorkload(wl))
	}
	return workloads
}

func ConvertProtoWorkload(wl *connector.WorkloadInfo) models.Workload {
	if wl == nil {
		return models.Workload{}
	}

	intercepts := make([]models.InterceptInfo, 0, len(wl.InterceptInfo))
	for _, ic := range wl.InterceptInfo {
		intercepts = append(intercepts, ConvertProtoIntercept(ic))
	}

	return models.Workload{
		Name:                   wl.Name,
		Namespace:              wl.Namespace,
		WorkloadResourceType:   wl.WorkloadResourceType,
		UID:                    wl.Uid,
		DesiredReplicas:        int(wl.DesiredReplicas),
		ReadyReplicas:          int(wl.ReadyReplicas),
		AgentVersion:           wl.AgentVersion,
		NotInterceptableReason: wl.NotInterceptableReason,
		InterceptInfo:          intercepts,
	}
}

func ConvertProtoIntercept(ic *manager.InterceptInfo) models.InterceptInfo {
	if ic == nil {
		return models.InterceptInfo{}
	}

	var session models.ClientSession
	if ic.ClientSession != nil {
		session = models.ClientSession{
			SessionID:        ic.ClientSession.GetSessionId(),
			ManagerInstallID: ic.ClientSession.GetManagerInstallId(),
			InstallID:        ic.ClientSession.GetInstallId(),
		}
	}

	var spec models.InterceptSpec
	if ic.Spec != nil {
		spec = models.InterceptSpec{
			Name:             ic.Spec.Name,
			Client:           ic.Spec.Client,
			Agent:            ic.Spec.Agent,
			WorkloadKind:     ic.Spec.WorkloadKind,
			Namespace:        ic.Spec.Namespace,
			Mechanism:        ic.Spec.Mechanism,
			TargetHost:       ic.Spec.TargetHost,
			PortIdentifier:   ic.Spec.PortIdentifier,
			ServicePortName:  ic.Spec.ServicePortName,
			ServicePort:      int(ic.Spec.ServicePort),
			ServiceUID:       ic.Spec.ServiceUid,
			Protocol:         ic.Spec.Protocol,
			ContainerName:    ic.Spec.ContainerName,
			ContainerPort:    int(ic.Spec.ContainerPort),
			TargetPort:       int(ic.Spec.TargetPort),
			RoundtripLatency: ic.Spec.RoundtripLatency,
			DialTimeout:      ic.Spec.DialTimeout,
			Replace:          ic.Spec.Replace,
			Wiretap:          ic.Spec.Wiretap,
			NoDefaultPort:    ic.Spec.NoDefaultPort,
			HeaderFilters:    ic.Spec.HeaderFilters,
			Plaintext:        ic.Spec.Plaintext,
			NodeAgent:        ic.Spec.NodeAgent,
		}
	}

	mounts := make(map[string]int)
	for k, v := range ic.Mounts {
		mounts[k] = int(v)
	}

	var modifiedAt models.Timestamp
	if ic.ModifiedAt != nil {
		modifiedAt = models.Timestamp{
			Seconds: ic.ModifiedAt.Seconds,
			Nanos:   ic.ModifiedAt.Nanos,
		}
	}

	return models.InterceptInfo{
		Spec:              spec,
		ID:                ic.Id,
		ClientSession:     session,
		Disposition:       int(ic.Disposition),
		PodName:           ic.PodName,
		APIPort:           int(ic.ApiPort),
		PodIP:             ic.PodIp,
		SFTPPort:          int(ic.SftpPort),
		FTPPort:           int(ic.FtpPort),
		MountPoint:        ic.MountPoint,
		MechanismArgsDesc: ic.MechanismArgsDesc,
		Environment:       ic.Environment,
		Mounts:            mounts,
		ModifiedAt:        modifiedAt,
	}
}
