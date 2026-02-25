import { ipcMain, BrowserWindow } from "electron";
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
      console.error(`[IPC] Failed to toggle widget ${data.id}:`, err.message);
    }
  });

  ipcMain.handle("toggle-widget-drag", async (_event, data: { id: string; draggable: boolean }) => {
    try {
      await manager.toggleWidgetDrag(data.id, data.draggable);
    } catch (err: any) {
      console.error(`[IPC] Failed to toggle drag ${data.id}:`, err.message);
    }
  });

  ipcMain.handle("reload-widget", async (_event, data: { id: string }) => {
    try {
      await manager.reloadWidget(data.id);
    } catch (err: any) {
      console.error(`[IPC] Failed to reload widget ${data.id}:`, err.message);
    }
  });

  ipcMain.handle("open-widgets-folder", () => {
    const { shell } = require("electron");
    shell.openPath(manager.getWidgetsDir());
  });

  console.log("[IPC] All handlers registered.");
}
