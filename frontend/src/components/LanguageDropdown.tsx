import { useEffect, useRef, useState } from "react";
import { useI18n } from ".././i18n";
import { ChevronDown } from "lucide-react";

const LANGS: Array<{ code: "en" | "fr" | "nl" }> = [
  { code: "en" }, { code: "fr" }, { code: "nl" }
];

export default function LanguageDropdown() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("aria.openLangMenu")}
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-2 text-xl font-medium link-underline link-underline-beige focus:outline-none focus:ring-2 focus:ring-[#FFB96B]/60 rounded-sm"
      >
        {t(`langNames.${lang}`)}
        <ChevronDown size={18} aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 mt-2 w-44 rounded-md border border-[#4C0C27]/20 bg-white shadow-lg overflow-hidden z-50"
        >
          {LANGS.map(({ code }) => (
            <li
              key={code}
              role="option"
              aria-selected={lang === code}
              tabIndex={0}
              onClick={() => { setLang(code); setOpen(false); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setLang(code); setOpen(false);
                }
              }}
              className={`px-4 py-2 cursor-pointer hover:bg-[#F7EBD9] ${
                lang === code ? "font-semibold" : ""
              }`}
            >
              {t(`langNames.${code}`)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
