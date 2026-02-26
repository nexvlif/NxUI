export interface WidgetSettingDef {
  key: string;
  label: string;
  type: "range" | "toggle" | "select" | "text" | "color";
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
  description?: string;
}

export interface WidgetContext {
  getElementById<T extends HTMLElement = HTMLElement>(id: string): T;
  querySelector<T extends HTMLElement = HTMLElement>(selector: string): T | null;
  querySelectorAll<T extends HTMLElement = HTMLElement>(selector: string): NodeListOf<T>;
  getRoot(): HTMLElement;

  setInterval(callback: () => void, ms: number): number;
  setTimeout(callback: () => void, ms: number): number;
  clearInterval(id: number): void;
  clearTimeout(id: number): void;

  sendToMain(channel: string, data?: any): void;
  onMessage(channel: string, callback: (data: any) => void): void;

  getSystemStats(): Promise<SystemStats>;

  fetch(url: string): Promise<any>;

  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<boolean>;
  showOpenDialog(options: any): Promise<string[]>;

  getSetting(key: string): any;
  onSettingChanged(callback: (key: string, value: any) => void): void;

  emit(event: string, data?: any): void;
  on(event: string, callback: (data?: any) => void): void;
  off(event: string, callback: (data?: any) => void): void;
}

export interface SystemStats {
  cpu: { usage: number; model: string; cores: number };
  ram: { total: number; used: number; free: number; usagePercent: number };
  uptime: number;
  platform: string;
  hostname: string;
}

export interface NxWidget {
  name: string;
  version: string;
  author: string;
  description?: string;
  width: number;
  height: number;

  transparent?: boolean;
  alwaysOnTop?: boolean;
  desktopLevel?: "top" | "normal" | "bottom";
  resizable?: boolean;
  clickThrough?: boolean;

  settings?: WidgetSettingDef[];

  render?(): string;
  styles?: string;

  onMount?(ctx: WidgetContext): void;
  onDestroy?(): void;
  onResize?(width: number, height: number): void;
}

export interface WidgetPosition { x: number; y: number; }

export interface WidgetState {
  enabled: boolean;
  draggable: boolean;
  position: WidgetPosition;
  width?: number;
  height?: number;
  displayId?: number;
  opacity?: number;
  hidden?: boolean;
}

export interface WidgetInstance {
  id: string;
  filePath: string;
  config: NxWidget;
  state: WidgetState;
}
