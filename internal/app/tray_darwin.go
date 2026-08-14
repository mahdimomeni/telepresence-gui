//go:build darwin

package app

import (
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) setupSystemTray() {

}

func (a *App) setTrayIcon() {
}

func (a *App) updateConnectionStatus(connected bool) {

	a.isConnected = connected
	if connected {
		_ = a.Notify("Telepresence Connected", "Connected to cluster successfully.")
	} else {
		_ = a.Notify("Telepresence Disconnected", "Daemon stopped successfully.")
	}

	runtime.EventsEmit(a.ctx, "connection-changed", a.isConnected)
}
