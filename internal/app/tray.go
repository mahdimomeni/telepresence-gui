//go:build windows || linux

package app

import (
	"fmt"
	"telepresence-gui/internal/models"

	"fyne.io/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var mConnectToggle *systray.MenuItem

func (a *App) setupSystemTray() {
	go systray.Run(a.onTrayReady, a.onTrayExit)
}

func (a *App) onTrayReady() {
	systray.SetIcon(a.appIconIco)
	systray.SetTitle("Telepresence")
	systray.SetTooltip("Telepresence GUI Client")
	systray.SetOnTapped(func() {
		runtime.WindowUnminimise(a.ctx)
		runtime.WindowShow(a.ctx)
	})

	mConnectToggle := systray.AddMenuItem("Connect", "Connect to Kubernetes cluster")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("Quit", "Disconnect and exit")

	go func() {
		for range mConnectToggle.ClickedCh {
			a.statusMu.Lock()
			currentlyConnected := a.isConnected
			a.statusMu.Unlock()

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
		}
	}()

	go func() {
		for range mQuit.ClickedCh {
			_ = a.StopTelepresence()
			systray.Quit()
			runtime.Quit(a.ctx)
		}
	}()
}

func (a *App) onTrayExit() {}

func (a *App) updateConnectionStatus(connected bool) {
	a.statusMu.Lock()
	defer a.statusMu.Unlock()

	a.isConnected = connected
	if connected {
		_ = a.Notify("Telepresence Connected", "Connected to cluster successfully.")
		if mConnectToggle != nil {
			mConnectToggle.SetTitle("Disconnect")
			mConnectToggle.SetTooltip("Disconnect Telepresence daemon")
		}
	} else {
		_ = a.Notify("Telepresence Disconnected", "Daemon stopped successfully.")
		if mConnectToggle != nil {
			mConnectToggle.SetTitle("Connect")
			mConnectToggle.SetTooltip("Connect to Kubernetes cluster")
		}
	}

	runtime.EventsEmit(a.ctx, "connection-changed", a.isConnected)
}
