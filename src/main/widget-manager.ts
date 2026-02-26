import { BrowserWindow, screen } from "electron";
import { loadWidget } from "./widget-loader";
import { scanWidgets, filePathToWidgetId } from "./widget-scanner";
import { createWidgetWindow } from "./window-factory";
import { setupIPC } from "./ipc-handlers";
import { SettingsStore } from "./settings-store";
import { ThemeManager } from "./theme-manager";
import { FileWatcher } from "./file-watcher";
import type { WidgetInstance, WidgetState } from "../sdk/types";

export class WidgetManager {
  private widgets = new Map<string, WidgetInstance>();
  private windows = new Map<string, BrowserWindow>();
  private settings: SettingsStore;
  private themeManager: ThemeManager;
  private fileWatcher: FileWatcher;
  private widgetsDir: string;
  private allHidden = false;

  constructor(widgetsDir: string, settings: SettingsStore, themeManager: ThemeManager) {
    this.widgetsDir = widgetsDir;
    this.settings = settings;
    this.themeManager = themeManager;
    this.fileWatcher = new FileWatcher(widgetsDir);

    setupIPC(this, settings);
    this.setupFileWatcher();
  }

  getWidgets(): Map<string, WidgetInstance> { return this.widgets; }
  getWindows(): Map<string, BrowserWindow> { return this.windows; }
  getWidgetsDir(): string { return this.widgetsDir; }

  async initialize(): Promise<void> {
    console.log(`[WidgetManager] Scanning: ${this.widgetsDir}`);

    const entries = scanWidgets(this.widgetsDir);
    console.log(`[WidgetManager] Found ${entries.length} widget(s)`);

    for (const entry of entries) {
      try {
        await this.loadAndCreateWidget(entry.id, entry.entryPath, entry.dirPath);
      } catch (err: any) {
        console.error(`[WidgetManager] Failed to load "${entry.id}":`, err.message);
      }
    }

    this.fileWatcher.start();
  }

  private async loadAndCreateWidget(
    widgetId: string,
    entryPath: string,
    dirPath: string | null
  ): Promise<void> {
    if (this.widgets.has(widgetId)) {
      this.destroyWidget(widgetId);
    }

    console.log(`[WidgetManager] Loading: ${widgetId}`);
    const config = await loadWidget(entryPath, dirPath);

    let state = this.settings.getWidgetState(widgetId);
    if (!state) {
      const display = screen.getPrimaryDisplay();
      state = {
        enabled: true,
        draggable: true,
        position: {
          x: Math.round(display.workArea.width / 2 - config.width / 2),
          y: Math.round(display.workArea.height / 2 - config.height / 2),
        },
        width: config.width,
        height: config.height,
        opacity: 1,
      };
      this.settings.setWidgetState(widgetId, state);
    } else if (state.draggable === undefined) {
      state.draggable = true;
      this.settings.setWidgetState(widgetId, state);
    }

    if (state.opacity === undefined) {
      state.opacity = 1;
    }

    const instance: WidgetInstance = { id: widgetId, filePath: entryPath, config, state };
    this.widgets.set(widgetId, instance);

    if (state.enabled) {
      const win = await createWidgetWindow(instance, this.settings);
      win.on("closed", () => this.windows.delete(widgetId));
      this.windows.set(widgetId, win);

      await this.themeManager.injectTheme(win);
    }
  }

  destroyWidget(widgetId: string): void {
    const win = this.windows.get(widgetId);
    if (win && !win.isDestroyed()) {
      win.close();
    }
    this.windows.delete(widgetId);
    this.widgets.delete(widgetId);
  }

  async toggleWidget(widgetId: string, enabled: boolean): Promise<void> {
    const instance = this.widgets.get(widgetId);
    if (!instance) return;

    instance.state.enabled = enabled;
    this.settings.setWidgetEnabled(widgetId, enabled);

    if (enabled) {
      const win = await createWidgetWindow(instance, this.settings);
      win.on("closed", () => this.windows.delete(widgetId));
      this.windows.set(widgetId, win);

      await this.themeManager.injectTheme(win);
    } else {
      const win = this.windows.get(widgetId);
      if (win && !win.isDestroyed()) win.close();
      this.windows.delete(widgetId);
    }
  }

  async toggleWidgetDrag(widgetId: string, draggable: boolean): Promise<void> {
    const instance = this.widgets.get(widgetId);
    if (!instance) return;

    instance.state.draggable = draggable;
    this.settings.setWidgetDraggable(widgetId, draggable);

    const win = this.windows.get(widgetId);
    if (win && !win.isDestroyed()) {
      win.setIgnoreMouseEvents(!draggable, { forward: true });
      win.webContents.send("widget-drag-toggled", draggable);
    }
  }

