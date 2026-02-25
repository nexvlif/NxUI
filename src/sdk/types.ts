export interface WidgetContext {
  getElementById<T extends HTMLElement = HTMLElement>(id: string): T;

  querySelector<T extends HTMLElement = HTMLElement>(selector: string): T | null;

  querySelectorAll<T extends HTMLElement = HTMLElement>(selector: string): NodeListOf<T>;

  setInterval(callback: () => void, ms: number): number;

  setTimeout(callback: () => void, ms: number): number;

  clearInterval(id: number): void;

  clearTimeout(id: number): void;

  sendToMain(channel: string, data?: any): void;

  onMessage(channel: string, callback: (data: any) => void): void;
  getRoot(): HTMLElement;
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
  render?(): string;

  styles?: string;

  onMount?(ctx: WidgetContext): void;

  onDestroy?(): void;

  onResize?(width: number, height: number): void;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetState {
  enabled: boolean;
  draggable: boolean;
  position: WidgetPosition;
  width?: number;
  height?: number;
}

export interface WidgetInstance {
  id: string;
  filePath: string;
  config: NxWidget;
  state: WidgetState;
}
