import * as path from "path";
import * as fs from "fs";

export interface WidgetEntry {
  id: string;
  entryPath: string;
  dirPath: string | null;
  isFolder: boolean;
}

export function scanWidgets(widgetsDir: string): WidgetEntry[] {
  const entries: WidgetEntry[] = [];

  if (!fs.existsSync(widgetsDir)) return entries;

  const items = fs.readdirSync(widgetsDir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(widgetsDir, item.name);

    if (item.isDirectory()) {
      const widgetTs = path.join(fullPath, "widget.ts");
      if (fs.existsSync(widgetTs)) {
        entries.push({
          id: item.name,
          entryPath: widgetTs,
          dirPath: fullPath,
          isFolder: true,
        });
      }
    } else if (item.name.endsWith(".widget.ts")) {
      const id = item.name.replace(/\.widget\.ts$/, "");
      entries.push({
        id,
        entryPath: fullPath,
        dirPath: null,
        isFolder: false,
      });
    }
  }

  return entries;
}

export function filePathToWidgetId(widgetsDir: string, filePath: string): string {
  const relative = path.relative(widgetsDir, filePath);
  return relative
    .replace(/[\\/]widget\.ts$/, "")
    .replace(/\.widget\.ts$/, "")
    .replace(/\\/g, "/");
}
