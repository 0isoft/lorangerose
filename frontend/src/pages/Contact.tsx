import { useEffect, useMemo, useState } from "react";
import { Instagram, Facebook } from "lucide-react";
import Logo from "@/assets/essentials/orangerose_logo-removebg-preview.png";
import { useI18n } from "../i18n";
import LanguageDropdown from "../components/LanguageDropdown";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";


// Brand: red #C81D25, beige #F7EBD9, line #4C0C27, light orange #FFB96B
type Slot = "all" | "lunch" | "dinner";

// What the backend returns
type BackendSlot = "ALL" | "LUNCH" | "DINNER";
type BackendClosure = {
  id: string;
  date: string;      // ISO DateTime from API
  slot: BackendSlot; // enum from DB
  note?: string | null;
};

/**
 * @typedef {"ALL" | "LUNCH" | "DINNER"} BackendSlot
 * BackendSlot represents slot values returned from the backend API.
 */

/**
 * @typedef {Object} BackendClosure
 * @property {string} id - Unique identifier for the closure.
 * @property {string} date - ISO DateTime string representing the date of closure.
 * @property {BackendSlot} slot - Enum from database specifying slot of closure.
 * @property {string | null} [note] - Optional note regarding closure.
 */

/**
 * Converts a backend slot value into a frontend Slot string.
 * @param {BackendSlot} s - The slot as returned from the backend.
 * @returns {Slot} Corresponding frontend slot value.
 */
function toFrontendSlot(s: BackendSlot): Slot {
  if (s === "LUNCH") return "lunch";
  if (s === "DINNER") return "dinner";
  return "all"; // "ALL"
}

/**
 * Converts an ISO DateTime string or Date object to an ISO date string (YYYY-MM-DD).
 * @param {string | Date} d - Source date (as string or Date object).
 * @returns {string} ISO date string (YYYY-MM-DD).
 */
function isoDateFromDateTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Displays a decorative section heading.
 * @param {object} props
 * @param {React.ReactNode} props.children - The heading content to render.
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

/* ---------- Page ---------- */

/**
 * Main contact page for L'Orange Rose.
 * Presents contact info, menu navigation, hours, and closures calendar.
 * @component
 * @returns {JSX.Element}
 */
export default function ContactPage() {
  const { t, lang, localeTag } = useI18n() as any;

  const [mobileOpen, setMobileOpen] = useState(false);

  // lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (import.meta.env.DEV) {
    console.log("[Contact] lang =", lang, "localeTag =", localeTag);
    // Prove we’re seeing the right dictionary:
    // @ts-ignore
    console.log("[Contact] has contact keys?", t("contact.title"), t("contact.reservations"), t("contact.listTitle"));
  }
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

    {/* Desktop nav (unchanged) */}
    <nav className="hidden md:flex items-center gap-8">
      <LanguageDropdown />
      <a href="/" className="nav-link text-lg font-medium tracking-wide">{t("contact.nav.home")}</a>
      <a href="/gallery" className="nav-link text-lg font-medium tracking-wide">{t("nav.gallery")}</a>
      <a href="/menu" className="nav-link text-lg font-medium tracking-wide">{t("contact.nav.menu")}</a>
    </nav>

    {/* Mobile hamburger */}
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
            <div className="py-2">
              <LanguageDropdown />
            </div>
            <a
              href="/menu"
              className="block px-3 py-3 rounded-md text-lg hover:bg-[#4C0C27]/5"
              onClick={() => setMobileOpen(false)}
            >
              {t("contact.nav.menu")}
            </a>
            <a
              href="/gallery"
              className="block px-3 py-3 rounded-md text-lg hover:bg-[#4C0C27]/5"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.gallery")}
            </a>
            <a
              href="/"
              className="block px-3 py-3 rounded-md text-lg hover:bg-[#4C0C27]/5"
              onClick={() => setMobileOpen(false)}
            >
              {t("contact.nav.home")}
            </a>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
