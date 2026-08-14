package app

import (
	"fmt"
	"telepresence-gui/internal/models"

	"github.com/gogpu/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var mConnectToggle *systray.MenuItem
var tray *systray.SystemTray

func (a *App) setupSystemTray() {
	tray = systray.New()

	menu := systray.NewMenu()
	mConnectToggle = menu.Add("Connect", func() {
		currentlyConnected := a.isConnected

		if currentlyConnected {
			runtime.EventsEmit(a.ctx, "connection-pending", true)
			if err := a.StopTelepresence(); err != nil {
				_ = a.Notify("Disconnect Failed", fmt.Sprintf("Error: %v", err))
			} else {
				a.updateConnectionStatus(false)
				runtime.EventsEmit(a.ctx, "connection-pending", false)
			}
		} else {
			config, err := a.configService.LoadConnectConfig()
			if err != nil || config == nil {
				config = &models.ConnectConfig{Namespace: "default"}
			}

			runtime.EventsEmit(a.ctx, "daemon-log", "[Tray] Connecting to cluster...")
			runtime.EventsEmit(a.ctx, "connection-pending", true)
			if err := a.StartTelepresence(*config); err != nil {
				_ = a.Notify("Connection Failed", fmt.Sprintf("Error: %v", err))
			} else {
				a.updateConnectionStatus(true)
				runtime.EventsEmit(a.ctx, "connection-pending", false)
			}
		}
	})
	menu.AddSeparator()
	menu.Add("Quit", func() {
		_ = a.StopTelepresence()
		tray.Remove()
		runtime.Quit(a.ctx)
	})

	a.setTrayIcon()

	tray.SetTooltip("Telepresence GUI").
		SetMenu(menu)
	tray.OnClick(func() {
		runtime.WindowUnminimise(a.ctx)
		runtime.WindowShow(a.ctx)
	})
	tray.Show()

	if err := tray.Run(); err != nil {
		fmt.Println("error:", err)
	}
}

func (a *App) updateConnectionStatus(connected bool) {

	a.isConnected = connected
	if connected {
		_ = a.Notify("Telepresence Connected", "Connected to cluster successfully.")
		if mConnectToggle != nil {
			mConnectToggle.SetLabel("Disconnect")
		}
	} else {
		_ = a.Notify("Telepresence Disconnected", "Daemon stopped successfully.")
		if mConnectToggle != nil {
			mConnectToggle.SetLabel("Connect")
		}
	}

	runtime.EventsEmit(a.ctx, "connection-changed", a.isConnected)
}
