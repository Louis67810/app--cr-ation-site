"use client";

import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  ImageIcon,
  LoaderCircle,
  Minus,
  Play,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { SitePage } from "@/lib/site-template";

type CmsProject = { key: string; name: string; pages: SitePage[]; publishedAt: string | null };
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type Path = Array<string | number>;

const collections = [
  { id: "all", label: "Tout le contenu", match: () => true },
  { id: "realisations", label: "Réalisations", match: (page: SitePage) => page.slug.includes("realisation") },
  { id: "articles", label: "Articles", match: (page: SitePage) => page.slug.includes("blog") },
  { id: "prestations", label: "Prestations", match: (page: SitePage) => page.slug.includes("prestation") },
  { id: "secteurs", label: "Secteurs", match: (page: SitePage) => page.slug.includes("secteur") },
  { id: "pages", label: "Pages générales", match: (page: SitePage) => !["realisation", "blog", "prestation", "secteur"].some((part) => page.slug.includes(part)) },
] as const;

const humanize = (value: string) => value.replace(/([A-Z])/g, " $1").replace(/[-_]/g, " ").replace(/^./, (letter) => letter.toUpperCase());
const isImageField = (key: string) => /image|avatar|photo|logo/i.test(key);
const isLongText = (key: string, value: string) => /text|description|subtitle|excerpt|message|content/i.test(key) || value.length > 90;

function setAtPath<T>(source: T, path: Path, value: JsonValue): T {
  if (path.length === 0) return value as T;
  const [head, ...tail] = path;
  const clone = Array.isArray(source) ? [...source] : { ...(source as Record<string, unknown>) };
  (clone as Record<string | number, unknown>)[head] = setAtPath(
    (source as Record<string | number, unknown>)[head],
    tail,
    value,
  );
  return clone as T;
}

function defaultFor(value: JsonValue): JsonValue {
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, defaultFor(child)]));
  }
  return "";
}

