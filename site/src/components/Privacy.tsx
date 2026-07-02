import { Check, ShieldCheck, KeyRound, ServerOff } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT, fromLeft, fromRight } from "../lib/motion";

const CHECKS: ReadonlyArray<{ icon: typeof Check; text: string }> = [
  { icon: KeyRound, text: "Bring your own API key (OpenAI or DeepSeek)" },
  { icon: ServerOff, text: "Zero telemetry — we don't collect any data" },
  { icon: ShieldCheck, text: "Content goes direct from your browser to your AI provider" },
];

function FlowDiagram() {
  return (
    <div
      className="relative w-full max-w-md mx-auto rounded-[var(--radius-lg)] p-6"
      style={{
        background: "var(--color-pm-bg)",
        border: "1px solid var(--color-pm-border)",
      }}
      aria-label="Data flow diagram: browser to AI provider with no middleman"
      role="img"
    >
      <div className="flex flex-col items-stretch gap-4">
        <DiagramNode label="Your browser" sub="PageMind extension" accent="primary" />
        <FlowArrow label="fetch (with your key)" />
        <DiagramNode
          label="OpenAI / DeepSeek"
          sub="Direct, no middleman"
          accent="accent"
        />
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-2 text-mono">
        <li
          className="flex items-center gap-1.5"
          style={{ color: "var(--color-pm-muted-subtle)" }}
        >
          <span style={{ color: "var(--color-pm-danger)" }}>✕</span> No telemetry
        </li>
        <li
          className="flex items-center gap-1.5"
          style={{ color: "var(--color-pm-muted-subtle)" }}
        >
          <span style={{ color: "var(--color-pm-danger)" }}>✕</span> No proxy
        </li>
        <li
          className="flex items-center gap-1.5"
          style={{ color: "var(--color-pm-muted-subtle)" }}
        >
          <span style={{ color: "var(--color-pm-danger)" }}>✕</span> No logging
        </li>
        <li
          className="flex items-center gap-1.5"
          style={{ color: "var(--color-pm-muted-subtle)" }}
        >
          <span style={{ color: "var(--color-pm-danger)" }}>✕</span> No account
        </li>
      </ul>
    </div>
  );
}

function DiagramNode({
  label,
  sub,
  accent,
}: {
  label: string;
  sub: string;
  accent: "primary" | "accent";
}) {
  const isPrimary = accent === "primary";
  return (
    <div
      className="flex items-center gap-3 rounded-md p-3"
      style={{
        background: "var(--color-pm-surface)",
        border: "1px solid var(--color-pm-border)",
      }}
    >
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{
          background: isPrimary
            ? "var(--color-pm-primary)"
            : "var(--color-pm-accent)",
          boxShadow: isPrimary
            ? "var(--shadow-glow-primary)"
            : "var(--shadow-glow-accent)",
        }}
        aria-hidden="true"
      />
      <div className="flex flex-col">
        <span
          className="text-small font-semibold"
          style={{ color: "var(--color-pm-text)" }}
        >
          {label}
        </span>
        <span className="text-mono" style={{ color: "var(--color-pm-muted)" }}>
          {sub}
        </span>
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <svg
        width="20"
        height="28"
        viewBox="0 0 20 28"
        fill="none"
        aria-hidden="true"
      >
        <line
          x1="10"
          y1="0"
          x2="10"
          y2="20"
          stroke="var(--color-pm-border)"
          strokeWidth="1.5"
          className="flow-line"
        />
        <path
          d="M5 20 L10 26 L15 20"
          stroke="var(--color-pm-primary)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="text-mono mt-1"
        style={{ color: "var(--color-pm-muted-subtle)" }}
      >
        {label}
      </span>
    </div>
  );
}

export function Privacy() {
  const shouldReduce = useReducedMotion();
  return (
    // Full-bleed wrapper to give this section a slightly different surface
    // that visually separates it from the rest of the page.
    <div
      id="privacy"
      className="relative left-1/2 right-1/2 -mx-[50vw] w-screen"
      style={{ background: "var(--color-pm-surface)" }}
    >
      <motion.section
        className="section-pad"
        aria-labelledby="privacy-heading"
        initial={shouldReduce ? false : "hidden"}
        whileInView={shouldReduce ? undefined : "visible"}
        viewport={{ once: true, margin: "-80px" }}
        variants={fromLeft}
      >
        <div className="container-pm">
          <div className="section-divider mb-16" aria-hidden="true" />
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
            {/* Left: messaging */}
            <motion.div
              initial={shouldReduce ? { opacity: 0 } : "hidden"}
              whileInView={shouldReduce ? { opacity: 1 } : "visible"}
              viewport={{ once: true, margin: "-80px" }}
              variants={fromLeft}
            >
              <span
                className="text-mono uppercase"
                style={{
                  letterSpacing: "0.18em",
                  color: "var(--color-pm-accent)",
                }}
              >
                Privacy-first
              </span>
              <h2
                id="privacy-heading"
                className="text-h1 mt-3 text-[var(--color-pm-text)]"
              >
                Your keys. Your data. Your AI.
              </h2>
              <p
                className="text-body-lg mt-5 max-w-prose"
                style={{ color: "var(--color-pm-muted)" }}
              >
                PageMind sends your content directly to your chosen AI provider —
                no middleman, no telemetry, no tracking. Your API key is stored
                locally in your browser and never touches our servers. There is
                no backend.
              </p>
              <ul className="mt-7 space-y-3">
                {CHECKS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 grid h-5 w-5 place-items-center rounded-full"
                      style={{
                        background: "rgba(52, 211, 153, 0.1)",
                        color: "var(--color-pm-success)",
                      }}
                      aria-hidden="true"
                    >
                      <Icon className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    <span
                      className="text-body"
                      style={{ color: "var(--color-pm-text)" }}
                    >
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right: visual */}
            <motion.div
              initial={shouldReduce ? { opacity: 0 } : "hidden"}
              whileInView={shouldReduce ? { opacity: 1 } : "visible"}
              viewport={{ once: true, margin: "-80px" }}
              variants={fromRight}
              transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.1 }}
            >
              <FlowDiagram />
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
