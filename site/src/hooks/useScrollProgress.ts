import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Tracks the page's vertical scroll progress (0–1) for the sticky nav
 * background. Uses passive scroll listener + rAF throttle for perf.
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = (): void => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      setProgress(p);
      frame = 0;
    };
    const onScroll = (): void => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  return progress;
}

/**
 * Tracks a mouse position relative to the given element, exposing x/y in
 * pixel coordinates and exposing the same values as percentages via
 * `pctX` / `pctY`. Used by the bento card mouse-follow glow effect.
 */
export function useMousePosition<T extends HTMLElement>(): {
  ref: RefObject<T>;
  x: number;
  y: number;
  pctX: number;
  pctY: number;
} {
  const ref = useRef<T>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, pctX: 50, pctY: 50 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent): void => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pctX = rect.width > 0 ? (x / rect.width) * 100 : 50;
      const pctY = rect.height > 0 ? (y / rect.height) * 100 : 50;
      setPos({ x, y, pctX, pctY });
    };
    const onLeave = (): void => {
      setPos({ x: 0, y: 0, pctX: 50, pctY: 50 });
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return { ref, x: pos.x, y: pos.y, pctX: pos.pctX, pctY: pos.pctY };
}
