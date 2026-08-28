package app

import (
	"encoding/json"
	"fmt"
	"strings"
	"telepresence-gui/internal/models"
	"time"
)

func (a *App) startBackgroundWatcher() {
	a.statusMu.Lock()
	interval := a.pollInterval
	if interval <= 0 {
		interval = 4 * time.Second
	}
	a.statusMu.Unlock()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			a.checkTelepresenceChanges()

			// Dynamically adjust interval if updated from settings
			a.statusMu.Lock()
			currentInterval := a.pollInterval
			a.statusMu.Unlock()
			if currentInterval > 0 && currentInterval != interval {
				interval = currentInterval
				ticker.Reset(interval)
			}
		}
	}
}

func (a *App) startGRPCWorkloadStream() {
	grpcClient := a.teleService.GRPC()
	if !grpcClient.IsConnected() {
		_ = grpcClient.Connect(a.ctx)
	}
	if !grpcClient.IsConnected() {
		return
	}

	_ = grpcClient.StartWatchWorkloads(
		a.ctx,
		nil,
		func(workloads []models.Workload) {
			rawJSON, _ := json.Marshal(workloads)
			strJSON := string(rawJSON)

			a.statusMu.Lock()
			listChanged := strJSON != a.lastListRaw
			if listChanged {
				a.lastListRaw = strJSON
			}
			a.statusMu.Unlock()

			if listChanged {
				a.emit("daemon-log", fmt.Sprintf("[Workloads (gRPC Stream)] Workload list synchronized (%d workloads)", len(workloads)))
				a.emit("workloads-changed", workloads)
			}
		},
		func(err error) {
			a.emit("daemon-log", fmt.Sprintf("[gRPC Stream] Workload stream update: %v (falling back to heartbeat polling)", err))
		},
	)
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
			a.emit("daemon-log", fmt.Sprintf("[Status] Daemon status updated: UserDaemon=%s (Running=%v), RootDaemon Running=%v", status.UserDaemon.Status, status.UserDaemon.Running, status.RootDaemon.Running))
			a.updateConnectionStatus(connected)
			a.emit("telepresence-status-changed", status)
		}
	}

	a.statusMu.Lock()
	connected := a.isConnected
	a.statusMu.Unlock()

	if connected {
		// Ensure gRPC client is connected and stream is active
		if !a.teleService.GRPC().IsConnected() {
			if err := a.teleService.GRPC().Connect(a.ctx); err == nil {
				a.startGRPCWorkloadStream()
			}
		}

		rawList, workloads, err := a.teleService.ListWorkloadsRawNoLock(a.ctx)
		if err == nil {
			a.statusMu.Lock()
			listChanged := rawList != a.lastListRaw
			if listChanged {
				a.lastListRaw = rawList
			}
			a.statusMu.Unlock()

			if listChanged {
				a.emit("daemon-log", fmt.Sprintf("[Workloads] Workload list synchronized (%d workloads found)", len(workloads)))
				a.emit("workloads-changed", workloads)
			}
		}
	} else {
		a.statusMu.Lock()
		a.lastListRaw = ""
		a.statusMu.Unlock()
	}
}
