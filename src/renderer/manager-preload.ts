// ============================================================
// NxUI — Manager UI Preload Script
// ============================================================

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("nxuiManager", {
  getWidgetsList: () => ipcRenderer.invoke("get-widgets-list"),
  toggleWidget: (id: string, enabled: boolean) =>
    ipcRenderer.invoke("toggle-widget", { id, enabled }),
  toggleWidgetDrag: (id: string, draggable: boolean) =>
    ipcRenderer.invoke("toggle-widget-drag", { id, draggable }),
  reloadWidget: (id: string) =>
    ipcRenderer.invoke("reload-widget", { id }),
  openWidgetsFolder: () =>
    ipcRenderer.invoke("open-widgets-folder"),
});
