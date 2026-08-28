import { models } from "@/../wailsjs/go/models";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Laptop, Sparkles, Bell, Tv, RotateCcw, BellRing } from "lucide-react";
import { CoreService } from "@/services/core";
import { useTheme } from "@/components/theme-provider";

interface GeneralTabProps {
  settings: models.AppSettings;
  onChange: <K extends keyof models.AppSettings>(key: K, value: models.AppSettings[K]) => void;
  onReplaySplash?: () => void;
}

export function GeneralTab({ settings, onChange, onReplaySplash }: GeneralTabProps) {
  const { setTheme } = useTheme();

  const handleThemeChange = (theme: "dark" | "light" | "system") => {
    onChange("theme", theme);
    setTheme(theme);
  };

  const handleTestNotification = async () => {
    await CoreService.notify(
      "Telepresence GUI Notification Test",
      "Desktop notifications are active and working properly!"
    );
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* 1. Appearance & Aesthetics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Appearance & Visuals
          </h3>
        </div>

        <div className="grid gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
          {/* Theme Mode Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
            <div>
              <Label className="text-xs font-semibold text-foreground">Color Theme</Label>
              <p className="text-[11px] text-muted-foreground">
                Select your preferred color scheme for the application interface.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 shrink-0">
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  settings.theme === "dark"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="size-3.5 text-primary" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  settings.theme === "light"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="size-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("system")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  settings.theme === "system"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Laptop className="size-3.5 text-sky-400" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Ambient Glows Toggle */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="space-y-0.5">
              <Label
                htmlFor="glow-toggle"
                className="text-xs font-semibold text-foreground cursor-pointer"
              >
                Ambient Cyber Glow Effects
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Display subtle dynamic aurora glows and neon backdrops behind application windows.
              </p>
            </div>
            <Switch
              id="glow-toggle"
              checked={settings.enableGlowEffects}
              onCheckedChange={checked => onChange("enableGlowEffects", checked)}
            />
          </div>

          {/* Startup Splash Screen */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="splash-toggle"
                  className="text-xs font-semibold text-foreground cursor-pointer"
                >
                  Show Boot Sequence on Launch
                </Label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Display the orbital boot and engine initialization animation when launching the
                application.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onReplaySplash && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onReplaySplash}
                  className="h-7 px-2 text-[11px] gap-1 active:scale-95 transition-transform"
                >
                  <RotateCcw className="size-3 text-primary" />
                  <span>Preview</span>
                </Button>
              )}
              <Switch
                id="splash-toggle"
                checked={settings.showSplashScreen}
                onCheckedChange={checked => onChange("showSplashScreen", checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Window & System Tray Behavior */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tv className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Window & System Tray
          </h3>
        </div>

        <div className="grid gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
          {/* Close to Tray Toggle */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="close-tray-toggle"
                  className="text-xs font-semibold text-foreground cursor-pointer"
                >
                  Hide to System Tray on Close
                </Label>
                <Badge
                  variant="outline"
                  className="text-[9px] h-4 font-mono px-1 py-0 text-muted-foreground"
                >
                  Recommended
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Clicking the window close [X] button hides the GUI to the background tray without
                disconnecting active Telepresence intercepts.
              </p>
            </div>
            <Switch
              id="close-tray-toggle"
              checked={settings.closeToTray}
              onCheckedChange={checked => onChange("closeToTray", checked)}
            />
          </div>

          {/* Start Minimized */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="space-y-0.5">
              <Label
                htmlFor="start-min-toggle"
                className="text-xs font-semibold text-foreground cursor-pointer"
              >
                Start Minimized
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Launch the application directly in the system tray upon system startup without
                popping open the main window.
              </p>
            </div>
            <Switch
              id="start-min-toggle"
              checked={settings.startMinimized}
              onCheckedChange={checked => onChange("startMinimized", checked)}
            />
          </div>
        </div>
      </div>

      {/* 3. Desktop Notifications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Desktop Notifications
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleTestNotification}
            className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground active:scale-95"
            title="Send test desktop notification"
          >
            <BellRing className="size-3 text-primary" />
            <span>Test Alert</span>
          </Button>
        </div>

        <div className="grid gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
          {/* Master Notification Switch */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div className="space-y-0.5">
              <Label
                htmlFor="notif-master-toggle"
                className="text-xs font-semibold text-foreground cursor-pointer"
              >
                Enable System Desktop Notifications
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Show native OS toast notifications for cluster connections, intercepts, and
                warnings.
              </p>
            </div>
            <Switch
              id="notif-master-toggle"
              checked={settings.enableNotifications}
              onCheckedChange={checked => onChange("enableNotifications", checked)}
            />
          </div>

          {/* Sub-toggles */}
          <div
            className={`space-y-3 transition-opacity ${settings.enableNotifications ? "opacity-100" : "opacity-40 pointer-events-none"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label
                  htmlFor="notif-conn-toggle"
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  Notify on Cluster Connect & Disconnect
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Receive alerts when Telepresence daemon successfully connects or disconnects.
                </p>
              </div>
              <Switch
                id="notif-conn-toggle"
                checked={settings.notifyOnConnect}
                disabled={!settings.enableNotifications}
                onCheckedChange={checked => onChange("notifyOnConnect", checked)}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/30">
              <div className="space-y-0.5">
                <Label
                  htmlFor="notif-inter-toggle"
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  Notify on Intercept & Replace Actions
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Receive alerts when workloads are intercepted, replaced, or detached.
                </p>
              </div>
              <Switch
                id="notif-inter-toggle"
                checked={settings.notifyOnIntercept}
                disabled={!settings.enableNotifications}
                onCheckedChange={checked => onChange("notifyOnIntercept", checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
