import { ipcMain, BrowserWindow, app, screen } from "electron";
import * as fs from "fs";
import { dialog } from "electron";
import { SettingsStore } from "./settings-store";
import type { WidgetInstance } from "../sdk/types";

interface WidgetManagerRef {
  getWidgets(): Map<string, WidgetInstance>;
  getWindows(): Map<string, BrowserWindow>;
  toggleWidget(id: string, enabled: boolean): Promise<void>;
  toggleWidgetDrag(id: string, draggable: boolean): Promise<void>;
  reloadWidget(id: string): Promise<void>;
  getWidgetsDir(): string;
  setWidgetOpacity(id: string, opacity: number): void;
  hideAllWidgets(): void;
  showAllWidgets(): void;
  applyProfile(profile: Record<string, any>): Promise<void>;
}

export function setupIPC(manager: WidgetManagerRef, settings: SettingsStore): void {
  ipcMain.on("widget-drag-move", (_event, data: { id: string; deltaX: number; deltaY: number }) => {
    const win = manager.getWindows().get(data.id);
    if (win && !win.isDestroyed()) {
      const [x, y] = win.getPosition();
      const newX = x + data.deltaX;
      const newY = y + data.deltaY;
      win.setPosition(newX, newY);

      const instance = manager.getWidgets().get(data.id);
      if (instance) {
        instance.state.position = { x: newX, y: newY };
        settings.setWidgetPosition(data.id, { x: newX, y: newY });
      }
    }
  });

  ipcMain.on("widget-drag-end", (_event, data: { id: string }) => {
    const win = manager.getWindows().get(data.id);
    if (!win || win.isDestroyed()) return;

    const SNAP_THRESHOLD = 20;
    const [x, y] = win.getPosition();
    const bounds = win.getBounds();
    let newX = x;
    let newY = y;

    const display = screen.getDisplayMatching(bounds);
    const workArea = display.workArea;

    // Screen snapping
    if (Math.abs(newX - workArea.x) < SNAP_THRESHOLD) newX = workArea.x;
    else if (Math.abs((newX + bounds.width) - (workArea.x + workArea.width)) < SNAP_THRESHOLD)
      newX = workArea.x + workArea.width - bounds.width;

    if (Math.abs(newY - workArea.y) < SNAP_THRESHOLD) newY = workArea.y;
    else if (Math.abs((newY + bounds.height) - (workArea.y + workArea.height)) < SNAP_THRESHOLD)
      newY = workArea.y + workArea.height - bounds.height;

    for (const [otherId, otherWin] of manager.getWindows()) {
      if (otherId === data.id || otherWin.isDestroyed()) continue;
      const other = otherWin.getBounds();

      if (Math.abs(newX - other.x) < SNAP_THRESHOLD) newX = other.x;
      else if (Math.abs(newX - (other.x + other.width)) < SNAP_THRESHOLD) newX = other.x + other.width;
      else if (Math.abs((newX + bounds.width) - (other.x + other.width)) < SNAP_THRESHOLD) newX = other.x + other.width - bounds.width;
      else if (Math.abs((newX + bounds.width) - other.x) < SNAP_THRESHOLD) newX = other.x - bounds.width;

      if (Math.abs(newY - other.y) < SNAP_THRESHOLD) newY = other.y;
      else if (Math.abs(newY - (other.y + other.height)) < SNAP_THRESHOLD) newY = other.y + other.height;
      else if (Math.abs((newY + bounds.height) - (other.y + other.height)) < SNAP_THRESHOLD) newY = other.y + other.height - bounds.height;
      else if (Math.abs((newY + bounds.height) - other.y) < SNAP_THRESHOLD) newY = other.y - bounds.height;
    }

    if (newX !== x || newY !== y) {
      win.setPosition(newX, newY);
      const instance = manager.getWidgets().get(data.id);
      if (instance) {
        instance.state.position = { x: newX, y: newY };
        settings.setWidgetPosition(data.id, { x: newX, y: newY });
      }
    }
  });

  ipcMain.on("widget-bus-emit", (e, payload: { event: string; data?: any }) => {
    const senderWin = e.sender;
    for (const [, win] of manager.getWindows()) {
      if (win.webContents !== senderWin && !win.isDestroyed()) {
        win.webContents.send("widget-bus-on", payload);
      }
    }
  });

  ipcMain.handle("get-widgets-list", () => {
    const list: any[] = [];
    for (const [id, instance] of manager.getWidgets()) {
      list.push({
        id,
        name: instance.config.name,
        version: instance.config.version,
        author: instance.config.author,
        description: instance.config.description || "",
        enabled: instance.state.enabled,
        draggable: instance.state.draggable,
        opacity: instance.state.opacity ?? 1,
        filePath: instance.filePath,
        settingsSchema: instance.config.settings || [],
      });
    }
    return list;
  });

  ipcMain.handle("toggle-widget", async (_event, data: { id: string; enabled: boolean }) => {
    try {
      await manager.toggleWidget(data.id, data.enabled);
    } catch (err: any) {
      console.error(`[IPC] Toggle widget failed:`, err.message);
    }
  });

  ipcMain.handle("toggle-widget-drag", async (_event, data: { id: string; draggable: boolean }) => {
    try {
      await manager.toggleWidgetDrag(data.id, data.draggable);
    } catch (err: any) {
      console.error(`[IPC] Toggle drag failed:`, err.message);
    }
  });

  ipcMain.handle("reload-widget", async (_event, data: { id: string }) => {
    try {
      await manager.reloadWidget(data.id);
    } catch (err: any) {
      console.error(`[IPC] Reload failed:`, err.message);
    }
  });

  ipcMain.handle("open-widgets-folder", () => {
    const { shell } = require("electron");
    shell.openPath(manager.getWidgetsDir());
  });

  ipcMain.handle("set-widget-opacity", (_event, data: { id: string; opacity: number }) => {
    manager.setWidgetOpacity(data.id, data.opacity);
    return { success: true };
  });

  ipcMain.handle("get-widget-settings", (_event, id: string) => {
    const instance = manager.getWidgets().get(id);
    if (!instance) return { schema: [], values: {} };
    return {
      schema: instance.config.settings || [],
      values: settings.getWidgetSettings(id),
    };
  });

  ipcMain.handle("set-widget-setting", (_event, data: { id: string; key: string; value: any }) => {
    settings.setWidgetSetting(data.id, data.key, data.value);
    const win = manager.getWindows().get(data.id);
    if (win && !win.isDestroyed()) {
      win.webContents.send("widget-setting-changed", { key: data.key, value: data.value });
    }
    return { success: true };
  });

  ipcMain.handle("get-profiles", () => {
    return settings.getProfiles();
  });

  ipcMain.handle("save-profile", (_event, name: string) => {
    settings.saveProfile(name);
    return { success: true };
  });

  ipcMain.handle("load-profile", async (_event, name: string) => {
    const profile = settings.loadProfile(name);
    if (profile) {
      await manager.applyProfile(profile);
    }
    return { success: !!profile };
  });

  ipcMain.handle("delete-profile", (_event, name: string) => {
    settings.deleteProfile(name);
    return { success: true };
  });

  ipcMain.handle("get-app-info", () => {
    return {
      version: app.getVersion() || "2.0.0",
      name: "NxUI",
      author: "Nex",
      homepage: "https://github.com/nexvlif/NxUI",
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome,
      platform: process.platform,
      arch: process.arch,
    };
  });

  ipcMain.handle("get-widget-memory", async (_event, id: string) => {
    const win = manager.getWindows().get(id);
    if (!win || win.isDestroyed()) return { memory: 0 };
    try {
      const memInfo = await (win.webContents as any).getProcessMemoryInfo();
      return { memory: Math.round((memInfo.private || memInfo.residentSet || 0) / 1024) };
    } catch {
      return { memory: 0 };
    }
  });

  ipcMain.handle("get-task-manager", async () => {
    const mainMemory = process.memoryUsage();
    const widgetDetails: any[] = [];
    let totalWidgetMemory = 0;

    for (const [id, instance] of manager.getWidgets()) {
      const win = manager.getWindows().get(id);
      let memMB = 0;
      if (win && !win.isDestroyed()) {
        try {
          const memInfo = await (win.webContents as any).getProcessMemoryInfo();
          memMB = Math.round((memInfo.private || memInfo.residentSet || 0) / 1024);
        } catch { }
      }
      totalWidgetMemory += memMB;
      widgetDetails.push({
        id,
        name: instance.config.name,
        enabled: instance.state.enabled,
        memory: memMB,
      });
    }

    const mainMB = Math.round(mainMemory.rss / 1024 / 1024);
    const heapUsed = Math.round(mainMemory.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(mainMemory.heapTotal / 1024 / 1024);
    const external = Math.round(mainMemory.external / 1024 / 1024);

    return {
      mainProcess: {
        rss: mainMB,
        heapUsed,
        heapTotal,
        external,
      },
      widgets: widgetDetails,
      totalWidgetMemory,
      totalMemory: mainMB + totalWidgetMemory,
      widgetCount: manager.getWidgets().size,
      activeWindows: manager.getWindows().size,
      uptime: Math.floor(process.uptime()),
      pid: process.pid,
    };
  });

  ipcMain.handle("get-focus-mode", () => {
    return settings.getFocusModeEnabled();
  });

  ipcMain.handle("set-focus-mode", (_event, enabled: boolean) => {
    settings.setFocusModeEnabled(enabled);
    return { success: true };
  });

  ipcMain.handle("hide-all-widgets", () => {
    manager.hideAllWidgets();
    return { success: true };
  });

  ipcMain.handle("show-all-widgets", () => {
    manager.showAllWidgets();
    return { success: true };
  });

  ipcMain.handle("widget-fetch", async (_event, url: string) => {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "NxUI/Widget Engine" }
      });
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (err: any) {
      throw new Error(`Fetch failed: ${err.message}`);
    }
  });

  ipcMain.handle("widget-read-file", async (_event, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) throw new Error("File not found");
      return fs.readFileSync(filePath, "utf-8");
    } catch (err: any) {
      throw new Error(`Read failed: ${err.message}`);
    }
  });

  ipcMain.handle("widget-write-file", async (_event, data: { path: string; content: string }) => {
    try {
      fs.writeFileSync(data.path, data.content, "utf-8");
      return true;
    } catch (err: any) {
      throw new Error(`Write failed: ${err.message}`);
    }
  });

  ipcMain.handle("widget-show-open-dialog", async (_event, options: any) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(options);
    if (canceled) return [];
    return filePaths;
  });

  console.log("[IPC] All handlers registered.");
}
