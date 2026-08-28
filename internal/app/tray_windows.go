//go:build windows

package app

import (
	"fmt"
	"runtime"
	"telepresence-gui/internal/models"

	"github.com/gogpu/systray"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

var mConnectToggle *systray.MenuItem
var tray *systray.SystemTray

func (a *App) setupSystemTray() {
	go func() {
		runtime.LockOSThread()
		defer runtime.UnlockOSThread()

		tray = systray.New()

		menu := systray.NewMenu()
		menu.Add("Show Window", func() {
			wailsRuntime.WindowUnminimise(a.ctx)
			wailsRuntime.WindowShow(a.ctx)
		})
		menu.Add("Settings...", func() {
			wailsRuntime.WindowUnminimise(a.ctx)
			wailsRuntime.WindowShow(a.ctx)
			wailsRuntime.EventsEmit(a.ctx, "open-settings")
		})
		menu.AddSeparator()
		mConnectToggle = menu.Add("Connect", func() {
			a.statusMu.Lock()
			currentlyConnected := a.isConnected
			a.statusMu.Unlock()

			if currentlyConnected {
				wailsRuntime.EventsEmit(a.ctx, "connection-pending", true)
				defer wailsRuntime.EventsEmit(a.ctx, "connection-pending", false)
				if err := a.StopTelepresence(); err != nil {
					_ = a.Notify("Disconnect Failed", fmt.Sprintf("Error: %v", err))
				}
			} else {
				config, err := a.configService.LoadConnectConfig()
				if err != nil || config == nil {
					config = &models.ConnectConfig{Namespace: "default"}
				}

				wailsRuntime.EventsEmit(a.ctx, "daemon-log", "[Tray] Connecting to cluster...")
				wailsRuntime.EventsEmit(a.ctx, "connection-pending", true)
				defer wailsRuntime.EventsEmit(a.ctx, "connection-pending", false)
				if err := a.StartTelepresence(*config); err != nil {
					_ = a.Notify("Connection Failed", fmt.Sprintf("Error: %v", err))
				}
			}
		})
		menu.AddSeparator()
		menu.Add("Quit", func() {
			_ = a.StopTelepresence()
			tray.Remove()
			wailsRuntime.Quit(a.ctx)
		})

		a.setTrayIcon()

		tray.SetTooltip("Telepresence GUI").
			SetMenu(menu)
		tray.OnClick(func() {
			wailsRuntime.WindowUnminimise(a.ctx)
			wailsRuntime.WindowShow(a.ctx)
		})
		tray.Show()

		a.statusMu.Lock()
		connected := a.isConnected
		a.statusMu.Unlock()
		if connected {
			mConnectToggle.SetLabel("Disconnect")
		}

		if err := tray.Run(); err != nil {
			fmt.Println("Tray error:", err)
		}
	}()
}

func (a *App) setTrayIcon() {
	if tray != nil {
		tray.SetIcon(a.windowsTrayIcon)
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

