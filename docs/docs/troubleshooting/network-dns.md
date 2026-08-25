---
id: network-dns
title: Network, Subnet & DNS Troubleshooting
sidebar_position: 2
---

# Network, Subnet & DNS Troubleshooting

This guide addresses common networking conflicts, overlapping subnets, and DNS resolution failures between local workstations and Kubernetes clusters.

---

## 🛑 Problem: Subnet Collision Error (`Subnet already in use`)

### Cause:
The remote Kubernetes Pod/Service CIDR range overlaps with your local workstation's physical LAN IP (e.g. `192.168.1.0/24` or `10.0.0.0/16`).

### Solutions:
1. **Use Virtual NAT (vNAT)**:
   - In the **Network** tab, enter a non-conflicting subnet in the **Virtual NAT (vNAT)** field (e.g., `10.200.0.0/16`). Telepresence will map the cluster IPs into this virtual range.
2. **Configure Never-Proxy**:
   - In the **Never-Proxy CIDRs** field, add your local router subnet (e.g., `192.168.1.0/24`).
3. **Allow Conflicting Subnets**:
   - Add the specific conflicting subnet to **Allow Conflicting Subnets** to force cluster routing priority.

---

## 🛑 Problem: Cannot Resolve Cluster Service Names (e.g. `auth-service.dev`)

### Cause:
The local DNS resolver was not updated, or a corporate VPN / systemd-resolved service is overriding DNS lookups.

### Solutions:
1. **Verify Mapped Namespaces**:
   - Ensure the target namespace is listed in **Mapped Namespaces** on the **Network** tab (e.g., `dev,staging,default`).
2. **Linux `systemd-resolved` Check**:
   - Run `resolvectl status` to ensure the Telepresence interface has cluster DNS domains attached.
3. **macOS Resolver Check**:
   - Check if `/etc/resolver/` contains entries for `cluster.local`.

---

## 🛑 Problem: Corporate VPN Disconnects on Telepresence Connect

### Cause:
The corporate VPN client detects route table modifications and disconnects for security compliance.

### Solution:
1. Connect to your corporate VPN **first**.
2. Identify the VPN subnet range (e.g., `172.16.0.0/12`).
3. Add that range to the **Never-Proxy CIDRs** field in Telepresence GUI before clicking **Connect**.