</header>

      {/* Contact blocks */}


      <section className="mx-auto max-w-6xl px-6 lg:px-8 pt-6 pb-4">
        <section className="mx-auto max-w-6xl px-6 lg:px-8 pt-4 pb-2">
          <SectionHeading >
            <h1 className="font-legacy text-3xl md:text-4xl tracking-wide">Contact</h1>
          </SectionHeading>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Phone */}
          <div className="rounded-2xl border border-[#4C0C27]/20 bg-white/70 p-6">
            <h4 className="font-legacy text-2xl tracking-wide mb-2">{t("contact.reservations")}</h4>
            <a href="tel:+3281634100" className="text-[#C81D25] text-xl font-semibold">
              081 / 63 41 00
            </a>
            <p className="text-[#4C0C27] mt-2 text-sm">{t("contact.callUsToBook")}</p>
          </div>

          {/* Address */}
          <div className="rounded-2xl border border-[#4C0C27]/20 bg-white/70 p-6">
            <h4 className="font-legacy text-2xl tracking-wide mb-2">{t("contact.address")}</h4>
            <p className="text-lg">Chaussée de Namur 19, 5310 Éghezée</p>
            <a
              className="inline-block mt-2 text-[#C81D25] hover:text-[#FFB96B] transition"
              href="https://www.google.com/maps/place/L'Orange+Rose/@50.5900854,4.9100618,17z/data=!3m2!4b1!5s0x47c1759c40df2da7:0x883dd19e92984529!4m6!3m5!1s0x47c1759c4533df0b:0x63407f6c38127fbf!8m2!3d50.590082!4d4.9126367!16s%2Fg%2F1tfvgc7r?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noreferrer"
            >
              {t("contact.openInMaps")}
            </a>
          </div>

          {/* Socials */}
          <div className="rounded-2xl border border-[#4C0C27]/20 bg-white/70 p-6">
            <h4 className="font-legacy text-2xl tracking-wide mb-2">{t("contact.socials")}</h4>
            <div className="flex gap-6">
              <a
                href="https://www.instagram.com/lorangerose/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-lg text-[#0B0B0B] hover:text-[#C81D25] transition"
              >
                <Instagram className="h-5 w-5 text-[#C81D25]" aria-hidden />
                <span>Instagram</span>
              </a>
              <a
                href="https://www.facebook.com/p/LOrange-Rose-100064241130233/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-lg text-[#0B0B0B] hover:text-[#C81D25] transition"
              >
                <Facebook className="h-5 w-5 text-[#1877F2]" aria-hidden />
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Hours / Horaire (insert this block between Contact blocks and Closures) ---- */}
      <section className="mx-auto max-w-6xl px-6 lg:px-8 py-8">
        <HoursSection />
      </section>

      {/* Read-only Closures */}
      <section className="mx-auto max-w-6xl px-6 lg:px-8 py-8">
        <h5 className="font-legacy text-2xl md:text-4xl tracking-wide mb-4">
          {t("contact.closuresTitle")}
        </h5>
        <ReadOnlyClosuresCalendar />
      </section>

      {/* Footer */}
      <footer className="border-t border-[#4C0C27]/20 bg-[#F7EBD9] text-[#4C0C27]">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 py-10 flex items-center justify-between">
          <span className="font-legacy text-xl">L&apos;Orange Rose</span>
          <span className="text-[#4C0C27]/70 text-sm">© {new Date().getFullYear()}</span>
        </div>
      </footer>

      {/* Local link styles */}
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
      `}</style>
    </div>
  );
}

/* ---------- Read-only Calendar ---------- */

/**
 * Displays operating hours in a table for each weekday.
 * Fetches from `/api/hours`.
 * @component
 * @returns {JSX.Element}
 */
function HoursSection() {
  const { t, localeTag } = useI18n();

  /**
   * @typedef {Object} PublicRow
   * @property {number} weekday - 0 = Monday, ..., 6 = Sunday
   * @property {string} text - The hours text for the weekday
   */
  type PublicRow = { weekday: number; text: string };

  const [hours, setHours] = useState<PublicRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/hours");
        if (!r.ok) throw new Error("fetch hours failed");
        const data: PublicRow[] = await r.json();
        if (!alive) return;

        const map = new Map<number, string>(data.map(d => [d.weekday, d.text]));
        const normalized: PublicRow[] = Array.from({ length: 7 }, (_, i) =>
          ({ weekday: i, text: map.get(i) ?? "" })
        );
        setHours(normalized);
      } catch (e) {
        console.warn("[Hours] failed:", e);
        if (alive) setHours(null);
      }
    })();
    return () => { alive = false; };
  }, []);


  //enforce capitalization on weekdays
  const weekdayLabels = useMemo(() => {
    const base = new Date(2020, 5, 1); 
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base); d.setDate(base.getDate() + i);
      const label = new Intl.DateTimeFormat(localeTag, { weekday: "long" }).format(d);
      return label.charAt(0).toUpperCase() + label.slice(1);
    });
  }, [localeTag]);

  const rows = hours ?? Array.from({ length: 7 }, (_, i) => ({ weekday: i, text: "" }));

  return (
    <div className="rounded-2xl border border-[#4C0C27]/20 bg-white/70 p-4 md:p-6">
      <h5 className="font-legacy text-2xl md:text-4xl tracking-wide mb-4">
        {t("contact.hours.title")}
      </h5>

      <div className="overflow-x-auto">
        <table className="w-full text-sm md:text-base">
          <thead>
            <tr className="text-left text-[#4C0C27]">
              <th className="p-2 w-1/3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const label = weekdayLabels[r.weekday];
              const text = r.text?.trim() || t("contact.hours.closedAllDay");
              return (
                <tr key={r.weekday} className="border-t border-[#4C0C27]/10">
                  <td className="p-2 font-medium">{label}</td>
                  <td className="p-2">{text}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-[#4C0C27]">
        {t("contact.hours.note")}
      </p>
    </div>
  );
}

/**
 * Read-only calendar showing closure days of the restaurant.
 * Fetches from `/api/closures` and color-codes accordingly.
 * @component
 * @returns {JSX.Element}
 */
function ReadOnlyClosuresCalendar() {
  const { t, localeTag } = useI18n();
  const [refDate, setRefDate] = useState(startOfMonth(new Date()));

  // NEW: keep slot + kind per day
  /**
   * @typedef {"all" | "lunch" | "dinner"} Slot
   * @typedef {"EXCEPTIONAL" | "RECURRING" | "OTHER"} Kind
   * @typedef {Object} DayEntry
   * @property {Slot} slot
   * @property {Kind} kind
   */
  type Slot = "all" | "lunch" | "dinner";
  type Kind = "EXCEPTIONAL" | "RECURRING" | "OTHER";
  type DayEntry = { slot: Slot; kind: Kind };

  const [closures, setClosures] = useState<Record<string, DayEntry>>({});

  /**
   * Returns a numeric rank for a Slot to compare slot breadth.
   * @param {Slot} s
   * @returns {number}
   */
  const slotRank = (s: Slot) => (s === "all" ? 3 : s === "dinner" ? 2 : 1);
  /**
   * Returns a numeric rank for a Kind to compare kind precedence.
   * @param {Kind} k
   * @returns {number}
   */
  const kindRank = (k: Kind) => (k === "EXCEPTIONAL" ? 3 : k === "RECURRING" ? 2 : 1);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/closures");
        const data: Array<{
          id: string;
          date: string | Date;
          slot: "ALL" | "LUNCH" | "DINNER";
          note?: string | null;
          kind?: "EXCEPTIONAL" | "RECURRING";
        }> = await res.json();
        if (!alive) return;

        const map = new Map<string, DayEntry>();

        for (const c of data) {
          const iso = isoDateFromDateTime(c.date);
          const slot: Slot = c.slot === "ALL" ? "all" : c.slot === "LUNCH" ? "lunch" : "dinner";
          // if backend doesn't send kind yet, infer from id
          const kind: Kind = c.kind ?? (c.id.startsWith("rec_") ? "RECURRING" : "EXCEPTIONAL");

          const incoming: DayEntry = { slot, kind };
          const prev = map.get(iso);

          if (!prev) {
            map.set(iso, incoming);
          } else {
            // precedence: EXCEPTIONAL > RECURRING; tie-break with slot breadth
            if (kindRank(incoming.kind) > kindRank(prev.kind)) {
              map.set(iso, incoming);
            } else if (kindRank(incoming.kind) === kindRank(prev.kind)) {
              map.set(iso, slotRank(incoming.slot) >= slotRank(prev.slot) ? incoming : prev);
            }
          }
        }

        setClosures(Object.fromEntries(map));
      } catch {
        // keep empty on error
      }
    })();
    return () => { alive = false; };
  }, []);

  const weeks = useMemo(() => buildCalendar(refDate), [refDate]);

  // Weekday header (unchanged)
  const weekdayLabels = useMemo(() => {
    const base = new Date(2020, 5, 1); // Mon Jun 1, 2020
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return new Intl.DateTimeFormat(localeTag, { weekday: "short" }).format(d);
    });
  }, [localeTag]);

  return (
    <div className="rounded-2xl border border-[#4C0C27]/20 bg:white/70 bg-white/70 p-3 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <button
            className="px-2.5 py-1 rounded-lg border border-[#4C0C27]/30 hover:bg-white transition text-sm"
            onClick={() => setRefDate(addMonths(refDate, -1))}
            aria-label={t("contact.calPrevMonth")}
          >
            ←
          </button>
          <div className="font-legacy text-lg md:text-xl tracking-wide">
            {refDate.toLocaleDateString(localeTag, { month: "long", year: "numeric" })}
          </div>
          <button
            className="px-2.5 py-1 rounded-lg border border-[#4C0C27]/30 hover:bg-white transition text-sm"
            onClick={() => setRefDate(addMonths(refDate, 1))}
            aria-label={t("contact.calNextMonth")}
          >
            →
          </button>
        </div>

        {/* NEW legend (French only, simple) */}
        <div className="hidden md:flex items-center gap-4 text-sm text-[#4C0C27]">
          <LegendSwatch color="#A26BF5" label="Fermé toute la journée" />
          <LegendSwatch color="#FFB96B" label="Fermé à midi" />
          <LegendSwatch color="#4C0C27" label="Fermé" />
          {/* Intentionally no legend for 'autres' (gris) */}
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 text-center text-[10px] md:text-sm">
        {weekdayLabels.map((d, i) => (
          <div key={i} className="py-1 md:py-2 font-semibold text-[#4C0C27]">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 text-center">
        {weeks.flat().map((cell, idx) => {
          const iso = cell?.iso;
          const entry = iso ? closures[iso] : undefined;
          const isOtherMonth = cell && cell.date.getMonth() !== refDate.getMonth();

          return (
            <div
              key={cell ? iso : `empty-${idx}`}
              className={`relative border border-[#4C0C27]/10
                          ${isOtherMonth ? "bg-white/40 text-[#4C0C27]/50" : "bg-white/80 text-[#0B0B0B]"}
                          ${entry ? "font-semibold" : ""} transition`}
              style={{ aspectRatio: "1 / 1", padding: "2px" }}
            >
              {cell && (
                <>
                  <span className="absolute top-1 left-1 text-[10px] md:text-xs">
                    {cell.date.toLocaleDateString(localeTag, { day: "2-digit" })}
                  </span>
                  {entry && (
                    <span
                      className="absolute left-1 right-1 bottom-1 rounded"
                      style={{ height: "70%", backgroundColor: dayColor(entry.kind, entry.slot) }}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile legend */}
      <div className="mt-3 flex md:hidden items-center gap-3 justify-center text-[11px] text-[#4C0C27]">
        <LegendSwatch color="#A26BF5" label="Récurrent (toute la journée)" />
        <LegendSwatch color="#FFB96B" label="Récurrent (midi)" />
        <LegendSwatch color="#4C0C27" label="Exceptionnelle" />
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

/**
 * Returns color for a calendar day based on kind and slot.
 * 'Other' stays unlisted in legend.
 * @param {"EXCEPTIONAL" | "RECURRING" | "OTHER"} kind
 * @param {"all" | "lunch" | "dinner"} slot
 * @returns {string} Hex color string
 */
function dayColor(kind: "EXCEPTIONAL" | "RECURRING" | "OTHER", slot: "all" | "lunch" | "dinner") {
  if (kind === "EXCEPTIONAL") return "#4C0C27";      // Exceptionnelle
  if (kind === "RECURRING") {
    if (slot === "all")   return "#A26BF5";          // Récurrent – toute la journée
    if (slot === "lunch") return "#FFB96B";          // Récurrent – midi
    // dinner or anything else = 'autres'
    return "#9CA3AF";                                // Autres (gris, non listé)
  }
  return "#9CA3AF";                                  // OTHER fallback
}

// ...startOfMonth, addMonths, toISODate, formatISOToDisplay, buildCalendar unchanged

/* ---------- helpers ---------- */

/**
 * Swatch label for legend. Displays color and description.
 * @param {object} props
 * @param {string} props.color - Hex color string for the swatch.
 * @param {string} props.label - Description label for the swatch.
 * @returns {JSX.Element}
 */
function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-4 md:h-2.5 md:w-5 rounded" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

/**
 * Returns a representative hex color for a slot.
 * @param {Slot} slot
 * @returns {string}
 */
function slotColor(slot: Slot): string {
  if (slot === "lunch") return "#FFB96B";
  if (slot === "dinner") return "#C81D25";
  return "#4C0C27";
}

/**
 * Returns the slot label using t for i18n.
 * @param {Slot} slot
 * @param {(k: string) => string} t - translation function
 * @returns {string}
 */
function slotLabel(slot: Slot, t: (k: string) => string): string {
  if (slot === "lunch") return t("contact.legend.lunch");
  if (slot === "dinner") return t("contact.legend.dinner");
  return `${t("contact.legend.all")} (${/* all-day clarifier */ ""})`;
}

/**
 * Returns a new Date representing the first of the month.
 * @param {Date} d - Source date.
 * @returns {Date}
 */
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Returns a new Date shifted by delta months.
 * @param {Date} d - Source date.
 * @param {number} delta - Number of months to add (can be negative).
 * @returns {Date}
 */
function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

/**
 * Converts a Date to ISO date string (YYYY-MM-DD).
 * @param {Date} d
 * @returns {string}
 */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Formats ISO string to localized display string.
 * @param {string} iso - ISO date string (YYYY-MM-DD).
 * @param {string} localeTag - i18n locale.
 * @returns {string}
 */
function formatISOToDisplay(iso: string, localeTag: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(localeTag, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Builds a 6x7 array for the weeks of a month with null pads.
 * Each cell is either {date, iso} or null.
 * @param {Date} ref - Any date in the target month.
 * @returns {Array<Array<{date: Date, iso: string} | null>>} 2D array of calendar weeks
 */
function buildCalendar(ref: Date): Array<Array<{ date: Date; iso: string } | null>> {
  const first = startOfMonth(ref);
  const firstWeekday = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();

  const cells: Array<{ date: Date; iso: string } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(first.getFullYear(), first.getMonth(), d);
    cells.push({ date, iso: toISODate(date) });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);

  const weeks: Array<Array<{ date: Date; iso: string } | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
