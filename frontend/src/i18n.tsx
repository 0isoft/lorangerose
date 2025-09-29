import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Lang = "en" | "fr" | "nl";

type Messages = Record<string, any>;
type TFn = (key: string, vars?: Record<string, string | number>) => string;

const LOCALE_TAG: Record<Lang, string> = { en: "en-GB", fr: "fr-FR", nl: "nl-BE" };
const DIR: Record<Lang, "ltr" | "rtl"> = { en: "ltr", fr: "ltr", nl: "ltr" };

// Minimal nested message dictionaries
const MESSAGES: Record<Lang, Messages> = {
    en: {
        nav: { menu: "Menu", contact: "Contact", gallery: "Gallery", language: "Language" },
        hero: { tagline: "Asian Food", explore: "Explore Menu" },
        about: { title: "About Us", body: "A nice text, with nice long meandering phrases, descriptive, mesmerising, scintillating vocabulary. Tantalizing food and drinks." },
        info: {
            visit: "Visit Us",
            call: "Call Us",
            find: "Find Us",
            follow: "Follow Us",
            viewOnMaps: "View on Google Maps",
            instagram: "Instagram",
            facebook: "Facebook",
        },
        announcements: {
            title: "What's new",
        },
        contact: {
            nav: { home: "Home", menu: "Menu", gallery:"Gallery" },
            title: "Contact",
            reservations: "Reservations",
            callUsToBook: "Call us to book a table.",
            address: "Address",
            openInMaps: "Open in Google Maps",
            socials: "Socials",
            closuresTitle: "Closing days",
            legend: { lunch: "Lunch closed", dinner: "Dinner closed", all: "Closed" },
            listTitle: "Closures",
            none: "No closures recorded.",
            calPrevMonth: "Previous month",
            calNextMonth: "Next month",
            hours: {
                title: "Opening hours",
                note: "These are our regular hours. The calendar below lists exceptions (special closures or changes).",
                lunch: "Lunch",
                dinner: "Dinner",
                closed: "Closed",
                closedAllDay: "Closed all day",
            },
        },
        menu: {
            title: "Menu",
            loading: "Loading menu…",
            comingSoon: "Menu coming soon.",
            imageAlt: "L'Orange Rose menu",
          },
        
          footer: {
            privacy: "This site does not use cookies or collect personal data.",
            madeByPrefix: "© {year} {brand} -- website made with care by ",
          },
        aria: { openLangMenu: "Open language menu" },
        langNames: { en: "English", fr: "Français", nl: "Nederlands" },
    },
    fr: {
        nav: { menu: "Carte", contact: "Contact", gallery: "Galerie", language: "Langue" },
        hero: { tagline: "Asian food", explore: "Voir la carte" },
        about: { title: "À propos de nous", body: "Un beau texte avec de belles phrases sinueuses, descriptives et envoûtantes. Des mets et boissons irrésistibles." },
        info: {
            visit: "Venez nous voir",
            call: "Appelez-nous",
            find: "Trouvez-nous",
            follow: "Suivez-nous",
            viewOnMaps: "Voir sur Google Maps",
            instagram: "Instagram",
            facebook: "Facebook",
        },
        contact: {
            nav: { home: "Accueil", menu: "Carte", gallery:"Gallerie"  },
            title: "Contact",
            reservations: "Réservations",
            callUsToBook: "Appelez-nous pour réserver une table.",
            address: "Adresse",
            openInMaps: "Ouvrir dans Google Maps",
            socials: "Réseaux sociaux",
            closuresTitle: "Jours de fermeture",
            legend: { lunch: "Midi fermé", dinner: "Soir fermé", all: "Fermé" },
            listTitle: "Fermetures",
            none: "Aucune fermeture enregistrée.",
            calPrevMonth: "Mois précédent",
            calNextMonth: "Mois suivant",
            hours: {
                title: "Horaires",
                note: "Voici nos horaires habituels. Le calendrier ci-dessous liste les exceptions (fermetures ou changements).",
                lunch: "Midi",
                dinner: "Soir",
                closed: "Fermé",
                closedAllDay: "Fermé toute la journée",
            },
        },
        menu: {
            title: "Carte",                   
            loading: "Chargement de la carte…",
            comingSoon: "Carte à venir.",
            imageAlt: "Carte de L'Orange Rose",
          },
        
        announcements: {
            title: "Quoi de neuf",
        },
        footer: {
            privacy: "Ce site n’utilise pas de cookies et ne collecte pas de données personnelles.",
            madeByPrefix: "© {year} {brand} -- site réalisé avec soin par ",
          },
        aria: { openLangMenu: "Ouvrir le menu des langues" },
        langNames: { en: "English", fr: "Français", nl: "Nederlands" },
    },
    nl: {
        nav: { menu: "Menukaart", contact: "Contact", gallery: "Galerij", language: "Taal" },
        hero: { tagline: "Asian food", explore: "Ontdek het menukaart" },
        about: { title: "Over ons", body: "Een mooie tekst met lange meanderende zinnen, beeldend en betoverend. Verleidelijke gerechten en drankjes." },
        info: {
            visit: "Bezoek ons",
            call: "Bel ons",
            find: "Vind ons",
            follow: "Volg ons",
            viewOnMaps: "Bekijk op Google Maps",
            instagram: "Instagram",
            facebook: "Facebook",
        },
        announcements: {
            title: "Wat is er nieuw",
        },
        contact: {
            nav: { home: "Home", menu: "Menukaart", gallery: "Galerij"},
            title: "Contact",
            reservations: "Reservaties",
            callUsToBook: "Bel ons om een tafel te reserveren.",
            address: "Adres",
            openInMaps: "Openen in Google Maps",
            socials: "Sociale media",
            closuresTitle: "Sluitingsdagen",
            legend: { lunch: "Lunch gesloten", dinner: "Avond gesloten", all: "Gesloten" },
            listTitle: "Sluitingen",
            none: "Geen sluitingen geregistreerd.",
            calPrevMonth: "Vorige maand",
            calNextMonth: "Volgende maand",
            hours: {
                title: "Openingsuren",
                note: "Dit zijn onze vaste uren. De kalender hieronder toont uitzonderingen (bijzondere sluitingen of wijzigingen).",
                lunch: "Lunch",
                dinner: "Avond",
                closed: "Gesloten",
                closedAllDay: "Hele dag gesloten",
            },
        },

        menu: {
            title: "Menukaart",
            loading: "Menukaart laden…",
            comingSoon: "Menukaart binnenkort.",
            imageAlt: "Menukaart L'Orange Rose",
          },
        
          footer: {
            privacy: "Deze site gebruikt geen cookies en verzamelt geen persoonlijke gegevens.",
            madeByPrefix: "© {year} {brand} -- website met zorg gemaakt door ",
          },
        aria: { openLangMenu: "Taalmenu openen" },
        langNames: { en: "English", fr: "Français", nl: "Nederlands" },
    },
};

