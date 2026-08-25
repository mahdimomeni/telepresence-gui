---
id: config-schema
title: Configuration File Schema
sidebar_position: 2
---

# Configuration File Schema

Telepresence GUI automatically persists the user's connection profile to a local JSON configuration file.

---

## 📁 File Locations

- **Windows**: `%APPDATA%\telepresence-gui\config.json` (typically `C:\Users\<Username>\AppData\Roaming\telepresence-gui\config.json`)
- **macOS**: `~/Library/Application Support/telepresence-gui/config.json` or `~/.config/telepresence-gui/config.json`
- **Linux**: `~/.config/telepresence-gui/config.json`

---

## 📄 JSON Structure & Example

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

---

## 🔍 Schema Property Definitions

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
