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

type EventEmitter interface {
	Emit(eventName string, data ...interface{})
}

type defaultEventEmitter struct {
	ctx context.Context
}

func (d *defaultEventEmitter) Emit(eventName string, data ...interface{}) {
	if d.ctx != nil {
		runtime.EventsEmit(d.ctx, eventName, data...)
	}
}

type Notifier interface {
	SendNotification(title, body string) error
}

type defaultNotifier struct {
	ctx context.Context
}

func (d *defaultNotifier) SendNotification(title, body string) error {
	if d.ctx != nil && runtime.IsNotificationAvailable(d.ctx) {
		return runtime.SendNotification(d.ctx, runtime.NotificationOptions{
			ID:    "telepresence-gui-alert",
			Title: title,
			Body:  body,
		})
	}
	return nil
}

type App struct {
	ctx           context.Context
	teleService   *services.TelepresenceService
	kubeService   *services.KubeService
	configService *services.ConfigService
	updateService *services.UpdateService
	toolService   *services.ToolCheckerService
	logTailer     *services.LogTailer
	emitter       EventEmitter
	notifier      Notifier

	pollMu        sync.Mutex
	statusMu      sync.Mutex
	isConnected   bool
	lastStatusRaw string
	lastListRaw   string
	pollInterval  time.Duration

	trayIcon []byte
}

func NewApp(
	teleService *services.TelepresenceService,
	kubeService *services.KubeService,
	configService *services.ConfigService,
	updateService *services.UpdateService,
	toolService *services.ToolCheckerService,
	trayIcon []byte,
) *App {
	return &App{
		teleService:   teleService,
		kubeService:   kubeService,
		configService: configService,
		updateService: updateService,
		toolService:   toolService,
		logTailer:     services.NewLogTailer(),
		pollInterval:  4 * time.Second,
		trayIcon:      trayIcon,
	}
}

func (a *App) SetEventEmitter(emitter EventEmitter) {
	a.emitter = emitter
}

func (a *App) SetNotifier(notifier Notifier) {
	a.notifier = notifier
}

func (a *App) SetContext(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) emit(eventName string, data ...interface{}) {
	if a.emitter != nil {
		a.emitter.Emit(eventName, data...)
		return
	}
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, eventName, data...)
	}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	if a.emitter == nil {
		a.emitter = &defaultEventEmitter{ctx: ctx}
	}
	if a.notifier == nil {
		a.notifier = &defaultNotifier{ctx: ctx}
	}

	// Load settings on startup and apply engine parameters
	settings, err := a.configService.LoadAppSettings()
	if err == nil && settings != nil {
		if settings.RequestTimeoutSeconds > 0 {
			a.teleService.SetTimeout(time.Duration(settings.RequestTimeoutSeconds) * time.Second)
		}
		if settings.PollIntervalSeconds > 0 {
			a.statusMu.Lock()
			a.pollInterval = time.Duration(settings.PollIntervalSeconds) * time.Second
			a.statusMu.Unlock()
		}
		if settings.StartMinimized {
			go func() {
				time.Sleep(150 * time.Millisecond)
				runtime.WindowHide(a.ctx)
			}()
		}
	}

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
		time.Sleep(500 * time.Millisecond)
		report, err := a.toolService.CheckTools(a.ctx)
		if err == nil {
			a.emit("system-tools:status", report)
			if !report.AllInstalled {
				a.emit("daemon-log", fmt.Sprintf("[Tools Warning] %d required tool(s) missing. Telepresence and kubectl are required.", report.MissingCount))
			} else {
				a.emit("daemon-log", "[Tools] All required tools (telepresence, kubectl) detected successfully.")
			}
		}
	}()

	go func() {
		time.Sleep(2 * time.Second)
		currentSettings, err := a.configService.LoadAppSettings()
		if err == nil && currentSettings != nil && !currentSettings.AutoCheckUpdates {
			return
		}
		info, err := a.updateService.CheckForUpdate(a.ctx)
		if err == nil && info != nil && info.Available {
			a.emit("daemon-log", fmt.Sprintf("[Update] New version available: v%s (Current: v%s)", info.LatestVersion, info.CurrentVersion))
			a.emit("update:available", info)
		}
	}()
}

