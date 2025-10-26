/**
 * @file LanguageDropdown.tsx
 * @brief Language dropdown/select component for changing UI language.
 * @details
 *   - Displays the current language, and allows switching ("en", "fr", "nl") via dropdown.
 *   - Handles clicks outside dropdown and Esc to close menu.
 *   - Keyboard accessible; options selectable with Enter or Space.
 *   - Uses i18n context for current language and text.
 */

import { useEffect, useRef, useState } from "react";
import { useI18n } from ".././i18n";
import { ChevronDown } from "lucide-react";

/**
 * @var LANGS
 * @brief Array of available language codes for UI selection.
 */
const LANGS: Array<{ code: "en" | "fr" | "nl" }> = [
  { code: "en" }, { code: "fr" }, { code: "nl" }
];

/**
 * @component LanguageDropdown
 * @brief Dropdown for selecting UI language.
 * @returns {JSX.Element} Language selection dropdown.
 *
 * @details
 * - Uses useI18n() for current lang and setter.
 * - Menu closes on outside click or Escape key.
 * - Selected language is highlighted and accessible by keyboard.
 */
export default function LanguageDropdown() {
  /**
   * @var lang Current language code
   * @var setLang Function to set the language
   * @var t Function to translate text keys
   */
  const { lang, setLang, t } = useI18n();

  /**
   * @var open
   * @brief State to control dropdown open/close.
   */
  const [open, setOpen] = useState(false);

  /**
   * @var ref
   * @brief Ref to the dropdown root for click outside detection.
   */
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /**
     * @brief Handles document clicks to close menu when clicking outside.
     * @param e MouseEvent
     */
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    /**
     * @brief Handles Escape key to close dropdown.
     * @param e KeyboardEvent
     */
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
              /**
               * @brief Handler for clicking a language option.
               */
              onClick={() => { setLang(code); setOpen(false); }}
              /**
               * @brief Handler for selecting option via keyboard.
               * @param e KeyboardEvent
               */
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
