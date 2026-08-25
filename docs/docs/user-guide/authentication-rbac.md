---
id: authentication-rbac
title: Authentication, RBAC & Advanced Flags
sidebar_position: 3
---

# Authentication, RBAC & Advanced Settings

The **Cluster & Auth** and **Advanced** tabs allow you to configure enterprise-grade authentication, RBAC user/group impersonation, TLS certificates, and Telepresence daemon runtime tuning.

---

## 🔑 Authentication & Impersonation Settings

```
+--------------------------------------------------------------------+
| Kubeconfig File:     [ /home/user/.kube/config            ] [Browse]
| Context:             [ staging-k8s-us-east-1              ]        |
| API Server URL:      [ https://api.k8s.company.internal:6443 ]     |
| Bearer Token:        [ •••••••••••••••••••••••••••••••••• ]        |
| Impersonate User:    [ developer@company.com              ]        |
| Impersonate Group:   [ dev-team-backend, engineering      ]        |
| Impersonate UID:     [ 10001                              ]        |
| Client Certificate:  [ /certs/client.crt                  ] [Browse]
| Client Key:          [ /certs/client.key                  ] [Browse]
| TLS Server Name:     [ k8s-api.company.internal           ]        |
| Insecure Skip TLS:   [X] Skip TLS Certificate Verification         |
+--------------------------------------------------------------------+
```

---

## 🛡️ RBAC Impersonation Explained

In enterprise Kubernetes clusters, developers often access the cluster via an administrative proxy or jump host, but must be restricted to specific RBAC roles.

### 1. User Impersonation (`--as`)
- Specifies the username to impersonate when making requests to the Kubernetes API server.
- Example: `developer@company.com` or `serviceaccount:default:dev-user`.

### 2. Group Impersonation (`--as-group`)
- Specifies one or more security groups for RBAC authorization.
- Example: `developers,devops-read-only`.

### 3. UID Impersonation (`--as-uid`)
- Specifies a unique user identifier for strict multi-tenant authorization policies.

---

## 🔐 TLS & Certificate Management

- **Client Certificate (`--client-certificate`)**: Path to your client PEM certificate file used for mTLS authentication against the Kubernetes API.
- **Client Key (`--client-key`)**: Path to your private RSA/ECDSA key matching the client certificate.
- **TLS Server Name (`--tls-server-name`)**: Overrides the SNI (Server Name Indication) hostname passed during the TLS handshake.
- **Insecure Skip TLS Verify (`--insecure-skip-tls-verify`)**: Bypasses SSL/TLS certificate chain verification (useful for local self-signed Minikube/Kind clusters or corporate development proxies).

---

## ⚙️ Advanced Daemon Settings

The **Advanced** tab provides low-level control over the Telepresence daemon process:

```
+--------------------------------------------------------------------+
| Telepresence Config File:  [ /etc/telepresence/config.yml   ] [Browse]
| Request Timeout:           [ 45s                            ]        |
| Response Compression:      [ ] Disable Response Compression          |
+--------------------------------------------------------------------+
```

### 1. Custom Configuration Path (`--config`)
Points Telepresence to a custom YAML configuration file defining global timeouts, log levels, and DNS settings.

### 2. Request Timeout (`--request-timeout`)
Specifies the maximum time to wait for a Kubernetes API or Traffic Manager operation before returning a timeout error (e.g., `30s`, `1m`, `90s`). Default is `60s`.

### 3. Disable Response Compression (`--disable-compression`)
Disables gzip/brotli compression for traffic transferred between the cluster traffic manager and your local workstation.
- Useful when debugging binary streaming protocols, gRPC, or high-throughput WebSocket connections.
