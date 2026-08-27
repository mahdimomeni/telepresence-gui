package app

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"
	"telepresence-gui/internal/models"
	"telepresence-gui/internal/services"
	"time"

	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx           context.Context
	teleService   *services.TelepresenceService
	kubeService   *services.KubeService
	configService *services.ConfigService
	updateService *services.UpdateService
	logTailer     *services.LogTailer

	pollMu        sync.Mutex
	statusMu      sync.Mutex
	isConnected   bool
	lastStatusRaw string
	lastListRaw   string

	linuxTrayIcon   []byte
	darwinTrayIcon  []byte
	windowsTrayIcon []byte
}

func NewApp(
	teleService *services.TelepresenceService,
	kubeService *services.KubeService,
	configService *services.ConfigService,
	updateService *services.UpdateService,
	linuxTrayIcon []byte,
	darwinTrayIcon []byte,
	windowsTrayIcon []byte,
) *App {
	return &App{
		teleService:     teleService,
		kubeService:     kubeService,
		configService:   configService,
		updateService:   updateService,
		logTailer:       services.NewLogTailer(),
		linuxTrayIcon:   linuxTrayIcon,
		darwinTrayIcon:  darwinTrayIcon,
		windowsTrayIcon: windowsTrayIcon,
	}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	if err := runtime.InitializeNotifications(a.ctx); err != nil {
		log.Printf("Failed to initialize notifications: %v", err)
	} else if runtime.IsNotificationAvailable(a.ctx) {
		if auth, _ := runtime.CheckNotificationAuthorization(a.ctx); !auth {
			_, _ = runtime.RequestNotificationAuthorization(a.ctx)
		}
	}

	// Start Telepresence log files tailer (connector.log, daemon.log, cli.log)
	a.logTailer.Start(a.ctx)

	go a.startBackgroundWatcher()

	a.setupSystemTray()

	go func() {
		time.Sleep(2 * time.Second)
		info, err := a.updateService.CheckForUpdate(a.ctx)
		if err == nil && info != nil && info.Available {
			runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Update] New version available: v%s (Current: v%s)", info.LatestVersion, info.CurrentVersion))
			runtime.EventsEmit(a.ctx, "update:available", info)
		}
	}()
}

func (a *App) CheckForUpdates() (*services.UpdateInfo, error) {
	runtime.EventsEmit(a.ctx, "daemon-log", "[Update] Checking for updates...")
	info, err := a.updateService.CheckForUpdate(a.ctx)
	if err != nil {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Update Error] Check failed: %v", err))
		return nil, err
	}
	if info != nil && info.Available {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Update] New version available: v%s", info.LatestVersion))
	} else {
		runtime.EventsEmit(a.ctx, "daemon-log", "[Update] App is up to date.")
	}
	return info, nil
}

func (a *App) DownloadAndInstallUpdate() error {
	log.Println("[AutoUpdate] DownloadAndInstallUpdate requested from frontend")
	runtime.EventsEmit(a.ctx, "daemon-log", "[Update] Starting update download and installation...")

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[AutoUpdate] Panic during update: %v\n", r)
				runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Update Error] Internal panic: %v", r))
				runtime.EventsEmit(a.ctx, "update:progress", services.UpdateProgress{
					Status: "error",
					Error:  fmt.Sprintf("internal panic: %v", r),
				})
			}
		}()

		err := a.updateService.DownloadAndApply(a.ctx, func(p services.UpdateProgress) {
			log.Printf("[AutoUpdate] Progress: %d%% (%s)\n", p.Percentage, p.Status)
			runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Update Progress] %d%% - %s", p.Percentage, p.Status))
			runtime.EventsEmit(a.ctx, "update:progress", p)
		})

		if err != nil {
			log.Printf("[AutoUpdate] Update failed: %v\n", err)
			runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Update Error] %v", err))
			runtime.EventsEmit(a.ctx, "update:progress", services.UpdateProgress{
				Status: "error",
				Error:  err.Error(),
			})
		} else {
			log.Println("[AutoUpdate] Update applied successfully!")
			runtime.EventsEmit(a.ctx, "daemon-log", "[Update] Update applied successfully! Ready to restart.")
		}
	}()

	return nil
}

func (a *App) RestartApp() error {
	runtime.EventsEmit(a.ctx, "daemon-log", "[Update] Restarting application...")
	return a.updateService.RestartApp()
}

func (a *App) Shutdown(ctx context.Context) {
	if a.logTailer != nil {
		a.logTailer.Stop()
	}

	if _, err := a.teleService.QuitSync(ctx); err != nil {
		fmt.Println("Failed to quit Telepresence on shutdown:", err)
	} else {
		fmt.Println("Telepresence daemon stopped successfully.")
	}
}

func (a *App) OnSecondInstanceLaunch(secondInstanceData options.SecondInstanceData) {
	secondInstanceArgs := secondInstanceData.Args

	println("user opened second instance", strings.Join(secondInstanceData.Args, ","))
	println("user opened second from", secondInstanceData.WorkingDirectory)
	runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[App] Secondary instance launched with args: %s", strings.Join(secondInstanceData.Args, " ")))
	runtime.WindowUnminimise(a.ctx)
	runtime.Show(a.ctx)
	go runtime.EventsEmit(a.ctx, "launchArgs", secondInstanceArgs)
}