func (a *App) CheckSystemTools() (models.SystemToolsReport, error) {
	return a.toolService.CheckTools(a.ctx)
}

func (a *App) CheckForUpdates() (*services.UpdateInfo, error) {
	a.emit("daemon-log", "[Update] Checking for updates...")
	info, err := a.updateService.CheckForUpdate(a.ctx)
	if err != nil {
		a.emit("daemon-log", fmt.Sprintf("[Update Error] Check failed: %v", err))
		return nil, err
	}
	if info != nil && info.Available {
		a.emit("daemon-log", fmt.Sprintf("[Update] New version available: v%s", info.LatestVersion))
	} else {
		a.emit("daemon-log", "[Update] App is up to date.")
	}
	return info, nil
}

func (a *App) DownloadAndInstallUpdate() error {
	log.Println("[AutoUpdate] DownloadAndInstallUpdate requested from frontend")
	a.emit("daemon-log", "[Update] Starting update download and installation...")

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[AutoUpdate] Panic during update: %v\n", r)
				a.emit("daemon-log", fmt.Sprintf("[Update Error] Internal panic: %v", r))
				a.emit("update:progress", services.UpdateProgress{
					Status: "error",
					Error:  fmt.Sprintf("internal panic: %v", r),
				})
			}
		}()

		err := a.updateService.DownloadAndApply(a.ctx, func(p services.UpdateProgress) {
			log.Printf("[AutoUpdate] Progress: %d%% (%s)\n", p.Percentage, p.Status)
			a.emit("daemon-log", fmt.Sprintf("[Update Progress] %d%% - %s", p.Percentage, p.Status))
			a.emit("update:progress", p)
		})

		if err != nil {
			log.Printf("[AutoUpdate] Update failed: %v\n", err)
			a.emit("daemon-log", fmt.Sprintf("[Update Error] %v", err))
			a.emit("update:progress", services.UpdateProgress{
				Status: "error",
				Error:  err.Error(),
			})
		} else {
			log.Println("[AutoUpdate] Update applied successfully!")
			a.emit("daemon-log", "[Update] Update applied successfully! Ready to restart.")
		}
	}()

	return nil
}

func (a *App) RestartApp() error {
	a.emit("daemon-log", "[Update] Restarting application...")
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
	a.emit("daemon-log", fmt.Sprintf("[App] Secondary instance launched with args: %s", strings.Join(secondInstanceData.Args, " ")))
	if a.ctx != nil && a.emitter == nil {
		runtime.WindowUnminimise(a.ctx)
		runtime.Show(a.ctx)
	}
	go a.emit("launchArgs", secondInstanceArgs)
}

func (a *App) Notify(title, body string) error {
	settings, err := a.configService.LoadAppSettings()
	if err == nil && settings != nil && !settings.EnableNotifications {
		return nil
	}
	if a.notifier != nil {
		return a.notifier.SendNotification(title, body)
	}
	if a.ctx != nil && runtime.IsNotificationAvailable(a.ctx) {
		return runtime.SendNotification(a.ctx, runtime.NotificationOptions{
			ID:    "telepresence-gui-alert",
			Title: title,
			Body:  body,
		})
	}
	return nil
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
	a.emit("daemon-log", fmt.Sprintf("[Connect] Connecting to cluster (Namespace: %s, Context: %s)...", targetNs, config.Context))

	out, err := a.teleService.Start(a.ctx, config)
	if out != "" {
		for _, line := range strings.Split(out, "\n") {
			if trimmed := strings.TrimSpace(line); trimmed != "" {
				a.emit("daemon-log", fmt.Sprintf("[Connect] %s", trimmed))
			}
		}
	}
	if err != nil {
		a.emit("daemon-log", fmt.Sprintf("[Connect Error] Failed to connect: %v", err))
		return err
	}

	a.emit("daemon-log", fmt.Sprintf("[Connect] Connected successfully to cluster (Namespace: %s)", targetNs))
	a.updateConnectionStatus(true)
	return nil
}

