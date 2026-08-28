import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TabProps } from "../types";
import { Switch } from "@/components/ui/switch";
import { useLoadingStore } from "@/stores/useLoadingStore";
import { ContextInput } from "@/components/context-input";
import { BrowseInput } from "@/components/browse-input";

function AdvancedTabComponent({ values, onChange, onBrowse }: TabProps) {
  const isConnecting = useLoadingStore(state => state.isLoading("connection"));
  const isFetchingKube = useLoadingStore(state => state.isLoading("kube-info"));
  const loading = isConnecting || isFetchingKube;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Settings</CardTitle>
        <CardDescription>Global CLI configurations and network tuning.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 grid gap-2">
            <BrowseInput
              id="config"
              label="Telepresence Config Path"
              name="config"
              placeholder="/path/to/telepresence/config"
              value={values.config}
              onChange={e => onChange("config", e.target.value)}
              onBrowse={_ => onBrowse("config", "Select Telepresence Config File")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="request-timeout">Request Timeout</Label>
            <ContextInput
              id="request-timeout"
              name="request-timeout"
              placeholder="e.g., 2m, 3h"
              value={values["request-timeout"]}
              onChange={e => onChange("request-timeout", e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="disable-compression"
              name="disable-compression"
              disabled={loading}
              checked={values["disable-compression"]}
              onCheckedChange={checked => onChange("disable-compression", checked)}
            />
            <Label htmlFor="disable-compression">Disable Response Compression</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const AdvancedTab = React.memo(AdvancedTabComponent);