func (a *App) Notify(title string, body string) error {
	if !runtime.IsNotificationAvailable(a.ctx) {
		return nil
	}
	return runtime.SendNotification(a.ctx, runtime.NotificationOptions{
		ID:    "telepresence-gui-alert",
		Title: title,
		Body:  body,
	})
}

func (a *App) SelectFile(title string) (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
}

func (a *App) StartTelepresence(config models.ConnectConfig) error {
	targetNs := config.Namespace
	if targetNs == "" {
		targetNs = "default"
	}
	runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Connect] Connecting to cluster (Namespace: %s, Context: %s)...", targetNs, config.Context))

	out, err := a.teleService.Start(a.ctx, config)
	if out != "" {
		for _, line := range strings.Split(out, "\n") {
			if trimmed := strings.TrimSpace(line); trimmed != "" {
				runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Connect] %s", trimmed))
			}
		}
	}
	if err != nil {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Connect Error] Failed to connect: %v", err))
		return err
	}

	runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Connect] Connected successfully to cluster (Namespace: %s)", targetNs))
	a.updateConnectionStatus(true)
	return nil
}

func (a *App) StopTelepresence() error {
	runtime.EventsEmit(a.ctx, "daemon-log", "[Disconnect] Stopping Telepresence daemon (telepresence quit -s)...")
	out, err := a.teleService.QuitSync(a.ctx)
	if out != "" {
		for _, line := range strings.Split(out, "\n") {
			if trimmed := strings.TrimSpace(line); trimmed != "" {
				runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Disconnect] %s", trimmed))
			}
		}
	}
	if err != nil {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Disconnect Error] Failed to stop daemon: %v", err))
		return err
	}
	runtime.EventsEmit(a.ctx, "daemon-log", "[Disconnect] Telepresence daemon stopped successfully.")
	a.updateConnectionStatus(false)
	return nil
}

func (a *App) ListWorkloads() ([]models.Workload, error) {
	return a.teleService.ListWorkloads(a.ctx)
}

func (a *App) InterceptWorkload(config models.InterceptConfig) error {
	runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Intercept] Starting intercept for \"%s\" (Port: %s, Namespace: %s)...", config.Workload, config.Port, config.Namespace))
	out, err := a.teleService.Intercept(a.ctx, config)
	if out != "" {
		for _, line := range strings.Split(out, "\n") {
			if trimmed := strings.TrimSpace(line); trimmed != "" {
				runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Intercept] %s", trimmed))
			}
		}
	}
	if err != nil {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Intercept Error] Failed to intercept \"%s\": %v", config.Workload, err))
		return err
	}
	runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Intercept] Successfully intercepted workload \"%s\"", config.Workload))
	return nil
}

func (a *App) ReplaceWorkload(config models.ReplaceConfig) error {
	runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Replace] Starting replace for \"%s\" (Port: %s, Container: %s)...", config.Workload, config.Port, config.Container))
	out, err := a.teleService.Replace(a.ctx, config)
	if out != "" {
		for _, line := range strings.Split(out, "\n") {
			if trimmed := strings.TrimSpace(line); trimmed != "" {
				runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Replace] %s", trimmed))
			}
		}
	}
	if err != nil {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Replace Error] Failed to replace \"%s\": %v", config.Workload, err))
		return err
	}
	runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Replace] Successfully replaced workload \"%s\"", config.Workload))
	return nil
}

func (a *App) DetachWorkload(config models.DetachConfig) error {
	runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Detach] Detaching workload/intercept \"%s\" (Namespace: %s)...", config.AttachmentName, config.Namespace))
	out, err := a.teleService.Detach(a.ctx, config)
	if out != "" {
		for _, line := range strings.Split(out, "\n") {
			if trimmed := strings.TrimSpace(line); trimmed != "" {
				runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Detach] %s", trimmed))
			}
		}
	}
	if err != nil {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Detach Error] Failed to detach \"%s\": %v", config.AttachmentName, err))
		return err
	}
	runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Detach] Successfully detached workload \"%s\"", config.AttachmentName))
	return nil
}

func (a *App) GetKubeInfo(kubeConfigPath string) (models.KubeInfo, error) {
	info, err := a.kubeService.GetKubeInfo(a.ctx, kubeConfigPath)
	if err != nil {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Kube Error] Failed to load kubeconfig: %v", err))
		return info, err
	}
	if len(info.Contexts) > 0 {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Kube] Loaded kubeconfig from %s (Context: %s, Namespace: %s, Contexts: %d)", info.KubeconfigPath, info.CurrentContext, info.Namespace, len(info.Contexts)))
	}
	return info, nil
}

func (a *App) updateConnectionStatus(connected bool) {
	a.statusMu.Lock()
	if a.isConnected == connected {
		a.statusMu.Unlock()
		return
	}
	a.isConnected = connected
	if !connected {
		a.lastListRaw = ""
	}
	a.statusMu.Unlock()

	if connected {
		_ = a.Notify("Telepresence Connected", "Connected to cluster successfully.")
	} else {
		_ = a.Notify("Telepresence Disconnected", "Daemon stopped successfully.")
	}

	a.updateTrayMenu(connected)
	runtime.EventsEmit(a.ctx, "connection-changed", connected)
}

func (a *App) SaveConnectConfig(config models.ConnectConfig) error {
	return a.configService.SaveConnectConfig(config)
}

func (a *App) LoadConnectConfig() (*models.ConnectConfig, error) {
	return a.configService.LoadConnectConfig()
}

