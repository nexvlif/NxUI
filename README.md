<div align="center">
  <img src="assets/icon.png" alt="NxUI Logo" width="120" />
  <h1>NxUI</h1>
  <p><strong>A Next-Generation, Open-Source Desktop Widget Engine</strong></p>
  <p><em>Built with Web Technologies, Optimized for the Desktop. Welcome to the Future.</em></p>
</div>

---

## What is NxUI?

NxUI is a premium desktop customization tool that allows you to build, install, and manage lively desktop widgets using the languages you already know: **HTML, CSS, and TypeScript/JavaScript**. 

Unlike legacy software, NxUI leverages modern API bridging and a powerful custom widget lifecycle to give you total control over your Windows desktop layout without the extreme RAM or CPU penalties typical of Electron apps.

## Features

* **Community Widget Store:** Browse and install stunning widgets directly from the remote NxUI ecosystem with one click. No restarting required! (Development)
* **Global Theme Engine:** A built-in CSS variable orchestrator. Swap your entire desktop's color palette (like our default **Miku Garden**) instantly from the Settings menu.
* **Real Hardware Data:** Direct access to Node.js `os` metrics. Display live CPU, RAM, and uptime effortlessly.
* **CORS-Free Fetching:** Widgets can scrape or hit any external API (weather APIs, REST backends) directly through the main process safely.
* **Direct File System Access:** Built-in SDK APIs to read and write files locally. Run a full Markdown code editor *as a widget overlay* right on your wallpaper!
* **Visual Edit Mode:** Press `Ctrl+E` to interactively drag and drop widgets anywhere on your screen. Leave Edit Mode to lock them seamlessly into the background.

## Extreme Memory & CPU Optimization

We know Chromium/Electron is heavily criticized for memory bloat. NxUI specifically modifies the engine at the C++ initialization level to ensure widgets are practically invisible to your system resources:

- **V8 Engine Heap Restriction:** Hard-limited to 256MB.
- **Site Isolation Disabled:** Frees up ~30-40MB of RAM *per widget instance*.
- **Chromium Throttling:** Background rendering and timers are aggressively killed for idle widgets.

## Bundled Widgets
Out of the box, NxUI comes with gorgeous showcase widgets:
1. **Clock:** A dynamic SVG-based animated clock.
2. **Notes:** A full Markdown editor that saves straight to your disk.
3. **System Monitor:** Real-time RAM & CPU gauges.
4. **Greeting:** A personalized dynamic message widget.

## Getting Started

### Installation
1. Download the latest `NxUI` from the [Releases](#) tab (or from the `release/` folder if building from source).
2. Install the application.
3. NxUI will launch into your System Tray and place the default widgets on your desktop.
4. Right-click the tray icon and click **Manage** to open the Manager UI!

### Development (Build from Source)
To run NxUI locally or develop new widgets:

```bash
# 1. Clone the repository
git clone https://github.com/nexvlif/NxUI.git
cd NxUI

# 2. Install dependencies
npm install

# 3. Start the application in Developer Mode
npm run dev

# 4. Build the Windows Installer (.exe)
npm run pack
```

## Writing Your First Widget

Creating a widget is incredibly easy. Navigate to `C:\Users\{Username}\NxUI\widgets` and create a new folder `my-widget`.

**1. `template.html`**
```html
<div class="my-box">
  <h1 id="hello-text">Loading...</h1>
</div>
```

**2. `styles.css`**
```css
.my-box {
  background: var(--nxui-surface); /* Uses global themes! */
  color: var(--nxui-text-primary);
  padding: 20px;
  border-radius: 12px;
}
```

**3. `widget.ts`**
```typescript
import { defineWidget } from "../../src/sdk/define";

export default defineWidget({
  id: "my-hello-widget",
  name: "Hello World",
  description: "My very first widget",
  author: "You",
  version: "1.0.0",
  draggable: true,
  onMount: (ctx) => {
    const textNode = ctx.getElementById("hello-text");
    textNode.innerText = "Hello, NxUI!";
  }
});
```

And that's it! Your widget will instantly show up in the **Manager UI**, fully supporting themes, dragging, and live-reloading.

## License
NxUI is open-sourced under the MIT License. Built with for extreme desktop customization.