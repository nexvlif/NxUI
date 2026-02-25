// ============================================================
// NxUI — Widget Host Preload Script
// Runs in each widget's BrowserWindow renderer process.
// ============================================================

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("nxui", {
  onInit: (callback: (data: any) => void) => {
    ipcRenderer.on("widget-init", (_event, data) => {
      callback(data);
    });
  },

  dragMove: (deltaX: number, deltaY: number, widgetId: string) => {
    ipcRenderer.send("widget-drag-move", { id: widgetId, deltaX, deltaY });
  },

  sendToMain: (channel: string, data: any) => {
    ipcRenderer.send(`widget-msg-${channel}`, data);
  },

  onMessage: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.on(`widget-msg-${channel}`, (_event, data) => {
      callback(data);
    });
  },
});