  setWidgetOpacity(widgetId: string, opacity: number): void {
    const instance = this.widgets.get(widgetId);
    if (!instance) return;

    const clampedOpacity = Math.max(0.1, Math.min(1, opacity));
    instance.state.opacity = clampedOpacity;
    this.settings.setWidgetOpacity(widgetId, clampedOpacity);

    const win = this.windows.get(widgetId);
    if (win && !win.isDestroyed()) {
      win.setOpacity(clampedOpacity);
    }
  }

  hideAllWidgets(): void {
    this.allHidden = true;
    let delay = 0;
    for (const [, win] of this.windows) {
      if (!win.isDestroyed()) {
        const currentWin = win;
        setTimeout(() => {
          if (!currentWin.isDestroyed()) {
            currentWin.webContents.send("widget-hide-anim");
            setTimeout(() => {
              if (!currentWin.isDestroyed()) currentWin.hide();
            }, 400); // Wait for CSS transition
          }
        }, delay);
        delay += 50; // Stagger effect
      }
    }
    console.log("[WidgetManager] All widgets hiding sequentially.");
  }

  showAllWidgets(): void {
    this.allHidden = false;
    let delay = 0;
    for (const [id, win] of this.windows) {
      if (!win.isDestroyed()) {
        const instance = this.widgets.get(id);
        if (instance && instance.state.enabled) {
          const currentWin = win;
          setTimeout(() => {
            if (!currentWin.isDestroyed()) {
              currentWin.showInactive();
              currentWin.webContents.send("widget-show-anim");
            }
          }, delay);
          delay += 50;
        }
      }
    }
    console.log("[WidgetManager] All widgets showing sequentially.");
  }

  toggleAllVisibility(): void {
    if (this.allHidden) {
      this.showAllWidgets();
    } else {
      this.hideAllWidgets();
    }
  }

  isAllHidden(): boolean {
    return this.allHidden;
  }

  async applyProfile(profile: Record<string, WidgetState>): Promise<void> {
    for (const [widgetId, savedState] of Object.entries(profile)) {
      const instance = this.widgets.get(widgetId);
      if (!instance) continue;

      instance.state.position = savedState.position;
      instance.state.enabled = savedState.enabled;
      instance.state.opacity = savedState.opacity ?? 1;
      instance.state.width = savedState.width;
      instance.state.height = savedState.height;
      this.settings.setWidgetState(widgetId, instance.state);

      const win = this.windows.get(widgetId);
      if (savedState.enabled && win && !win.isDestroyed()) {
        win.setPosition(savedState.position.x, savedState.position.y);
        if (savedState.width && savedState.height) {
          win.setSize(savedState.width, savedState.height);
        }
        win.setOpacity(savedState.opacity ?? 1);
      } else if (savedState.enabled && !win) {
        await this.toggleWidget(widgetId, true);
      } else if (!savedState.enabled && win) {
        await this.toggleWidget(widgetId, false);
      }
    }
    console.log("[WidgetManager] Profile applied.");
  }

  async reloadWidget(widgetId: string): Promise<void> {
    const instance = this.widgets.get(widgetId);
    if (!instance) return;

    const entries = scanWidgets(this.widgetsDir);
    const entry = entries.find(e => e.id === widgetId);
    const dirPath = entry ? entry.dirPath : null;

    console.log(`[WidgetManager] Reloading: ${widgetId}`);
    await this.loadAndCreateWidget(widgetId, instance.filePath, dirPath);
  }

  private setupFileWatcher(): void {
    this.fileWatcher.on("widget-changed", async (filePath: string) => {
      const widgetId = filePathToWidgetId(this.widgetsDir, filePath);
      if (this.widgets.has(widgetId)) {
        try {
          await this.reloadWidget(widgetId);
        } catch (err: any) {
          console.error(`[HotReload] Reload failed for "${widgetId}":`, err.message);
        }
      }
    });

    this.fileWatcher.on("widget-added", async (filePath: string) => {
      const widgetId = filePathToWidgetId(this.widgetsDir, filePath);
      try {
        const entries = scanWidgets(this.widgetsDir);
        const entry = entries.find(e => e.id === widgetId);
        if (entry) {
          await this.loadAndCreateWidget(entry.id, entry.entryPath, entry.dirPath);
        }
      } catch (err: any) {
        console.error(`[HotReload] Failed to add widget:`, err.message);
      }
    });

    this.fileWatcher.on("widget-removed", (filePath: string) => {
      try {
        const widgetId = filePathToWidgetId(this.widgetsDir, filePath);
        this.destroyWidget(widgetId);
      } catch (err: any) {
        console.error(`[HotReload] Error removing widget:`, err.message);
      }
    });
  }

  async shutdown(): Promise<void> {
    await this.fileWatcher.stop();

    for (const [, win] of this.windows) {
      if (!win.isDestroyed()) win.close();
    }

    this.windows.clear();
    this.widgets.clear();
    console.log("[WidgetManager] Shutdown complete.");
  }
}