func (a *App) StopTelepresence() error {
	a.emit("daemon-log", "[Disconnect] Stopping Telepresence daemon (telepresence quit -s)...")
	out, err := a.teleService.QuitSync(a.ctx)
	if out != "" {
		for _, line := range strings.Split(out, "\n") {
			if trimmed := strings.TrimSpace(line); trimmed != "" {
				a.emit("daemon-log", fmt.Sprintf("[Disconnect] %s", trimmed))
			}
		}
	}
	if err != nil {
		a.emit("daemon-log", fmt.Sprintf("[Disconnect Error] Failed to stop daemon: %v", err))
		return err
	}
	a.emit("daemon-log", "[Disconnect] Telepresence daemon stopped successfully.")
	a.updateConnectionStatus(false)
	return nil
}

func (a *App) ListWorkloads() ([]models.Workload, error) {
	return a.teleService.ListWorkloads(a.ctx)
}

func (a *App) InterceptWorkload(config models.InterceptConfig) error {
	a.emit("daemon-log", fmt.Sprintf("[Intercept] Starting intercept for %q (Port: %s, Namespace: %s)...", config.Workload, config.Port, config.Namespace))
	out, err := a.teleService.Intercept(a.ctx, config)
	if out != "" {
		for _, line := range strings.Split(out, "\n") {
			if trimmed := strings.TrimSpace(line); trimmed != "" {
				a.emit("daemon-log", fmt.Sprintf("[Intercept] %s", trimmed))
			}
		}
	}
	if err != nil {
		a.emit("daemon-log", fmt.Sprintf("[Intercept Error] Failed to intercept %q: %v", config.Workload, err))
		return err
	}
	a.emit("daemon-log", fmt.Sprintf("[Intercept] Successfully intercepted workload %q", config.Workload))
	a.notifyIntercept("Workload Intercepted", fmt.Sprintf("Successfully intercepted workload %q", config.Workload))
	return nil
}

func (a *App) ReplaceWorkload(config models.ReplaceConfig) error {
	a.emit("daemon-log", fmt.Sprintf("[Replace] Starting replace for %q (Port: %s, Container: %s)...", config.Workload, config.Port, config.Container))
	out, err := a.teleService.Replace(a.ctx, config)
	if out != "" {
		for _, line := range strings.Split(out, "\n") {
			if trimmed := strings.TrimSpace(line); trimmed != "" {
				a.emit("daemon-log", fmt.Sprintf("[Replace] %s", trimmed))
			}
		}
	}
	if err != nil {
		a.emit("daemon-log", fmt.Sprintf("[Replace Error] Failed to replace %q: %v", config.Workload, err))
		return err
	}
	a.emit("daemon-log", fmt.Sprintf("[Replace] Successfully replaced workload %q", config.Workload))
	a.notifyIntercept("Workload Replaced", fmt.Sprintf("Successfully replaced workload %q", config.Workload))
	return nil
}

func (a *App) DetachWorkload(config models.DetachConfig) error {
	a.emit("daemon-log", fmt.Sprintf("[Detach] Detaching workload/intercept %q (Namespace: %s)...", config.AttachmentName, config.Namespace))
	out, err := a.teleService.Detach(a.ctx, config)
	if out != "" {
		for _, line := range strings.Split(out, "\n") {
			if trimmed := strings.TrimSpace(line); trimmed != "" {
				a.emit("daemon-log", fmt.Sprintf("[Detach] %s", trimmed))
			}
		}
	}
	if err != nil {
		a.emit("daemon-log", fmt.Sprintf("[Detach Error] Failed to detach %q: %v", config.AttachmentName, err))
		return err
	}
	a.emit("daemon-log", fmt.Sprintf("[Detach] Successfully detached workload %q", config.AttachmentName))
	a.notifyIntercept("Workload Detached", fmt.Sprintf("Successfully detached workload %q", config.AttachmentName))
	return nil
}

