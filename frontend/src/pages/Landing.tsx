import { useEffect, useMemo, useState } from "react";
import { Phone, MapPin, Instagram } from "lucide-react";
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
    <div className="mx-[calc(50%-50vw)] px-6 py-16 select-none">
      <div className="flex w-screen items-center gap-6">
        <span aria-hidden className="h-[4px] flex-1 bg-[#4C0C27]" />
        <h3 className="font-legacy shrink-0 px-8 text-4xl md:text-5xl lg:text-6xl text-[#0B0B0B] tracking-wide">
          {children}
        </h3>
        <span aria-hidden className="h-[4px] flex-1 bg-[#4C0C27]" />
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
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  i === idx ? "opacity-100 scale-105" : "opacity-0 scale-100"
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

          {/* Header */}
          <header className="absolute inset-x-0 top-0 z-50">
            <div className="flex items-center justify-between px-6 py-6">
              <h1 className="font-lorange text-4xl md:text-5xl text-white drop-shadow-lg font-black flex items-center gap-3 whitespace-nowrap">
                <img
                  src={Logo}
                  alt="L'Orange Rose logo"
                  className="h-8 md:h-20 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
                  decoding="async"
                />
              </h1>
              <nav className="hidden md:flex items-center gap-8">
                {/* Language dropdown to the LEFT of Menu */}
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
            </div>
          </header>

          {/* Hero content */}
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6 hero-content"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          >
            <h2 className="font-lorange text-5xl md:text-7xl lg:text-[6.5rem] leading-tight text-red-800 drop-shadow-2xl font-black whitespace-nowrap">
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
            return Number(bImg) - Number(aImg);
          });

          return (
            <div className="mt-10 px-4 sm:px-6 lg:px-8">
              {/* centered, two columns on md+, with slightly larger cards and tighter gaps */}
              <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 justify-items-center">
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
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, ease: easeOutExpo }}
                className="group"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C81D25] mb-6 group-hover:scale-110 group-hover:bg-[#FFB96B] transition-all duration-300">
                  <Phone size={28} className="text-white" />
                </div>
                <h4 className="font-legacy text-2xl mb-4 tracking-wide">{t("info.call")}</h4>
                <a href="tel:+3212345678" className="contact-link text-lg">
                  +32 12 34 56 78
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, ease: easeOutExpo }}
                className="group"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C81D25] mb-6 group-hover:scale-110 group-hover:bg-[#FFB96B] transition-all duration-300">
                  <MapPin size={28} className="text-white" />
                </div>
                <h4 className="font-legacy text-2xl mb-4 tracking-wide">{t("info.find")}</h4>
                <a target="_blank" rel="noreferrer" href="https://maps.google.com" className="contact-link text-lg">
                  {t("info.viewOnMaps")}
                </a>
              </motion.div>

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
                  <a href="#" className="contact-link text-lg">
                    {t("info.instagram")}
                  </a>
                  <a href="#" className="contact-link text-lg">
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
