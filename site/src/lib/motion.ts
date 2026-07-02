/**
 * Shared motion variants and constants for the PageMind landing page.
 *
 * Uses Motion (formerly framer-motion). Importing from `motion/react`.
 * All variants respect `prefers-reduced-motion` via the `useReducedMotion`
 * hook in the consumer — keep the shape of `transition` etc. consistent
 * so we can branch on it cleanly.
 */
import type { Variants, Transition } from "motion/react";

export const EASE_OUT: Transition["ease"] = [0.16, 1, 0.3, 1];
export const EASE_SPRING: Transition["ease"] = [0.175, 0.885, 0.32, 1.1];

export const DURATION = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  reveal: 0.4,
  hero: 0.6,
} as const;

/** Fade + slight rise. Default for section headers and content blocks. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.reveal, ease: EASE_OUT },
  },
};

/** Container with staggered children (50ms apart by default). */
export const stagger = (delayChildren = 0.05, staggerChildren = 0.05): Variants => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren,
      staggerChildren,
    },
  },
});

/** Per-item stagger child — use inside a `stagger()` parent. */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE_OUT },
  },
};

/** Hero headline word — slight rise, used with custom delay. */
export const heroWord: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

/** Side-from-left / side-from-right for split layouts. */
export const fromLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.reveal, ease: EASE_OUT },
  },
};

export const fromRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.reveal, ease: EASE_OUT },
  },
};
