import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { useSettingsStore } from "@/stores/useSettingsStore";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const updateField = useSettingsStore(state => state.updateField);
  const saveSettings = useSettingsStore(state => state.saveSettings);

  const handleSelectTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    updateField("theme", newTheme);
    saveSettings();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleSelectTheme("light")} disabled={theme === "light"}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelectTheme("dark")} disabled={theme === "dark"}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelectTheme("system")} disabled={theme === "system"}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
