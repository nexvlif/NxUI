import * as os from "os";
import { ipcMain } from "electron";

export interface SystemStats {
  cpu: {
    usage: number;
    model: string;
    cores: number;
  };
  ram: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  uptime: number;
  platform: string;
  hostname: string;
}

let previousCpuTimes: { idle: number; total: number } | null = null;

function getCpuTimes(): { idle: number; total: number } {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    idle += cpu.times.idle;
    total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
  }

  return { idle, total };
}

function calculateCpuUsage(): number {
  const current = getCpuTimes();

  if (!previousCpuTimes) {
    previousCpuTimes = current;
    return 0;
  }

  const idleDiff = current.idle - previousCpuTimes.idle;
  const totalDiff = current.total - previousCpuTimes.total;

  previousCpuTimes = current;

  if (totalDiff === 0) return 0;
  return Math.round((1 - idleDiff / totalDiff) * 100);
}

export function getSystemStats(): SystemStats {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    cpu: {
      usage: calculateCpuUsage(),
      model: cpus[0]?.model || "Unknown",
      cores: cpus.length,
    },
    ram: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usagePercent: Math.round((usedMem / totalMem) * 100),
    },
    uptime: Math.floor(os.uptime()),
    platform: os.platform(),
    hostname: os.hostname(),
  };
}

export function registerSystemProvider(): void {
  ipcMain.handle("get-system-stats", () => {
    return getSystemStats();
  });

  getCpuTimes();
  previousCpuTimes = getCpuTimes();

  console.log("[SystemProvider] Registered.");
}
