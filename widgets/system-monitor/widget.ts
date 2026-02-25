import { defineWidget } from "../../src/sdk/define";
import type { WidgetContext } from "../../src/sdk/types";

export default defineWidget({
  name: "System Monitor",
  version: "1.0.0",
  author: "Nex",
  description: "CPU and RAM usage monitor",

  width: 280,
  height: 180,
  desktopLevel: "top",

  onMount(ctx: WidgetContext) {
    const cpuHistory: number[] = [];

    const formatUptime = (seconds: number): string => {
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return d > 0 ? d + "d " + h + "h" : h + "h " + m + "m";
    };

    const update = () => {
      const baseCpu = 25 + Math.random() * 35;
      cpuHistory.push(baseCpu);
      if (cpuHistory.length > 10) cpuHistory.shift();
      const avgCpu = cpuHistory.reduce((a, b) => a + b, 0) / cpuHistory.length;
      const cpuPercent = Math.round(avgCpu);

      ctx.getElementById("cpu-percent").textContent = cpuPercent + "%";
      ctx.getElementById("cpu-bar").style.width = cpuPercent + "%";

      const totalMem = 16;
      const usedMem = 6 + Math.random() * 4;
      const ramPercent = Math.round((usedMem / totalMem) * 100);

      ctx.getElementById("ram-percent").textContent = ramPercent + "%";
      ctx.getElementById("ram-bar").style.width = ramPercent + "%";
      ctx.getElementById("ram-detail").textContent = usedMem.toFixed(1) + " / " + totalMem + " GB";

      const uptime = Math.floor(Date.now() / 1000) % 360000;
      ctx.getElementById("sysmon-uptime").textContent = formatUptime(uptime);
    };

    update();
    ctx.setInterval(update, 2000);
  },
});
