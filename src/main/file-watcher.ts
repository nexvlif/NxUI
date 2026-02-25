import * as chokidar from "chokidar";
import * as path from "path";
import { EventEmitter } from "events";

export interface FileWatcherEvents {
  "widget-added": (filePath: string) => void;
  "widget-changed": (filePath: string) => void;
  "widget-removed": (filePath: string) => void;
}

export class FileWatcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private watchDir: string;

  constructor(watchDir: string) {
    super();
    this.watchDir = watchDir;
  }

  start(): void {
    const globPattern = path.join(this.watchDir, "**/*.widget.ts");

    console.log(`[FileWatcher] Watching: ${globPattern}`);

    this.watcher = chokidar.watch(globPattern, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    });

    this.watcher
      .on("add", (filePath) => {
        console.log(`[FileWatcher] Widget added: ${filePath}`);
        this.emit("widget-added", path.resolve(filePath));
      })
      .on("change", (filePath) => {
        console.log(`[FileWatcher] Widget changed: ${filePath}`);
        this.emit("widget-changed", path.resolve(filePath));
      })
      .on("unlink", (filePath) => {
        console.log(`[FileWatcher] Widget removed: ${filePath}`);
        this.emit("widget-removed", path.resolve(filePath));
      })
      .on("error", (error) => {
        console.error("[FileWatcher] Error:", error);
      });
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log("[FileWatcher] Stopped watching.");
    }
  }

  getWatchDir(): string {
    return this.watchDir;
  }
}
