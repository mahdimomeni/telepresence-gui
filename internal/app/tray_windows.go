package app

func (a *App) setTrayIcon() {
	tray.SetIcon(a.windowsTrayIcon)
}
