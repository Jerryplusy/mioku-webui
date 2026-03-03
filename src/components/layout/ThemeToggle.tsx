import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { applyTheme, cycleThemeMode, readThemeMode, watchSystemTheme, type ThemeMode } from "@/lib/theme";

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(readThemeMode());
  const nextMode = cycleThemeMode(mode);

  useEffect(() => {
    applyTheme(mode);
    return watchSystemTheme(() => {
      if (mode === "auto") {
        applyTheme("auto");
      }
    });
  }, [mode]);

  const icon = mode === "light" ? <Sun className="h-4 w-4" /> : mode === "dark" ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;
  const title = mode === "light" ? "当前: 日间模式，点击切换到夜间" : mode === "dark" ? "当前: 夜间模式，点击切换到自动" : "当前: 自动模式，点击切换到日间";

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => setMode(nextMode)}
      title={title}
      aria-label={title}
      className="transition-all duration-300 hover:-translate-y-0.5"
    >
      <span className="animate-soft-pop">{icon}</span>
    </Button>
  );
}
