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

  getStoreWidgets: () => ipcRenderer.invoke("get-store-widgets"),
  installStoreWidget: (id: string, url: string) => ipcRenderer.invoke("install-store-widget", { id, url }),
  uninstallWidget: (id: string) => ipcRenderer.invoke("uninstall-widget", id),

  getThemes: () => ipcRenderer.invoke("get-themes"),
  setTheme: (id: string) => ipcRenderer.invoke("set-theme", id),
  getAutoStart: () => ipcRenderer.invoke("get-auto-start"),
  setAutoStart: (enabled: boolean) => ipcRenderer.invoke("set-auto-start", enabled),
});
