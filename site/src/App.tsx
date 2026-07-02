import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Providers } from "./components/Providers";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { Privacy } from "./components/Privacy";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";

/**
 * Root component for the PageMind marketing landing page.
 *
 * Renders all sections in document order. Each section owns its own
 * in-view animation and respects `prefers-reduced-motion` internally.
 *
 * The page is a single static SPA — no router, no server, just anchor
 * links. The order matters for both reading flow and the section-divider
 * rhythm defined in `index.css`.
 */
export default function App() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Providers />
        <Features />
        <HowItWorks />
        <Privacy />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
