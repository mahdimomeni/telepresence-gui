---
id: config-schema
title: Configuration File Schemas
sidebar_position: 2
---

# Configuration File Schemas

Telepresence GUI persists configuration data across two primary JSON files in the user's application data directory:
1. **`config.json`**: Stores the cluster connection parameters and network routing profiles (`ConnectConfig`).
2. **`settings.json`**: Stores application preferences, appearance options, logging limits, and notification triggers (`AppSettings`).

---

## 📁 Storage Directory Locations

- **Windows**: `%APPDATA%\telepresence-gui\` (typically `C:\Users\<Username>\AppData\Roaming\telepresence-gui\`)
- **macOS**: `~/Library/Application Support/telepresence-gui/` or `~/.config/telepresence-gui/`
- **Linux**: `~/.config/telepresence-gui/`

---

## 1. Connection Profile Schema (`config.json`)

Stores the parameters submitted through the multi-tab connection form:

```json
{
  "namespace": "dev",
  "name": "my-session",
  "manager-namespace": "ambassador",
  "docker": false,
  "mapped-namespaces": "dev,staging,shared-db",
  "proxy-via": "",
  "also-proxy": "10.244.0.0/16,172.20.0.0/16",
  "never-proxy": "192.168.1.0/24",
  "reroute-local": "8080:80",
  "reroute-remote": "9090:9090",
  "vnat": "10.200.0.0/16",
  "allow-conflicting-subnets": "",
  "expose": "3000,5000",
  "hostname": "dev-station.cluster.local",
  "kubeconfig": "/home/user/.kube/config",
  "context": "staging-cluster-east",
  "cluster": "",
  "server": "https://api.k8s.internal:6443",
  "token": "",
  "user": "developer",
  "as": "developer@company.com",
  "as-group": "dev-team",
  "as-uid": "",
  "client-certificate": "/certs/client.crt",
  "client-key": "/certs/client.key",
  "insecure-skip-tls-verify": false,
  "tls-server-name": "",
  "config": "",
  "request-timeout": "45s",
  "disable-compression": false
}
```

### Properties Definition

| Property | Type | Description |
| :--- | :--- | :--- |
| `namespace` | `string` | Target Kubernetes namespace. |
| `name` | `string` | Custom identifier for the Telepresence connection session. |
| `manager-namespace` | `string` | Traffic Manager installation namespace. |
| `docker` | `boolean` | Flag to execute daemon inside a local Docker container. |
| `mapped-namespaces` | `string` | Comma-separated namespaces for DNS discovery. |
| `also-proxy` | `string` | Comma-separated CIDRs to route through cluster. |
| `never-proxy` | `string` | Comma-separated CIDRs to exclude from routing. |
| `reroute-local` | `string` | Port redirect format `localPort:remotePort`. |
| `reroute-remote` | `string` | Port redirect format `localPort:remotePort`. |
| `vnat` | `string` | Virtual NAT CIDR range for IP collision resolution. |
| `kubeconfig` | `string` | Absolute filesystem path to custom kubeconfig. |
| `context` | `string` | Active kubeconfig context identifier. |
| `as` | `string` | RBAC username impersonation. |
| `as-group` | `string` | RBAC security group impersonation. |
| `client-certificate` | `string` | Path to client TLS certificate. |
| `client-key` | `string` | Path to client TLS private key. |
| `insecure-skip-tls-verify` | `boolean` | Skip TLS certificate validation. |
| `request-timeout` | `string` | Operation timeout duration string (e.g., `45s`, `1m`). |
| `disable-compression` | `boolean` | Disable gzip/brotli stream compression. |

---

## 2. Application Preferences Schema (`settings.json`)

Stores the user's application preferences and default behaviors:

```json
{
  "theme": "dark",
  "enableGlowEffects": true,
  "showSplashScreen": true,
  "closeToTray": true,
  "startMinimized": false,
  "enableNotifications": true,
  "notifyOnConnect": true,
  "notifyOnIntercept": true,
  "autoCheckUpdates": true,
  "defaultNamespace": "default",
  "defaultKubeconfig": "",
  "defaultContext": "",
  "managerNamespace": "",
  "requestTimeoutSeconds": 60,
  "pollIntervalSeconds": 4,
  "dockerDaemonMode": false,
  "disableCompression": false,
  "insecureSkipTLS": false,
  "maxLogLines": 2000,
  "autoScrollLogs": true,
  "wrapLogLines": true,
  "defaultLogLevel": "all"
}
```

### Properties Definition

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `theme` | `string` | `"dark"` | Active color scheme: `"dark"`, `"light"`, or `"system"`. |
| `enableGlowEffects` | `boolean` | `true` | Toggles background aurora ambient glow halos. |
| `showSplashScreen` | `boolean` | `true` | Displays animated brand splash screen on startup. |
| `closeToTray` | `boolean` | `true` | Minimizes window to tray when close (`✕`) button is clicked. |
| `startMinimized` | `boolean` | `false` | Launches application directly to system tray on start. |
| `enableNotifications` | `boolean` | `true` | Master switch for desktop notifications. |
| `notifyOnConnect` | `boolean` | `true` | Dispatches desktop alert when cluster connects/disconnects. |
| `notifyOnIntercept` | `boolean` | `true` | Dispatches alert when workload intercept/replace changes. |
| `autoCheckUpdates` | `boolean` | `true` | Checks GitHub Releases for new updates on application launch. |
| `defaultNamespace` | `string` | `"default"` | Initial namespace populated in connection form. |
| `defaultKubeconfig` | `string` | `""` | Path to custom kubeconfig override. |
| `defaultContext` | `string` | `""` | Context identifier to pre-select on startup. |
| `requestTimeoutSeconds` | `integer` | `60` | CLI execution timeout in seconds. |
| `pollIntervalSeconds` | `integer` | `4` | Watcher poll interval in seconds. |
| `maxLogLines` | `integer` | `2000` | Maximum number of log lines retained in log panel buffer. |
| `autoScrollLogs` | `boolean` | `true` | Automatically scroll log viewer on new output. |
| `wrapLogLines` | `boolean` | `true` | Wrap long log lines. |
| `defaultLogLevel` | `string` | `"all"` | Default filter level for the log console. |
