export type ThemeMode = "light" | "dark" | "auto";

export const THEME_MODE_KEY = "mioku_theme_mode";

export function resolveAutoTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readThemeMode(): ThemeMode {
  const raw = localStorage.getItem(THEME_MODE_KEY);
  if (raw === "light" || raw === "dark" || raw === "auto") {
    return raw;
  }
  return "auto";
}

export function applyTheme(mode: ThemeMode): void {
  const resolved = mode === "auto" ? resolveAutoTheme() : mode;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  localStorage.setItem(THEME_MODE_KEY, mode);
}

export function cycleThemeMode(mode: ThemeMode): ThemeMode {
  if (mode === "auto") return "light";
  if (mode === "light") return "dark";
  return "auto";
}

export function watchSystemTheme(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
