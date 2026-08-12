import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TabProps } from "../types";

export function CoreTab({ values, onChange, loading }: TabProps) {
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
                            <Input
                                id="namespace"
                                name="namespace"
                                placeholder="default"
                                value={values.namespace}
                                onChange={(e) => onChange("namespace", e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Connection Name</Label>
                            <Input
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
                            <Input
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