# PageMind

AI sidekick for any webpage — summarize, explain, rewrite, translate, extract, and chat with the page's content.

PageMind is a Manifest V3 Chrome extension that adds a floating launcher and a native side panel to every page. It extracts readable article content with Mozilla Readability and streams responses from your own AI provider keys.

## Features

### Phase 1 (MVP) — now

- **Summarize page** — one click extracts the article and streams a concise summary via Groq.
- **Chat with the page** — ask questions about the current page content in the side panel.
- **Shadow DOM floating launcher** — a polished, isolated button injected on every page.
- **Streaming responses** — assistant replies render token-by-token in the side panel.
- **BYOK key management** — add your Groq API key in the settings page; keys stay local.
- **Model picker** — switch between Groq models (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`).
- **Keyboard shortcuts** — `Ctrl+Shift+S` summarizes the current page.

### Phase 2 — planned

- OpenAI and Google Gemini providers.
- Context-menu actions for selected text (explain, rewrite, translate, extract).
- Full selection handling for `Ctrl+Shift+E`.
- Rewrite, Translate, and Extract data actions in the side panel.
- Conversation history sync and richer chat management.

### Phase 3 — planned

- Chrome Web Store listing, privacy policy, and submission.
- Landing page at `pagemind.adarshweb.in`.
- Polish, custom icons, and onboarding.

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

- AI API calls happen **only** in the service worker; content scripts never call AI providers directly.
- API keys live in `chrome.storage.local` and are only used inside `fetch()` calls to the chosen provider.
- Shadow DOM UI uses WXT's `createShadowRootUi` with `cssInjectionMode: 'ui'` to isolate styles from host pages.

## Tech stack

- [WXT](https://wxt.dev/) v0.20.x — Manifest V3 extension framework
- React 18 + TypeScript (strict)
- Tailwind CSS v4
- [Mozilla Readability](https://github.com/mozilla/readability) — article extraction
- [Lucide React](https://lucide.dev/) — icons
- Groq (OpenAI-compatible) API for Phase 1

## Project structure

```
pagemind/
├── AGENTS.md                 # locked architecture and conventions
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
│   │   └── components/       # chat UI pieces
│   └── options/
│       ├── index.html
│       ├── main.tsx
│       └── App.tsx           # API key + model settings
├── lib/
│   ├── ai/
│   │   ├── providers.ts      # unified provider interface
│   │   └── groq.ts           # Groq SSE client
│   ├── storage.ts            # chrome.storage.local wrapper
│   ├── messaging.ts          # typed message bus
│   └── readability.ts        # page content extraction helper
├── assets/
│   ├── global.css            # Tailwind entry + PageMind theme tokens
│   └── react.svg
└── public/icon/              # 16/32/48/96/128 extension icons
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Get a Groq API key

1. Visit [console.groq.com/keys](https://console.groq.com/keys).
2. Create a free API key.
3. Open PageMind settings after installation and paste the key.

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

- **BYOK** — Bring Your Own Key. PageMind never includes hardcoded API keys.
- **Local storage** — API keys and conversation history are stored in `chrome.storage.local` only.
- **No telemetry** — PageMind does not track usage, collect page content, or send data anywhere except to your chosen AI provider when you explicitly run an action.
- Page content and selected text are sent to the AI provider you configure.

## License

MIT