function get(obj: any, path: string): any {
    return path.split(".").reduce((o, k) => (o && k in o ? o[k] : undefined), obj);
}

function format(str: string, vars?: Record<string, string | number>) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`) as string);
}

type I18nCtx = {
    lang: Lang;
    localeTag: string;
    dir: "ltr" | "rtl";
    t: TFn;
    setLang: (l: Lang) => void;
};

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const initial: Lang = (() => {
        const q = new URLSearchParams(window.location.search).get("lang") as Lang | null;
        if (q && ["en", "fr", "nl"].includes(q)) return q;
        const stored = localStorage.getItem("lang") as Lang | null;
        if (stored && ["en", "fr", "nl"].includes(stored)) return stored;
        const nav = navigator.language.toLowerCase();
        if (nav.startsWith("fr")) return "fr";
        if (nav.startsWith("nl")) return "nl";
        return "en";
    })();

    const [lang, setLangState] = useState<Lang>(initial);

    const setLang = (l: Lang) => {
        setLangState(l);
        localStorage.setItem("lang", l);
    };

    const localeTag = LOCALE_TAG[lang];
    const dir = DIR[lang];

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = dir;
    }, [lang, dir]);

    const t: TFn = useMemo(() => {
        return (key, vars) => {
            const raw = get(MESSAGES[lang], key);
            if (typeof raw === "string") return format(raw, vars);
            // fallback to English if missing
            const rawEn = get(MESSAGES.en, key);
            return typeof rawEn === "string" ? format(rawEn, vars) : key;
        };
    }, [lang]);

    const value: I18nCtx = { lang, localeTag, dir, t, setLang };
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error("useI18n must be used within I18nProvider");
    return ctx;
}

export const __MESSAGES = MESSAGES;

