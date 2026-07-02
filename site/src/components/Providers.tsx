import { motion, useReducedMotion } from "motion/react";
import { AnimatedSection } from "./AnimatedSection";

const PROVIDERS = [
  { name: "OpenAI", glyph: "OpenAI" },
  { name: "DeepSeek", glyph: "DeepSeek" },
] as const;

export function Providers() {
  const shouldReduce = useReducedMotion();
  return (
    <AnimatedSection
      withDivider
      className="section-pad"
      aria-labelledby="providers-heading"
    >
      <div className="container-pm flex flex-col items-center gap-5 text-center">
        <h2
          id="providers-heading"
          className="text-mono uppercase tracking-[0.18em]"
          style={{ color: "var(--color-pm-muted-subtle)" }}
        >
          Works with your AI provider
        </h2>
        <motion.ul
          className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 1 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.12, delayChildren: 0.05 },
            },
          }}
        >
          {PROVIDERS.map((p) => (
            <motion.li
              key={p.name}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                className="provider-wordmark"
                style={shouldReduce ? undefined : { fontSize: "1.5rem" }}
                aria-label={p.name}
              >
                {p.glyph}
              </span>
            </motion.li>
          ))}
        </motion.ul>
        <p
          className="text-small max-w-md"
          style={{ color: "var(--color-pm-muted)" }}
        >
          Bring your own OpenAI or DeepSeek API key. PageMind speaks the same
          OpenAI-compatible protocol to both.
        </p>
      </div>
    </AnimatedSection>
  );
}
