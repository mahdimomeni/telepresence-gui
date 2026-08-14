package app

import (
	"context"
	"fmt"
	"log"
	"sync"
	"telepresence-gui/internal/models"
	"telepresence-gui/internal/services"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx           context.Context
	teleService   *services.TelepresenceService
	kubeService   *services.KubeService
	configService *services.ConfigService

	pollMu        sync.Mutex
	statusMu      sync.Mutex
	isConnected   bool
	lastStatusRaw string
	lastListRaw   string

	appIconIco []byte
	appIconPng []byte
}

func NewApp(
	teleService *services.TelepresenceService,
	kubeService *services.KubeService,
	configService *services.ConfigService,
	appIconIco []byte,
	appIconPng []byte,
) *App {
	return &App{
		teleService:   teleService,
		kubeService:   kubeService,
		configService: configService,
		appIconIco:    appIconIco,
		appIconPng:    appIconPng,
	}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	go systray.Run(a.onTrayReady, a.onTrayExit)

	if err := runtime.InitializeNotifications(a.ctx); err != nil {
		log.Printf("Failed to initialize notifications: %v", err)
	} else if runtime.IsNotificationAvailable(a.ctx) {
		if auth, _ := runtime.CheckNotificationAuthorization(a.ctx); !auth {
			_, _ = runtime.RequestNotificationAuthorization(a.ctx)
		}
	}

	go a.startBackgroundWatcher()
}

func (a *App) Shutdown(ctx context.Context) {
	if _, err := a.teleService.QuitSync(ctx); err != nil {
		fmt.Println("Failed to quit Telepresence on shutdown:", err)
	} else {
		fmt.Println("Telepresence daemon stopped successfully.")
	}
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

func (a *App) SaveConnectConfig(config models.ConnectConfig) error {
	return a.configService.SaveConnectConfig(config)
}

func (a *App) LoadConnectConfig() (*models.ConnectConfig, error) {
	return a.configService.LoadConnectConfig()
}
