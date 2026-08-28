package app

import (
	"encoding/json"
	"fmt"
	"strings"
	"telepresence-gui/internal/models"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) startBackgroundWatcher() {
	ticker := time.NewTicker(4 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			a.checkTelepresenceChanges()
		}
	}
}

func (a *App) startGRPCWorkloadStream() {
	grpcClient := a.teleService.GRPC()
	if !grpcClient.IsConnected() {
		_ = grpcClient.Connect(a.ctx)
	}
	if !grpcClient.IsConnected() {
		return
	}

	_ = grpcClient.StartWatchWorkloads(
		a.ctx,
		nil,
		func(workloads []models.Workload) {
			rawJSON, _ := json.Marshal(workloads)
			strJSON := string(rawJSON)

			a.statusMu.Lock()
			listChanged := strJSON != a.lastListRaw
			if listChanged {
				a.lastListRaw = strJSON
			}
			a.statusMu.Unlock()

			if listChanged {
				runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Workloads (gRPC Stream)] Workload list synchronized (%d workloads)", len(workloads)))
				runtime.EventsEmit(a.ctx, "workloads-changed", workloads)
			}
		},
		func(err error) {
			runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[gRPC Stream] Workload stream update: %v (falling back to heartbeat polling)", err))
		},
	)
}

func (a *App) checkTelepresenceChanges() {
	if !a.pollMu.TryLock() {
		return
	}
	defer a.pollMu.Unlock()

	if !a.teleService.TryLock() {
		return
	}
	defer a.teleService.Unlock()

	rawStatus, status, err := a.teleService.StatusNoLock(a.ctx)
	if err == nil && rawStatus != "" {
		a.statusMu.Lock()
		statusChanged := rawStatus != a.lastStatusRaw
		if statusChanged {
			a.lastStatusRaw = rawStatus
		}
		a.statusMu.Unlock()

		if statusChanged && status != nil {
			connected := status.UserDaemon.Running && strings.EqualFold(status.UserDaemon.Status, "Connected")
			runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Status] Daemon status updated: UserDaemon=%s (Running=%v), RootDaemon Running=%v", status.UserDaemon.Status, status.UserDaemon.Running, status.RootDaemon.Running))
			a.updateConnectionStatus(connected)
			runtime.EventsEmit(a.ctx, "telepresence-status-changed", status)
		}
	}

	a.statusMu.Lock()
	connected := a.isConnected
	a.statusMu.Unlock()

	if connected {
		// Ensure gRPC client is connected and stream is active
		if !a.teleService.GRPC().IsConnected() {
			if err := a.teleService.GRPC().Connect(a.ctx); err == nil {
				a.startGRPCWorkloadStream()
			}
		}

		rawList, workloads, err := a.teleService.ListWorkloadsRawNoLock(a.ctx)
		if err == nil {
			a.statusMu.Lock()
			listChanged := rawList != a.lastListRaw
			if listChanged {
				a.lastListRaw = rawList
			}
			a.statusMu.Unlock()

			if listChanged {
				runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Workloads] Workload list synchronized (%d workloads found)", len(workloads)))
				runtime.EventsEmit(a.ctx, "workloads-changed", workloads)
			}
		}
	} else {
		a.statusMu.Lock()
		a.lastListRaw = ""
		a.statusMu.Unlock()
	}
}
