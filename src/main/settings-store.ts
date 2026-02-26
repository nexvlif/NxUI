import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import type { WidgetState, WidgetPosition } from "../sdk/types";

interface StoreData {
  widgets: Record<string, WidgetState>;
  widgetSettings: Record<string, Record<string, any>>;
  profiles: Record<string, Record<string, WidgetState>>;
  globalSettings: {
    widgetsDirectory: string;
    startOnBoot: boolean;
    startMinimized: boolean;
    activeTheme: string;
    focusModeEnabled: boolean;
  };
}

const DEFAULT_STORE: StoreData = {
  widgets: {},
  widgetSettings: {},
  profiles: {},
  globalSettings: {
    widgetsDirectory: "",
    startOnBoot: false,
    startMinimized: true,
    activeTheme: "miku-garden",
    focusModeEnabled: true,
  },
};

export class SettingsStore {
  private filePath: string;
  private data: StoreData;

  constructor() {
    const userDataPath = app.getPath("userData");
    this.filePath = path.join(userDataPath, "nxui-settings.json");
    this.data = this.load();
  }

  getWidgetState(widgetId: string): WidgetState | undefined {
    return this.data.widgets[widgetId];
  }

  setWidgetState(widgetId: string, state: WidgetState): void {
    this.data.widgets[widgetId] = state;
    this.save();
  }

  setWidgetPosition(widgetId: string, position: WidgetPosition): void {
    if (this.data.widgets[widgetId]) {
      this.data.widgets[widgetId].position = position;
      this.save();
    }
  }

  setWidgetEnabled(widgetId: string, enabled: boolean): void {
    if (this.data.widgets[widgetId]) {
      this.data.widgets[widgetId].enabled = enabled;
      this.save();
    }
  }

  setWidgetDraggable(widgetId: string, draggable: boolean): void {
    if (this.data.widgets[widgetId]) {
      this.data.widgets[widgetId].draggable = draggable;
      this.save();
    }
  }

  setWidgetOpacity(widgetId: string, opacity: number): void {
    if (this.data.widgets[widgetId]) {
      this.data.widgets[widgetId].opacity = opacity;
      this.save();
    }
  }

  setWidgetHidden(widgetId: string, hidden: boolean): void {
    if (this.data.widgets[widgetId]) {
      this.data.widgets[widgetId].hidden = hidden;
      this.save();
    }
  }

  getAllWidgetStates(): Record<string, WidgetState> {
    return { ...this.data.widgets };
  }

  removeWidgetState(widgetId: string): void {
    delete this.data.widgets[widgetId];
    delete this.data.widgetSettings[widgetId];
    this.save();
  }

  getWidgetSettings(widgetId: string): Record<string, any> {
    return this.data.widgetSettings[widgetId] || {};
  }

  setWidgetSetting(widgetId: string, key: string, value: any): void {
    if (!this.data.widgetSettings[widgetId]) {
      this.data.widgetSettings[widgetId] = {};
    }
    this.data.widgetSettings[widgetId][key] = value;
    this.save();
  }

  getAllWidgetSettings(): Record<string, Record<string, any>> {
    return { ...this.data.widgetSettings };
  }

  getProfiles(): Record<string, Record<string, WidgetState>> {
    return { ...this.data.profiles };
  }

  saveProfile(name: string): void {
    this.data.profiles[name] = JSON.parse(JSON.stringify(this.data.widgets));
    this.save();
  }

  loadProfile(name: string): Record<string, WidgetState> | undefined {
    return this.data.profiles[name];
  }

  deleteProfile(name: string): void {
    delete this.data.profiles[name];
    this.save();
  }

  getWidgetsDirectory(): string {
    return this.data.globalSettings.widgetsDirectory;
  }

  setWidgetsDirectory(dir: string): void {
    this.data.globalSettings.widgetsDirectory = dir;
    this.save();
  }

  getStartOnBoot(): boolean {
    return this.data.globalSettings.startOnBoot;
  }

  setStartOnBoot(value: boolean): void {
    this.data.globalSettings.startOnBoot = value;
    this.save();
  }

  getActiveTheme(): string {
    return this.data.globalSettings.activeTheme || "miku-garden";
  }

  setActiveTheme(themeId: string): void {
    this.data.globalSettings.activeTheme = themeId;
    this.save();
  }

  getFocusModeEnabled(): boolean {
    return this.data.globalSettings.focusModeEnabled !== false;
  }

  setFocusModeEnabled(value: boolean): void {
    this.data.globalSettings.focusModeEnabled = value;
    this.save();
  }

  private load(): StoreData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_STORE,
          ...parsed,
          globalSettings: { ...DEFAULT_STORE.globalSettings, ...(parsed.globalSettings || {}) },
        };
      }
    } catch (err) {
      console.error("[SettingsStore] Failed to load settings:", err);
    }
    return { ...DEFAULT_STORE };
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("[SettingsStore] Failed to save settings:", err);
    }
  }
}
