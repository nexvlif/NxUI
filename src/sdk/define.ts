import type { NxWidget } from "./types";

/**
 * Define a widget with type-safe configuration.
 * Provides sensible defaults and validates at the type level.
 *
 * @example
 * ```ts
 * import { defineWidget } from "nxui/sdk";
 *
 * export default defineWidget({
 *   name: "My Widget",
 *   version: "1.0.0",
 *   author: "You",
 *   width: 300,
 *   height: 150,
 *   onMount(ctx) {
 *     // Your logic here
 *   },
 * });
 * ```
 */
export function defineWidget(config: NxWidget): NxWidget {
  return {
    transparent: true,
    alwaysOnTop: true,
    desktopLevel: "top",
    resizable: false,
    clickThrough: false,
    ...config,
  };
}
