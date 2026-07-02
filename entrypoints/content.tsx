import ReactDOM from "react-dom/client";
import "@/assets/global.css";
import {
  MessageType,
  isExtractPageMessage,
  type ContentResponse,
} from "@/lib/messaging.ts";
import { extractPageContent } from "@/lib/readability.ts";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    // Fix 1: Register message listener FIRST — before any async operation.
    // This prevents "Could not establish connection" when the background sends
    // EXTRACT_PAGE during the async CSS fetch window.
    const messageListener = (
      message: unknown,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: ContentResponse) => void,
    ): boolean => {
      if (!isExtractPageMessage(message)) return false;

      const result = extractPageContent();
      if (result) {
        sendResponse({ success: true, ...result });
      } else {
        sendResponse({
          success: false,
          error: "This page does not contain readable article content.",
        });
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(messageListener);
    ctx.onInvalidated(() =>
      chrome.runtime.onMessage.removeListener(messageListener),
    );

    // Fix 1 continued: Build the UI — wrapped in try/catch so a CSS fetch
    // failure doesn't crash the content script (the listener still works).
    try {
      const ui = await createShadowRootUi(ctx, {
        name: "pagemind-launcher",
        position: "overlay",
        alignment: "bottom-right",
        anchor: "body",
        zIndex: 2147483647,
        onMount(uiContainer) {
          const root = ReactDOM.createRoot(uiContainer);
          root.render(<FloatingButton />);
          return root;
        },
        onRemove(root) {
          root?.unmount();
        },
      });

      ui.mount();

      // Re-mount on SPA navigation so the button returns after the page changes.
      ctx.addEventListener(window, "wxt:locationchange", () => {
        ui.remove();
        ui.mount();
      });
    } catch (err) {
      console.error("[PageMind] Failed to mount floating button:", err);
      // Listener still works — extraction will succeed even if the button doesn't show.
    }
  },
});

function FloatingButton() {
  const handleClick = () => {
    // Content scripts can't call chrome.sidePanel (not available in the isolated
    // world). Send a message to the service worker SYNCHRONOUSLY within the click
    // handler — this preserves the user gesture so the service worker's
    // chrome.sidePanel.open() call succeeds. (Official Chrome sidepanel sample
    // pattern.) Do NOT await anything before this call.
    try {
      console.log("[PageMind] Floating button clicked, sending OPEN_SIDE_PANEL");
      chrome.runtime.sendMessage({ type: MessageType.OPEN_SIDE_PANEL }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("[PageMind] OPEN_SIDE_PANEL error:", chrome.runtime.lastError.message);
        } else if (response && typeof response === 'object' && 'error' in response) {
          console.error("[PageMind] sidePanel.open failed:", (response as { error: string }).error);
        } else {
          console.log("[PageMind] OPEN_SIDE_PANEL acknowledged");
        }
      });
    } catch (err) {
      console.error("[PageMind] Failed to open side panel:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-5 right-5 flex cursor-pointer items-center justify-center rounded-full bg-pm-primary text-white shadow-lg shadow-glow-primary ring-1 ring-white/15 transition-all duration-150 ease-out hover:scale-[1.08] hover:bg-pm-primary-hover active:scale-95 focus:outline-none focus-visible:pm-focus-ring"
      style={{ zIndex: 2147483647, width: "40px", height: "40px" }}
      aria-label="Open PageMind side panel"
      title="PageMind AI sidekick">
      <img
        src={chrome.runtime.getURL("icon/icon128.png")}
        alt="PageMind"
        className="h-[20px] w-[20px] object-contain pointer-events-none"
      />
    </button>
  );
}
