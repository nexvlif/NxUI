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

  setWidgetOpacity: (id: string, opacity: number) =>
    ipcRenderer.invoke("set-widget-opacity", { id, opacity }),

  getWidgetSettings: (id: string) =>
    ipcRenderer.invoke("get-widget-settings", id),
  setWidgetSetting: (id: string, key: string, value: any) =>
    ipcRenderer.invoke("set-widget-setting", { id, key, value }),

  getProfiles: () => ipcRenderer.invoke("get-profiles"),
  saveProfile: (name: string) => ipcRenderer.invoke("save-profile", name),
  loadProfile: (name: string) => ipcRenderer.invoke("load-profile", name),
  deleteProfile: (name: string) => ipcRenderer.invoke("delete-profile", name),

  getAppInfo: () => ipcRenderer.invoke("get-app-info"),
  getWidgetMemory: (id: string) => ipcRenderer.invoke("get-widget-memory", id),

  getFocusMode: () => ipcRenderer.invoke("get-focus-mode"),
  setFocusMode: (enabled: boolean) => ipcRenderer.invoke("set-focus-mode", enabled),

  hideAllWidgets: () => ipcRenderer.invoke("hide-all-widgets"),
  showAllWidgets: () => ipcRenderer.invoke("show-all-widgets"),

  getTaskManager: () => ipcRenderer.invoke("get-task-manager"),

  getAccentColor: () => ipcRenderer.invoke("get-accent-color"),
  onAccentColorChanged: (callback: (color: string) => void) => {
    ipcRenderer.on("accent-color-changed", (_event, color) => callback(color));
  },
});