func (a *App) GetKubeInfo(kubeConfigPath string) (models.KubeInfo, error) {
	info, err := a.kubeService.GetKubeInfo(a.ctx, kubeConfigPath)
	if err != nil {
		a.emit("daemon-log", fmt.Sprintf("[Kube Error] Failed to load kubeconfig: %v", err))
		return info, err
	}
	if len(info.Contexts) > 0 {
		a.emit("daemon-log", fmt.Sprintf("[Kube] Loaded kubeconfig from %s (Context: %s, Namespace: %s, Contexts: %d)", info.KubeconfigPath, info.CurrentContext, info.Namespace, len(info.Contexts)))
	}
	return info, nil
}

func (a *App) notifyConnect(title, body string) {
	settings, err := a.configService.LoadAppSettings()
	if err == nil && settings != nil {
		if !settings.EnableNotifications || !settings.NotifyOnConnect {
			return
		}
	}
	_ = a.Notify(title, body)
}

func (a *App) notifyIntercept(title, body string) {
	settings, err := a.configService.LoadAppSettings()
	if err == nil && settings != nil {
		if !settings.EnableNotifications || !settings.NotifyOnIntercept {
			return
		}
	}
	_ = a.Notify(title, body)
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
		a.notifyConnect("Telepresence Connected", "Connected to cluster successfully.")
		go func() {
			if err := a.teleService.GRPC().Connect(a.ctx); err == nil {
				a.startGRPCWorkloadStream()
			}
		}()
	} else {
		a.notifyConnect("Telepresence Disconnected", "Daemon stopped successfully.")
		a.teleService.GRPC().StopWatchWorkloads()
		a.teleService.GRPC().Disconnect()
	}

	a.updateTrayMenu(connected)
	a.emit("connection-changed", connected)
}

func (a *App) SaveConnectConfig(config models.ConnectConfig) error {
	return a.configService.SaveConnectConfig(config)
}

func (a *App) LoadConnectConfig() (*models.ConnectConfig, error) {
	return a.configService.LoadConnectConfig()
}

func (a *App) GetAppSettings() (models.AppSettings, error) {
	settings, err := a.configService.LoadAppSettings()
	if err != nil {
		return models.DefaultAppSettings(), err
	}
	if settings == nil {
		return models.DefaultAppSettings(), nil
	}
	return *settings, nil
}

func (a *App) SaveAppSettings(settings models.AppSettings) error {
	err := a.configService.SaveAppSettings(settings)
	if err == nil {
		if settings.RequestTimeoutSeconds > 0 {
			a.teleService.SetTimeout(time.Duration(settings.RequestTimeoutSeconds) * time.Second)
		}
		if settings.PollIntervalSeconds > 0 {
			a.statusMu.Lock()
			a.pollInterval = time.Duration(settings.PollIntervalSeconds) * time.Second
			a.statusMu.Unlock()
		}
		a.emit("app-settings:changed", settings)
		a.emit("daemon-log", "[Settings] Application preferences saved successfully.")
	}
	return err
}

func (a *App) ResetAppSettings() (models.AppSettings, error) {
	settings, err := a.configService.ResetAppSettings()
	if err != nil {
		return models.DefaultAppSettings(), err
	}
	if settings.RequestTimeoutSeconds > 0 {
		a.teleService.SetTimeout(time.Duration(settings.RequestTimeoutSeconds) * time.Second)
	}
	if settings.PollIntervalSeconds > 0 {
		a.statusMu.Lock()
		a.pollInterval = time.Duration(settings.PollIntervalSeconds) * time.Second
		a.statusMu.Unlock()
	}
	a.emit("app-settings:changed", *settings)
	a.emit("daemon-log", "[Settings] Application preferences reset to factory defaults.")
	return *settings, nil
}
