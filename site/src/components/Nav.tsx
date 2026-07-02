import { useState, useEffect, useCallback } from "react";
import { Menu, X, Github } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useScrollProgress } from "../hooks/useScrollProgress";

const NAV_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Privacy", href: "#privacy" },
];

// TODO: Replace with the real Chrome Web Store URL once the listing is live.
const CHROME_STORE_URL = "#";

export function Nav() {
  const scrollProgress = useScrollProgress();
  const isScrolled = scrollProgress > 0.02;
  const [menuOpen, setMenuOpen] = useState(false);
  const shouldReduce = useReducedMotion();

  // Close menu on resize to desktop (avoid stuck overlay on orientation change).
  useEffect(() => {
    const onResize = (): void => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <nav
        aria-label="Primary"
        className="nav-bg pm-focus-ring fixed top-0 left-0 right-0 z-20 border-b border-transparent backdrop-blur-xl transition-[background-color,border-color] duration-200"
        style={{
          // backdrop-filter saturate via inline style (Tailwind v4 utility alternative)
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
        }}
      >
        <div
          className={`container-pm flex h-14 items-center justify-between transition-[background-color,border-color] duration-200 ${
            isScrolled ? "nav-bg--scrolled" : ""
          }`}
        >
          {/* Left: logo + wordmark */}
          <a
            href="#hero"
            className="flex items-center gap-2.5 pm-focus-ring rounded-md"
            aria-label="PageMind home"
          >
            <span
              className="grid h-8 w-8 place-items-center overflow-hidden rounded-md"
              style={{
                background:
                  "linear-gradient(135deg, rgba(91,141,239,0.18), rgba(167,139,250,0.18))",
                border: "1px solid var(--color-pm-border)",
              }}
            >
              <img
                src="/logo.png"
                alt=""
                width={32}
                height={32}
                className="h-7 w-7"
              />
            </span>
            <span
              className="text-body font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              PageMind
            </span>
          </a>

          {/* Center: nav links (desktop) */}
          <ul className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="pm-focus-ring rounded-md px-3 py-2 text-small text-[var(--color-pm-muted)] transition-colors hover:text-[var(--color-pm-text)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right: GitHub + CTA (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href="https://github.com/AdarshKhandare/pagemind"
              target="_blank"
              rel="noopener noreferrer"
              className="pm-focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-pm-muted)] transition-colors hover:text-[var(--color-pm-text)]"
              aria-label="View PageMind on GitHub"
            >
              <Github className="h-4.5 w-4.5" aria-hidden="true" />
            </a>
            <a
              href={CHROME_STORE_URL}
              className="btn btn--primary btn--sm"
              aria-label="Add PageMind to Chrome"
            >
              Add to Chrome
            </a>
          </div>

          {/* Mobile: CTA + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href={CHROME_STORE_URL}
              className="btn btn--primary btn--sm"
              aria-label="Add PageMind to Chrome"
            >
              Add
            </a>
            <button
              type="button"
              className="pm-focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-pm-text)]"
              style={{
                background: "var(--color-pm-surface)",
                border: "1px solid var(--color-pm-border)",
              }}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={shouldReduce ? { opacity: 0 } : { opacity: 0, x: "100%" }}
            animate={shouldReduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduce ? { opacity: 0 } : { opacity: 0, x: "100%" }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="menu-scrim fixed inset-0 z-30 md:hidden"
            onClick={(e) => {
              // Close if user clicks the scrim, not the panel.
              if (e.target === e.currentTarget) closeMenu();
            }}
          >
            <div
              className="absolute right-0 top-0 h-full w-[78%] max-w-sm p-6"
              style={{
                background: "var(--color-pm-surface)",
                borderLeft: "1px solid var(--color-pm-border)",
              }}
            >
              <div className="mb-8 flex items-center justify-between">
                <span
                  className="font-semibold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Menu
                </span>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="pm-focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md"
                  style={{
                    background: "var(--color-pm-bg)",
                    border: "1px solid var(--color-pm-border)",
                  }}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <ul className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={closeMenu}
                      className="pm-focus-ring block rounded-md px-3 py-3 text-body font-medium text-[var(--color-pm-text)] transition-colors hover:bg-[var(--color-pm-surface-hover)]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="https://github.com/AdarshKhandare/pagemind"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="pm-focus-ring flex items-center gap-2 rounded-md px-3 py-3 text-body font-medium text-[var(--color-pm-text)] transition-colors hover:bg-[var(--color-pm-surface-hover)]"
                  >
                    <Github className="h-4 w-4" aria-hidden="true" /> GitHub
                  </a>
                </li>
              </ul>
              <div className="mt-8">
                <a
                  href={CHROME_STORE_URL}
                  onClick={closeMenu}
                  className="btn btn--primary w-full"
                >
                  Add to Chrome
                </a>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
