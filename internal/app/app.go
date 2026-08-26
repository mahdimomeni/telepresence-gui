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

	go a.startBackgroundWatcher()

	a.setupSystemTray()

	go func() {
		time.Sleep(2 * time.Second)
		info, err := a.updateService.CheckForUpdate(a.ctx)
		if err == nil && info != nil && info.Available {
			runtime.EventsEmit(a.ctx, "update:available", info)
		}
	}()
}

func (a *App) CheckForUpdates() (*services.UpdateInfo, error) {
	return a.updateService.CheckForUpdate(a.ctx)
}

func (a *App) DownloadAndInstallUpdate() error {
	log.Println("[AutoUpdate] DownloadAndInstallUpdate requested from frontend")

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[AutoUpdate] Panic during update: %v\n", r)
				runtime.EventsEmit(a.ctx, "update:progress", services.UpdateProgress{
					Status: "error",
					Error:  fmt.Sprintf("internal panic: %v", r),
				})
			}
		}()

		err := a.updateService.DownloadAndApply(a.ctx, func(p services.UpdateProgress) {
			log.Printf("[AutoUpdate] Progress: %d%% (%s)\n", p.Percentage, p.Status)
			runtime.EventsEmit(a.ctx, "update:progress", p)
		})

		if err != nil {
			log.Printf("[AutoUpdate] Update failed: %v\n", err)
			runtime.EventsEmit(a.ctx, "update:progress", services.UpdateProgress{
				Status: "error",
				Error:  err.Error(),
			})
		} else {
			log.Println("[AutoUpdate] Update applied successfully!")
		}
	}()

	return nil
}

func (a *App) RestartApp() error {
	return a.updateService.RestartApp()
}

func (a *App) Shutdown(ctx context.Context) {
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
	out, err := a.teleService.Start(a.ctx, config)
	if err != nil {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Error starting daemon]: %s", out))
		return err
	}
	a.updateConnectionStatus(true)
	return nil
}

func (a *App) StopTelepresence() error {
	out, err := a.teleService.QuitSync(a.ctx)
	if err != nil {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Error stopping daemon]: %s", out))
		return err
	}
	runtime.EventsEmit(a.ctx, "daemon-log", "[Telepresence Disconnected]")
	a.updateConnectionStatus(false)
	return nil
}

func (a *App) ListWorkloads() ([]models.Workload, error) {
	return a.teleService.ListWorkloads(a.ctx)
}

func (a *App) InterceptWorkload(config models.InterceptConfig) error {
	return a.teleService.Intercept(a.ctx, config)
}

func (a *App) DetachWorkload(config models.DetachConfig) error {
	return a.teleService.Detach(a.ctx, config)
}

func (a *App) GetKubeInfo(kubeConfigPath string) (models.KubeInfo, error) {
	return a.kubeService.GetKubeInfo(a.ctx, kubeConfigPath)
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

