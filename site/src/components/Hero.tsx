import {
  motion,
  useReducedMotion,
} from "motion/react";
import { ArrowRight, Sparkles, Bot, Send, RotateCw } from "lucide-react";
import { EASE_OUT, stagger, fadeUpItem } from "../lib/motion";

const CHROME_STORE_URL = "#"; // TODO: real store URL

/**
 * CSS-driven aurora background. Three soft radial-gradient blobs drift
 * slowly via keyframes. Respects `prefers-reduced-motion` via the
 * global CSS rule (animations collapse to 0.01ms).
 */
function AuroraBackground() {
  return (
    <div className="aurora-bg" aria-hidden="true">
      <div className="aurora-blob aurora-blob--blue" />
      <div className="aurora-blob aurora-blob--violet" />
      <div className="aurora-blob aurora-blob--teal" />
      <div className="aurora-grid-overlay" />
    </div>
  );
}

/**
 * A static CSS mock of the extension's side panel — used as the hero
 * product visual. No real screenshots are required.
 */
function ProductMock() {
  return (
    <div
      className="relative mx-auto w-full max-w-[420px]"
      style={{
        background: "var(--color-pm-surface-raised)",
        border: "1px solid var(--color-pm-border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-lg)",
        transform: "perspective(1400px) rotateY(-2deg) rotateX(1deg)",
        overflow: "hidden",
      }}
    >
      {/* Mock chrome — title bar */}
      <div
        className="flex items-center gap-2 px-3.5 py-2.5"
        style={{ borderBottom: "1px solid var(--color-pm-border)" }}
      >
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: "rgba(248,113,113,0.6)" }}
        />
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: "rgba(251,191,36,0.6)" }}
        />
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: "rgba(52,211,153,0.6)" }}
        />
        <span
          className="ml-2 text-mono"
          style={{ color: "var(--color-pm-muted-subtle)" }}
        >
          pagemind · side panel
        </span>
      </div>

      {/* Page context pill */}
      <div className="px-4 pt-4">
        <div
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
          style={{
            background: "var(--color-pm-bg)",
            border: "1px solid var(--color-pm-border)",
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--color-pm-primary)" }}
          />
          <span
            className="truncate text-mono"
            style={{ color: "var(--color-pm-muted)" }}
          >
            arxiv.org/abs/2503.18941
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-1.5 px-4 pt-3">
        {[
          { icon: Sparkles, label: "Summarize" },
          { icon: Bot, label: "Explain" },
          { icon: RotateCw, label: "Rewrite" },
          { icon: Send, label: "Chat" },
        ].map(({ icon: Icon, label }) => (
          <button
            type="button"
            key={label}
            className="flex items-center justify-center gap-1.5 rounded-md py-1.5 text-small font-medium transition-colors"
            style={{
              background: "var(--color-pm-bg)",
              color: "var(--color-pm-text)",
              border: "1px solid var(--color-pm-border)",
            }}
            tabIndex={-1}
            aria-hidden="true"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Conversation */}
      <div className="space-y-2.5 px-4 py-4">
        <div className="mock-bubble mock-bubble--user">
          Summarize this paper in 5 bullets.
        </div>
        <div className="mock-bubble mock-bubble--assistant">
          <strong>TL;DR</strong> — the authors propose a sparse mixture-of-experts
          routing scheme that halves inference cost with{" "}
          <strong>&lt;1% quality loss</strong>
          <span className="mock-cursor" aria-hidden="true" />
        </div>
      </div>

      {/* Input */}
      <div
        className="px-4 pb-4"
        style={{ borderTop: "1px solid var(--color-pm-border)", paddingTop: 12 }}
      >
        <div
          className="flex items-center gap-2 rounded-md px-3 py-2"
          style={{
            background: "var(--color-pm-bg)",
            border: "1px solid var(--color-pm-border)",
          }}
        >
          <span
            className="text-small"
            style={{ color: "var(--color-pm-muted-subtle)" }}
          >
            Ask anything about this page…
          </span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const shouldReduce = useReducedMotion();

  // Pre-split the headline so each word can stagger in.
  const headlineWords = ["Your", "AI", "sidekick", "for", "any", "webpage."];

  return (
    <section
      id="hero"
      className="relative isolate min-h-[calc(100dvh-56px)] overflow-hidden pt-14"
      aria-labelledby="hero-headline"
    >
      <AuroraBackground />

      <div className="container-pm relative z-10 flex flex-col items-center gap-12 pb-16 pt-12 md:flex-row md:items-center md:gap-10 md:pt-20 lg:pt-24">
        {/* Left: text */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger(0.05, 0.08)}
          className="flex-1 text-center md:text-left"
        >
          {/* Eyebrow */}
          <motion.div
            variants={fadeUpItem}
            className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              background: "var(--color-pm-primary-subtle)",
              border: "1px solid var(--color-pm-border)",
            }}
          >
            <Sparkles
              className="h-3.5 w-3.5"
              aria-hidden="true"
              style={{ color: "var(--color-pm-primary)" }}
            />
            <span
              className="text-mono"
              style={{ color: "var(--color-pm-text)" }}
            >
              v1.0 · Chrome MV3 · open source
            </span>
          </motion.div>

          {/* Headline */}
          <h1
            id="hero-headline"
            className="text-hero text-[var(--color-pm-text)]"
          >
            {headlineWords.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                variants={fadeUpItem}
                className="inline-block"
                style={{ marginRight: i < headlineWords.length - 1 ? "0.28em" : 0 }}
              >
                {word === "AI" ? (
                  <span className="gradient-text">AI</span>
                ) : (
                  word
                )}
              </motion.span>
            ))}
          </h1>

          {/* Subhead */}
          <motion.p
            variants={fadeUpItem}
            className="text-body-lg mt-5 max-w-xl text-[var(--color-pm-muted)] md:mt-6"
            style={{ marginLeft: "auto", marginRight: "auto" }}
          >
            Summarize, explain, rewrite, translate, extract data, and chat — right
            from your browser side panel.{" "}
            <span className="text-[var(--color-pm-text)]">
              Bring your own API key.
            </span>{" "}
            Privacy-first.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUpItem}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:items-start"
          >
            <a
              href={CHROME_STORE_URL}
              className="btn btn--primary btn--large w-full sm:w-auto"
            >
              Add to Chrome
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#how-it-works"
              className="btn btn--ghost btn--large w-full sm:w-auto"
            >
              See how it works
            </a>
          </motion.div>

          {/* Trust line */}
          <motion.p
            variants={fadeUpItem}
            className="text-small mt-5 text-[var(--color-pm-muted-subtle)]"
          >
            Free, no account required. Works with OpenAI &amp; DeepSeek.
          </motion.p>
        </motion.div>

        {/* Right: product mock */}
        <motion.div
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
          animate={shouldReduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.4 }}
          className="flex-1 w-full max-w-md md:max-w-none"
        >
          <ProductMock />
        </motion.div>
      </div>

      {/* Bottom fade to next section */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, var(--color-pm-bg) 100%)",
        }}
        aria-hidden="true"
      />
    </section>
  );
}
