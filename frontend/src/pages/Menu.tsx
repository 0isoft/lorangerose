import { useEffect, useState } from "react";
import Logo from "/src/assets/essentials/orangerose_logo-removebg-preview.png";

function SectionHeading({
  children,
  compact = false,
}: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`mx-[calc(50%-50vw)] px-6 ${compact ? "py-6" : "py-16"} select-none`}>
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

// Matches your public /api/media response
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


export default function MenuPage() {
  const [images, setImages] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/media?type=MENU"); // defaults to 3 server-side
        const data: MediaAsset[] = await res.json();
        if (!alive) return;
        setImages([...data].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 3)); // front-end safety
      } catch {
        // leave empty on error
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7EBD9] text-[#0B0B0B]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F7EBD9]/95 backdrop-blur border-b border-[#4C0C27]/10">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src={Logo} alt="L'Orange Rose" className="h-8" />
            <span className="font-legacy text-xl tracking-wide">L'Orange Rose</span>
          </a>
          <nav className="hidden md:flex items-center gap-8">
            <a href="/" className="nav-link text-lg font-medium tracking-wide">Home</a>
            <a href="/gallery" className="nav-link text-lg font-medium tracking-wide">Gallery</a>
            <a href="/contact" className="nav-link text-lg font-medium tracking-wide">Contact</a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 lg:px-8 pt-4 pb-2">
        <SectionHeading compact>
          <h1 className="font-legacy text-3xl md:text-4xl tracking-wide">Menu</h1>
        </SectionHeading>
      </section>

      <main className="mx-auto max-w-6xl px-6 lg:px-8 pt-4 pb-12">
        {loading ? (
          <div className="rounded-3xl border border-[#4C0C27]/20 bg-white/70 p-8 text-center text-[#4C0C27]">
            Chargement du menu…
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-3xl border border-[#4C0C27]/20 bg-white/70 p-8 text-center text-[#4C0C27]">
            Menu à venir.
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
                  alt={m.alt ?? "Menu L'Orange Rose"}
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

