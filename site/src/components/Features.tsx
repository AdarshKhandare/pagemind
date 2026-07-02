import { type ReactNode } from "react";
import {
  FileText,
  HelpCircle,
  PenTool,
  Languages,
  Database,
  MessageSquare,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { AnimatedSection } from "./AnimatedSection";
import { useMousePosition } from "../hooks/useScrollProgress";
import { stagger, fadeUpItem } from "../lib/motion";

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  /** Grid placement: which row/column this card spans. */
  span: "sm" | "md" | "lg" | "wide";
};

const FEATURES: ReadonlyArray<Feature> = [
  {
    id: "summarize",
    title: "Summarize",
    description: "Get the key points of any article, paper, or docs page in seconds.",
    icon: FileText,
    span: "sm",
  },
  {
    id: "explain",
    title: "Explain",
    description:
      "Highlight a phrase or paragraph and get a plain-English explanation in context.",
    icon: HelpCircle,
    span: "sm",
  },
  {
    id: "rewrite",
    title: "Rewrite",
    description:
      "Change the tone, simplify, or tighten — your selection, your voice, refined.",
    icon: PenTool,
    span: "sm",
  },
  {
    id: "translate",
    title: "Translate",
    description:
      "Translate selected text or the whole page in 50+ languages without leaving the tab.",
    icon: Languages,
    span: "md",
  },
  {
    id: "extract",
    title: "Extract",
    description:
      "Pull structured data — emails, dates, prices, tables — as clean JSON you can copy.",
    icon: Database,
    span: "md",
  },
  {
    id: "chat",
    title: "Chat with the page",
    description:
      "Ask follow-up questions and have a real conversation grounded in the page's content. Streaming responses, full history, no tab switching.",
    icon: MessageSquare,
    span: "wide",
  },
];

type CardProps = {
  feature: Feature;
  children?: ReactNode;
};

function FeatureCard({ feature }: CardProps) {
  const { ref, pctX, pctY } = useMousePosition<HTMLDivElement>();
  const shouldReduce = useReducedMotion();
  const Icon = feature.icon;

  // Bento spans: 3-col grid → use col-span-2 for md/wide on desktop.
  // Mobile = col-span-1 for all.
  const colClass =
    feature.span === "wide"
      ? "md:col-span-3"
      : feature.span === "md"
        ? "md:col-span-2"
        : "md:col-span-1";

  return (
    <motion.article
      ref={ref}
      variants={fadeUpItem}
      whileHover={shouldReduce ? undefined : { y: -2 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`card-glow group col-span-1 flex flex-col gap-4 rounded-[var(--radius-lg)] p-6 transition-[border-color,box-shadow] duration-200 hover:border-[rgba(255,255,255,0.12)] ${colClass}`}
      style={{
        background: "var(--color-pm-surface)",
        border: "1px solid var(--color-pm-border)",
        // Pass mouse position into CSS custom properties for the glow.
        ["--mouse-x" as never]: `${pctX}%`,
        ["--mouse-y" as never]: `${pctY}%`,
        minHeight: feature.span === "wide" ? 200 : 180,
      }}
    >
      <div
        className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)]"
        style={{
          background: "var(--color-pm-primary-subtle)",
          color: "var(--color-pm-primary)",
        }}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <h3 className="text-h3 text-[var(--color-pm-text)]">
          {feature.title}
        </h3>
        <p
          className="text-small mt-2 max-w-prose"
          style={{ color: "var(--color-pm-muted)" }}
        >
          {feature.description}
        </p>
      </div>

      {feature.span === "wide" ? (
        <div
          className="mt-2 flex flex-wrap items-center gap-2"
          aria-hidden="true"
        >
          {[
            "Streaming",
            "Conversation history",
            "Context from the page",
            "Multi-tab",
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2.5 py-1 text-mono"
              style={{
                background: "var(--color-pm-bg)",
                border: "1px solid var(--color-pm-border)",
                color: "var(--color-pm-muted)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </motion.article>
  );
}

export function Features() {
  return (
    <AnimatedSection
      id="features"
      withDivider
      className="section-pad"
      aria-labelledby="features-heading"
    >
      <div className="container-pm">
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <h2
            id="features-heading"
            className="text-h1 text-[var(--color-pm-text)]"
          >
            Everything you need to understand the web.
          </h2>
          <p
            className="text-body-lg mt-4"
            style={{ color: "var(--color-pm-muted)" }}
          >
            Six powerful actions, one side panel. No tab-switching, no
            copy-pasting.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger(0.1, 0.05)}
        >
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
