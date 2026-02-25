import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import extract from "extract-zip";
import { WidgetManager } from "./widget-manager";

export interface StoreWidget {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  downloadUrl: string;
  previewUrl?: string;
  tags?: string[];
}

export class EcosystemManager {
  private widgetsDir: string;
  private manager: WidgetManager;

  private registryUrl = "https://raw.githubusercontent.com/nxui/registry/main/registry.json";

  constructor(widgetsDir: string, manager: WidgetManager) {
    this.widgetsDir = widgetsDir;
    this.manager = manager;
  }

  async fetchRegistry(): Promise<StoreWidget[]> {
    try {
      const res = await fetch(this.registryUrl);
      if (res.ok) {
        const data = await res.json();
        return data.widgets;
      }
    } catch (err) {
      console.warn("[Ecosystem] Failed to fetch remote registry. Using builtin mock registry.");
    }

    return [
      {
        id: "calc-pro",
        name: "Calculator Pro",
        author: "NxUI Community",
        version: "1.0.0",
        description: "A sleek glassmorphism calculator with history.",
        downloadUrl: "mock",
        tags: ["Utility", "Productivity"]
      },
      {
        id: "crypto-ticker",
        name: "Crypto Ticker",
        author: "Satoshi",
        version: "1.2.0",
        description: "Live cryptocurrency prices on your desktop.",
        downloadUrl: "mock",
        tags: ["Finance", "Live Data"]
      }
    ];
  }

  async installWidget(id: string, downloadUrl: string): Promise<boolean> {
    const targetDir = path.join(this.widgetsDir, id);

    try {
      if (downloadUrl === "mock") {
        this.createMockWidget(id, targetDir);
      } else {
        const zipPath = path.join(os.tmpdir(), `nxui-widget-${id}.zip`);
        await this.downloadFile(downloadUrl, zipPath);

        await extract(zipPath, { dir: targetDir });

        fs.unlinkSync(zipPath);
      }

      console.log(`[Ecosystem] Successfully installed widget: ${id}`);
      return true;
    } catch (err: any) {
      console.error(`[Ecosystem] Failed to install ${id}:`, err);
      throw new Error(`Installation failed: ${err.message}`);
    }
  }

  async uninstallWidget(id: string): Promise<boolean> {
    const targetDir = path.join(this.widgetsDir, id);

    try {
      if (this.manager.getWidgets().has(id)) {
        this.manager.destroyWidget(id);
      }

      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }

      console.log(`[Ecosystem] Successfully uninstalled widget: ${id}`);
      return true;
    } catch (err: any) {
      console.error(`[Ecosystem] Failed to uninstall ${id}:`, err);
      throw err;
    }
  }

  private async downloadFile(url: string, destPath: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);
  }

  private createMockWidget(id: string, targetDir: string): void {
    if (fs.existsSync(targetDir)) return;

    fs.mkdirSync(targetDir, { recursive: true });

    fs.writeFileSync(path.join(targetDir, "widget.ts"), `
import { defineWidget } from "../../src/sdk/define";

export default defineWidget({
  name: "${id.toUpperCase()}",
  version: "1.0.0",
  author: "Store",
  description: "Installed from Store",
  width: 280,
  height: 160,
  styles: \`
    .mock-store-widget {
      width: 100%; height: 100%;
      background: var(--nxui-surface);
      border: 1px solid var(--nxui-accent);
      border-radius: 12px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: var(--nxui-text);
      font-family: sans-serif;
      box-shadow: 0 0 20px var(--nxui-accent-glow);
    }
  \`,
  render() {
    return \`
      <div class="mock-store-widget">
        <h3 style="color:var(--nxui-accent); margin-bottom:8px;">Store Widget</h3>
        <p style="font-size:12px; opacity:0.7">ID: ${id}</p>
        <div style="margin-top:16px; padding:6px 12px; background:var(--nxui-success); border-radius:20px; font-size:11px; color:#000; font-weight:bold;">
          ✓ Installed Successfully
        </div>
      </div>
    \`;
  }
});
    `.trim());
  }
}
