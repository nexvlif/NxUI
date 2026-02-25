import { app, shell, globalShortcut, ipcMain } from "electron";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { WidgetManager } from "./widget-manager";
import { SettingsStore } from "./settings-store";
import { TrayManager } from "./tray-manager";
import { ThemeManager } from "./theme-manager";
import { EcosystemManager } from "./ecosystem-manager";
import { registerSystemProvider } from "./system-provider";

const DEFAULT_WIDGETS_DIR = path.join(os.homedir(), "NxUI", "widgets");

let widgetManager: WidgetManager;
let settingsStore: SettingsStore;
let trayManager: TrayManager;
let themeManager: ThemeManager;
let ecosystemManager: EcosystemManager;
let editMode = false;

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-features', 'Spellcheck-mac-ext');
app.commandLine.appendSwitch('disable-spell-checking');

app.whenReady().then(async () => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║   NxUI — Desktop Widget Engine v2.0    ║");
  console.log("╚════════════════════════════════════════╝");

  settingsStore = new SettingsStore();
  themeManager = new ThemeManager(settingsStore);
  registerSystemProvider();

  let widgetsDir = settingsStore.getWidgetsDirectory() || DEFAULT_WIDGETS_DIR;
  settingsStore.setWidgetsDirectory(widgetsDir);
  ensureWidgetsDir(widgetsDir);

  widgetManager = new WidgetManager(widgetsDir, settingsStore, themeManager);

  ecosystemManager = new EcosystemManager(widgetsDir, widgetManager);

  trayManager = new TrayManager(() => shell.openPath(widgetsDir));
  trayManager.create();

  await widgetManager.initialize();

  registerShortcuts();
  registerThemeIPC();
  registerEcosystemIPC();
  setupAutoStart();

  console.log("[Main] NxUI is running! Widgets are on your desktop.");
  console.log(`[Main] Widget folder: ${widgetsDir}`);
});

function registerEcosystemIPC(): void {
  ipcMain.handle("get-store-widgets", () => ecosystemManager.fetchRegistry());
  ipcMain.handle("install-store-widget", (_e, args) => ecosystemManager.installWidget(args.id, args.url));
  ipcMain.handle("uninstall-widget", (_e, id: string) => ecosystemManager.uninstallWidget(id));
}

app.on("window-all-closed", () => {
});

app.on("before-quit", async () => {
  console.log("[Main] Shutting down...");
  globalShortcut.unregisterAll();
  if (widgetManager) await widgetManager.shutdown();
  if (trayManager) trayManager.destroy();
});

function registerShortcuts(): void {
  globalShortcut.register("CommandOrControl+E", () => {
    editMode = !editMode;
    console.log(`[Main] Edit mode: ${editMode ? "ON" : "OFF"}`);

    for (const [, win] of widgetManager.getWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send("edit-mode-changed", editMode);
        if (editMode) {
          win.setIgnoreMouseEvents(false);
        } else {
          const widgets = widgetManager.getWidgets();
          for (const [id, instance] of widgets) {
            const w = widgetManager.getWindows().get(id);
            if (w === win) {
              w.setIgnoreMouseEvents(instance.config.clickThrough || false, { forward: true });
              break;
            }
          }
        }
      }
    }
  });
  console.log("[Main] Shortcuts registered (Ctrl+E = Edit Mode)");
}

function registerThemeIPC(): void {
  ipcMain.handle("get-themes", () => {
    return {
      themes: themeManager.getAvailableThemes(),
      active: themeManager.getActiveThemeId(),
    };
  });

  ipcMain.handle("set-theme", async (_event, themeId: string) => {
    themeManager.setTheme(themeId);
    await themeManager.applyToAll(widgetManager.getWindows());
    return { success: true };
  });
}

function setupAutoStart(): void {
  const shouldAutoStart = settingsStore.getStartOnBoot();
  app.setLoginItemSettings({
    openAtLogin: shouldAutoStart,
    path: process.execPath,
  });

  ipcMain.handle("get-auto-start", () => settingsStore.getStartOnBoot());

  ipcMain.handle("set-auto-start", (_event, enabled: boolean) => {
    settingsStore.setStartOnBoot(enabled);
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: process.execPath,
    });
    return { success: true };
  });
}

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
    path.join(process.resourcesPath, "widgets"),
  ];

  function copyDirSync(src: string, dest: string) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, item.name);
      const destPath = path.join(dest, item.name);
      if (item.isDirectory()) {
        copyDirSync(srcPath, destPath);
      } else {
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  }

  for (const source of possibleSources) {
    if (!fs.existsSync(source)) continue;

    try {
      const entries = fs.readdirSync(source, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const srcFolder = path.join(source, entry.name);
        const destFolder = path.join(targetDir, entry.name);

        if (!fs.existsSync(destFolder)) {
          copyDirSync(srcFolder, destFolder);
          console.log(`[Main] Copied widget: ${entry.name}/`);
        }
      }
      return;
    } catch (err) {
      console.error(`[Main] Failed reading source ${source}:`, err);
    }
  }
}
