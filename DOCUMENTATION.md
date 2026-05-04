# NxUI SDK Documentation

Welcome to the NxUI SDK. This guide explains how to build custom widgets for the NxUI engine using TypeScript/JavaScript.

## Table of Contents
- [Getting Started](#getting-started)
- [Defining a Widget](#defining-a-widget)
- [Widget Configuration](#widget-configuration)
- [Widget Context (ctx)](#widget-context-ctx)
- [Settings Schema](#settings-schema)
- [System Stats](#system-stats)

---

## Getting Started

To create a widget, you must use the `defineWidget` function from the SDK. This ensures your widget follows the required structure and provides full type safety.

```typescript
import { defineWidget } from "@/sdk/define";

export default defineWidget({
  // Configuration here
});
```

---

## Widget Configuration

The object passed to `defineWidget` supports the following properties:

| Property | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `name` | `string` | Yes | The display name of your widget. |
| `version` | `string` | Yes | Semantic version (e.g., "1.0.0"). |
| `author` | `string` | Yes | Your name or username. |
| `width` | `number` | Yes | Default width in pixels. |
| `height` | `number` | Yes | Default height in pixels. |
| `description` | `string` | No | A short description of the widget. |
| `transparent` | `boolean` | No | Whether the window should be transparent (default: `true`). |
| `alwaysOnTop` | `boolean` | No | Keeps the widget above all other windows. |
| `desktopLevel` | `"top" \| "normal" \| "bottom"` | No | Z-level on the desktop. `bottom` is pinned to wallpaper. |
| `resizable` | `boolean` | No | Whether the user can resize the widget manually. |
| `clickThrough` | `boolean` | No | If `true`, the widget won't capture mouse clicks. |
| `settings` | `WidgetSettingDef[]` | No | Array of user-configurable settings. |
| `styles` | `string` | No | Raw CSS string to be applied to the widget. |
| `onMount` | `(ctx) => void` | No | Lifecycle hook called when the widget is loaded. |
| `onDestroy` | `() => void` | No | Called when the widget is closed. |
| `onResize` | `(w, h) => void` | No | Called when the widget is resized. |

---

## Widget Context (ctx)

The `onMount` function receives a `ctx` object, which provides the following APIs:

### DOM Interaction
- `ctx.getElementById(id)`: Similar to `document.getElementById`.
- `ctx.querySelector(selector)`: Selects the first matching element.
- `ctx.querySelectorAll(selector)`: Returns a list of matching elements.
- `ctx.getRoot()`: Returns the root container of the widget.

### Timers
- `ctx.setInterval(callback, ms)`: Managed interval (cleared automatically on destroy).
- `ctx.setTimeout(callback, ms)`: Managed timeout.
- `ctx.clearInterval(id)` / `ctx.clearTimeout(id)`: Manual clearing.

### Persistence & File System
- `ctx.getSetting(key)`: Retrieves a value from the widget's settings.
- `ctx.onSettingChanged(callback)`: Listen for real-time setting updates.
- `ctx.readFile(path)`: Reads a local file (returns string).
- `ctx.writeFile(path, content)`: Writes a local file.
- `ctx.showOpenDialog(options)`: Opens a native system file picker.

### Communication
- `ctx.sendToMain(channel, data)`: Send data to the Electron main process.
- `ctx.onMessage(channel, callback)`: Listen for messages from the main process.
- `ctx.fetch(url)`: Helper for making network requests (bypasses CORS).

### Internal Events
- `ctx.emit(event, data)`: Emit internal widget events.
- `ctx.on(event, callback)`: Listen for internal events.

---

## Settings Schema

Define interactive settings that users can change via the NxUI Manager UI.

```typescript
settings: [
  {
    key: "accentColor",
    label: "Accent Color",
    type: "color",
    default: "#00d4ff"
  },
  {
    key: "fontSize",
    label: "Font Size",
    type: "range",
    min: 12,
    max: 72,
    default: 24
  }
]
```

### Supported Types
- `range`: A slider (requires `min`, `max`, `step`).
- `toggle`: A boolean checkbox.
- `select`: A dropdown (requires `options`).
- `text`: A single-line text input.
- `color`: A color picker.

---

## System Stats

Access live hardware metrics via `ctx.getSystemStats()`.

```typescript
const stats = await ctx.getSystemStats();
// stats.cpu.usage (%)
// stats.ram.usagePercent (%)
// stats.uptime (seconds)
```