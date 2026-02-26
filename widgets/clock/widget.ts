import { defineWidget } from "../../src/sdk/define";
import type { WidgetContext } from "../../src/sdk/types";

export default defineWidget({
  name: "Clock",
  version: "2.1.0",
  author: "Nex",
  description: "Transparent floating clock with customizable colors, format, and display options",

  width: 420,
  height: 200,
  desktopLevel: "bottom",

  settings: [
    {
      key: "accentColor",
      label: "Accent Color",
      type: "color",
      default: "#00d4ff",
      description: "Color for separator, day text, and glow effects",
    },
    {
      key: "timeFormat",
      label: "Time Format",
      type: "select",
      default: "24",
      options: [
        { label: "24 Hour", value: "24" },
        { label: "12 Hour (AM/PM)", value: "12" },
      ],
      description: "Choose between 12-hour or 24-hour format",
    },
    {
      key: "showSeconds",
      label: "Show Seconds",
      type: "toggle",
      default: true,
      description: "Display the seconds counter",
    },
    {
      key: "showDate",
      label: "Show Date",
      type: "toggle",
      default: true,
      description: "Display the day and date below the time",
    },
    {
      key: "fontSize",
      label: "Font Size",
      type: "range",
      default: 88,
      min: 40,
      max: 140,
      step: 4,
      description: "Size of the hours and minutes text",
    },
  ],

  onMount(ctx: WidgetContext) {
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const pad = (n: number): string => (n < 10 ? "0" + n : String(n));

    let accentColor = ctx.getSetting("accentColor") || "#00d4ff";
    let timeFormat = ctx.getSetting("timeFormat") || "24";
    let showSeconds = ctx.getSetting("showSeconds") !== false;
    let showDate = ctx.getSetting("showDate") !== false;
    let fontSize = ctx.getSetting("fontSize") || 88;

    const applyStyles = () => {
      const hoursEl = ctx.getElementById("clock-hours");
      const minsEl = ctx.getElementById("clock-mins");
      const secsEl = ctx.getElementById("clock-secs");
      const sepEl = ctx.getElementById("clock-sep");
      const dayEl = ctx.getElementById("clock-day");
      const bottomRow = ctx.querySelector(".clock-bottom-row");

      if (hoursEl) {
        hoursEl.style.fontSize = fontSize + "px";
        hoursEl.style.textShadow = `0 0 40px ${accentColor}40, 0 0 80px ${accentColor}14, 0 2px 4px rgba(0,0,0,0.5)`;
      }
      if (minsEl) {
        minsEl.style.fontSize = fontSize + "px";
        minsEl.style.textShadow = `0 0 40px ${accentColor}40, 0 0 80px ${accentColor}14, 0 2px 4px rgba(0,0,0,0.5)`;
      }
      if (sepEl) {
        sepEl.style.fontSize = (fontSize - 8) + "px";
        sepEl.style.color = accentColor + "99";
        sepEl.style.textShadow = `0 0 20px ${accentColor}66`;
      }
      if (secsEl) {
        secsEl.style.display = showSeconds ? "inline" : "none";
      }
      if (dayEl) {
        dayEl.style.color = accentColor + "b3";
        dayEl.style.textShadow = `0 0 15px ${accentColor}4d`;
      }
      if (bottomRow) {
        (bottomRow as HTMLElement).style.display = showDate ? "flex" : "none";
      }
    };

    const update = () => {
      const now = new Date();
      let hours = now.getHours();
      let ampm = "";

      if (timeFormat === "12") {
        ampm = hours >= 12 ? " PM" : " AM";
        hours = hours % 12 || 12;
      }

      ctx.getElementById("clock-hours").textContent = pad(hours);
      ctx.getElementById("clock-mins").textContent = pad(now.getMinutes());

      if (showSeconds) {
        ctx.getElementById("clock-secs").textContent = pad(now.getSeconds()) + ampm;
      } else if (ampm) {
        ctx.getElementById("clock-secs").style.display = "inline";
        ctx.getElementById("clock-secs").textContent = ampm;
      }

      if (showDate) {
        ctx.getElementById("clock-day").textContent = days[now.getDay()];
        ctx.getElementById("clock-date").textContent =
          months[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear();
      }
    };

    applyStyles();
    update();
    ctx.setInterval(update, 1000);

    ctx.onSettingChanged((key: string, value: any) => {
      if (key === "accentColor") accentColor = value;
      if (key === "timeFormat") timeFormat = value;
      if (key === "showSeconds") showSeconds = value;
      if (key === "showDate") showDate = value;
      if (key === "fontSize") fontSize = value;
      applyStyles();
      update();
    });
  },
});
