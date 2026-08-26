import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabProps } from "../types";
import { useLoadingStore } from "@/stores/useLoadingStore";
import { ContextInput } from "@/components/context-input";

function CoreTabComponent({ values, onChange }: TabProps) {
    const isConnecting = useLoadingStore((state) => state.isLoading("connection"))
    const isFetchingKube = useLoadingStore((state) => state.isLoading("kube-info"))
    const loading = isConnecting || isFetchingKube
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Core Connection</CardTitle>
                <CardDescription>
                    Essential settings to establish your development session and intercept traffic.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
                <div className="grid gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="namespace">Namespace</Label>
                            <ContextInput
                                id="namespace"
                                name="namespace"
                                placeholder="default"
                                value={values.namespace}
                                onChange={(e) => onChange("namespace", e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Connection Name</Label>
                            <ContextInput
                                id="name"
                                name="name"
                                placeholder="my-connection"
                                value={values.name}
                                onChange={(e) => onChange("name", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="manager-namespace">Manager Namespace</Label>
                            <ContextInput
                                id="manager-namespace"
                                name="manager-namespace"
                                placeholder="Override default manager namespace"
                                value={values["manager-namespace"]}
                                onChange={(e) => onChange("manager-namespace", e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                            <Switch
                                id="docker"
                                name="docker"
                                checked={values.docker}
                                disabled={loading}
                                onCheckedChange={(checked) => onChange("docker", checked)}
                            />
                            <Label htmlFor="docker">Start daemon in Docker container</Label>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export const CoreTab = React.memo(CoreTabComponent)