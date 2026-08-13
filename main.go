package main

import (
	"embed"

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
	// Create an instance of the app structure
	app := NewApp()

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
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
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
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
