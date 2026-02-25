import { BrowserWindow } from "electron";
import { SettingsStore } from "./settings-store";

export interface NxTheme {
  name: string;
  id: string;
  colors: Record<string, string>;
}

const THEMES: NxTheme[] = [
  {
    name: "Miku Garden",
    id: "miku-garden",
    colors: {
      "--nxui-bg": "rgba(30, 42, 37, 0.88)",
      "--nxui-bg-solid": "#1e2a25",
      "--nxui-surface": "rgba(55, 75, 65, 0.75)",
      "--nxui-border": "rgba(102, 194, 165, 0.25)",
      "--nxui-accent": "#66c2a5",
      "--nxui-accent-glow": "rgba(102, 194, 165, 0.3)",
      "--nxui-text": "rgba(245, 250, 245, 0.95)",
      "--nxui-text-secondary": "rgba(210, 230, 220, 0.7)",
      "--nxui-text-muted": "rgba(210, 230, 220, 0.45)",
      "--nxui-success": "#81b29a",
      "--nxui-danger": "#e07a5f",
      "--nxui-gradient": "linear-gradient(135deg, rgba(30, 42, 37, 0.9), rgba(55, 75, 65, 0.85))",
    },
  },
  {
    name: "Midnight",
    id: "midnight",
    colors: {
      "--nxui-bg": "rgba(13, 15, 20, 0.88)",
      "--nxui-bg-solid": "#0d0f14",
      "--nxui-surface": "rgba(26, 30, 40, 0.75)",
      "--nxui-border": "rgba(0, 212, 255, 0.12)",
      "--nxui-accent": "#00d4ff",
      "--nxui-accent-glow": "rgba(0, 212, 255, 0.25)",
      "--nxui-text": "rgba(255, 255, 255, 0.95)",
      "--nxui-text-secondary": "rgba(255, 255, 255, 0.55)",
      "--nxui-text-muted": "rgba(255, 255, 255, 0.35)",
      "--nxui-success": "#00e676",
      "--nxui-danger": "#ff5252",
      "--nxui-gradient": "linear-gradient(135deg, rgba(13, 15, 20, 0.88), rgba(20, 24, 35, 0.8))",
    },
  },
  {
    name: "Arctic",
    id: "arctic",
    colors: {
      "--nxui-bg": "rgba(240, 245, 255, 0.88)",
      "--nxui-bg-solid": "#f0f5ff",
      "--nxui-surface": "rgba(255, 255, 255, 0.8)",
      "--nxui-border": "rgba(0, 100, 200, 0.12)",
      "--nxui-accent": "#0066cc",
      "--nxui-accent-glow": "rgba(0, 102, 204, 0.2)",
      "--nxui-text": "rgba(10, 20, 40, 0.92)",
      "--nxui-text-secondary": "rgba(10, 20, 40, 0.55)",
      "--nxui-text-muted": "rgba(10, 20, 40, 0.35)",
      "--nxui-success": "#00a86b",
      "--nxui-danger": "#d32f2f",
      "--nxui-gradient": "linear-gradient(135deg, rgba(240, 245, 255, 0.9), rgba(220, 230, 250, 0.85))",
    },
  },
  {
    name: "Cyberpunk",
    id: "cyberpunk",
    colors: {
      "--nxui-bg": "rgba(15, 5, 25, 0.9)",
      "--nxui-bg-solid": "#0f0519",
      "--nxui-surface": "rgba(30, 10, 50, 0.75)",
      "--nxui-border": "rgba(255, 0, 128, 0.15)",
      "--nxui-accent": "#ff0080",
      "--nxui-accent-glow": "rgba(255, 0, 128, 0.3)",
      "--nxui-text": "rgba(255, 255, 255, 0.95)",
      "--nxui-text-secondary": "rgba(255, 255, 255, 0.55)",
      "--nxui-text-muted": "rgba(255, 255, 255, 0.35)",
      "--nxui-success": "#39ff14",
      "--nxui-danger": "#ff073a",
      "--nxui-gradient": "linear-gradient(135deg, rgba(15, 5, 25, 0.9), rgba(30, 10, 50, 0.85))",
    },
  },
  {
    name: "Emerald",
    id: "emerald",
    colors: {
      "--nxui-bg": "rgba(5, 15, 12, 0.9)",
      "--nxui-bg-solid": "#050f0c",
      "--nxui-surface": "rgba(10, 30, 25, 0.75)",
      "--nxui-border": "rgba(0, 200, 150, 0.12)",
      "--nxui-accent": "#00c896",
      "--nxui-accent-glow": "rgba(0, 200, 150, 0.25)",
      "--nxui-text": "rgba(255, 255, 255, 0.95)",
      "--nxui-text-secondary": "rgba(255, 255, 255, 0.55)",
      "--nxui-text-muted": "rgba(255, 255, 255, 0.35)",
      "--nxui-success": "#00e676",
      "--nxui-danger": "#ff5252",
      "--nxui-gradient": "linear-gradient(135deg, rgba(5, 15, 12, 0.9), rgba(10, 30, 25, 0.85))",
    },
  },
];

export class ThemeManager {
  private activeThemeId: string;
  private settings: SettingsStore;

  constructor(settings: SettingsStore) {
    this.settings = settings;
    this.activeThemeId = settings.getActiveTheme() || "miku-garden";
  }

  getAvailableThemes(): { id: string; name: string }[] {
    return THEMES.map(t => ({ id: t.id, name: t.name }));
  }

  getActiveThemeId(): string {
    return this.activeThemeId;
  }

  setTheme(themeId: string): void {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return;
    this.activeThemeId = themeId;
    this.settings.setActiveTheme(themeId);
  }

  getThemeCSS(): string {
    const theme = THEMES.find(t => t.id === this.activeThemeId) || THEMES[0];
    const vars = Object.entries(theme.colors)
      .map(([key, val]) => `${key}: ${val};`)
      .join("\n      ");

    return `:root {\n      ${vars}\n    }`;
  }

  async injectTheme(win: BrowserWindow): Promise<void> {
    const css = this.getThemeCSS();
    await win.webContents.insertCSS(css);
  }

  async applyToAll(windows: Map<string, BrowserWindow>): Promise<void> {
    const css = this.getThemeCSS();
    for (const [, win] of windows) {
      if (!win.isDestroyed()) {
        await win.webContents.insertCSS(css);
      }
    }
  }
}
