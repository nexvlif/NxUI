import { BrowserWindow } from "electron";
import * as path from "path";
import type { NxWidget, WidgetState, WidgetInstance } from "../sdk/types";
import { SettingsStore } from "./settings-store";

export async function createWidgetWindow(
  instance: WidgetInstance,
  settings: SettingsStore
): Promise<BrowserWindow> {
  const { config, state, id } = instance;

  const desktopLevel = config.desktopLevel || "top";
  const isBottom = desktopLevel === "bottom";
  const isTop = desktopLevel === "top";

  const win = new BrowserWindow({
    width: state.width || config.width,
    height: state.height || config.height,
    x: state.position.x,
    y: state.position.y,
    frame: false,
    transparent: config.transparent !== false,
    alwaysOnTop: isTop,
    resizable: config.resizable || false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, "..", "renderer", "widget-host.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  win.setSkipTaskbar(true);

  if (isBottom) {
    win.showInactive();
  }
  const hostHtmlPath = path.join(__dirname, "..", "renderer", "widget-host.html");
  await win.loadFile(hostHtmlPath);

  const html = config.render ? config.render() : "";
  const styles = config.styles || "";
  const onMountCode = config.onMount ? config.onMount.toString() : "";

  win.webContents.send("widget-init", {
    id,
    name: config.name,
    html,
    styles,
    onMountCode,
    clickThrough: config.clickThrough || !state.draggable,
  });

  if (instance.config.clickThrough) {
    win.setIgnoreMouseEvents(true, { forward: true });
  }

  win.on("moved", () => {
    const [x, y] = win.getPosition();
    instance.state.position = { x, y };
    settings.setWidgetPosition(id, { x, y });
  });

  win.on("resize", () => {
    const [w, h] = win.getSize();
    instance.state.width = w;
    instance.state.height = h;
    settings.setWidgetState(id, instance.state);
  });

  console.log(`[WindowFactory] Created: ${id} (level: ${desktopLevel}, draggable: ${state.draggable})`);

  return win;
}
