import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("nxui", {
  onInit: (callback: (data: any) => void) => {
    ipcRenderer.on("widget-init", (_event, data) => callback(data));
  },

  onShowAnim: (callback: () => void) => {
    ipcRenderer.on("widget-show-anim", () => callback());
  },

  onHideAnim: (callback: () => void) => {
    ipcRenderer.on("widget-hide-anim", () => callback());
  },

  emit: (event: string, data?: any) => {
    ipcRenderer.send("widget-bus-emit", { event, data });
  },

  onBusEvent: (callback: (event: string, data?: any) => void) => {
    ipcRenderer.on("widget-bus-on", (_e, payload: { event: string; data?: any }) => callback(payload.event, payload.data));
  },

  dragMove: (deltaX: number, deltaY: number, widgetId: string) => {
    ipcRenderer.send("widget-drag-move", { id: widgetId, deltaX, deltaY });
  },

  sendToMain: (channel: string, data: any) => {
    ipcRenderer.send(`widget-msg-${channel}`, data);
  },
  onMessage: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.on(`widget-msg-${channel}`, (_event, data) => callback(data));
  },

  getSystemStats: () => ipcRenderer.invoke("get-system-stats"),

  fetch: (url: string) => ipcRenderer.invoke("widget-fetch", url),

  readFile: (path: string) => ipcRenderer.invoke("widget-read-file", path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke("widget-write-file", { path, content }),
  showOpenDialog: (options: any) => ipcRenderer.invoke("widget-show-open-dialog", options),

  onEditModeChanged: (callback: (enabled: boolean) => void) => {
    ipcRenderer.on("edit-mode-changed", (_event, enabled) => callback(enabled));
  },

  onDragToggled: (callback: (draggable: boolean) => void) => {
    ipcRenderer.on("widget-drag-toggled", (_event, draggable) => callback(draggable));
  },

  onSettingChanged: (callback: (data: { key: string; value: any }) => void) => {
    ipcRenderer.on("widget-setting-changed", (_event, data) => callback(data));
  },
});
