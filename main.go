package main

import (
	"embed"
	"encoding/json"
	"telepresence-gui/internal/app"
	"telepresence-gui/internal/cli"
	"telepresence-gui/internal/services"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed wails.json
var wailsConfigJSON []byte

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/darwin/tray-icon.png
var darwinTrayIcon []byte

//go:embed build/linux/tray-icon.png
var linuxTrayIcon []byte

//go:embed build/windows/tray-icon.png
var windowsTrayIcon []byte

type wailsConfig struct {
	Info struct {
		ProductVersion string `json:"productVersion"`
	} `json:"info"`
}

func getAppVersion() string {
	var cfg wailsConfig
	if err := json.Unmarshal(wailsConfigJSON, &cfg); err != nil || cfg.Info.ProductVersion == "" {
		return "1.0.0"
	}
	return cfg.Info.ProductVersion
}

func main() {
	appVersion := getAppVersion()

	// Instantiate Core Infrastructure & Services
	runner := cli.NewCommandRunner()
	configService := services.NewConfigService()
	kubeService := services.NewKubeService(runner, configService)
	teleService := services.NewTelepresenceService(runner)
	updateService := services.NewUpdateService("mahdimomeni", "telepresence-gui", appVersion)

	// Instantiate the Presentation App Layer
	application := app.NewApp(
		teleService,
		kubeService,
		configService,
		updateService,
		linuxTrayIcon,
		darwinTrayIcon,
		windowsTrayIcon,
	)

	// Create application with options
	err := wails.Run(&options.App{
		Title:             "Telepresence GUI",
		Width:             1024,
		Height:            768,
		HideWindowOnClose: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: options.NewRGBA(0, 0, 0, 128),
		OnStartup:        application.Startup,
		OnShutdown:       application.Shutdown,
		Bind: []interface{}{
			application,
		},
		MinWidth:  1024,
		MinHeight: 768,
		Windows: &windows.Options{
			WindowIsTranslucent:  true,
			WebviewIsTransparent: true,
			BackdropType:         windows.Auto,
		},
		DragAndDrop: &options.DragAndDrop{
			DisableWebViewDrop: true,
		},
		EnableDefaultContextMenu: true,
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId:               "ca6a3d2a-9307-43ee-9fc3-dff845cb175a",
			OnSecondInstanceLaunch: application.OnSecondInstanceLaunch,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
