//go:build linux

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
	menu.Add("Show Window", func() {
		runtime.WindowUnminimise(a.ctx)
		runtime.WindowShow(a.ctx)
	})
	menu.Add("Settings...", func() {
		runtime.WindowUnminimise(a.ctx)
		runtime.WindowShow(a.ctx)
		runtime.EventsEmit(a.ctx, "open-settings")
	})
	menu.AddSeparator()
	mConnectToggle = menu.Add("Connect", func() {
		a.statusMu.Lock()
		currentlyConnected := a.isConnected
		a.statusMu.Unlock()

		if currentlyConnected {
			runtime.EventsEmit(a.ctx, "connection-pending", true)
			defer runtime.EventsEmit(a.ctx, "connection-pending", false)
			if err := a.StopTelepresence(); err != nil {
				_ = a.Notify("Disconnect Failed", fmt.Sprintf("Error: %v", err))
			}
		} else {
			config, err := a.configService.LoadConnectConfig()
			if err != nil || config == nil {
				config = &models.ConnectConfig{Namespace: "default"}
			}

			runtime.EventsEmit(a.ctx, "daemon-log", "[Tray] Connecting to cluster...")
			runtime.EventsEmit(a.ctx, "connection-pending", true)
			defer runtime.EventsEmit(a.ctx, "connection-pending", false)
			if err := a.StartTelepresence(*config); err != nil {
				_ = a.Notify("Connection Failed", fmt.Sprintf("Error: %v", err))
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

	go func() {
		if err := tray.Run(); err != nil {
			fmt.Println("Tray error:", err)
		}
	}()
}

func (a *App) setTrayIcon() {
	if tray != nil {
		tray.SetIcon(a.linuxTrayIcon)
	}
}

func (a *App) updateTrayMenu(connected bool) {
	if mConnectToggle != nil {
		if connected {
			mConnectToggle.SetLabel("Disconnect")
		} else {
			mConnectToggle.SetLabel("Connect")
		}
	}
}

