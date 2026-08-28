import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TabProps } from "../types";
import { ContextInput } from "@/components/context-input";

function NetworkTabComponent({ values, onChange }: TabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Routing</CardTitle>
        <CardDescription>
          Configure CIDRs, port forwarding, and namespace mapping for outbound connections.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <div className="grid grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="mapped-namespaces">Mapped Namespaces</Label>
            <ContextInput
              id="mapped-namespaces"
              name="mapped-namespaces"
              placeholder="comma, separated, namespaces"
              value={values["mapped-namespaces"]}
              onChange={e => onChange("mapped-namespaces", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="proxy-via">Proxy Via</Label>
            <ContextInput
              id="proxy-via"
              name="proxy-via"
              placeholder="CIDR=WORKLOAD"
              value={values["proxy-via"]}
              onChange={e => onChange("proxy-via", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="also-proxy">Also Proxy</Label>
            <ContextInput
              id="also-proxy"
              name="also-proxy"
              placeholder="Comma-separated CIDRs"
              value={values["also-proxy"]}
              onChange={e => onChange("also-proxy", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="never-proxy">Never Proxy</Label>
            <ContextInput
              id="never-proxy"
              name="never-proxy"
              placeholder="Comma-separated CIDRs"
              value={values["never-proxy"]}
              onChange={e => onChange("never-proxy", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reroute-local">Reroute Local</Label>
            <ContextInput
              id="reroute-local"
              name="reroute-local"
              placeholder="<local port>:<host>:<port>"
              value={values["reroute-local"]}
              onChange={e => onChange("reroute-local", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reroute-remote">Reroute Remote</Label>
            <ContextInput
              id="reroute-remote"
              name="reroute-remote"
              placeholder="<host>:<port>:<new port>"
              value={values["reroute-remote"]}
              onChange={e => onChange("reroute-remote", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vnat">Virtual NAT (vnat)</Label>
            <ContextInput
              id="vnat"
              name="vnat"
              placeholder="Comma-separated CIDRs or symbolic names"
              value={values.vnat}
              onChange={e => onChange("vnat", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="allow-conflicting-subnets">Allow Conflicting Subnets</Label>
            <ContextInput
              id="allow-conflicting-subnets"
              name="allow-conflicting-subnets"
              placeholder="Comma-separated CIDRs"
              value={values["allow-conflicting-subnets"]}
              onChange={e => onChange("allow-conflicting-subnets", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expose">Expose Ports</Label>
            <ContextInput
              id="expose"
              name="expose"
              placeholder="e.g., 8080:80"
              value={values.expose}
              onChange={e => onChange("expose", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hostname">Hostname</Label>
            <ContextInput
              id="hostname"
              name="hostname"
              placeholder="Containerized daemon hostname"
              value={values.hostname}
              onChange={e => onChange("hostname", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const NetworkTab = React.memo(NetworkTabComponent);
