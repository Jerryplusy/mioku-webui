import { useEffect } from "react";
import { applyTheme, readThemeMode, watchSystemTheme } from "@/lib/theme";

export function ThemeBootstrap() {
  useEffect(() => {
    const applyCurrent = () => {
      applyTheme(readThemeMode());
    };

    applyCurrent();
    const unwatch = watchSystemTheme(() => {
      if (readThemeMode() === "auto") {
        applyCurrent();
      }
    });

    return () => unwatch();
  }, []);

  return null;
}
