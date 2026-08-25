---
id: workload-management
title: Workload Discovery & Management
sidebar_position: 4
---

# Workload Discovery & Management

Once connected to a Kubernetes cluster, Telepresence GUI displays the **Workload Browser**—a live, interactive dashboard that monitors all workloads in your active namespace.

---

## 📋 The Workload Browser Table

Powered by **TanStack Table v9**, the workload browser delivers high-performance virtualized rendering with instant search and multi-column sorting.

```
+------------------------------------------------------------------------------------------------------+
| [ Search workloads...               ]                         Showing 1-10 of 42 workloads  [Page 1] |
+---------------------+-------------+---------------+----------+--------------------+------------------+
| Workload Name       | Namespace   | Kind          | Replicas | Status             | Actions          |
+---------------------+-------------+---------------+----------+--------------------+------------------+
| auth-service        | staging     | Deployment    | 2/2      | Ready              | [ Intercept ]    |
| payment-api         | staging     | Deployment    | 3/3      | Intercepted (8080) | [ Detach ]       |
| order-worker        | staging     | StatefulSet   | 1/1      | Ready              | [ Intercept ]    |
| notification-svc    | staging     | Rollout       | 2/2      | Ready              | [ Intercept ]    |
| ingress-controller  | staging     | DaemonSet     | 4/4      | System Agent       | [ Intercept ]    |
+---------------------+-------------+---------------+----------+--------------------+------------------+
```

---

## 🔍 Features & Table Operations

### 1. Real-Time Search & Filtering
- Type any partial string in the search bar to filter workloads by name instantaneously without querying the cluster again.

### 2. Multi-Column Sorting
- Click any column header (**Workload Name**, **Namespace**, **Kind**, **Replicas**) to toggle ascending or descending sort order.

### 3. Pagination Controls
- Easily navigate large enterprise clusters with customizable page sizes (10, 20, 50, 100 rows per page).

---

## 🏷️ Workload Status Indicators

| Badge | Meaning | Description |
| :--- | :--- | :--- |
| **Ready (Green)** | Workload Healthy | All desired replicas are ready and available for interception. |
| **Intercepted (Orange)** | Active Traffic Intercept | Traffic for this workload is currently routed to a local process or Docker container. |
| **Degraded (Yellow)** | Replica Mismatch | Some pods are failing health checks or restarting (e.g. `1/3 ready`). |
| **Not Interceptable (Grey)** | Incompatible | Displays the exact reason (e.g. headless service, missing container port, or unsupported controller). |

---

## 🔄 Live State Polling

The Go background watcher polls `telepresence list --format json` every 3 seconds:
- As soon as a pod restarts or another developer starts an intercept, the table updates automatically without requiring a manual page refresh.
- If you intercept a service from the terminal CLI, Telepresence GUI detects it in real time and updates the button to **Detach**.
