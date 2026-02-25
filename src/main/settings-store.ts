import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import type { WidgetState, WidgetPosition } from "../sdk/types";

interface StoreData {
  widgets: Record<string, WidgetState>;
  globalSettings: {
    widgetsDirectory: string;
    startOnBoot: boolean;
    startMinimized: boolean;
    activeTheme: string;
  };
}

const DEFAULT_STORE: StoreData = {
  widgets: {},
  globalSettings: {
    widgetsDirectory: "",
    startOnBoot: false,
    startMinimized: true,
    activeTheme: "miku-garden",
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

  getAllWidgetStates(): Record<string, WidgetState> {
    return { ...this.data.widgets };
  }

  removeWidgetState(widgetId: string): void {
    delete this.data.widgets[widgetId];
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

  private load(): StoreData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_STORE, ...parsed };
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
