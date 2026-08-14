package main

import (
	"embed"
	"telepresence-gui/internal/app"
	"telepresence-gui/internal/cli"
	"telepresence-gui/internal/services"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appIcon.png
var appIconPng []byte

//go:embed build/windows/icon.ico
var appIconIco []byte

func main() {
	// Instantiate Core Infrastructure & Services
	runner := cli.NewCommandRunner()
	configService := services.NewConfigService()
	kubeService := services.NewKubeService(runner, configService)
	teleService := services.NewTelepresenceService(runner)

	// Instantiate the Presentation App Layer
	application := app.NewApp(
		teleService,
		kubeService,
		configService,
		appIconIco,
		appIconPng,
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
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
