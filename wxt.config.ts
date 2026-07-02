import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "PageMind",
    description:
      "AI sidekick for any webpage — summarize, explain, rewrite, translate, extract, and chat with the page.",
    version: "0.1.0",
    permissions: [
      "sidePanel",
      "contextMenus",
      "storage",
      "commands",
      "activeTab",
      "alarms",
      "scripting",
    ],
    host_permissions: [
      "https://api.openai.com/*",
      "https://api.deepseek.com/*",
    ],
    commands: {
      "summarize-page": {
        suggested_key: {
          default: "Ctrl+Shift+S",
          mac: "Command+Shift+S",
        },
        description: "Summarize the current page",
      },
      "explain-selection": {
        suggested_key: {
          default: "Ctrl+Shift+E",
          mac: "Command+Shift+E",
        },
        description: "Explain the selected text",
      },
    },
    icons: {
      "16": "icon/icon16.png",
      "32": "icon/icon32.png",
      "48": "icon/icon48.png",
      "128": "icon/icon128.png",
    },
    action: {
      default_icon: {
        "16": "icon/icon16.png",
        "32": "icon/icon32.png",
        "48": "icon/icon48.png",
        "128": "icon/icon128.png",
      },
    },
  },
});
