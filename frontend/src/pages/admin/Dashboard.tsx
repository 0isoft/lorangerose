// src/pages/admin/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseAPIDate, fmtDate } from "../../lib/date";
import dayjs from "dayjs";

import {
    LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend,
  } from "recharts";

  
/** ---------- Shared types ---------- */
type MediaType = "HERO" | "MENU" | "ANNOUNCEMENT";
type MediaAsset = {
    id: string;
    type: string;
    url: string;
    alt: string | null;
    width?: number | null;
    height?: number | null;
    sortOrder: number;
    published: boolean;
    _linkSortOrder?: number;
};
type Announcement = {
    id: string;
    date: string; // ISO
    title: string;
    desc?: string | null;
    published: boolean;
    mediaAssets: MediaAsset[];
};
type Slot = "ALL" | "LUNCH" | "DINNER";
type Closure = {
    id: string;
    date: string; // ISO DateTime
    slot: Slot;
    note?: string | null;
};

async function uploadImage(file: File): Promise<MediaAsset> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "ANNOUNCEMENT");
    fd.append("alt", file.name);
    const r = await fetch("/api/admin/media", {
        method: "POST",
        credentials: "include",
        body: fd,
    });
    if (!r.ok) {
        const msg = await r.text().catch(() => "");
        throw new Error(`Upload failed: ${r.status} ${msg}`);
    }
    return r.json();
}
const EU_LANG = "fr-BE";

/** =========================================
 *  DASHBOARD WRAPPER (with sidebar)
 *  ========================================= */
type SectionKey = "carousel" | "announcements" | "schedule" | "gallery" | "menu" | "analytics";

const SECTIONS: { key: SectionKey; label: string }[] = [
    { key: "carousel", label: "Carrousel" },
    { key: "announcements", label: "Annonces" },
    { key: "schedule", label: "Horaires & Fermetures" },
    { key: "gallery", label: "Galerie" },
    { key: "menu", label: "Image du menu" },
    { key: "analytics", label: "Analytics" },
];

