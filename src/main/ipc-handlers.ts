import { ipcMain, BrowserWindow } from "electron";
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
        filePath: instance.filePath,
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
