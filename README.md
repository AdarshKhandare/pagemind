# PageMind

AI sidekick for any webpage — summarize, explain, rewrite, translate, extract structured data, and chat with the page's content using your own AI API keys.

PageMind is a Manifest V3 Chrome extension that adds a floating launcher and a native side panel to every page. It extracts readable article content with Mozilla Readability and streams responses from OpenAI or DeepSeek via a single OpenAI-compatible interface.

**Status:** Published on the [Chrome Web Store](https://chromewebstore.google.com/detail/PageMind/obpahajeeopognhbpomcfgplemegamme). Landing page live at [pagemind.adarshweb.in](https://pagemind.adarshweb.in).

## Features

- **Summarize page** — one click extracts the article (Mozilla Readability) and streams a concise summary.
- **Explain selection** — select any text, get a clear explanation.
- **Rewrite** — improve clarity, tone, or length of selected text.
- **Translate** — translate page or selection to a chosen language with an inline language picker.
- **Extract data** — pull structured JSON data from page content.
- **Chat with page** — ask questions grounded in the current page's content.
- **Streaming responses** — answers render token-by-token via SSE.
- **Markdown rendering** — assistant responses render as safe markdown (react-markdown + remark-gfm, no `dangerouslySetInnerHTML`).
- **Multi-session chat** — separate conversations per page or topic, with a session picker in the header.
- **Model picker** — switch provider and model from the side panel or settings.
- **Shadow DOM floating launcher** — injected on every page via WXT `createShadowRootUi` with `cssInjectionMode: 'ui'` for style isolation from host pages.
- **Right-click context menu** — Summarize, Explain, Rewrite, Translate, Extract on selected text; opens the side panel with the result.
- **Keyboard shortcuts** — `Ctrl+Shift+S` (Cmd+Shift+S on Mac) summarizes the current page; `Ctrl+Shift+E` (Cmd+Shift+E on Mac) explains the selection.

## Architecture

```
[Content Script]  --extracts DOM via Readability-->  [Service Worker]  --fetch()-->  [AI API]
   (ISOLATED world)                                          ^
       |                                                     |
       |--Shadow DOM floating button--sendMessage---------->|
       |                                                     |
[Side Panel (React chat UI)]  <--streaming response--------  [Service Worker]
[Context Menu]  --onClicked-->  [Service Worker]  --> opens side panel + triggers action
[Keyboard Commands]  --onCommand-->  [Service Worker]  --> triggers action
```

Critical rules:

- AI API calls happen **only** in the service worker; content scripts never call AI providers directly (CORS).
- API keys live in `chrome.storage.local` and are only used inside `fetch()` calls to the chosen provider.
- Shadow DOM UI uses WXT's `createShadowRootUi` with `cssInjectionMode: 'ui'` to isolate styles from host pages.
- Service worker keepalive via `chrome.alarms` during long streams (service workers terminate after ~30s idle).
- Side panel opens via `chrome.sidePanel.open()` which requires a user gesture (floating button click, context menu, or keyboard shortcut all qualify).

## Tech stack

- [WXT](https://wxt.dev/) v0.20.x — Manifest V3 extension framework
- React 18 + TypeScript (strict)
- Tailwind CSS v4
- [@mozilla/readability](https://github.com/mozilla/readability) — article extraction
- [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm — safe markdown rendering
- [lucide-react](https://lucide.dev/) — icons
- OpenAI-compatible API interface (OpenAI + DeepSeek)
- `chrome.storage.local` — provider configs, settings, conversation history
- No backend in v1 (BYOK; calls go direct from service worker to AI providers)

### AI providers

PageMind uses a **Bring Your Own Key (BYOK)** model. You supply your own API keys and base URLs in settings. Both supported providers use the same OpenAI-compatible `/v1/chat/completions` endpoint with Bearer auth and SSE streaming, handled by a single `OpenAICompatibleProvider` class.

| Provider | Models                                       |
| -------- | -------------------------------------------- |
| OpenAI   | gpt-5.5, gpt-5.4, gpt-5.4-mini, gpt-5.4-nano |
| DeepSeek | deepseek-v4-flash, deepseek-v4-pro           |

API keys are stored in `chrome.storage.local` only (never synced, never hardcoded). They are sent only to the user's chosen provider.

## Project structure

```
pagemind/
├── package.json
├── wxt.config.ts             # manifest, permissions, commands
├── tsconfig.json
├── entrypoints/
│   ├── background.ts         # service worker: AI calls, routing, context menus, commands
│   ├── content.tsx           # content script: Shadow DOM floating button, Readability extraction
│   ├── sidepanel/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── components/       # ActionBar, ChatBubble, ModelPicker, SessionList, etc.
│   └── options/
│       ├── index.html
│       ├── main.tsx
│       └── App.tsx           # API key + model settings
├── lib/
│   ├── ai/
│   │   ├── providers.ts      # unified provider interface
│   │   └── openai-compatible.ts  # single OpenAI-compatible client (OpenAI + DeepSeek)
│   ├── actions.ts            # shared prompt builders
│   ├── storage.ts            # chrome.storage.local wrapper
│   ├── messaging.ts          # typed message bus
│   └── readability.ts        # page content extraction helper
├── assets/
│   └── global.css            # Tailwind entry + PageMind theme tokens
├── public/
│   ├── icon/                 # 16/32/48/96/128 extension icons
│   └── logo.png
└── site/                     # React + Vite + Tailwind + Motion landing page (deployed to Vercel)
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Get an API key

PageMind requires an API key from one of the supported providers:

- **OpenAI** — [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **DeepSeek** — [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)

Open PageMind settings after loading the extension and paste the key.

### 3. Build the extension

```bash
npm run build
```

### 4. Load unpacked in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3` folder.

### 5. Try it

1. Open any readable article or blog post.
2. Click the floating **PageMind** button in the bottom-right corner.
3. Click **Summarize page** in the side panel, or type a question and press Enter.

Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/PageMind/obpahajeeopognhbpomcfgplemegamme).

## Development

```bash
# Start the dev server with HMR
npm run dev

# Build for production
npm run build

# Type-check the project
npm run typecheck

# Create a distributable ZIP
npm run zip
```

## Privacy

- **BYOK** — Bring Your Own Key. PageMind never includes or transmits hardcoded API keys.
- **Local storage** — API keys and conversation history are stored in `chrome.storage.local` only. They never leave your browser.
- **No telemetry** — PageMind does not track usage, collect analytics, or send data anywhere except to your chosen AI provider (OpenAI or DeepSeek) when you explicitly run an action.
- Page content and selected text are sent only to the AI provider you configure, and only when you trigger an action (summarize, explain, rewrite, translate, extract, or chat).
- Privacy policy: [pagemind.adarshweb.in/privacy](https://pagemind.adarshweb.in/privacy).

## License

MIT

## Author

Adarsh Khandare — [github.com/AdarshKhandare](https://github.com/AdarshKhandare)