export default function AdminDashboard() {
    const nav = useNavigate();
    const [active, setActive] = useState<SectionKey>("carousel");

    async function logout() {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        nav("/admin/login", { replace: true });
    }

    return (
        <div className="min-h-screen bg-[#F7EBD9] text-[#0B0B0B]">
            <header className="sticky top-0 z-40 bg-[#F7EBD9]/95 backdrop-blur border-b border-[#4C0C27]/10">
                <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
                    <div className="font-legacy text-xl">Tableau de bord</div>
                    <button
                        onClick={logout}
                        className="px-3 py-1.5 rounded border border-[#4C0C27]/30 hover:bg-white"
                    >
                        Se déconnecter
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-8">
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <aside className="col-span-12 md:col-span-3">
                        <div className="md:sticky md:top-20">
                            <SidebarNav active={active} onSelect={setActive} />
                        </div>
                    </aside>

                    {/* Content well */}
                    <section className="col-span-12 md:col-span-9 space-y-10">
                        {/* Keep all sections mounted to preserve form state; toggle visibility with CSS */}
                        <div className={active === "carousel" ? "" : "hidden"}>
                            <HeroCarouselManager />
                        </div>

                        <div className={active === "announcements" ? "" : "hidden"}>
                            <AnnouncementsManager />
                        </div>

                        <div className={active === "schedule" ? "" : "hidden"}>
                            <SchedulePanel />
                        </div>

                        <div className={active === "gallery" ? "" : "hidden"}>
                            <GalleryManager />
                        </div>

                        <div className={active === "menu" ? "" : "hidden"}>
                            <MenuManager />
                        </div>

                        <div className={active === "analytics" ? "" : "hidden"}>
                            <AnalyticsPanel />
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

/** ---------- Sidebar component ---------- */
function SidebarNav({
    active,
    onSelect,
}: {
    active: SectionKey;
    onSelect: (k: SectionKey) => void;
}) {
    return (
        <nav
            aria-label="Sections du tableau de bord"
            className="rounded-2xl border border-[#4C0C27]/20 bg-white/80 p-2"
        >
            <ul className="space-y-1">
                {SECTIONS.map((s) => {
                    const isActive = active === s.key;
                    return (
                        <li key={s.key}>
                            <button
                                onClick={() => onSelect(s.key)}
                                aria-current={isActive ? "page" : undefined}
                                className={[
                                    "w-full text-left px-3 py-2 rounded-xl transition",
                                    isActive
                                        ? "bg-[#4C0C27] text-white shadow-sm"
                                        : "hover:bg-[#4C0C27]/10 text-[#0B0B0B]",
                                ].join(" ")}
                            >
                                {s.label}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

/** ---------- Schedule container with inner tabs ---------- */
function SchedulePanel() {
    type Tab = "hours" | "closures" | "recurring";
    const [tab, setTab] = useState<Tab>("hours");

    return (
        <section>
            <h2 className="font-legacy text-2xl mb-3">Horaires & Fermetures</h2>

            {/* Segmented control */}
            <div className="mb-4 inline-flex rounded-xl border border-[#4C0C27]/20 bg-white/60 p-1">
                {([
                    { k: "hours", label: "Horaires" },
                    { k: "closures", label: "Fermetures exceptionnelles" },
                    { k: "recurring", label: "Fermetures récurrentes" },
                ] as const).map(({ k, label }) => {
                    const isActive = tab === k;
                    return (
                        <button
                            key={k}
                            onClick={() => setTab(k)}
                            className={[
                                "px-3 py-1.5 rounded-lg text-sm transition",
                                isActive
                                    ? "bg-[#4C0C27] text-white shadow-sm"
                                    : "hover:bg-[#4C0C27]/10 text-[#0B0B0B]",
                            ].join(" ")}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Keep sub-sections mounted; just hide/show */}
            <div className={tab === "hours" ? "" : "hidden"}>
                <BusinessHoursManager />
            </div>
            <div className={tab === "closures" ? "" : "hidden"}>
                <ClosuresManager />
            </div>
            <div className={tab === "recurring" ? "" : "hidden"}>
                <RecurringClosuresManager />
            </div>
        </section>
    );
}

/** ---------- (Your existing managers below remain UNCHANGED) ----------
 * HeroCarouselManager, GalleryManager, MenuManager, AnnouncementsManager,
 * BusinessHoursManager, ClosuresManager, RecurringClosuresManager,
 * helpers (asDateTime, parseYMD), etc.
 * ------------------------------------------------------------------- */

// ... keep the rest of your file exactly as-is ...


/** ---------- HERO CAROUSEL (multi-image, add/remove/reorder/toggle publish) ---------- */
function HeroCarouselManager() {
    const [items, setItems] = useState<MediaAsset[]>([]);
    const [staged, setStaged] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);

    async function load() {
        const res = await fetch("/api/admin/media?type=HERO", { credentials: "include" });
        const data: MediaAsset[] = await res.json();
        setItems(data.sort((a, b) => a.sortOrder - b.sortOrder));
    }
    useEffect(() => { load(); }, []);

    function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (files.length) setStaged((prev) => [...prev, ...files]);
    }
    function onDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length) setStaged((prev) => [...prev, ...files]);
    }

    async function uploadStaged() {
        if (staged.length === 0) return;
        setUploading(true);
        try {
            const baseOrder = items.length;
            for (let i = 0; i < staged.length; i++) {
                const file = staged[i];
                const fd = new FormData();
                fd.append("file", file);
                fd.append("type", "HERO");
                fd.append("alt", file.name);
                fd.append("sortOrder", String(baseOrder + i));
                fd.append("published", "true");
                await fetch("/api/admin/media", { method: "POST", body: fd, credentials: "include" });
            }
            setStaged([]);
            await load();
        } finally {
            setUploading(false);
        }
    }

    async function del(id: string) {
        if (!confirm("Supprimer cette image du carrousel ?")) return;
        setSaving(id);
        try {
            await fetch(`/api/admin/media/${id}`, { method: "DELETE", credentials: "include" });
            await load();
        } finally {
            setSaving(null);
        }
    }

    async function togglePublish(it: MediaAsset) {
        setSaving(it.id);
        try {
            await fetch(`/api/admin/media/${it.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ published: !it.published }),
            });
            await load();
        } finally {
            setSaving(null);
        }
    }

    async function changeAlt(it: MediaAsset, alt: string) {
        setSaving(it.id);
        try {
            await fetch(`/api/admin/media/${it.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ alt }),
            });
            await load();
        } finally {
            setSaving(null);
        }
    }

    async function changeOrder(it: MediaAsset, newOrder: number) {
        setSaving(it.id);
        try {
            await fetch(`/api/admin/media/${it.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sortOrder: newOrder }),
            });
            await load();
        } finally {
            setSaving(null);
        }
    }

    return (
        <section>
            <h2 className="font-legacy text-2xl mb-3">Carrousel d’accueil</h2>

            {/* current items */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {items.map((it) => (
                    <div key={it.id} className="rounded-xl border border-[#4C0C27]/20 bg-white/80 p-2">
                        <img src={it.url} alt={it.alt ?? ""} className="w-full h-32 object-cover rounded-md mb-2" />
                        <div className="text-xs text-[#4C0C27]/80 mb-2 break-all">{it.alt || <em>(aucun texte alternatif)</em>}</div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-sm">Ordre</label>
                            <input
                                type="number"
                                className="w-20 px-2 py-1 rounded border border-[#4C0C27]/30 bg-white"
                                value={it.sortOrder}
                                onChange={(e) => changeOrder(it, Number(e.target.value))}
                            />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                onClick={() => togglePublish(it)}
                                disabled={saving === it.id}
                                className={`px-2 py-1 rounded text-sm ${it.published ? "bg-green-600 text-white" : "bg-gray-200"}`}
                            >
                                {it.published ? "Publié" : "Non publié"}
                            </button>
                            <button
                                onClick={() => del(it.id)}
                                disabled={saving === it.id}
                                className="px-2 py-1 rounded text-sm bg-[#C81D25] text-white"
                            >
                                Supprimer
                            </button>
                        </div>
                        <input
                            type="text"
                            className="w-full px-2 py-1 rounded border border-[#4C0C27]/30 bg-white text-sm"
                            placeholder="Texte alternatif"
                            defaultValue={it.alt ?? ""}
                            onBlur={(e) => e.target.value !== (it.alt ?? "") && changeAlt(it, e.target.value)}
                        />
                    </div>
                ))}
            </div>

            {/* staging dropzone */}
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="rounded-xl border-2 border-dashed border-[#4C0C27]/30 bg-white/70 p-6 text-center"
            >
                <div className="mb-3">Glissez-déposez des images ici (ou sélectionnez)</div>
                <input type="file" accept="image/*" multiple onChange={onFilePick} />
                {staged.length > 0 && (
                    <div className="mt-4 text-sm">
                        <div className="mb-2">En file : {staged.length} fichier(s)</div>
                        <button
                            onClick={uploadStaged}
                            disabled={uploading}
                            className="px-3 py-1.5 rounded bg-[#4C0C27] text-white"
                        >
                            {uploading ? "Téléversement…" : `Téléverser ${staged.length} image(s)`}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}


/** ---------- GALLERY (multi-image, add/remove/reorder/toggle publish) ---------- */
function GalleryManager() {
    const [items, setItems] = useState<MediaAsset[]>([]);
    const [staged, setStaged] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [savingId, setSavingId] = useState<string | null>(null);

    // simple picker of existing media not yet in gallery
    const [allMedia, setAllMedia] = useState<MediaAsset[]>([]);
    const [showPicker, setShowPicker] = useState(false);

    async function load() {
        const res = await fetch("/api/admin/gallery", { credentials: "include" });
        const data: MediaAsset[] = await res.json();
        setItems(data.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    }
    useEffect(() => { load(); }, []);

    async function loadAllMedia() {
        // fetch everything admin can see; filter out already-in-gallery
        const res = await fetch("/api/admin/media", { credentials: "include" });
        const data: MediaAsset[] = await res.json();
        const inGallery = new Set(items.map(i => i.id));
        setAllMedia(data.filter(m => !inGallery.has(m.id)));
    }

    function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (files.length) setStaged(prev => [...prev, ...files]);
    }
    function onDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length) setStaged(prev => [...prev, ...files]);
    }

    async function uploadStaged() {
        if (!staged.length) return;
        setUploading(true);
        try {
            const base = items.length;
            for (let i = 0; i < staged.length; i++) {
                // 1) upload as a regular media (we'll reuse ANNOUNCEMENT type)
                const asset = await uploadImage(staged[i]); // creates MediaAsset
                // 2) link into gallery with proper order
                await fetch("/api/admin/gallery", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        mediaAssetId: asset.id,
                        sortOrder: base + i,
                        published: true,
                    }),
                });
            }
            setStaged([]);
            await load();
        } finally {
            setUploading(false);
        }
    }

    async function addExisting(mediaAssetId: string) {
        const nextOrder = (items[items.length - 1]?.sortOrder ?? items.length - 1) + 1;
        await fetch("/api/admin/gallery", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaAssetId, sortOrder: nextOrder, published: true }),
        });
        await load();
    }

    async function removeFromGallery(mediaAssetId: string) {
        if (!confirm("Retirer cette image de la galerie ?")) return;
        setSavingId(mediaAssetId);
        try {
            await fetch(`/api/admin/gallery/${mediaAssetId}`, {
                method: "DELETE",
                credentials: "include",
            });
            await load();
        } finally {
            setSavingId(null);
        }
    }

    async function togglePublish(mediaAssetId: string, published: boolean) {
        setSavingId(mediaAssetId);
        try {
            await fetch(`/api/admin/gallery/${mediaAssetId}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ published: !published }),
            });
            await load();
        } finally {
            setSavingId(null);
        }
    }

    async function changeOrder(mediaAssetId: string, sortOrder: number) {
        setSavingId(mediaAssetId);
        try {
            await fetch(`/api/admin/gallery/${mediaAssetId}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sortOrder }),
            });
            await load();
        } finally {
            setSavingId(null);
        }
    }

    return (
        <section>
            <h2 className="font-legacy text-2xl mb-3">Galerie</h2>

            {/* current gallery items */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {items.map((it) => (
                    <div key={it.id} className="rounded-xl border border-[#4C0C27]/20 bg-white/80 p-2">
                        <img src={it.url} alt={it.alt ?? ""} className="w-full h-32 object-cover rounded-md mb-2" />
                        <div className="text-xs text-[#4C0C27]/80 mb-2 break-all">
                            {it.alt || <em>(aucun texte alternatif)</em>}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-sm">Ordre</label>
                            <input
                                type="number"
                                className="w-20 px-2 py-1 rounded border border-[#4C0C27]/30 bg-white"
                                value={it.sortOrder}
                                onChange={(e) => changeOrder(it.id, Number(e.target.value))}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => togglePublish(it.id, it.published)}
                                disabled={savingId === it.id}
                                className={`px-2 py-1 rounded text-sm ${it.published ? "bg-green-600 text-white" : "bg-gray-200"}`}
                            >
                                {it.published ? "Publié" : "Non publié"}
                            </button>
                            <button
                                onClick={() => removeFromGallery(it.id)}
                                disabled={savingId === it.id}
                                className="px-2 py-1 rounded text-sm bg-[#C81D25] text-white"
                            >
                                Retirer
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* staging: upload new into gallery */}
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="rounded-xl border-2 border-dashed border-[#4C0C27]/30 bg-white/70 p-6 text-center"
            >
                <div className="mb-3">Glissez-déposez des images ici (ou sélectionnez) pour la galerie</div>
                <input type="file" accept="image/*" multiple onChange={onFilePick} />
                {staged.length > 0 && (
                    <div className="mt-4 text-sm">
                        <div className="mb-2">En file : {staged.length} fichier(s)</div>
                        <button
                            onClick={uploadStaged}
                            disabled={uploading}
                            className="px-3 py-1.5 rounded bg-[#4C0C27] text-white"
                        >
                            {uploading ? "Téléversement…" : `Téléverser ${staged.length} image(s)`}
                        </button>
                        <button
                            onClick={() => setStaged([])}
                            className="ml-2 px-3 py-1.5 rounded border border-[#4C0C27]/30"
                        >
                            Effacer la file
                        </button>
                    </div>
                )}
            </div>

            {/* add from existing assets */}
            <div className="mt-4 rounded-xl border border-[#4C0C27]/20 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                    <div className="font-semibold">Ajouter depuis la médiathèque</div>
                    <button
                        onClick={async () => { await loadAllMedia(); setShowPicker(!showPicker); }}
                        className="px-2 py-1 rounded border border-[#4C0C27]/30"
                    >
                        {showPicker ? "Fermer" : "Ouvrir"}
                    </button>
                </div>

                {showPicker && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3">
                        {allMedia.map((m) => (
                            <div key={m.id} className="rounded-lg border border-[#4C0C27]/20 bg-white/70 p-2">
                                <img src={m.url} alt={m.alt ?? ""} className="w-full h-24 object-cover rounded mb-2" />
                                <button
                                    onClick={() => addExisting(m.id)}
                                    className="w-full px-2 py-1 rounded text-sm bg-[#4C0C27] text-white"
                                >
                                    Ajouter à la galerie
                                </button>
                            </div>
                        ))}
                        {allMedia.length === 0 && <div className="text-sm text-[#4C0C27]">Aucune image disponible.</div>}
                    </div>
                )}
            </div>
        </section>
    );
}

/** ---------- MENU ---------- */

function MenuManager() {
    const [items, setItems] = useState<MediaAsset[]>([]);
    const [staged, setStaged] = useState<FileList | null>(null);
    const [working, setWorking] = useState(false);

    async function load() {
        const res = await fetch("/api/admin/media?type=MENU", { credentials: "include" });
        const data: MediaAsset[] = await res.json();
        setItems(data.sort((a, b) => a.sortOrder - b.sortOrder));
    }
    useEffect(() => { load(); }, []);

    const publishedCount = useMemo(
        () => items.filter(i => i.published).length,
        [items]
    );

    function onPick(e: React.ChangeEvent<HTMLInputElement>) {
        setStaged(e.target.files);
    }

    // (A) Upload (supports multi-file). New uploads default to unpublished.
    async function uploadNewMenus() {
        if (!staged || staged.length === 0) return;
        setWorking(true);
        try {
            // Upload sequentially to preserve incremental sortOrder
            const baseOrder = (items[items.length - 1]?.sortOrder ?? -1) + 1;
            let idx = 0;
            for (const f of Array.from(staged)) {
                const fd = new FormData();
                fd.append("file", f);
                fd.append("type", "MENU");
                fd.append("alt", f.name);
                fd.append("sortOrder", String(baseOrder + idx));
                fd.append("published", "false");
                await fetch("/api/admin/media", {
                    method: "POST",
                    body: fd,
                    credentials: "include",
                });
                idx++;
            }
            setStaged(null);
            await load();
        } finally {
            setWorking(false);
        }
    }

    // (B) Toggle publish with a hard client cap of 3
    async function togglePublish(it: MediaAsset) {
        const next = !it.published;
        if (next && publishedCount >= 3) {
            alert("Maximum 3 images de menu publiées.");
            return;
        }
        setWorking(true);
        try {
            await fetch(`/api/admin/media/${it.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ published: next }),
            });
            await load();
        } finally {
            setWorking(false);
        }
    }

    // (C) Simple reordering helpers (down/up by 1 step)
    async function bump(it: MediaAsset, delta: number) {
        const ordered = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
        const i = ordered.findIndex(x => x.id === it.id);
        const j = i + delta;
        if (j < 0 || j >= ordered.length) return;

        // swap sortOrder values
        const a = ordered[i], b = ordered[j];
        setWorking(true);
        try {
            await Promise.all([
                fetch(`/api/admin/media/${a.id}`, {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sortOrder: b.sortOrder }),
                }),
                fetch(`/api/admin/media/${b.id}`, {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sortOrder: a.sortOrder }),
                }),
            ]);
            await load();
        } finally {
            setWorking(false);
        }
    }

    async function del(id: string) {
        if (!confirm("Supprimer cette image du menu ?")) return;
        setWorking(true);
        try {
            await fetch(`/api/admin/media/${id}`, { method: "DELETE", credentials: "include" });
            await load();
        } finally {
            setWorking(false);
        }
    }

    return (
        <section>
            <h2 className="font-legacy text-2xl mb-3">Images du menu (max 3 publiées)</h2>

            {/* All items with controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {items.map((it) => (
                    <div key={it.id} className="rounded-xl border border-[#4C0C27]/20 bg-white/80 p-2">
                        <img
                            src={it.url}
                            alt={it.alt ?? ""}
                            className="w-full h-32 object-contain rounded-md mb-2 bg-white"
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => togglePublish(it)}
                                disabled={working || (!it.published && publishedCount >= 3)}
                                className={`px-2 py-1 rounded text-sm ${it.published ? "bg-green-600 text-white" : "bg-gray-200"
                                    }`}
                                title={it.published ? "Dépublier" : "Publier"}
                            >
                                {it.published ? "Publié" : "Publier"}
                            </button>
                            <button
                                onClick={() => bump(it, -1)}
                                disabled={working}
                                className="px-2 py-1 rounded text-sm border"
                                title="Monter"
                            >
                                ↑
                            </button>
                            <button
                                onClick={() => bump(it, +1)}
                                disabled={working}
                                className="px-2 py-1 rounded text-sm border"
                                title="Descendre"
                            >
                                ↓
                            </button>
                            <button
                                onClick={() => del(it.id)}
                                disabled={working}
                                className="ml-auto px-2 py-1 rounded text-sm bg-[#C81D25] text-white"
                            >
                                Supprimer
                            </button>
                        </div>
                        <div className="mt-1 text-xs text-[#4C0C27]/70">
                            Ordre: {it.sortOrder}
                        </div>
                    </div>
                ))}
            </div>

            {/* Uploader */}
            <div className="rounded-xl border-2 border-dashed border-[#4C0C27]/30 bg-white/70 p-6 text-center">
                <div className="mb-3">Ajouter des images (elles seront non publiées par défaut)</div>
                <input type="file" accept="image/*" multiple onChange={onPick} />
                {staged && staged.length > 0 && (
                    <div className="mt-3 text-sm">
                        En file :
                        <ul className="mt-1 list-disc list-inside">
                            {Array.from(staged).map((f) => <li key={f.name}>{f.name}</li>)}
                        </ul>
                        <div className="mt-2">
                            <button
                                onClick={uploadNewMenus}
                                disabled={working}
                                className="px-3 py-1.5 rounded bg-[#4C0C27] text-white"
                            >
                                {working ? "Téléversement…" : "Téléverser"}
                            </button>
                            <button
                                onClick={() => setStaged(null)}
                                className="ml-2 px-3 py-1.5 rounded border border-[#4C0C27]/30"
                            >
                                Effacer la sélection
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}


/** ---------- Announcements (full CRUD, EU pickers + preview) ---------- */


function AnnouncementsManager() {
    const [rows, setRows] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    // new / edit form state
    const [nDate, setNDate] = useState<string>("");
    const [nTitle, setNTitle] = useState("");
    const [nDesc, setNDesc] = useState("");
    const [nPub, setNPub] = useState(true);
    const [nMedia, setNMedia] = useState<MediaAsset[]>([]); // ← NEW

    const [editing, setEditing] = useState<Announcement | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [openId, setOpenId] = useState<string | "new" | null>(null); // ← accordion

    async function load() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/announcements", { credentials: "include" });
            const data: Announcement[] = await res.json();
            setRows(data);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, []);

    async function create() {
        if (!nDate || !nTitle) return;
        setBusyId("new");
        try {
            await fetch("/api/admin/announcements", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: asDateTime(nDate), // "YYYY-MM-DD" -> ISO
                    title: nTitle,
                    desc: nDesc || null,
                    published: nPub,
                    media: nMedia.map((m, i) => ({ id: m.id, sortOrder: i })), // ← include media
                }),
            });
            setNDate(""); setNTitle(""); setNDesc(""); setNPub(true);
            setNMedia([]); // reset
            await load();
            setOpenId(null);
        } finally {
            setBusyId(null);
        }
    }

    async function update(a: Announcement) {
        setBusyId(a.id);
        try {
            await fetch(`/api/admin/announcements/${a.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: asDateTime((a.date || "").slice(0, 10)), // ensure Y-M-D
                    title: a.title,
                    desc: a.desc ?? null,
                    published: a.published,
                    media: (a.mediaAssets || []).map((m, i) => ({
                        id: m.id,
                        sortOrder: m._linkSortOrder ?? i,
                    })),
                }),
            });
            setEditing(null);
            await load();
            setOpenId(null);
        } finally {
            setBusyId(null);
        }
    }

    async function remove(id: string) {
        if (!confirm("Supprimer cette annonce ?")) return;
        setBusyId(id);
        try {
            await fetch(`/api/admin/announcements/${id}`, { method: "DELETE", credentials: "include" });
            await load();
        } finally {
            setBusyId(null);
        }
    }

    return (
        <section>
            <h2 className="font-legacy text-2xl mb-3">Annonces</h2>

            {/* --- New Announcement (accordion style) --- */}
            <div className="rounded-xl border border-[#4C0C27]/20 bg-white/80">
                <button
                    onClick={() => setOpenId(openId === "new" ? null : "new")}
                    className="w-full flex items-center justify-between px-4 py-3"
                >
                    <div className="font-semibold">Nouvelle annonce</div>
                    <span className="text-sm text-[#4C0C27]">{openId === "new" ? "Fermer" : "Ouvrir"}</span>
                </button>

                {openId === "new" && (
                    <div className="border-t border-[#4C0C27]/10 p-4">
                        <div className="grid md:grid-cols-6 gap-2 items-center">
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    lang={EU_LANG}
                                    value={nDate}
                                    onChange={(e) => setNDate(e.target.value)}
                                    className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white"
                                />
                                <span className="text-[11px] text-[#4C0C27]">
                                    {nDate ? fmtDate(parseYMD(nDate)) : ""}
                                </span>
                            </div>
                            <input
                                type="text"
                                value={nTitle}
                                onChange={(e) => setNTitle(e.target.value)}
                                placeholder="Titre"
                                className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white md:col-span-2"
                            />
                            <input
                                type="text"
                                value={nDesc}
                                onChange={(e) => setNDesc(e.target.value)}
                                placeholder="Description (facultatif)"
                                className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white md:col-span-2"
                            />
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={nPub} onChange={(e) => setNPub(e.target.checked)} /> Publié
                            </label>
                        </div>

                        {/* Images for NEW */}
                        <div className="mt-4">
                            <div className="text-sm font-semibold text-[#4C0C27] mb-2">Images</div>
                            <div className="flex gap-2 flex-wrap mb-2">
                                {nMedia.map((m, i) => (
                                    <div key={m.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#4C0C27]/20">
                                        <img src={m.url} alt={m.alt ?? ""} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setNMedia(nMedia.filter((_, idx) => idx !== i))}
                                            className="absolute top-1 right-1 bg-white/90 text-[#C81D25] text-[10px] px-1 rounded"
                                            title="Remove"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]; if (!file) return;
                                        const asset = await uploadImage(file);
                                        setNMedia((prev) => [...prev, asset]);
                                        e.currentTarget.value = "";
                                    }}
                                />
                                <span className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white">
                                    Téléverser une image
                                </span>
                            </label>
                        </div>

                        <div className="mt-4">
                            <button onClick={create} disabled={busyId === "new"} className="px-3 py-1.5 rounded bg-[#4C0C27] text-white">
                                {busyId === "new" ? "Enregistrement…" : "Créer"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- List: compact + per-row accordion --- */}
            <div className="rounded-xl border border-[#4C0C27]/20 bg-white/70 mt-4">
                {loading ? (
                    <div className="p-4 text-[#4C0C27]">Chargement…</div>
                ) : rows.length === 0 ? (
                    <div className="p-4 text-[#4C0C27]">Aucune annonce pour l’instant.</div>
                ) : (
                    <ul className="divide-y divide-[#4C0C27]/10">
                        {rows.map((a) => {
                            const isOpen = openId === a.id;
                            const isEditing = editing?.id === a.id;

                            return (
                                <li key={a.id} className="bg-white/60">
                                    {/* row header */}
                                    <button
                                        onClick={() => setOpenId(isOpen ? null : a.id)}
                                        className="w-full flex items-center justify-between px-3 py-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-xs px-2 py-0.5 rounded bg-[#4C0C27]/10 text-[#4C0C27]">
                                                {fmtDate(parseAPIDate(a.date))}
                                            </div>
                                            <div className="font-semibold">{a.title}</div>
                                            <div className="text-xs text-[#4C0C27] opacity-70">
                                                {a.published ? "Publié" : "Non publié"}
                                            </div>
                                        </div>
                                        <div className="text-sm text-[#4C0C27]">{isOpen ? "Fermer" : "Modifier"}</div>
                                    </button>

                                    {/* expanded panel */}
                                    {isOpen && (
                                        <div className="px-3 pb-3">
                                            {/* fields */}
                                            <div className="grid md:grid-cols-6 gap-2 items-center my-2">
                                                {isEditing ? (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="date"
                                                                lang={EU_LANG}
                                                                defaultValue={a.date.slice(0, 10)}
                                                                onChange={(e) => editing && (editing.date = e.target.value)}
                                                                className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white"
                                                            />
                                                            <span className="text-[11px] text-[#4C0C27]">
                                                                {fmtDate(parseYMD(editing?.date ?? a.date.slice(0, 10)))}
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            defaultValue={a.title}
                                                            onChange={(e) => editing && (editing.title = e.target.value)}
                                                            className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white md:col-span-2"
                                                        />
                                                        <input
                                                            type="text"
                                                            defaultValue={a.desc ?? ""}
                                                            onChange={(e) => editing && (editing.desc = e.target.value)}
                                                            className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white md:col-span-2"
                                                        />
                                                        <label className="inline-flex items-center gap-2 text-sm">
                                                            <input
                                                                type="checkbox"
                                                                defaultChecked={a.published}
                                                                onChange={(e) => editing && (editing.published = e.target.checked)}
                                                            />
                                                            <span>Publié</span>
                                                        </label>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-sm text-[#4C0C27]">{fmtDate(parseAPIDate(a.date))}</div>
                                                        <div className="md:col-span-2 font-semibold">{a.title}</div>
                                                        <div className="md:col-span-2 text-[#0B0B0B]">{a.desc}</div>
                                                        <div>{a.published ? "Oui" : "Non"}</div>
                                                    </>
                                                )}
                                            </div>

                                            {/* images for this announcement */}
                                            <div className="mt-2">
                                                <div className="text-sm font-semibold text-[#4C0C27] mb-2">Images</div>
                                                <div className="flex gap-2 flex-wrap mb-2">
                                                    {(isEditing ? editing?.mediaAssets : a.mediaAssets)?.map((m, i) => (
                                                        <div key={m.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#4C0C27]/20">
                                                            <img src={m.url} alt={m.alt ?? ""} className="w-full h-full object-cover" />
                                                            {isEditing && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (!editing) return;
                                                                        setEditing({
                                                                            ...editing,
                                                                            mediaAssets: editing.mediaAssets.filter((_, idx) => idx !== i),
                                                                        });
                                                                    }}
                                                                    className="absolute top-1 right-1 bg-white/90 text-[#C81D25] text-[10px] px-1 rounded"
                                                                    title="Remove"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {isEditing && (
                                                    <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0]; if (!file || !editing) return;
                                                                const asset = await uploadImage(file);
                                                                setEditing({
                                                                    ...editing,
                                                                    mediaAssets: [...(editing.mediaAssets || []), asset],
                                                                });
                                                                e.currentTarget.value = "";
                                                            }}
                                                        />
                                                        <span className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white">
                                                            Ajouter une image
                                                        </span>
                                                    </label>
                                                )}
                                            </div>

                                            {/* actions */}
                                            <div className="mt-3">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={() => editing && update(editing)}
                                                            disabled={busyId === a.id}
                                                            className="px-2 py-1 rounded bg-[#4C0C27] text-white mr-2"
                                                        >
                                                            {busyId === a.id ? "Enregistrement…" : "Enregistrer"}
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditing(null); setOpenId(null); }}
                                                            className="px-2 py-1 rounded border border-[#4C0C27]/30"
                                                        >
                                                            Annuler
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => setEditing({ ...a })}
                                                            className="px-2 py-1 rounded border border-[#4C0C27]/30 mr-2"
                                                        >
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => remove(a.id)}
                                                            disabled={busyId === a.id}
                                                            className="px-2 py-1 rounded bg-[#C81D25] text-white"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </section>
    );
}
/** ---------- Closures (list + add + delete, EU pickers + preview) ---------- */

function BusinessHoursManager() {
    type Row = { weekday: number; text: string };
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyKey, setBusyKey] = useState<number | null>(null);

    const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]; // Mon=0

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                // we can read from the public endpoint or admin — public is simpler and cookie-free
                const r = await fetch("/api/hours");
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const data: { weekday: number; text: string }[] = await r.json();

                const map = new Map(data.map(d => [d.weekday, d.text]));
                const normalized: Row[] = Array.from({ length: 7 }, (_, i) => ({
                    weekday: i,
                    text: map.get(i) ?? "",
                }));
                if (alive) setRows(normalized);
            } catch (e) {
                console.error("[hours GET] failed:", e);
                if (alive) setRows(Array.from({ length: 7 }, (_, i) => ({ weekday: i, text: "" })));
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    async function saveRow(r: Row) {
        setBusyKey(r.weekday);
        try {
            const res = await fetch(`/api/admin/hours/${r.weekday}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: r.text }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                alert(j.error || "Échec de l'enregistrement");
            }
        } catch (e) {
            console.error("[admin/hours PUT] failed:", e);
            alert("Erreur réseau");
        } finally {
            setBusyKey(null);
        }
    }

    return (
        <section className="mt-8">
            <h2 className="font-legacy text-2xl mb-3">Horaires (texte libre)</h2>
            <div className="rounded-xl border border-[#4C0C27]/20 bg-white/80 p-2">
                {loading ? (
                    <div className="p-4 text-[#4C0C27]">Chargement…</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[#4C0C27]">
                                <th className="p-2">Jour</th>
                                <th className="p-2">Texte affiché publiquement</th>
                                <th className="p-2 w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.weekday} className="border-t border-[#4C0C27]/10">
                                    <td className="p-2 font-medium">{weekdays[r.weekday]}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={r.text}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setRows(prev =>
                                                    prev.map(x => x.weekday === r.weekday ? { ...x, text: v } : x)
                                                );
                                            }}
                                            placeholder="Ex: 12:00-21:30 (non-stop)"
                                            className="w-full px-2 py-1 border rounded"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <button
                                            onClick={() => saveRow(r)}
                                            disabled={busyKey === r.weekday}
                                            className="px-2 py-1 rounded bg-[#4C0C27] text-white"
                                        >
                                            {busyKey === r.weekday ? "…" : "Enregistrer"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <p className="mt-2 text-xs text-[#4C0C27]">
                Laissez vide pour « fermé ». Entrez n’importe quel texte – il sera affiché tel quel.
            </p>
        </section>
    );
}

function ClosuresManager() {
    const [rows, setRows] = useState<Closure[]>([]);
    const [loading, setLoading] = useState(true);

    const [cDate, setCDate] = useState("");
    const [cSlot, setCSlot] = useState<Slot>("ALL");
    const [cNote, setCNote] = useState("");
    const [busyId, setBusyId] = useState<string | "new" | null>(null);

    async function load() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/closures", { credentials: "include" });
            const data: Closure[] = await res.json();
            setRows(data.sort((a, b) => +new Date(a.date) - +new Date(b.date)));
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, []);

    async function addClosure() {
        if (!cDate) return;
        setBusyId("new");
        try {
            const body = { date: asDateTime(cDate), slot: cSlot, note: cNote || undefined };
            const res = await fetch("/api/admin/closures", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                alert(j.error || "Échec de l'ajout de la fermeture");
            }
            setCDate(""); setCSlot("ALL"); setCNote("");
            await load();
        } finally {
            setBusyId(null);
        }
    }

    async function del(id: string) {
        if (!confirm("Supprimer cette fermeture ?")) return;
        setBusyId(id);
        try {
            await fetch(`/api/admin/closures/${id}`, { method: "DELETE", credentials: "include" });
            await load();
        } finally {
            setBusyId(null);
        }
    }

    return (
        <section>
            <h2 className="font-legacy text-2xl mb-3">Fermetures exceptionelles</h2>

            <div className="rounded-xl border border-[#4C0C27]/20 bg-white/80 p-4 mb-4">
                <div className="font-semibold mb-2">Ajouter une fermeture</div>
                <div className="grid md:grid-cols-6 gap-2 items-center">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            lang={EU_LANG}
                            value={cDate}
                            onChange={(e) => setCDate(e.target.value)}
                            className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white"
                        />
                        <span className="text-[11px] text-[#4C0C27]">
                            {cDate ? fmtDate(parseYMD(cDate)) : ""}
                        </span>
                    </div>

                    <select value={cSlot} onChange={(e) => setCSlot(e.target.value as Slot)} className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white">
                        <option value="ALL">Toute la journée</option>
                        <option value="LUNCH">Midi</option>
                        <option value="DINNER">Soir</option>
                    </select>

                    <input type="text" placeholder="Note (facultatif)" value={cNote} onChange={(e) => setCNote(e.target.value)} className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white md:col-span-3" />

                    <button onClick={addClosure} disabled={busyId === "new"} className="px-3 py-1.5 rounded bg-[#4C0C27] text-white">
                        {busyId === "new" ? "Enregistrement…" : "Ajouter"}
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-[#4C0C27]/20 bg-white/70 p-2">
                {loading ? (
                    <div className="p-4 text-[#4C0C27]">Chargement…</div>
                ) : rows.length === 0 ? (
                    <div className="p-4 text-[#4C0C27]">Aucune fermeture pour l'instant.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[#4C0C27]">
                                <th className="p-2">Date</th>
                                <th className="p-2">Créneau</th>
                                <th className="p-2">Note</th>
                                <th className="p-2 w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((c) => (
                                <tr key={c.id} className="border-t border-[#4C0C27]/10">
                                    <td className="p-2">{fmtDate(parseAPIDate(c.date))}</td>
                                    <td className="p-2">{c.slot === "ALL" ? "Toute la journée" : c.slot === "LUNCH" ? "Midi" : "Soir"}</td>
                                    <td className="p-2">{c.note}</td>
                                    <td className="p-2">
                                        <button onClick={() => del(c.id)} disabled={busyId === c.id} className="px-2 py-1 rounded bg-[#C81D25] text-white">
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}

function RecurringClosuresManager() {
    const [rows, setRows] = useState<Array<{
        id: string; weekday: number; slot: "ALL" | "LUNCH" | "DINNER";
        note?: string | null; startsOn?: string | null; endsOn?: string | null; interval?: number;
    }>>([]);
    const [loading, setLoading] = useState(true);

    // form
    const [rWeekday, setRWeekday] = useState<number>(0); // Mon
    const [rSlot, setRSlot] = useState<"ALL" | "LUNCH" | "DINNER">("ALL");
    const [rNote, setRNote] = useState("");
    const [rStartsOn, setRStartsOn] = useState<string>(""); // yyyy-mm-dd
    const [rEndsOn, setREndsOn] = useState<string>("");     // yyyy-mm-dd
    const [rInterval, setRInterval] = useState<number>(1);
    const [busy, setBusy] = useState<string | "new" | null>(null);

    async function load() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/recurring-closures", { credentials: "include" });
            const data = await res.json();
            setRows(data);
        } finally { setLoading(false); }
    }
    useEffect(() => { load(); }, []);

    async function addRule() {
        setBusy("new");
        try {
            const body = {
                weekday: rWeekday,
                slot: rSlot,
                note: rNote || undefined,
                startsOn: rStartsOn ? new Date(rStartsOn).toISOString() : undefined,
                endsOn: rEndsOn ? new Date(rEndsOn).toISOString() : undefined,
                interval: rInterval || 1,
            };
            const res = await fetch("/api/admin/recurring-closures", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                alert(j.error || "Échec de l'ajout de la récurrence");
            } else {
                setRNote(""); setRStartsOn(""); setREndsOn(""); setRInterval(1);
                await load();
            }
        } finally { setBusy(null); }
    }

    async function delRule(id: string) {
        if (!confirm("Supprimer cette récurrence ?")) return;
        setBusy(id);
        try {
            await fetch(`/api/admin/recurring-closures/${id}`, { method: "DELETE", credentials: "include" });
            await load();
        } finally { setBusy(null); }
    }

    const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]; // Mon=0

    return (
        <section className="mt-8">
            <h2 className="font-legacy text-2xl mb-3">Fermetures récurrentes</h2>

            <div className="rounded-xl border border-[#4C0C27]/20 bg-white/80 p-4 mb-4">
                <div className="font-semibold mb-2">Ajouter une fermeture récurrente</div>
                <div className="grid md:grid-cols-7 gap-2 items-center">
                    <select value={rWeekday} onChange={e => setRWeekday(+e.target.value)}
                        className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white">
                        {weekdays.map((w, i) => <option key={i} value={i}>{w}</option>)}
                    </select>

                    <select value={rSlot} onChange={e => setRSlot(e.target.value as any)}
                        className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white">
                        <option value="ALL">Toute la journée</option>
                        <option value="LUNCH">Midi</option>
                        <option value="DINNER">Soir</option>
                    </select>

                    <input type="date" value={rStartsOn} onChange={e => setRStartsOn(e.target.value)}
                        className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white" placeholder="Début (optionnel)" />

                    <input type="date" value={rEndsOn} onChange={e => setREndsOn(e.target.value)}
                        className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white" placeholder="Fin (optionnel)" />

                    <input type="number" min={1} value={rInterval} onChange={e => setRInterval(Math.max(1, Number(e.target.value) || 1))}
                        className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white" placeholder="Toutes les N semaines" />

                    <input type="text" placeholder="Note (facultatif)" value={rNote}
                        onChange={(e) => setRNote(e.target.value)}
                        className="px-2 py-1 rounded border border-[#4C0C27]/30 bg-white md:col-span-2" />

                    <button onClick={addRule} disabled={busy === "new"}
                        className="px-3 py-1.5 rounded bg-[#4C0C27] text-white">
                        {busy === "new" ? "Enregistrement…" : "Ajouter"}
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-[#4C0C27]/20 bg-white/70 p-2">
                {loading ? (
                    <div className="p-4 text-[#4C0C27]">Chargement…</div>
                ) : rows.length === 0 ? (
                    <div className="p-4 text-[#4C0C27]">Aucune récurrence.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[#4C0C27]">
                                <th className="p-2">Jour</th>
                                <th className="p-2">Créneau</th>
                                <th className="p-2">Début</th>
                                <th className="p-2">Fin</th>
                                <th className="p-2">Toutes les</th>
                                <th className="p-2">Note</th>
                                <th className="p-2 w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(r => (
                                <tr key={r.id} className="border-t border-[#4C0C27]/10">
                                    <td className="p-2">{weekdays[r.weekday]}</td>
                                    <td className="p-2">{r.slot === "ALL" ? "Toute la journée" : r.slot === "LUNCH" ? "Midi" : "Soir"}</td>
                                    <td className="p-2">{r.startsOn ? new Date(r.startsOn).toLocaleDateString() : "—"}</td>
                                    <td className="p-2">{r.endsOn ? new Date(r.endsOn).toLocaleDateString() : "—"}</td>
                                    <td className="p-2">{r.interval ?? 1} sem.</td>
                                    <td className="p-2">{r.note ?? ""}</td>
                                    <td className="p-2">
                                        <button onClick={() => delRule(r.id)} disabled={busy === r.id}
                                            className="px-2 py-1 rounded bg-[#C81D25] text-white">
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}


type Summary = {
    total: number;
    uniques: number;
    topPages: { path: string; hits: number }[];
    topCities: { city: string | null; country: string | null; hits: number }[];
    range: { from: string; to: string };
  };
  type SeriesPoint = { bucket: string; hits: number };
  
  function AnalyticsPanel() {
    const [from, setFrom] = useState(dayjs().subtract(29, "day").format("YYYY-MM-DD"));
    const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
    const [summary, setSummary] = useState<Summary | null>(null);
    const [series, setSeries] = useState<SeriesPoint[]>([]);
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
      let cancelled = false;
      setLoading(true);
      const q = `from=${from}&to=${to}`;
      Promise.all([
        fetch(`/api/admin/analytics/summary?${q}`, { credentials: "include" }).then(r => r.json()),
        fetch(`/api/admin/analytics/series?bucket=day&${q}`, { credentials: "include" }).then(r => r.json()),
      ])
        .then(([s, ts]) => { if (!cancelled) { setSummary(s); setSeries(ts); } })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [from, to]);
  
    const seriesData = useMemo(
      () => series.map(d => ({ date: dayjs(d.bucket).format("YYYY-MM-DD"), hits: d.hits })),
      [series]
    );
  
    return (
      <section>
        <h2 className="font-legacy text-2xl mb-3">Analytics</h2>
  
        {/* Range controls */}
        <div className="mb-4 flex items-end gap-3">
          <div>
            <label className="block text-sm mb-1">Du</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                   className="border p-2 rounded bg-white" />
          </div>
          <div>
            <label className="block text-sm mb-1">Au</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
                   className="border p-2 rounded bg-white" />
          </div>
          {loading && <span className="text-sm text-[#4C0C27]">Chargement…</span>}
        </div>
  
        {summary && (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total hits" value={summary.total} />
              <StatCard label="Sessions uniques" value={summary.uniques} />
              <StatCard label="Top page" value={summary.topPages[0]?.path ?? "—"} />
              <StatCard label="Top ville" value={
                summary.topCities[0] ? `${summary.topCities[0].city ?? "Unknown"} (${summary.topCities[0].country ?? "--"})` : "—"
              } />
            </div>
  
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Visites quotidiennes">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={seriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="hits" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
  
              <Card title="Pages les plus visitées">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={summary.topPages}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="path" hide />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="hits" />
                  </BarChart>
                </ResponsiveContainer>
                <ul className="mt-2 text-sm">
                  {summary.topPages.map(p => (
                    <li key={p.path} className="flex justify-between gap-2">
                      <span className="truncate">{p.path}</span>
                      <span>{p.hits}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
  
            <Card title="Top villes">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie dataKey="hits" data={summary.topCities}
                         nameKey={(e: any) => `${e.city ?? "Unknown"} (${e.country ?? "--"})`} outerRadius={100}>
                      {summary.topCities.map((_, idx) => <Cell key={idx} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
  
                <ul className="text-sm">
                  {summary.topCities.map((c, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="truncate">{`${c.city ?? "Unknown"} (${c.country ?? "--"})`}</span>
                      <span>{c.hits}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </>
        )}
      </section>
    );
  }
  
  function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
      <div className="p-4 rounded-xl border border-[#4C0C27]/20 bg-white/80 shadow-sm">
        <div className="text-xs text-[#4C0C27]/80">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
    );
  }
  function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="p-4 rounded-xl border border-[#4C0C27]/20 bg-white/80 shadow-sm">
        <div className="text-lg font-semibold mb-2">{title}</div>
        {children}
      </div>
    );
  }

/** ---------- helpers ---------- */

// Convert "YYYY-MM-DD" (from <input type=date>) to a local Date ISO string
function asDateTime(ymd: string): string {
    const [y, m, d] = ymd.split("-").map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0); // noon local to avoid TZ midnight issues
    return dt.toISOString();
}

// Parse "YYYY-MM-DD" (from inputs) to Date at local noon
function parseYMD(ymd: string): Date {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y || 0, (m || 1) - 1, d || 1, 12, 0, 0);
}
