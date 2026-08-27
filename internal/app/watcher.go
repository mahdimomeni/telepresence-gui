package app

import (
	"fmt"
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
	if err == nil && rawStatus != "" {
		a.statusMu.Lock()
		statusChanged := rawStatus != a.lastStatusRaw
		if statusChanged {
			a.lastStatusRaw = rawStatus
		}
		a.statusMu.Unlock()

		if statusChanged && status != nil {
			connected := status.UserDaemon.Running && strings.EqualFold(status.UserDaemon.Status, "Connected")
			runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Status] Daemon status updated: UserDaemon=%s (Running=%v), RootDaemon Running=%v", status.UserDaemon.Status, status.UserDaemon.Running, status.RootDaemon.Running))
			a.updateConnectionStatus(connected)
			runtime.EventsEmit(a.ctx, "telepresence-status-changed", status)
		}
	}

	a.statusMu.Lock()
	connected := a.isConnected
	a.statusMu.Unlock()

	if connected {
		rawList, workloads, err := a.teleService.ListWorkloadsRawNoLock(a.ctx)
		if err == nil {
			a.statusMu.Lock()
			listChanged := rawList != a.lastListRaw
			if listChanged {
				a.lastListRaw = rawList
			}
			a.statusMu.Unlock()

			if listChanged {
				runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Workloads] Workload list synchronized (%d workloads found)", len(workloads)))
				runtime.EventsEmit(a.ctx, "workloads-changed", workloads)
			}
		}
	} else {
		a.statusMu.Lock()
		a.lastListRaw = ""
		a.statusMu.Unlock()
	}
}

