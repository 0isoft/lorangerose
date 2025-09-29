import { useEffect, useMemo, useState } from "react";
import { Phone, MapPin, Instagram, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { parseAPIDate, fmtWeekday } from "../lib/date";
import LanguageDropdown from "../components/LanguageDropdown";
import { useI18n } from "@/i18n";
import Logo from "@/assets/essentials/orangerose_logo-removebg-preview.png";

const USE_CHUNKY = false;

// types
type MediaAsset = {
  id: string;
  type: "HERO" | "MENU" | string; // keep open if you add more
  url: string;
  alt: string | null;
  sortOrder: number;
  published: boolean;
  width?: number | null;
  height?: number | null;
  _linkSortOrder?: number; // from join table
};

type Announcement = {
  id: string;
  date: string; // ISO from API
  title: string;
  desc?: string | null;
  published: boolean;

  // NEW
  mediaAssets: MediaAsset[];

  // derived
  _date?: Date;
};

// Easing tuple (approx easeOut)
const easeOutExpo = [0.16, 1, 0.3, 1] as const;

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

export default function Landing() {
  // --- NEW DATA STATE ---
  const [slides, setSlides] = useState<Array<{ src: string; alt: string }>>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [idx, setIdx] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  // i18n
  const { t, localeTag } = useI18n();

  const news = useMemo(() => {
    return announcements
      .map((a) => {
        const d = parseAPIDate(a.date); // your helper
        return isNaN(d.getTime()) ? null : { ...a, _date: d };
      })
      .filter((x): x is Announcement & { _date: Date } => !!x)
      .sort((a, b) => a._date.getTime() - b._date.getTime());
  }, [announcements]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/media?type=HERO");
        const data: MediaAsset[] = await res.json();
        if (!alive) return;
        const sorted = data.sort((a, b) => a.sortOrder - b.sortOrder); // server already orders, but safe
        setSlides(sorted.map((m) => ({ src: m.url, alt: m.alt ?? "" })));
      } catch {
        // optional: setSlides([...fallbacks]) or leave empty
      } finally {
        if (alive) setLoadingSlides(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Fetch announcements (published)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/announcements");
        if (!res.ok) {
          const text = await res.text();
          console.error("GET /api/announcements failed:", res.status, text);
          if (alive) setAnnouncements([]);
          return;
        }
        const data: Announcement[] = await res.json();
        console.debug("Announcements from API:", data);
        if (!alive) return;
        setAnnouncements(data);
      } catch (err) {
        console.error("GET /api/announcements error:", err);
        if (alive) setAnnouncements([]);
      } finally {
        if (alive) setLoadingNews(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Carousel auto-advance only when we have slides
  useEffect(() => {
    if (slides.length === 0) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % slides.length), 4800);
    return () => clearInterval(id);
  }, [slides.length]);

  // Track scroll (unchanged)
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&display=swap');
          .font-lorange { font-family: 'Cinzel Decorative', serif; }
          .hero-content > * { animation: heroSlideUp 1.2s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; opacity: 0; transform: translateY(60px); }
          .hero-content > *:nth-child(1) { animation-delay: 0.2s; }
          .hero-content > *:nth-child(2) { animation-delay: 0.4s; }
          .hero-content > *:nth-child(3) { animation-delay: 0.6s; }
          @keyframes heroSlideUp { to { opacity: 1; transform: translateY(0); } }
          .link-underline { position: relative; text-decoration: none; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .link-underline::before { content: ''; position: absolute; bottom: 0; left: -100%; width: 100%; height: 3px; background: currentColor; transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
          .link-underline:hover::before { left: 0; }
          .link-underline:hover { transform: translateY(-2px) scale(1.05); }
          .link-underline-beige { color: #F7EBD9; }
          .link-underline-orange { color: #FFB96B; }
        `}
      </style>

      <div className="min-h-screen bg-[#F7EBD9] text-[#0B0B0B] selection:bg-[#C81D25]/20 overflow-x-hidden">
        {/* HERO - ORIGINAL (UNCHANGED) */}
        <section className="relative w-full h-screen min-h[600px]">
          <div className="absolute inset-0">
            {slides.map((s, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${i === idx ? "opacity-100 scale-105" : "opacity-0 scale-100"
                  }`}
              >
                <img
                  src={s.src}
                  alt={s.alt}
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />


          <header className="absolute inset-x-0 top-0 z-50">
            <div className="flex items-center justify-between px-4 sm:px-6 py-8 sm:py-6">
              {/* Logo block: make it predictable on mobile */}
              <h1 className="font-lorange text-3xl sm:text-4xl md:text-5xl text-white drop-shadow-lg font-black flex items-center gap-3 whitespace-nowrap">
                <img
                  src={Logo}
                  alt="L'Orange Rose logo"
                  className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] shrink-0"
                  decoding="async"
                />
              </h1>

              {/* Desktop nav (unchanged behavior from md+) */}
              <nav className="hidden md:flex items-center gap-8">
                <LanguageDropdown />
                <Link to="menu" className="link-underline link-underline-beige text-xl font-medium">
                  {t("nav.menu")}
                </Link>
                <Link to="contact" className="link-underline link-underline-orange text-xl font-medium">
                  {t("nav.contact")}
                </Link>
                <Link to="gallery" className="link-underline link-underline-orange text-xl font-medium">
                  {t("nav.gallery")}
                </Link>
              </nav>

              {/* Mobile hamburger (only <md) */}
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center rounded-md bg-black/30 hover:bg-black/40 text-white w-10 h-10"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={22} />
              </button>
            </div>

            {/* Mobile menu sheet */}
            {mobileOpen && (
              <div className="md:hidden">
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40 bg-black/50"
                  onClick={() => setMobileOpen(false)}
                  aria-hidden="true"
                />
                {/* Panel */}
                <motion.div
                  initial={{ y: -24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -24, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0B]/95 backdrop-blur px-4 sm:px-6 pt-4 pb-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={Logo}
                        alt="L'Orange Rose logo"
                        className="h-10 w-auto"
                      />
                      <span className="font-legacy text-xl text-white/90">L&apos;Orange Rose</span>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-white w-10 h-10"
                      aria-label="Close menu"
                      onClick={() => setMobileOpen(false)}
                    >
                      <X size={22} />
                    </button>
                  </div>

                  {/* Links (touch-friendly) */}
                  <div className="mt-4 border-t border-white/10 pt-4 space-y-2">
                    <LanguageDropdown />
                    <Link
                      to="/menu"
                      className="block px-3 py-3 rounded-md text-lg text-[#F7EBD9] hover:bg-white/10"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t("nav.menu")}
                    </Link>
                    <Link
                      to="/contact"
                      className="block px-3 py-3 rounded-md text-lg text-[#F7EBD9] hover:bg-white/10"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t("nav.contact")}
                    </Link>
                    <Link
                      to="/gallery"
                      className="block px-3 py-3 rounded-md text-lg text-[#F7EBD9] hover:bg-white/10"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t("nav.gallery")}
                    </Link>
                  </div>
                </motion.div>
              </div>
            )}
          </header>

          {/* Hero content */}
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6 hero-content"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          >
            <h2 className="font-lorange text-4xl sm:text-5xl md:text-6xl lg:text-[6.5rem] leading-tight text-red-800 drop-shadow-2xl font-black whitespace-nowrap">
              L&apos;Orange Rose
            </h2>
            <p className="mt-6 text-white/90 text-xl md:text-2xl lg:text-6xl max-w-[65ch] font-light font-edo">
              {t("hero.tagline")}
            </p>
            {!USE_CHUNKY ? (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
                <Link to="/menu" className="link-underline link-underline-beige text-3xl md:text-4xl font-bold">
                  {t("hero.explore")}
                </Link>
              </div>
            ) : (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
                <Link to="/menu" className="btn-chunky btn-red">
                  {t("hero.explore")}
                </Link>
                <Link to="/contact" className="btn-chunky btn-ink">
                  Book Now
                </Link>
              </div>
            )}
          </div>
        </section>
        {/* Full-width divider line directly below carousel , something*/}
        <div className="mx-[calc(50%-50vw)] w-screen h-[1px] bg-[#4C0C27]" />

        {/* Announcements grid */}
        <SectionHeading>{t("announcements.title")}</SectionHeading>
        {(() => {
          // images first
          const rows = [...news].sort((a, b) => {
            const aImg = Boolean(a.mediaAssets?.[0]?.url);
            const bImg = Boolean(b.mediaAssets?.[0]?.url);
            return Number(bImg) - Number(aImg)
          });

          const isSingle = rows.length === 1;


          return (
            <div className="mt-10 px-4 sm:px-6 lg:px-8">
              {/* centered, two columns on md+, with slightly larger cards and tighter gaps */}
              <div className={`mx-auto max-w-5xl grid grid-cols-1 ${ isSingle ? "md:grid-cols-1" : "md:grid-cols-2" } gap-4 md:gap-5 justify-items-center`}>
                {rows.map((a) => {
                  const d = a._date!;
                  const day = new Intl.DateTimeFormat(localeTag, { day: "2-digit" }).format(d);
                  const mon = new Intl.DateTimeFormat(localeTag, { month: "short" }).format(d);

                  const hero = a.mediaAssets?.[0];
                  const hasImg = !!hero?.url;

                  

                  return (
                    <motion.article
                      key={a.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.35, ease: easeOutExpo }}
                      className="group relative w-full max-w-[29rem] overflow-hidden border border-[#4C0C27]/15 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all rounded-none"
                    >
                      {hasImg ? (
                        <>
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F7E9ED]">
                            <img
                              src={hero!.url}
                              alt={hero!.alt ?? ""}
                              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          </div>

                          {a.desc && (
                            <div className="p-3 md:p-4">
                              <p className="text-sm md:text-base text-[#4C0C27] leading-relaxed">{a.desc}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-4 md:p-5">

                          <h4 className="text-lg md:text-xl text-[#0B0B0B] leading-snug mb-1">{a.title}</h4>
                          {a.desc && <p className="text-sm md:text-base text-[#4C0C27] leading-relaxed">{a.desc}</p>}
                        </div>
                      )}
                    </motion.article>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ABOUT */}
        <section id="about" className="relative mx-auto max-w-6xl px-6 lg:px-8 py-24">
          <SectionHeading>{t("about.title")}</SectionHeading>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="mt-10 text-center max-w-4xl mx-auto"
          >
            <p className="text-2xl md:text-3xl lg:text-4xl leading-relaxed text-[#0B0B0B] font-light tracking-wide">
              {t("about.body")}
            </p>
            <div className="mt-12 w-32 h-px bg-gradient-to-r from-transparent via-[#C81D25] to-transparent mx-auto" />
          </motion.div>
        </section>

        {/* INFO / CTA */}
        <section id="info" className="bg-[#0B0B0B] text-[#F7EBD9]">
          <div className="mx-auto max-w-6xl px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <h3 className="font-legacy text-4xl md:text-5xl mb-6 tracking-wide">{t("info.visit")}</h3>
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#C81D25] to-transparent mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-14 text-center">
              <motion.a
                href="tel:+3281634100" // E.164 format for reliability
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, ease: easeOutExpo }}
                className="group block text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4C0C27]/40 rounded-xl"
                aria-label={`${t("info.call")}: 081 63 41 00`}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C81D25] mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#FFB96B]">
                  <Phone size={28} className="text-white" />
                </div>
                <h4 className="font-legacy text-2xl mb-4 tracking-wide">{t("info.call")}</h4>
                <span className="contact-link text-lg">081 / 63 41 00</span>
              </motion.a>

              <motion.a
                href="https://www.google.com/maps/place/L'Orange+Rose/@50.5900854,4.9100618,17z/data=!3m2!4b1!5s0x47c1759c40df2da7:0x883dd19e92984529!4m6!3m5!1s0x47c1759c4533df0b:0x63407f6c38127fbf!8m2!3d50.590082!4d4.9126367!16s%2Fg%2F1tfvgc7r?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, ease: easeOutExpo }}
                className="group block text-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4C0C27]/40"
                aria-label={`${t("info.viewOnMaps")} – L'Orange Rose`}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C81D25] mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#FFB96B]">
                  <MapPin size={28} className="text-white" />
                </div>
                <h4 className="font-legacy text-2xl mb-4 tracking-wide">{t("info.find")}</h4>
                <span className="contact-link text-lg">{t("info.viewOnMaps")}</span>
              </motion.a>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, ease: easeOutExpo }}
                className="group"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C81D25] mb-6 group-hover:scale-110 group-hover:bg-[#FFB96B] transition-all duration-300">
                  <Instagram size={28} className="text-white" />
                </div>
                <h4 className="font-legacy text-2xl mb-4 tracking-wide">{t("info.follow")}</h4>
                <div className="flex justify-center gap-8">
                  <a href="https://www.instagram.com/lorangerose/" className="contact-link text-lg">
                    {t("info.instagram")}
                  </a>
                  <a href="https://www.facebook.com/p/LOrange-Rose-100064241130233/" className="contact-link text-lg">
                    {t("info.facebook")}
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#4C0C27]/20 bg-[#F7EBD9] text-[#4C0C27]">
          <div className="mx-auto max-w-6xl px-6 lg:px-8 py-16 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <img src={Logo} alt="L'Orange Rose" className="h-12" />
              <span className="font-legacy text-2xl lg:text-3xl tracking-wide">L&apos;Orange Rose</span>
            </div>
            <p className="text-[#4C0C27]/70 text-sm lg:text-base font-light">
              © {new Date().getFullYear()} — {t("footer.tagline")}
            </p>
          </div>
        </footer>

        {/* Local styles for links */}
        <style>{`
          .contact-link { position: relative; color: #FFB96B; text-decoration: none; transition: color 0.3s ease; }
          .contact-link:hover { color: #C81D25; }
          .contact-link::after { content: ''; position: absolute; width: 0; height: 2px; bottom: -4px; left: 50%; background: #C81D25; transition: all 0.3s ease; transform: translateX(-50%); }
          .contact-link:hover::after { width: 100%; }
          @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(180deg); } }
        `}</style>
      </div>
    </>
  );
}
