import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TabProps } from "../types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLoadingStore } from "@/stores/useLoadingStore";
import { ContextInput } from "@/components/context-input";
import { BrowseInput } from "@/components/browse-input";

function ClusterAuthTabComponent({ values, onChange, onBrowse, availableContexts = [] }: TabProps) {
    const isConnecting = useLoadingStore((state) => state.isLoading("connection"))
    const isFetchingKube = useLoadingStore((state) => state.isLoading("kube-info"))
    const loading = isConnecting || isFetchingKube

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cluster & Authentication</CardTitle>
                <CardDescription>
                    Provide Kubeconfig paths, impersonation settings, and TLS credentials.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 grid gap-2">
                        <BrowseInput
                            id="kubeconfig"
                            label="Kubeconfig"
                            name="kubeconfig"
                            placeholder="/path/to/kubeconfig"
                            value={values.kubeconfig}
                            onChange={(e) => onChange("kubeconfig", e.target.value)}
                            onBrowse={(_) => onBrowse("kubeconfig", "Select Kubeconfig File")}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="context">Context</Label>
                        {availableContexts.length > 0 ? (
                            <Select
                                value={values.context}
                                onValueChange={(val) => val && onChange("context", val)}
                            >
                                <SelectTrigger id="context">
                                    <SelectValue placeholder="Select a context" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableContexts.map((ctxName) => (
                                        <SelectItem key={ctxName} value={ctxName}>
                                            {ctxName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <ContextInput
                                id="context"
                                placeholder="e.g., minikube"
                                value={values.context}
                                onChange={(e) => onChange("context", e.target.value)}
                            />
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cluster">Cluster</Label>
                        <ContextInput
                            id="cluster"
                            name="cluster"
                            placeholder="Cluster name"
                            value={values.cluster}
                            onChange={(e) => onChange("cluster", e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="server">API Server</Label>
                        <ContextInput
                            id="server"
                            name="server"
                            placeholder="https://..." type="url"
                            value={values.server}
                            onChange={(e) => onChange("server", e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="token">Bearer Token</Label>
                        <ContextInput
                            id="token"
                            name="token"
                            type="password"
                            placeholder="••••••••••••"
                            value={values.token}
                            onChange={(e) => onChange("token", e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="user">User</Label>
                        <ContextInput
                            id="user"
                            name="user"
                            placeholder="Kubeconfig user"
                            value={values.user}
                            onChange={(e) => onChange("user", e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="as">Impersonate User (--as)</Label>
                        <ContextInput
                            id="as"
                            name="as"
                            placeholder="Username or service account"
                            value={values.as}
                            onChange={(e) => onChange("as", e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="as-group">Impersonate Group</Label>
                        <ContextInput
                            id="as-group"
                            name="as-group"
                            placeholder="Comma-separated groups"
                            value={values["as-group"]}
                            onChange={(e) => onChange("as-group", e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="as-uid">Impersonate UID</Label>
                        <ContextInput
                            id="as-uid"
                            name="as-uid"
                            placeholder="UID"
                            value={values["as-uid"]}
                            onChange={(e) => onChange("as-uid", e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <BrowseInput
                            id="client-certificate"
                            label="Client Certificate"
                            name="client-certificate"
                            placeholder="/path/to/client/certificate"
                            value={values["client-certificate"]}
                            onChange={(e) => onChange("client-certificate", e.target.value)}
                            onBrowse={(_) => onBrowse("client-certificate", "Select Client Certificate File")}
                        />
                    </div>
                    <div className="grid gap-2">
                        <BrowseInput
                            id="client-key"
                            label="Client Key"
                            name="client-key"
                            placeholder="/path/to/client/key"
                            value={values["client-key"]}
                            onChange={(e) => onChange("client-key", e.target.value)}
                            onBrowse={(_) => onBrowse("client-key", "Select Client Key File")}
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                        <Switch
                            id="insecure-skip-tls-verify"
                            name="insecure-skip-tls-verify"
                            checked={values["insecure-skip-tls-verify"]}
                            disabled={loading}
                            onCheckedChange={(checked) => onChange("insecure-skip-tls-verify", checked)}
                        />
                        <Label htmlFor="insecure-skip-tls-verify" className="text-destructive">Skip TLS Verify</Label>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="tls-server-name">TLS Server Name</Label>
                        <ContextInput
                            id="tls-server-name"
                            name="tls-server-name"
                            placeholder="Server name for validation"
                            value={values["tls-server-name"]}
                            onChange={(e) => onChange("tls-server-name", e.target.value)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export const ClusterAuthTab = React.memo(ClusterAuthTabComponent)