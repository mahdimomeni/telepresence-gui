---
id: intercept-issues
title: Intercept & Traffic Routing Troubleshooting
sidebar_position: 3
---

# Intercept & Traffic Routing Troubleshooting

This guide assists in diagnosing why a traffic intercept may fail to create, drop connections, or fail to route incoming HTTP requests to your local process.

---

## 🛑 Problem: "Port is already allocated or unavailable"

### Cause:
Your local debugger or web server is not listening on the specified port, or another process is occupying the port.

### Solution:
1. Verify what process is listening locally:
   - **Linux / macOS**: `lsof -i :8080`
   - **Windows**: `netstat -ano | findstr 8080`
2. Start your local application server *before* or *immediately after* starting the intercept.
3. Make sure your local application binds to `0.0.0.0` or `127.0.0.1`.

---

## 🛑 Problem: Header-Based Intercept Not Routing Requests

### Cause:
The HTTP header name or value does not match exactly, or an intermediate proxy / API gateway stripped the header.

### Solution:
1. **Case Sensitivity**: While HTTP/1.1 headers are case-insensitive, Envoy header matching is strictly lowercase. Ensure your header matches:
   ```bash
   curl -H "x-dev-user: alice" http://cluster-service.dev
   ```
2. **Gateway Stripping**: Check if your Ingress Controller (Nginx, Traefik, Istio, Kong) strips custom `x-*` headers before passing them downstream.

---

## 🛑 Problem: "Workload has no interceptable container ports"

### Cause:
The targeted Kubernetes Deployment specification does not explicitly declare a `containerPort` on its container definition.

### Solution:
Ensure your deployment YAML specifies the `containerPort`:
```yaml
containers:
  - name: my-service
    image: my-service:latest
    ports:
      - containerPort: 8080
        name: http
```
