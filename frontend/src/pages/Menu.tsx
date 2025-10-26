/**
 * @file Menu.tsx
 * @brief The Menu page for the L'Orange Rose website. Displays menus as images and provides navigation.
 */

import { useEffect, useState } from "react";
import Logo from "/src/assets/essentials/orangerose_logo-removebg-preview.png";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "../i18n";
import LanguageDropdown from "../components/LanguageDropdown";

/**
 * @function SectionHeading
 * @brief Displays a styled section heading with decorative lines and a legacy font.
 * @param {object} props - React component props.
 * @param {React.ReactNode} props.children - The content to be displayed in the heading.
 * @returns {JSX.Element}
 */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-[calc(50%-50vw)] px-6 py-12 sm:py-16 overflow-x-clip">
      <div className="flex items-center w-full gap-3 sm:gap-6 min-w-0">
        {/* Left segment goes from left edge to title gap */}
        <span aria-hidden className="h-[3px] grow bg-[#4C0C27]" />

        {/* Centered title (doesn't shrink) */}
        <h3
          className="
            font-legacy shrink-0
            text-center px-4 sm:px-6
            text-[#0B0B0B] tracking-wide
            text-2xl sm:text-3xl md:text-5xl lg:text-6xl
            leading-tight
            max-w-[min(92vw,28ch)]
            bg-[#F7EBD9]
          "
        >
          {children}
        </h3>

        {/* Right segment goes from title gap to right edge */}
        <span aria-hidden className="h-[3px] grow bg-[#4C0C27]" />
      </div>
    </div>
  );
}

/**
 * @typedef MediaAsset
 * @brief Represents a media asset retrieved from the API.
 * @property {string} id - Unique identifier for the asset.
 * @property {"HERO"|"MENU"} type - Asset type.
 * @property {string} url - URL of the asset. May be relative or absolute.
 * @property {?string} alt - Alternative text for the image.
 * @property {number} sortOrder - Render order for the asset.
 * @property {boolean} published - Indicates if the asset is published.
 * @property {?number} width - Optional image width.
 * @property {?number} height - Optional image height.
 */
type MediaAsset = {
  id: string;
  type: "HERO" | "MENU";
  url: string;          // "/uploads/....jpg" (dev) or absolute URL (Supabase later)
  alt: string | null;
  sortOrder: number;
  published: boolean;
  width?: number | null;
  height?: number | null;
};

/**
 * @function MenuPage
 * @brief Top-level React component for the Menu page. Handles image fetching, loading state, header, navigation, and page styling.
 * @returns {JSX.Element}
 */
