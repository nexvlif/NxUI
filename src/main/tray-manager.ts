import { Tray, Menu, BrowserWindow, nativeImage, app } from "electron";
import * as path from "path";

export class TrayManager {
  private tray: Tray | null = null;
  private managerWindow: BrowserWindow | null = null;
  private onOpenWidgetsFolder: () => void;

  constructor(onOpenWidgetsFolder: () => void) {
    this.onOpenWidgetsFolder = onOpenWidgetsFolder;
  }

  create(): void {
    const iconPath = path.join(app.getAppPath(), "assets", "icon.png");
    let icon;

    if (require("fs").existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
      icon.resize({ width: 16, height: 16 });
    } else {
      icon = nativeImage.createFromBuffer(this.createIconBuffer());
      icon.setTemplateImage(false);
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip("NxUI — Desktop Widgets");

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Manage Widgets",
        click: () => this.openManagerWindow(),
      },
      {
        label: "Open Widgets Folder",
        click: () => this.onOpenWidgetsFolder(),
      },
      { type: "separator" },
      {
        label: "Settings",
        click: () => this.openManagerWindow(),
      },
      { type: "separator" },
      {
        label: "Exit NxUI",
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);

    this.tray.on("double-click", () => {
      this.openManagerWindow();
    });

    console.log("[TrayManager] System tray created.");
  }

  openManagerWindow(): void {
    if (this.managerWindow && !this.managerWindow.isDestroyed()) {
      this.managerWindow.focus();
      return;
    }

    const iconPath = path.join(app.getAppPath(), "assets", "icon.png");

    this.managerWindow = new BrowserWindow({
      width: 600,
      height: 500,
      title: "NxUI — Widget Manager",
      icon: require("fs").existsSync(iconPath) ? iconPath : undefined,
      frame: true,
      resizable: true,
      minimizable: true,
      maximizable: false,
      webPreferences: {
        preload: path.join(__dirname, "..", "renderer", "manager-preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    const managerHtmlPath = path.join(__dirname, "..", "renderer", "manager-ui.html");
    this.managerWindow.loadFile(managerHtmlPath);

    this.managerWindow.setMenuBarVisibility(false);

    this.managerWindow.on("closed", () => {
      this.managerWindow = null;
    });
  }

  private createIconBuffer(): Buffer {
    const size = 16;
    const channels = 4;
    const buffer = Buffer.alloc(size * size * channels);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * channels;
        const t = (x + y) / (size * 2);
        buffer[idx] = 0;
        buffer[idx + 1] = Math.round(201 + t * 11);
        buffer[idx + 2] = Math.round(167 + t * 88);
        buffer[idx + 3] = 255;
        const dx = Math.min(x, size - 1 - x);
        const dy = Math.min(y, size - 1 - y);
        if (dx === 0 && dy === 0) buffer[idx + 3] = 0;
      }
    }

    return nativeImage.createFromBuffer(buffer, {
      width: size,
      height: size,
    }).toPNG();
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
    if (this.managerWindow && !this.managerWindow.isDestroyed()) {
      this.managerWindow.close();
    }
  }
}
