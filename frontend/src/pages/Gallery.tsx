// src/pages/Gallery.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ArrowLeft, Instagram } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

/**
 * @file Gallery.tsx
 * @brief Renders the Lorange Rose "Gen-Z" gallery experience as a dynamic, responsive, hover-to-grow masonry grid.
 * 
 * @details
 * Gen‑Z gallery: vertical masonry with hover‑to‑grow that pushes neighbors,
 * subtle scroll reveals, and aspect‑aware sizing (portrait / landscape kept).
 *
 * @note
 * - Uses CSS Grid masonry technique (grid-auto-rows) with JS-measured spans.
 * - On hover we bump both row and column span (where space allows) so the card
 *   gets taller + a bit wider, physically pushing neighbors away.
 * - Keeps original layout ratios using natural image dimensions.
 */

/**
 * DEBUG mode (enables more error logging in dev)
 * @const {boolean}
 */
const DEBUG = import.meta.env.DEV;

/**
 * @typedef {Object} MediaAsset
 * @property {string} id - Unique asset id.
 * @property {"HERO"|"MENU"|string} type - Asset type identifier.
 * @property {string} url - Source image URL.
 * @property {string|null} alt - Alt text for accessibility.
 * @property {number} sortOrder - Sort order for display.
 * @property {boolean} published - Flag for published state.
 * @property {number|null|undefined} [width] - Optional natural width.
 * @property {number|null|undefined} [height] - Optional natural height.
 * @property {number|undefined} [_linkSortOrder] - Optional link sort order.
 */
export type MediaAsset = {
    id: string;
    type: "HERO" | "MENU" | string;
    url: string;
    alt: string | null;
    sortOrder: number;
    published: boolean;
    width?: number | null;
    height?: number | null;
    _linkSortOrder?: number;
};

/**
 * @constant {number} ROW - Base masonry row height, in px.
 */
const ROW = 8; // px — base masonry row height

/**
 * @constant {number} GAP - Gap between cards, in px.
 */
const GAP = 12; // px — gap between cards

/**
 * Gallery page component. Fetches media from API, renders a dynamic interactive masonry layout.
 * 
 * @component
 * @returns {JSX.Element}
 */
