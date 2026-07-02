import { Download, KeyRound, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { AnimatedSection } from "./AnimatedSection";
import { stagger, fadeUpItem } from "../lib/motion";

type Step = {
  number: string;
  title: string;
  description: string;
  icon: typeof Download;
};

const STEPS: ReadonlyArray<Step> = [
  {
    number: "01",
    title: "Install the extension",
    description:
      "Add PageMind from the Chrome Web Store. It's free, open source, and weighs in at under 200KB.",
    icon: Download,
  },
  {
    number: "02",
    title: "Add your API key",
    description:
      "Enter your OpenAI or DeepSeek API key in settings. Stored locally in your browser — never sent to us.",
    icon: KeyRound,
  },
  {
    number: "03",
    title: "Use it anywhere",
    description:
      "Click the floating button on any page, or right-click selected text. Your AI sidekick appears in the side panel.",
    icon: Zap,
  },
];

export function HowItWorks() {
  const shouldReduce = useReducedMotion();
  return (
    <AnimatedSection
      id="how-it-works"
      withDivider
      className="section-pad"
      aria-labelledby="how-heading"
    >
      <div className="container-pm">
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <h2
            id="how-heading"
            className="text-h1 text-[var(--color-pm-text)]"
          >
            Up and running in 30 seconds.
          </h2>
          <p
            className="text-body-lg mt-4"
            style={{ color: "var(--color-pm-muted)" }}
          >
            Three steps. No accounts, no waiting, no telemetry.
          </p>
        </div>

        <motion.ol
          className="relative grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger(0.1, 0.15)}
        >
          {/* Connector line on desktop (between steps). */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-10 hidden md:block"
            style={{
              borderTop: "1px dashed var(--color-pm-border-subtle)",
              // align roughly through the icon area
              top: 72,
            }}
          />

          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <motion.li
                key={step.number}
                variants={fadeUpItem}
                className="relative flex flex-col items-start gap-3 md:items-start"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-mono font-bold"
                    style={{
                      fontSize: "0.75rem",
                      letterSpacing: "0.12em",
                      color: "var(--color-pm-primary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    STEP {step.number}
                  </span>
                </div>
                <div
                  className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)]"
                  style={{
                    background: "var(--color-pm-surface)",
                    border: "1px solid var(--color-pm-border)",
                    color: "var(--color-pm-primary)",
                  }}
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-h3 text-[var(--color-pm-text)]">
                  {step.title}
                </h3>
                <p
                  className="text-body max-w-sm"
                  style={{ color: "var(--color-pm-muted)" }}
                >
                  {step.description}
                </p>
                {!shouldReduce ? null : null}
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </AnimatedSection>
  );
}
