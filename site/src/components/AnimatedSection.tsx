import { type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  type MotionProps,
} from "motion/react";
import { fadeUp } from "../lib/motion";

type AnimatedSectionProps = {
  children: ReactNode;
  className?: string;
  /** Custom variants. Defaults to `fadeUp`. */
  variants?: typeof fadeUp;
  /** Show a divider line above the section. */
  withDivider?: boolean;
  /** Optional id for the section (used for in-page anchors). */
  id?: string;
  /** When true, do NOT animate on viewport entry. */
  disableReveal?: boolean;
} & Omit<MotionProps, "variants" | "children" | "className">;

/**
 * Reusable scroll-reveal wrapper. Fades + rises content into view via
 * `whileInView`. Respects `prefers-reduced-motion`.
 *
 * Renders a `<motion.section>` under the hood (good for document
 * semantics). Pass `as` via className/role if you need a different tag.
 */
export function AnimatedSection({
  children,
  className,
  variants = fadeUp,
  withDivider = false,
  id,
  disableReveal = false,
  ...rest
}: AnimatedSectionProps) {
  const shouldReduce = useReducedMotion();

  return (
    <>
      {withDivider ? <div className="section-divider" aria-hidden="true" /> : null}
      <motion.section
        id={id}
        className={className}
        initial={disableReveal || shouldReduce ? false : "hidden"}
        whileInView={disableReveal || shouldReduce ? undefined : "visible"}
        viewport={{ once: true, margin: "-80px" }}
        variants={variants}
        {...rest}
      >
        {children}
      </motion.section>
    </>
  );
}