function FieldEditor({
  fieldKey,
  value,
  path,
  onChange,
}: {
  fieldKey: string;
  value: JsonValue;
  path: Path;
  onChange: (path: Path, value: JsonValue) => void;
}) {
  const [open, setOpen] = useState(path.length < 3);
  const label = humanize(fieldKey);

  if (Array.isArray(value)) {
    return (
      <div className="rounded-[10px] border border-black/[0.08] bg-white">
        <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between px-3 py-3 text-left text-[12px] font-semibold">
          <span className="flex items-center gap-2">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{label}<em className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] not-italic text-black/45">{value.length}</em></span>
          <Plus size={14} onClick={(event) => { event.stopPropagation(); onChange(path, [...value, defaultFor(value[0] ?? "")]); }} />
        </button>
        {open ? <div className="grid gap-2 border-t border-black/[0.06] p-2">{value.map((item, index) => <div key={index} className="relative rounded-lg bg-[#f8f8f7] p-2 pr-9"><FieldEditor fieldKey={`${label} ${index + 1}`} value={item} path={[...path, index]} onChange={onChange} /><button type="button" aria-label={`Supprimer ${label} ${index + 1}`} onClick={() => onChange(path, value.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-2 top-2 grid size-6 place-items-center rounded-md text-black/35 hover:bg-black/5 hover:text-black"><Minus size={13} /></button></div>)}</div> : null}
      </div>
    );
  }

  if (value && typeof value === "object") {
    return (
      <div className="rounded-[10px] border border-black/[0.08] bg-white">
        <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-center gap-2 px-3 py-3 text-left text-[12px] font-semibold">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{label}</button>
        {open ? <div className="grid gap-3 border-t border-black/[0.06] p-3">{Object.entries(value).map(([key, child]) => <FieldEditor key={key} fieldKey={key} value={child} path={[...path, key]} onChange={onChange} />)}</div> : null}
      </div>
    );
  }

  if (typeof value === "boolean") {
    return <label className="flex items-center justify-between gap-3 text-[12px] font-medium"><span>{label}</span><input type="checkbox" checked={value} onChange={(event) => onChange(path, event.target.checked)} className="size-4 accent-black" /></label>;
  }

  const stringValue = value == null ? "" : String(value);
  return (
    <label className="grid gap-1.5 text-[11px] font-medium text-black/55">
      {label}
      {isImageField(fieldKey) ? <span className="grid gap-2 rounded-[9px] border border-black/10 bg-[#fafafa] p-2"><span className="flex items-center gap-3">{stringValue ? <img src={stringValue} alt="" className="h-14 w-20 rounded-md border border-black/10 object-cover" /> : <span className="grid h-14 w-20 place-items-center rounded-md bg-black/5 text-black/25"><ImageIcon size={18} /></span>}<span className="min-w-0 flex-1"><input value={stringValue} onChange={(event) => onChange(path, event.target.value)} placeholder="URL de l’image" className="h-9 w-full rounded-md border border-black/10 bg-white px-2 text-[11px] text-black outline-none focus:border-black/30" /><span className="mt-1 flex items-center gap-1 text-[9px] text-black/35"><Upload size={10} />URL ou fichier local</span></span><input type="file" accept="image/*" aria-label={`Importer ${label}`} className="absolute h-px w-px opacity-0" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => onChange(path, String(reader.result)); reader.readAsDataURL(file); }} /></span></span> : isLongText(fieldKey, stringValue) ? <textarea rows={3} value={stringValue} onChange={(event) => onChange(path, event.target.value)} className="resize-y rounded-[8px] border border-black/10 bg-white px-3 py-2 text-[12px] leading-5 text-black outline-none focus:border-black/30" /> : <input value={stringValue} type={typeof value === "number" ? "number" : "text"} onChange={(event) => onChange(path, typeof value === "number" ? Number(event.target.value) : event.target.value)} className="h-9 rounded-[8px] border border-black/10 bg-white px-3 text-[12px] text-black outline-none focus:border-black/30" />}
    </label>
  );
}

export function CmsEditor({ project }: { project: CmsProject }) {
  const [pages, setPages] = useState(project.pages);
  const [collection, setCollection] = useState("all");
  const [selectedPageId, setSelectedPageId] = useState(project.pages[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "publishing">("idle");
  const [message, setMessage] = useState("");
  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? pages[0];
  const selectedCollection = collections.find((item) => item.id === collection) ?? collections[0];
  const visiblePages = useMemo(() => pages.filter((page) => selectedCollection.match(page) && `${page.title} ${page.slug}`.toLowerCase().includes(query.toLowerCase())), [pages, query, selectedCollection]);

  function updatePage(path: Path, value: JsonValue) {
    setPages((current) => current.map((page) => page.id === selectedPage.id ? setAtPath(page, path, value) : page));
    setMessage("Modifications non enregistrées");
  }

  async function saveDraft(nextStatus: "saving" | "publishing" = "saving") {
    setStatus(nextStatus);
    setMessage("");
    const response = await fetch("/api/projects/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectKey: project.key, projectName: project.name, pages }) });
    if (!response.ok) { const result = await response.json() as { error?: string }; setStatus("idle"); setMessage(result.error ?? "Enregistrement impossible"); return false; }
    if (nextStatus === "saving") { setStatus("idle"); setMessage("Toutes les modifications sont synchronisées"); }
    return true;
  }

  async function play() {
    if (await saveDraft("saving")) window.open(`/builder?project=${encodeURIComponent(project.key)}`, "_blank", "noopener,noreferrer");
  }

  async function publish() {
    if (!(await saveDraft("publishing"))) return;
    const response = await fetch("/api/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectKey: project.key, projectName: project.name, pages }) });
    const result = await response.json() as { url?: string; error?: string };
    setStatus("idle"); setMessage(response.ok ? "Site publié et contenu synchronisé" : result.error ?? "Publication impossible");
    if (response.ok && result.url) window.open(result.url, "_blank", "noopener,noreferrer");
  }

  if (!selectedPage) return <div className="mt-8 rounded-xl border border-dashed border-black/15 p-10 text-center text-[13px] text-black/45">Aucune page dans ce projet.</div>;

  return (
    <section className="mt-7 overflow-hidden rounded-[13px] border border-black/[0.08] bg-white shadow-[0_16px_45px_rgba(0,0,0,.05)]">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-black/[0.07] px-4">
        <div className="flex items-center gap-2"><button type="button" className="grid size-8 place-items-center rounded-md hover:bg-black/5" title="Nouvelle entrée"><Plus size={19} /></button><span className="h-5 w-px bg-black/10" /><label className="flex h-8 items-center gap-2 rounded-md px-2 text-[12px] text-black/45 focus-within:bg-black/[0.03]"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" className="w-36 bg-transparent outline-none" /></label></div>
        <div className="flex items-center gap-2"><span className="mr-2 hidden text-[10px] text-black/40 sm:block">{message}</span><button type="button" onClick={play} disabled={status !== "idle"} className="flex h-9 items-center gap-2 rounded-[9px] border border-black/10 bg-white px-4 text-[12px] font-semibold shadow-sm disabled:opacity-50"><Play size={14} fill="currentColor" />Play</button><button type="button" onClick={publish} disabled={status !== "idle"} className="flex h-9 items-center gap-2 rounded-[10px] bg-gradient-to-b from-[#323232] to-[#222] px-5 text-[12px] font-semibold text-white shadow-md disabled:opacity-50">{status === "publishing" ? <LoaderCircle size={14} className="animate-spin" /> : null}Publier</button></div>
      </div>
      <div className="grid min-h-[650px] lg:grid-cols-[195px_minmax(430px,1fr)_minmax(320px,420px)]">
        <aside className="border-r border-black/[0.07] bg-[#fbfaf8] p-3"><p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-[.08em] text-black/35">Collections</p>{collections.map((item) => <button key={item.id} type="button" onClick={() => setCollection(item.id)} className={`${collection === item.id ? "bg-black/[0.06] text-black" : "text-black/55 hover:bg-black/[0.03]"} flex w-full items-center justify-between rounded-[7px] px-2 py-2 text-left text-[12px]`}><span>{item.label}</span><span className="text-[10px] text-black/30">{pages.filter(item.match).length}</span></button>)}</aside>
        <div className="min-w-0 overflow-x-auto border-r border-black/[0.07]"><div className="grid min-w-[690px] grid-cols-[38px_80px_120px_minmax(180px,1fr)_180px_95px] border-b border-black/[0.07] bg-white text-[11px] font-semibold text-black/45"><span className="p-3" /><span className="p-3">Aperçu</span><span className="p-3">Statut</span><span className="p-3">Titre</span><span className="p-3">Slug</span><span className="p-3">Champs</span></div>{visiblePages.map((page) => { const preview = JSON.stringify(page).match(/(?:https?:[^" ]+|\/images\/[^" ]+)/)?.[0]; return <button key={page.id} type="button" onClick={() => setSelectedPageId(page.id)} className={`${selectedPage.id === page.id ? "bg-[#f7f7f5]" : "bg-white hover:bg-[#fafafa]"} grid h-[74px] min-w-[690px] w-full grid-cols-[38px_80px_120px_minmax(180px,1fr)_180px_95px items-center border-b border-black/[0.07] text-left text-[12px]`}><span className="grid place-items-center text-black/20"><GripVertical size={15} /></span><span>{preview ? <img src={preview} alt="" className="h-[45px] w-[62px] rounded-md border border-black/10 object-cover" /> : <span className="grid h-[45px] w-[62px] place-items-center rounded-md bg-black/5 text-black/20"><ImageIcon size={16} /></span>}</span><span><i className={`${project.publishedAt ? "bg-[#ddfff5] text-[#00a77a]" : "bg-[#f0f0ef] text-black/50"} rounded-full px-2.5 py-1 text-[11px] font-semibold not-italic`}>{project.publishedAt ? "Live" : "Brouillon"}</i></span><span className="truncate pr-4 font-medium">{page.title}</span><span className="truncate pr-4 text-black/50">{page.slug || "/"}</span><span className="text-black/40">{page.sections.length} sections</span></button>; })}</div>
        <aside className="max-h-[650px] overflow-y-auto bg-[#fbfbfa] p-4"><div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 border-b border-black/[0.07] bg-[#fbfbfa]/95 px-4 py-4 backdrop-blur"><p className="font-serif text-[18px]">{selectedPage.title}</p><p className="mt-1 text-[10px] text-black/40">Tous les champs sont reliés au site</p></div><div className="grid gap-3"><FieldEditor fieldKey="title" value={selectedPage.title} path={["title"]} onChange={updatePage} /><FieldEditor fieldKey="slug" value={selectedPage.slug} path={["slug"]} onChange={updatePage} />{selectedPage.sections.map((section, index) => <FieldEditor key={section.id} fieldKey={`${humanize(section.type)} · ${index + 1}`} value={section as unknown as JsonValue} path={["sections", index]} onChange={updatePage} />)}</div><button type="button" onClick={() => saveDraft()} disabled={status !== "idle"} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-[9px] border border-black/10 bg-white text-[12px] font-semibold shadow-sm disabled:opacity-50">{status === "saving" ? <LoaderCircle size={14} className="animate-spin" /> : null}Enregistrer les modifications</button></aside>
      </div>
    </section>
  );
}
