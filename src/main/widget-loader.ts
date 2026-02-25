import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import type { NxWidget } from "../sdk/types";

export async function loadWidget(
  entryPath: string,
  dirPath: string | null
): Promise<NxWidget> {
  const absolutePath = path.resolve(entryPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Widget file not found: ${absolutePath}`);
  }

  const rawCode = fs.readFileSync(absolutePath, "utf-8");
  const result = ts.transpileModule(rawCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    }
  });

  const jsCode = result.outputText;

  const tempModule = { exports: {} as any };

  const defineWidget = (cfg: any) => ({
    transparent: true, alwaysOnTop: true, desktopLevel: "top",
    resizable: false, clickThrough: false, ...cfg,
  });

  const sandboxRequire = (id: string) => {
    if (id.includes("sdk/define") || id.includes("nxui/sdk")) {
      return { defineWidget };
    }
    if (id.includes("sdk/types") || id.includes("sdk/index") || id.includes("sdk")) {
      return {};
    }
    return require(id);
  };

  const wrappedCode = `(function(module, exports, require) { ${jsCode} })`;

  try {
    const fn = eval(wrappedCode);
    fn(tempModule, tempModule.exports, sandboxRequire);
  } catch (err: any) {
    throw new Error(`Execution error in ${absolutePath}: ${err.message}`);
  }

  const config: NxWidget = tempModule.exports.default || tempModule.exports;

  if (dirPath) {
    const templatePath = path.join(dirPath, "template.html");
    const stylesPath = path.join(dirPath, "styles.css");

    if (fs.existsSync(templatePath)) {
      const html = fs.readFileSync(templatePath, "utf-8");
      config.render = () => html;
    }

    if (fs.existsSync(stylesPath)) {
      const css = fs.readFileSync(stylesPath, "utf-8");
      config.styles = (config.styles || "") + "\n" + css;
    }
  }

  validateWidget(config, absolutePath);

  return config;
}

function validateWidget(config: any, filePath: string): void {
  const required = ["name", "version", "author", "width", "height"];

  for (const field of required) {
    if (config[field] === undefined) {
      throw new Error(`Widget "${filePath}" is missing required field "${field}"`);
    }
  }

  if (config.render && typeof config.render !== "function") {
    throw new Error(`Widget "${filePath}" render must be a function, got ${typeof config.render}`);
  }

  if (typeof config.width !== "number" || typeof config.height !== "number") {
    throw new Error(`Widget "${filePath}" width and height must be numbers`);
  }
}
