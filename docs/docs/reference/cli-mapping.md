---
id: cli-mapping
title: Telepresence CLI Flag Mapping
sidebar_position: 1
---

# Telepresence CLI Flag Mapping

This reference table maps every user interface field in **Telepresence GUI** to its corresponding **Telepresence CLI** flag and argument.

---

## 🌐 Connection Settings (`telepresence connect`)

| GUI Tab | GUI Field Label | CLI Flag | Example CLI Value |
| :--- | :--- | :--- | :--- |
| **Core** | Target Namespace | `--namespace` | `--namespace dev` |
| **Core** | Connection Name | `--name` | `--name my-session` |
| **Core** | Manager Namespace | `--manager-namespace` | `--manager-namespace ambassador` |
| **Core** | Run Daemon in Docker | `--docker` | `--docker` |
| **Network** | Mapped Namespaces | `--mapped-namespaces` | `--mapped-namespaces dev,staging,db` |
| **Network** | Proxy Via | `--proxy-via` | `--proxy-via ingress-proxy` |
| **Network** | Also-Proxy CIDRs | `--also-proxy` | `--also-proxy 10.244.0.0/16` |
| **Network** | Never-Proxy CIDRs | `--never-proxy` | `--never-proxy 192.168.1.0/24` |
| **Network** | Reroute Local | `--reroute-local` | `--reroute-local 8080:80` |
| **Network** | Reroute Remote | `--reroute-remote` | `--reroute-remote 9090:9090` |
| **Network** | Virtual NAT (vNAT) | `--vnat` | `--vnat 10.200.0.0/16` |
| **Network** | Allow Conflicting Subnets | `--allow-conflicting-subnets` | `--allow-conflicting-subnets 10.0.0.0/8` |
| **Network** | Expose Ports | `--expose` | `--expose 3000,5000` |
| **Network** | Custom Hostname | `--hostname` | `--hostname dev.cluster.local` |
| **Cluster & Auth** | Kubeconfig File Path | `--kubeconfig` | `--kubeconfig /path/to/kubeconfig` |
| **Cluster & Auth** | Context | `--context` | `--context staging-context` |
| **Cluster & Auth** | Cluster Name | `--cluster` | `--cluster my-k8s-cluster` |
| **Cluster & Auth** | API Server URL | `--server` | `--server https://10.0.0.1:6443` |
| **Cluster & Auth** | Bearer Token | `--token` | `--token eyJhbGci...` |
| **Cluster & Auth** | User | `--user` | `--user dev-user` |
| **Cluster & Auth** | Impersonate User | `--as` | `--as developer@company.com` |
| **Cluster & Auth** | Impersonate Group | `--as-group` | `--as-group dev-team` |
| **Cluster & Auth** | Impersonate UID | `--as-uid` | `--as-uid 10001` |
| **Cluster & Auth** | Client Certificate | `--client-certificate` | `--client-certificate /path/to/cert.crt` |
| **Cluster & Auth** | Client Key | `--client-key` | `--client-key /path/to/key.key` |
| **Cluster & Auth** | Insecure Skip TLS Verify | `--insecure-skip-tls-verify` | `--insecure-skip-tls-verify` |
| **Cluster & Auth** | TLS Server Name | `--tls-server-name` | `--tls-server-name k8s.domain.com` |
| **Advanced** | Custom Config Path | `--config` | `--config /etc/telepresence.yml` |
| **Advanced** | Request Timeout | `--request-timeout` | `--request-timeout 45s` |
| **Advanced** | Disable Response Compression | `--disable-compression` | `--disable-compression` |

---

## 🎯 Intercept Settings (`telepresence intercept`)

| Intercept Field | CLI Flag | Example CLI Value |
| :--- | :--- | :--- |
| Workload Identifier | `[WORKLOAD_NAME]` | `auth-service` |
| Local Port | `--port` | `--port 8080` or `--port 3000:80` |
| HTTP Header Routing | `--http-header` | `--http-header x-dev-user=alice` |
| Environment Export (.env) | `--env-file` | `--env-file .env` |
| Environment Export (JSON) | `--env-json` | `--env-json env.json` |
| Environment Syntax | `--env-syntax` | `--env-syntax docker` or `sh` |
| Mount Directory | `--mount` | `--mount /tmp/k8s-mount` |
| Target Container | `--container` | `--container api-container` |
| Target Service | `--service` | `--service auth-svc` |
| Docker Run Mode | `--docker-run -- [ARGS]` | `--docker-run -- -it node:20 npm start` |

---

## 🛑 Detach Settings (`telepresence detach`)

| Action | CLI Command |
| :--- | :--- |
| Detach Specific Intercept | `telepresence detach <ATTACHMENT_NAME> --namespace <NAMESPACE>` |
| Disconnect All & Quit | `telepresence quit -s` |
