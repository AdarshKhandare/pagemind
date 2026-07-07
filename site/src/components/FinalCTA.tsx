import { ArrowRight, Github } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { AnimatedSection } from "./AnimatedSection";
import { fadeUp } from "../lib/motion";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/PageMind/obpahajeeopognhbpomcfgplemegamme";
const GITHUB_URL = "https://github.com/AdarshKhandare/pagemind";

export function FinalCTA() {
  const shouldReduce = useReducedMotion();
  return (
    <AnimatedSection
      withDivider
      className="section-pad-hero"
      aria-labelledby="final-cta-heading">
      <div className="container-pm">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[var(--radius-xl)] px-6 py-16 text-center md:px-12 md:py-20">
          {/* Soft aurora glow behind the CTA */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(91,141,239,0.18), transparent 60%), radial-gradient(ellipse 50% 40% at 50% 60%, rgba(167,139,250,0.12), transparent 60%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: "var(--color-pm-bg)",
              opacity: 0.7,
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 rounded-[var(--radius-xl)]"
            style={{ border: "1px solid var(--color-pm-border)" }}
          />

          {/* Logo */}
          <motion.div
            initial={shouldReduce ? false : { scale: 0.9, opacity: 0 }}
            whileInView={shouldReduce ? undefined : { scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mb-7">
            <div
              className="cta-logo-pulse mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(91,141,239,0.22), rgba(167,139,250,0.22))",
                border: "1px solid var(--color-pm-border)",
                boxShadow: "var(--shadow-glow-primary)",
              }}>
              <img
                src="/icon-128.png"
                alt="PageMind logo"
                width={64}
                height={64}
                className="h-14 w-14"
              />
            </div>
          </motion.div>

          <motion.h2
            id="final-cta-heading"
            className="text-h1 text-[var(--color-pm-text)]"
            variants={fadeUp}>
            Ready to understand the web?
          </motion.h2>
          <motion.p
            className="text-body-lg mt-4"
            style={{ color: "var(--color-pm-muted)" }}
            variants={fadeUp}>
            Free and open source. Bring your own API key.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            variants={fadeUp}>
            <a
              href={CHROME_STORE_URL}
              className="btn btn--primary btn--large w-full sm:w-auto"
              style={{ boxShadow: "var(--shadow-cta-glow)" }}>
              Add PageMind to Chrome
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost btn--large w-full sm:w-auto">
              <Github className="h-4 w-4" aria-hidden="true" />
              View on GitHub
            </a>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}
