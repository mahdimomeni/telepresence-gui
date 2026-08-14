package app

import (
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) startBackgroundWatcher() {
	ticker := time.NewTicker(4 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			a.checkTelepresenceChanges()
		}
	}
}

func (a *App) checkTelepresenceChanges() {
	if !a.pollMu.TryLock() {
		return
	}
	defer a.pollMu.Unlock()

	if !a.teleService.TryLock() {
		return
	}
	defer a.teleService.Unlock()

	rawStatus, status, err := a.teleService.StatusNoLock(a.ctx)
	if err == nil && rawStatus != "" && rawStatus != a.lastStatusRaw {
		a.lastStatusRaw = rawStatus
		if status != nil {
			connected := status.UserDaemon.Running && strings.EqualFold(status.UserDaemon.Status, "Connected")

			prevConnected := a.isConnected

			if connected != prevConnected {
				a.updateConnectionStatus(connected)
			}

			runtime.EventsEmit(a.ctx, "telepresence-status-changed", status)
		}
	}

	connected := a.isConnected

	if connected {
		workloads, err := a.teleService.ListWorkloadsNoLock(a.ctx)
		if err == nil {
			runtime.EventsEmit(a.ctx, "workloads-changed", workloads)
		}
	} else {
		a.lastListRaw = ""
	}
}
