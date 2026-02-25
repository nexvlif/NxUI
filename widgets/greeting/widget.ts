import { defineWidget } from "../../src/sdk/define";
import type { WidgetContext } from "../../src/sdk/types";

export default defineWidget({
  name: "Greeting",
  version: "1.0.0",
  author: "Nex",
  description: "A friendly time-based greeting",

  width: 350,
  height: 100,
  desktopLevel: "bottom",

  onMount(ctx: WidgetContext) {
    const update = () => {
      const hour = new Date().getHours();
      let greeting = "Good Evening";
      let emoji = "moon";
      let message = "Time to relax and unwind";

      if (hour >= 5 && hour < 12) {
        greeting = "Good Morning";
        emoji = "sun";
        message = "Start your day with energy!";
      } else if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon";
        emoji = "cloud-sun";
        message = "Keep up the great work!";
      } else if (hour >= 17 && hour < 21) {
        greeting = "Good Evening";
        emoji = "sunset";
        message = "Almost time to relax";
      }

      ctx.getElementById("greeting-hello").textContent = greeting;
      ctx.getElementById("greeting-message").textContent = message;

      const emojiEl = ctx.getElementById("greeting-emoji");
      emojiEl.className = "greeting-emoji emoji-" + emoji;
    };

    update();
    ctx.setInterval(update, 60000);
  },
});
