import { app, shell } from "electron";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { WidgetManager } from "./widget-manager";
import { SettingsStore } from "./settings-store";
import { TrayManager } from "./tray-manager";

const DEFAULT_WIDGETS_DIR = path.join(os.homedir(), "NxUI", "widgets");

let widgetManager: WidgetManager;
let settingsStore: SettingsStore;
let trayManager: TrayManager;

app.whenReady().then(async () => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║   NxUI — Desktop Widget Engine v1.0    ║");
  console.log("╚════════════════════════════════════════╝");

  settingsStore = new SettingsStore();

  let widgetsDir = settingsStore.getWidgetsDirectory() || DEFAULT_WIDGETS_DIR;
  settingsStore.setWidgetsDirectory(widgetsDir);

  ensureWidgetsDir(widgetsDir);

  widgetManager = new WidgetManager(widgetsDir, settingsStore);
  trayManager = new TrayManager(() => shell.openPath(widgetsDir));
  trayManager.create();

  await widgetManager.initialize();

  console.log("[Main] NxUI is running! Widgets are on your desktop.");
  console.log(`[Main] Widget folder: ${widgetsDir}`);
});

app.on("window-all-closed", () => {
});

app.on("before-quit", async () => {
  console.log("[Main] Shutting down...");
  if (widgetManager) await widgetManager.shutdown();
  if (trayManager) trayManager.destroy();
});

function ensureWidgetsDir(widgetsDir: string): void {
  if (!fs.existsSync(widgetsDir)) {
    fs.mkdirSync(widgetsDir, { recursive: true });
    console.log(`[Main] Created widgets directory: ${widgetsDir}`);
  }

  copyExampleWidgets(widgetsDir);
}

function copyExampleWidgets(targetDir: string): void {
  const possibleSources = [
    path.join(__dirname, "..", "..", "widgets"),
    path.join(app.getAppPath(), "widgets"),
  ];

  for (const source of possibleSources) {
    if (!fs.existsSync(source)) continue;

    const entries = fs.readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const srcFolder = path.join(source, entry.name);
      const destFolder = path.join(targetDir, entry.name);

      if (fs.existsSync(destFolder)) continue;

      fs.mkdirSync(destFolder, { recursive: true });

      const files = fs.readdirSync(srcFolder);
      for (const file of files) {
        fs.copyFileSync(path.join(srcFolder, file), path.join(destFolder, file));
      }

      console.log(`[Main] Copied widget: ${entry.name}/`);
    }

    return;
  }

  console.log("[Main] No example widgets found to copy.");
}