export default function MenuPage() {
  /** Images fetched from the menu media endpoint */
  const [images, setImages] = useState<MediaAsset[]>([]);
  /** Loading state for image fetch */
  const [loading, setLoading] = useState(true);
  /** Translation function from i18n */
  const { t } = useI18n();

  /**
   * @brief Fetch menu images from backend API on mount.
   * Limits to 10 images, sorted by sortOrder, suppresses error UI in case of fetch failure.
   */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/media?type=MENU"); // defaults to 3 server-side
        const data: MediaAsset[] = await res.json();
        if (!alive) return;
        setImages([...data].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 10)); // front-end safety
      } catch {
        // leave empty on error
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  /** Whether the mobile navbar drawer is open */
  const [mobileOpen, setMobileOpen] = useState(false);

  /**
   * @brief Prevent body scroll when mobile menu is open.
   */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[#F7EBD9] text-[#0B0B0B]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F7EBD9]/95 backdrop-blur border-b border-[#4C0C27]/10 text-[#4C0C27]">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <a href="/" className="flex items-center gap-3">
            <img src={Logo} alt="L'Orange Rose" className="h-8 w-auto" />
            <span className="font-legacy text-xl tracking-wide">L&apos;Orange Rose</span>
          </a>

          {/* Desktop nav (unchanged from md+) */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="/" className="nav-link text-lg font-medium tracking-wide">{t("contact.nav.home")}</a>
            <a href="/gallery" className="nav-link text-lg font-medium tracking-wide">{t("nav.gallery")}</a>
            <a href="/contact" className="nav-link text-lg font-medium tracking-wide">{t("nav.contact")}</a>
          </nav>

          {/* Mobile hamburger (only <md) */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md
                 bg-[#4C0C27]/10 hover:bg-[#4C0C27]/15 text-[#4C0C27]
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4C0C27]/40"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} strokeWidth={2} />
          </button>
        </div>

        {/* Mobile menu sheet */}
        <AnimatePresence>
          {mobileOpen && (
            <div className="md:hidden">
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-[#4C0C27]"
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />

              {/* Panel */}
              <motion.div
                key="panel"
                initial={{ y: -24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -24, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 left-0 right-0 z-50
                     bg-[#F7EBD9]/95 backdrop-blur
                     border-b border-[#4C0C27]/10
                     px-4 sm:px-6 pt-4 pb-6 text-[#4C0C27]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={Logo} alt="L'Orange Rose logo" className="h-10 w-auto" />
                    <span className="font-legacy text-xl">L&apos;Orange Rose</span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-md
                         bg-[#4C0C27]/10 hover:bg-[#4C0C27]/15
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4C0C27]/40"
                    aria-label="Close menu"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X size={22} strokeWidth={2} />
                  </button>
                </div>

                {/* Links (touch-friendly) */}
                <div className="mt-4 border-t border-[#4C0C27]/10 pt-2">
                <a href="/" className="block px-3 py-3 rounded-md text-lg hover:bg-[#4C0C27]/5" onClick={() => setMobileOpen(false)}>{t("contact.nav.home")}</a>
                <a href="/gallery" className="block px-3 py-3 rounded-md text-lg hover:bg-[#4C0C27]/5" onClick={() => setMobileOpen(false)}>{t("nav.gallery")}</a>
                <a href="/contact" className="block px-3 py-3 rounded-md text-lg hover:bg-[#4C0C27]/5" onClick={() => setMobileOpen(false)}>{t("nav.contact")}</a>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </header>
      <section className="mx-auto max-w-6xl px-6 lg:px-8 pt-4 pb-2">
        <SectionHeading >
          <h1 className="font-legacy text-3xl md:text-4xl tracking-wide">{t("contact.nav.menu")}</h1>
        </SectionHeading>
      </section>

      <main className="mx-auto max-w-6xl px-6 lg:px-8 pt-4 pb-12">
        {loading ? (
          <div className="rounded-3xl border border-[#4C0C27]/20 bg-white/70 p-8 text-center text-[#4C0C27]">
            {t("menu.loading")}
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-3xl border border-[#4C0C27]/20 bg-white/70 p-8 text-center text-[#4C0C27]">
            {t("menu.comingSoon")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {images.map((m) => (
              <figure
                key={m.id}
                className="rounded-3xl overflow-hidden border border-[#4C0C27]/20 bg-white/70 shadow-sm"
              >
                <img
                  src={m.url}
                  alt={m.alt ?? t("menu.imageAlt")}
                  className="w-full h-auto block"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#4C0C27]/20 bg-[#F7EBD9] text-[#4C0C27]">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 py-10 flex items-center justify-between">
          <span className="font-legacy text-xl">L'Orange Rose</span>
          <span className="text-[#4C0C27]/70 text-sm">© {new Date().getFullYear()}</span>
        </div>
      </footer>

      {/* Local link styles + print rules */}
      <style>{`
        .nav-link { position: relative; transition: color 0.3s ease; }
        .nav-link:hover { color: #C81D25; }
        .nav-link::after {
          content: '';
          position: absolute;
          width: 0; height: 2px; bottom: -6px; left: 50%;
          background: linear-gradient(90deg, #FFB96B, #C81D25);
          transition: all 0.3s ease; transform: translateX(-50%);
        }
        .nav-link:hover::after { width: 100%; }
        @media print {
          header, footer, .nav-link::after { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          img { max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

