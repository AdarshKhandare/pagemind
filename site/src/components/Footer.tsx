const GITHUB_URL = "https://github.com/AdarshKhandare/pagemind";
const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/PageMind/obpahajeeopognhbpomcfgplemegamme";

const FOOTER_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Privacy", href: "#privacy" },
  { label: "Chrome Web Store", href: CHROME_STORE_URL },
  { label: "GitHub", href: GITHUB_URL },
];

export function Footer() {
  return (
    <footer
      className="border-t"
      style={{
        background: "var(--color-pm-bg)",
        borderTopColor: "var(--color-pm-border)",
      }}
      aria-label="Page footer">
      <div className="container-pm flex flex-col items-center gap-6 py-10 md:flex-row md:justify-between md:py-12">
        {/* Left: brand + maker */}
        <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-3">
          <a
            href="#hero"
            className="flex items-center gap-2"
            aria-label="PageMind home">
            <img
              src="/icon-128.png"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 rounded"
            />
            <span
              className="text-body font-semibold"
              style={{ fontFamily: "var(--font-display)" }}>
              PageMind
            </span>
          </a>
          <span
            className="text-small"
            style={{ color: "var(--color-pm-muted-subtle)" }}>
            Made by{" "}
            <a
              href="https://adarshweb.in"
              target="_blank"
              rel="noopener noreferrer"
              className="pm-focus-ring rounded text-[var(--color-pm-muted)] underline-offset-2 transition-colors hover:text-[var(--color-pm-text)]">
              Adarsh Khandare
            </a>
          </span>
        </div>

        {/* Center: links */}
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="pm-focus-ring rounded text-small text-[var(--color-pm-muted)] transition-colors hover:text-[var(--color-pm-text)]"
                  {...(link.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: copyright */}
        <p
          className="text-small"
          style={{ color: "var(--color-pm-muted-subtle)" }}>
          © 2026 Adarsh Khandare
        </p>
      </div>
    </footer>
  );
}
