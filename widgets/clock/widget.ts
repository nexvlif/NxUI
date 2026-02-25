import { defineWidget } from "../../src/sdk/define";
import type { WidgetContext } from "../../src/sdk/types";

export default defineWidget({
  name: "Clock",
  version: "2.0.0",
  author: "Nex",
  description: "Transparent floating clock with date",

  width: 420,
  height: 200,
  desktopLevel: "bottom",

  onMount(ctx: WidgetContext) {
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const pad = (n: number): string => (n < 10 ? "0" + n : String(n));

    const update = () => {
      const now = new Date();
      ctx.getElementById("clock-hours").textContent = pad(now.getHours());
      ctx.getElementById("clock-mins").textContent = pad(now.getMinutes());
      ctx.getElementById("clock-secs").textContent = pad(now.getSeconds());
      ctx.getElementById("clock-day").textContent = days[now.getDay()];
      ctx.getElementById("clock-date").textContent =
        months[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear();
    };

    update();
    ctx.setInterval(update, 1000);
  },
});
