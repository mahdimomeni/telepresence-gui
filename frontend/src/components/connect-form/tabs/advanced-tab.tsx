import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TabProps } from "../types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function AdvancedTab({ values, onChange, loading, onBrowse }: TabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                    Global CLI configurations and network tuning.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 grid gap-2">
                        <Label htmlFor="config">Telepresence Config Path</Label>
                        <div className="flex gap-2">
                            <Input
                                id="config"
                                name="config"
                                type="text"
                                value={values.config}
                                onChange={(e) => onChange("config", e.target.value)}
                                placeholder="/path/to/telepresence/config"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={(_) => onBrowse("config", "Select Telepresence Config File")}
                            >
                                Browse
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="request-timeout">Request Timeout</Label>
                        <Input
                            id="request-timeout"
                            name="request-timeout"
                            placeholder="e.g., 2m, 3h"
                            value={values["request-timeout"]}
                            onChange={(e) => onChange("request-timeout", e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                        <Switch
                            id="disable-compression"
                            name="disable-compression"
                            disabled={loading}
                            checked={values["disable-compression"]}
                            onCheckedChange={(checked) => onChange("disable-compression", checked)}
                        />
                        <Label htmlFor="disable-compression">Disable Response Compression</Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}