export default function Gallery() {
    const [items, setItems] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch("/api/gallery");
                const data: MediaAsset[] = res.ok ? await res.json() : [];
                if (!alive) return;
                const sorted = [...data]
                    .filter((d) => d.published !== false)
                    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
                setItems(sorted);
            } catch (e) {
                if (DEBUG) console.error("GALLERY fetch failed:", e);
                if (alive) setItems([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const columnsHint = useColumnsHint();

    return (
        <>
            <style>{css}</style>

            <main className="min-h-screen bg-[#0B0B0B] text-[#F7EBD9] overflow-x-hidden">
                {/* Sticky top with soft glass */}
                <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-[#0B0B0B]/30 bg-[#0B0B0B]/50 border-b border-white/10">
                    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2 link-underline text-[#F7EBD9]">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="text-sm font-medium">Back</span>
                        </Link>
                        <a
                            href="https://www.instagram.com/lorangerose/"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 link-underline text-[#F7EBD9]"
                        >
                            <Instagram className="h-5 w-5" />
                            <span className="text-sm font-medium">Follow the vibes</span>
                        </a>
                    </div>
                    {/* tiny scroll bar */}
                    <div className="h-[2px] w-full bg-white/10">
                        <ScrollProgress />
                    </div>
                </header>

                {/* Title */}
                <section className="relative overflow-hidden">
                    {/* moving gradient background */}
                    <div className="absolute inset-0 -z-10 opacity-40">
                        <div className="moving-gradient" />
                    </div>

                    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                        <motion.h1
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }}
                            className="font-lorange text-[11vw] leading-[0.9] sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-[#F7EBD9] select-none drop-shadow-[0_8px_30px_rgba(255,255,255,0.1)]"
                        >
                            Gallery
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", delay: 0.15 } }}
                            className="mt-4 max-w-3xl text-lg md:text-xl text-[#F7EBD9]/80"
                        >
                            
                        </motion.p>
                    </div>
                </section>

                {/* Masonry grid */}
                <section className="py-8 sm:py-10">
                    {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[#F7EBD9]/70">
                            Loading the vibes…
                        </motion.div>
                    )}

                    {!loading && items.length === 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center text-[#F7EBD9]/70">
                            Nothing here yet — check back soon.
                        </motion.div>
                    )}

                    {!loading && items.length > 0 && (
                        <div
                            className="masonry mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8"
                            style={{
                                gridAutoRows: `${ROW}px`,
                                gap: `${GAP}px`,
                                // expose column count to CSS
                                ['--cols' as any]: String(columnsHint),
                            }}
                        >
                            {items.map((asset) => (
                                <MasonryCard key={asset.id} asset={asset} columnsHint={columnsHint} />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}

/* ---------------- Components ---------------- */

/**
 * @function ScrollProgress
 * @description Renders a horizontal bar indicating scroll progress across the page. Uses window scroll position.
 * @returns {JSX.Element}
 */
function ScrollProgress() {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const onScroll = () => {
            const scrolled = window.scrollY;
            const max = document.body.scrollHeight - window.innerHeight;
            const p = max > 0 ? scrolled / max : 0;
            el.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return <div ref={ref} className="h-full origin-left bg-[#F7EBD9] transition-transform duration-100 will-change-transform" />;
}

/**
 * @function MasonryCard
 * @description
 * Renders a single card in the masonry grid, sizing itself according to the image aspect and adding
 * interactive hover effect (grow/push). Tracks its own column/row span dynamically for masonry packing.
 * 
 * @param {Object} props
 * @param {MediaAsset} props.asset - Asset data for this card.
 * @param {number} props.columnsHint - Number of columns in masonry layout (from parent).
 * @returns {JSX.Element}
 */
function MasonryCard({ asset, columnsHint }: { asset: MediaAsset; columnsHint: number }) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const canHover = useCanHover();
  
    const [spans, setSpans] = useState({
      baseRowSpan: 30,
      baseColSpan: 1,
      expandedRowSpan: 34,
      expandedColSpan: 1,
    });
    const [hovered, setHovered] = useState(false);
    const [loaded, setLoaded] = useState(false);
  
    // Track last known container width so we ignore height-only ResizeObserver events
    const lastWidthRef = useRef<number | null>(null);
  
    const EPS = 0.05; // avoids ceil thrash on DPR subpixels
  
    /**
     * Computes the optimal row/col span for the asset, considering natural image size and grid column/width.
     * Used to maintain aspect ratio and to expand contract on hover, in a way that pushes neighbors.
     * 
     * @returns {Object|null} Spans, or null if cannot compute.
     */
    const computeSpans = useCallback(() => {
      const wrap = wrapperRef.current;
      const img = imgRef.current;
      if (!wrap || !img) return null;
  
      const naturalW = (asset.width ?? img.naturalWidth) || 1;
      const naturalH = (asset.height ?? img.naturalHeight) || 1;
  
      const container = wrap.parentElement as HTMLElement | null;
      if (!container) return null;
  
      // Use *content* width (exclude padding) for exact track math
      const rectW = container.getBoundingClientRect().width;
      const cs = getComputedStyle(container);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const contentW = rectW - padX;
  
      const cols = Math.max(1, columnsHint);
      const colWidth = (contentW - GAP * (cols - 1)) / cols;
  
      const landscapeRatio = naturalW / naturalH;
      const baseColSpan = landscapeRatio > 1.35 && cols >= 4 ? 2 : 1;
  
      const baseRenderedW = colWidth * baseColSpan + GAP * (baseColSpan - 1);
      const baseRenderedH = (naturalH / naturalW) * baseRenderedW;
      const baseRowSpan = Math.max(10, Math.ceil(((baseRenderedH + GAP) - EPS) / (ROW + GAP)));
  
      const expandedColSpan = Math.min(3, baseColSpan + (cols >= 3 ? 1 : 0));
      const expRenderedW = colWidth * expandedColSpan + GAP * (expandedColSpan - 1);
      const expRenderedH = (naturalH / naturalW) * expRenderedW;
      const expandedRowSpan = Math.max(
        baseRowSpan,
        Math.ceil(((expRenderedH + GAP) - EPS) / (ROW + GAP))
      );
  
      return { baseRowSpan, baseColSpan, expandedRowSpan, expandedColSpan };
    }, [asset.width, asset.height, columnsHint]);
  
    /**
     * Recalculate spans, but freeze while hovered to avoid feedback loop.
     */
    const recalc = useCallback(() => {
      if (hovered) return; // freeze during hover
      const next = computeSpans();
      if (next) setSpans(next);
    }, [hovered, computeSpans]);
  
    // Initial calc
    useEffect(() => { recalc(); }, [recalc]);
  
    // Window resize → recalc (width likely changed)
    useEffect(() => {
      const onResize = () => recalc();
      window.addEventListener("resize", onResize, { passive: true });
      return () => window.removeEventListener("resize", onResize);
    }, [recalc]);
  
    // Observe the grid container, but only react to *width* changes
    useEffect(() => {
      const parent = wrapperRef.current?.parentElement;
      if (!parent) return;
  
      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        // contentRect.width is stable across height changes
        const w = entry.contentRect?.width ?? parent.getBoundingClientRect().width;
        if (lastWidthRef.current == null || Math.abs(w - lastWidthRef.current) > 0.5) {
          lastWidthRef.current = w;
          recalc();
        }
      });
  
      ro.observe(parent);
      return () => ro.disconnect();
    }, [recalc]);
  
    /**
     * Handler: On image load, mark as loaded and trigger repack.
     */
    const onImgLoad = useCallback(() => {
      setLoaded(true);
      recalc();
    }, [recalc]);
  
    /**
     * Force a single, clean repack on hover (prevents micro-thrash).
     * @param {HTMLElement} container The grid's parent container element.
     */
    function forcePack(container: HTMLElement) {
      const prev = container.style.gridAutoRows;
      container.style.gridAutoRows = `${ROW + 0.5}px`; // tiny, invisible nudge
      void container.offsetHeight; // layout flush
      container.style.gridAutoRows = prev;
    }
  
    /**
     * Handler: on pointer entering card.
     */
    const onEnter = () => {
      // Compute once for current width, then hover
      const next = computeSpans();
      if (next) setSpans(next);
      setHovered(true);
  
      const parent = wrapperRef.current?.parentElement as HTMLElement | null;
      if (parent) forcePack(parent);
    };
  
    /**
     * Handler: on pointer leaving card.
     */
    const onLeave = () => setHovered(false);
  
    /**
     * Should use hover/expanded spans (true if device can hover and we're hovered)
     */
    const useHoverSpans = canHover && hovered;
  
    return (
      <motion.div
        ref={wrapperRef}
        className="masonry-item group relative"
        style={{
          gridRowEnd: `span ${useHoverSpans ? spans.expandedRowSpan : spans.baseRowSpan}`,
          gridColumnEnd: `span ${useHoverSpans ? spans.expandedColSpan : spans.baseColSpan}`,
        }}
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <div className="card-inner">
          <img
            ref={imgRef}
            src={asset.url}
            alt={asset.alt ?? ""}
            loading="lazy"
            decoding="async"
            onLoad={onImgLoad}
            className="block w-full h-auto select-none"
          />
  
          
        </div>
  
        <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 group-hover:ring-white/30 transition-all duration-300" />
        <div className="absolute inset-0 -z-10 rounded-2xl shadow-[0_15px_50px_rgba(247,235,217,0.06)] group-hover:shadow-[0_25px_70px_rgba(247,235,217,0.14)] transition-shadow duration-300" />
        {!loaded && <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/5" />}
      </motion.div>
    );
  }
  
/**
 * @function useCanHover
 * @description Determines if the current device supports hover (e.g. desktop mice) and returns a boolean. Internally reacts to media query for pointer: fine and hover: hover.
 * @returns {boolean}
 */
function useCanHover() {
    const [canHover, setCanHover] = useState<boolean>(false);
    useEffect(() => {
        const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
        const update = () => setCanHover(mq.matches);
        update();
        mq.addEventListener?.('change', update);
        return () => mq.removeEventListener?.('change', update);
    }, []);
    return canHover;
}

/* ---------------- Hooks & helpers ---------------- */

/**
 * @function useColumnsHint
 * @description Determines ideal column count for the current window size and returns it, updating on window resize.
 * Breakpoints: <640px=2, <960px=3, <1280px=4, else=5 columns.
 * @returns {number}
 */
function useColumnsHint() {
    const [cols, setCols] = useState(1);
    useEffect(() => {
        const calc = () => {
            const w = window.innerWidth;
            if (w < 640) setCols(2);
            else if (w < 960) setCols(3);
            else if (w < 1280) setCols(4);
            else setCols(5);
        };
        calc();
        window.addEventListener("resize", calc);
        return () => window.removeEventListener("resize", calc);
    }, []);
    return cols;
}

/* ---------------- Page CSS ---------------- */

/**
 * @constant {string} css
 * @description Embedded global CSS for the gallery experience (font, grid, masonry appearance, gradient bg, etc.)
 */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&display=swap');

.font-lorange { 
  font-family: 'Cinzel Decorative', serif; 
  font-weight: 700;
}

.link-underline { 
  position: relative; 
  text-decoration: none; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
}
.link-underline::before { 
  content: ''; 
  position: absolute; 
  bottom: -2px; 
  left: 0; 
  width: 0; 
  height: 2px; 
  background: currentColor; 
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
}
.link-underline:hover::before { width: 100%; }

/* swirling header bg */
.moving-gradient {
  width: 140%;
  height: 140%;
  position: absolute;
  left: -20%;
  top: -20%;
  background: radial-gradient(1200px 700px at 20% 30%, rgba(255, 90, 31, .15), transparent 60%),
              radial-gradient(900px 600px at 70% 20%, rgba(255, 228, 166, .20), transparent 60%),
              radial-gradient(800px 800px at 50% 80%, rgba(255, 150, 222, .12), transparent 60%);
  filter: blur(20px);
  animation: floaty 24s ease-in-out infinite alternate;
}
@keyframes floaty { from { transform: translate3d(-2%, -1%, 0) rotate(-1deg); } to { transform: translate3d(2%, 1%, 0) rotate(1deg); } }

/* Masonry grid */
.masonry {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
}
.masonry-item {
    position: relative;
    contain: paint; /* was: contain: layout paint; */
    transition: transform .25s cubic-bezier(.22,.61,.36,1), box-shadow .25s, filter .25s;
  }
.masonry-item .card-inner {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  backdrop-filter: blur(0px);
}
.masonry-item:hover { transform: translateY(-4px); }

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .masonry-item, .moving-gradient { animation: none !important; transition: none !important; }
}
`;
