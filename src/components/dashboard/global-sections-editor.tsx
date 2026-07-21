"use client";

import { Check, ChevronDown, ImageIcon, Layers3, LoaderCircle, Search, Shuffle, UploadCloud, Variable } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { isGlobalEditableSection, SECTION_LABELS } from "@/lib/content-sections";
import { prepareImageForUpload } from "@/lib/client-images";
import type { SectionInstance, SitePage } from "@/lib/site-template";
import { ensureSiteHeaderDefaults } from "@/lib/site-header-defaults";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type Path = Array<string | number>;
type Field = { key: string; label: string; path: Path; image: boolean; background: boolean; multiline: boolean; occurrences: number };
type SectionOccurrence = { pageTitle: string; section: SectionInstance };
type SectionGroup = { key: SectionInstance["type"]; label: string; occurrences: SectionOccurrence[]; fields: Field[] };
type SectionsProject = { key: string; ownerId: string; name: string; pages: SitePage[] };
type SectionAsset = { id: string; public_url: string; title: string; alt_text: string; original_name: string; ai_generated: boolean; created_at: string };

function humanize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/[-_]/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function getAtPath(source: unknown, path: Path): JsonValue | undefined {
  return path.reduce<unknown>((current, part) => current == null ? undefined : (current as Record<string | number, unknown>)[part], source) as JsonValue | undefined;
}

function setAtPath<T>(source: T, path: Path, value: JsonValue): T {
  if (path.length === 0) return value as T;
  const [head, ...tail] = path;
  const clone = Array.isArray(source) ? [...source] : { ...(source as Record<string, unknown>) };
  (clone as Record<string | number, unknown>)[head] = setAtPath((source as Record<string | number, unknown>)[head], tail, value);
  return clone as T;
}

function collectFields(value: JsonValue, path: Path = [], labels: string[] = []): Omit<Field, "occurrences">[] {
  if (Array.isArray(value)) {
    return value.flatMap((child, index) => collectFields(child, [...path, index], [...labels, `Élément ${index + 1}`]));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => collectFields(child, [...path, key], [...labels, humanize(key)]));
  }
  const lastKey = String(path.at(-1) ?? "champ");
  return [{
    key: path.map(String).join("."),
    path,
    label: labels.slice(-3).join(" · "),
    image: /image|avatar|photo|logo|background/i.test(lastKey),
    background: /backgroundImageUrl/i.test(lastKey),
    multiline: /text|description|subtitle|excerpt|message|answer|content|quote/i.test(lastKey),
  }];
}

function seededAssets(assets: SectionAsset[], seed: string) {
  const result = [...assets];
  let state = [...seed].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const target = state % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function distributeBackgroundAssets(pages: SitePage[], assets: SectionAsset[], seed: string, replaceExisting: boolean) {
  if (assets.length === 0) return { pages, changed: 0 };
  const shuffled = seededAssets(assets, seed);
  const assetUrls = new Set(assets.map((asset) => asset.public_url));
  const slots: Array<{ pageId: string; sectionId: string; path: Path }> = [];
  for (const page of pages) {
    for (const section of page.sections) {
      if (!isGlobalEditableSection(section.type)) continue;
      for (const field of collectFields(section.fields as JsonValue)) {
        if (field.background) slots.push({ pageId: page.id, sectionId: section.id, path: field.path });
      }
    }
  }

  let nextPages = pages;
  let changed = 0;
  let cursor = 0;
  for (const slot of slots) {
    const currentValue = getAtPath(
      pages.find((page) => page.id === slot.pageId)?.sections.find((section) => section.id === slot.sectionId)?.fields,
      slot.path,
    );
    const nextUrl = !replaceExisting && typeof currentValue === "string" && assetUrls.has(currentValue)
      ? currentValue
      : shuffled[cursor % shuffled.length].public_url;
    cursor += 1;
    nextPages = nextPages.map((page) => ({
      ...page,
      sections: page.sections.map((section) => {
        if (page.id !== slot.pageId || section.id !== slot.sectionId || getAtPath(section.fields, slot.path) === undefined) return section;
        if (getAtPath(section.fields, slot.path) === nextUrl) return section;
        changed += 1;
        return { ...section, fields: setAtPath(section.fields, slot.path, nextUrl) } as SectionInstance;
      }),
    }));
  }
  return { pages: nextPages, changed };
}

function buildGroups(pages: SitePage[]): SectionGroup[] {
  const grouped = new Map<SectionInstance["type"], SectionOccurrence[]>();
  for (const page of pages) {
    for (const section of page.sections) {
      if (!isGlobalEditableSection(section.type)) continue;
      grouped.set(section.type, [...(grouped.get(section.type) ?? []), { pageTitle: page.title, section }]);
    }
  }
  return [...grouped.entries()].map(([type, occurrences]) => {
    const uniqueFields = new Map<string, Omit<Field, "occurrences">>();
    for (const occurrence of occurrences) {
      for (const field of collectFields(occurrence.section.fields as JsonValue)) {
        if (!uniqueFields.has(field.key)) uniqueFields.set(field.key, field);
      }
    }
    return {
      key: type,
      label: SECTION_LABELS[type],
      occurrences,
      fields: [...uniqueFields.values()].map((field) => ({
        ...field,
        occurrences: occurrences.filter((occurrence) => getAtPath(occurrence.section.fields, field.path) !== undefined).length,
      })),
    };
  }).sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export function GlobalSectionsEditor({ project, initialAssets }: { project: SectionsProject; initialAssets: SectionAsset[] }) {
  const router = useRouter();
  const [initialDistribution] = useState(() => distributeBackgroundAssets(
    ensureSiteHeaderDefaults(project.pages),
    initialAssets,
    `${project.key}:${initialAssets.map((asset) => asset.id).join(":")}`,
    false,
  ));
  const [pages, setPages] = useState(initialDistribution.pages);
  const [assets, setAssets] = useState(initialAssets);
  const groups = useMemo(() => buildGroups(pages), [pages]);
  const [selectedKey, setSelectedKey] = useState<SectionInstance["type"] | null>(null);
  const [query, setQuery] = useState("");
  const [fieldQuery, setFieldQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">(() => initialDistribution.changed > 0 ? "saving" : "idle");
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [message, setMessage] = useState(() => initialDistribution.changed > 0 ? "Répartition automatique des images Assets…" : "");
  const selectedGroup = groups.find((group) => group.key === selectedKey) ?? null;
  const filteredGroups = groups.filter((group) => `${group.label} ${group.key}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")));
  const visibleFields = selectedGroup?.fields.filter((field) => field.label.toLocaleLowerCase("fr").includes(fieldQuery.toLocaleLowerCase("fr"))) ?? [];

  useEffect(() => {
    if (initialDistribution.changed === 0) return;
    const controller = new AbortController();
    void fetch("/api/projects/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        projectKey: project.key,
        projectOwnerId: project.ownerId,
        projectName: project.name,
        pages: initialDistribution.pages,
      }),
    }).then(async (response) => {
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Répartition impossible.");
      setMessage(`${initialDistribution.changed} arrière-plan(s) attribué(s) depuis Assets.`);
      router.refresh();
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage(error instanceof Error ? error.message : "Répartition automatique impossible.");
    }).finally(() => { if (!controller.signal.aborted) setStatus("idle"); });
    return () => controller.abort();
  }, [initialDistribution, project.key, project.name, project.ownerId, router]);

  function updateGlobalField(group: SectionGroup, field: Field, value: JsonValue) {
    setPages((currentPages) => currentPages.map((page) => ({
      ...page,
      sections: page.sections.map((section) => {
        if (section.type !== group.key || getAtPath(section.fields, field.path) === undefined) return section;
        return { ...section, fields: setAtPath(section.fields, field.path, value) } as SectionInstance;
      }),
    })));
    setMessage("Modifications non enregistrées");
  }

  function redistribute() {
    const distribution = distributeBackgroundAssets(pages, assets, `${project.key}:${Date.now()}`, true);
    setPages(distribution.pages);
    setMessage(distribution.changed > 0 ? `${distribution.changed} arrière-plan(s) redistribué(s). Enregistrez pour confirmer.` : "Les arrière-plans utilisent déjà cette répartition.");
  }

  async function uploadForField(file: File, group: SectionGroup, field: Field) {
    const key = `${group.key}:${field.key}`;
    setUploadingKey(key);
    setMessage("");
    try {
      const prepared = await prepareImageForUpload(file);
      const body = new FormData();
      body.append("file", prepared);
      body.append("projectKey", project.key);
      body.append("projectOwnerId", project.ownerId);
      const response = await fetch("/api/assets", { method: "POST", body });
      const result = await response.json() as { asset?: SectionAsset; warning?: string | null; error?: string };
      if (!response.ok || !result.asset) throw new Error(result.error ?? "Import impossible.");
      setAssets((current) => [result.asset as SectionAsset, ...current]);
      updateGlobalField(group, field, result.asset.public_url);
      setPickerKey(null);
      setMessage(result.warning ? `Image ajoutée. ${result.warning}` : "Image ajoutée à Assets et sélectionnée. Enregistrez pour confirmer.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import impossible.");
    } finally {
      setUploadingKey(null);
    }
  }

  async function save() {
    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch("/api/projects/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectKey: project.key, projectOwnerId: project.ownerId, projectName: project.name, pages }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Enregistrement impossible.");
      setMessage("Toutes les occurrences ont été synchronisées.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <section className="mt-14 border-t border-black/[0.08] pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><Layers3 size={19} className="text-black/35" /><h2 className="font-serif text-[23px] sm:text-[25px]">Sections du site</h2></div>
          <p className="mt-1 max-w-2xl text-[13px] leading-5 text-black/45">Chaque composant est regroupé ici. Une variable modifiée est synchronisée sur toutes les pages qui utilisent ce composant.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] text-black/40">{groups.length} composant(s) global(aux)</span>
          <button type="button" onClick={redistribute} disabled={assets.length === 0 || status !== "idle"} className="flex h-9 items-center gap-2 rounded-[9px] border border-black/10 bg-white px-3 text-[11px] font-medium shadow-sm hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:opacity-40"><Shuffle size={13} />Répartir les images</button>
        </div>
      </div>
      <p className="mt-3 text-[10px] text-black/35">{assets.length > 0 ? `${assets.length} image(s) disponible(s) dans Assets. Les arrière-plans existants hors Assets sont remplacés automatiquement.` : "Aucun asset disponible : les images actuelles sont conservées jusqu’au premier import."}</p>

      <label className="mt-6 flex max-w-[633px] items-center gap-2 rounded-[10px] border border-[#d7dce4] px-3 py-2.5 focus-within:border-black/40">
        <Search size={15} className="text-black/45" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une section" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" />
      </label>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredGroups.map((group) => {
          const active = selectedKey === group.key;
          const pageNames = [...new Set(group.occurrences.map((item) => item.pageTitle))];
          return <button key={group.key} type="button" onClick={() => { setSelectedKey(active ? null : group.key); setFieldQuery(""); }} className={`${active ? "border-black/25 bg-white shadow-md" : "border-[#e8ecee] bg-[#f9f9f9] hover:-translate-y-0.5 hover:shadow-sm"} group min-h-[144px] rounded-[13px] border p-4 text-left transition`} aria-expanded={active}>
            <div className="flex items-start justify-between"><span className="grid size-9 place-items-center rounded-lg bg-white text-black/45 shadow-sm"><Variable size={17} /></span><ChevronDown size={16} className={`${active ? "rotate-180 text-black" : "text-black/25"} transition`} /></div>
            <p className="mt-4 text-[14px] font-semibold">{group.label}</p>
            <p className="mt-1 text-[11px] text-black/40">{group.fields.length} variable(s) · {group.occurrences.length} occurrence(s)</p>
            <p className="mt-2 truncate text-[10px] text-black/30" title={pageNames.join(", ")}>{pageNames.join(" · ")}</p>
          </button>;
        })}
      </div>
      {filteredGroups.length === 0 ? <div className="mt-4 rounded-[13px] border border-dashed border-black/15 p-8 text-center text-[13px] text-black/45">Aucune section ne correspond à « {query} ».</div> : null}

      {selectedGroup ? <div className="mt-5 overflow-hidden rounded-[14px] border border-[#e3e6e8] bg-white shadow-[0_12px_35px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-4 border-b border-black/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><p className="font-serif text-[21px]">{selectedGroup.label}</p><p className="mt-1 text-[11px] text-black/40">Les champs compatibles sont appliqués aux {selectedGroup.occurrences.length} occurrences de ce composant.</p></div>
          <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-3"><span className="min-w-0 text-[10px] text-black/40 min-[420px]:max-w-[240px] min-[420px]:truncate">{message}</span><button type="button" onClick={save} disabled={status !== "idle"} className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232_0%,#222_100%)] px-4 text-[13px] font-semibold text-white shadow-md disabled:opacity-50 min-[420px]:h-9 min-[420px]:w-auto min-[420px]:min-w-[124px]">{status === "saving" ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}{status === "saving" ? "Enregistrement…" : "Enregistrer"}</button></div>
        </div>
        <div className="border-b border-black/[0.07] p-4"><label className="flex max-w-sm items-center gap-2 rounded-[8px] bg-[#f6f6f6] px-3 py-2"><Search size={13} className="text-black/35" /><input value={fieldQuery} onChange={(event) => setFieldQuery(event.target.value)} placeholder="Rechercher une variable" className="min-w-0 flex-1 bg-transparent text-[11px] outline-none" /></label></div>
        <div className="grid gap-x-5 gap-y-4 p-4 sm:p-5 lg:grid-cols-2">
          {visibleFields.map((field) => {
            const value = selectedGroup.occurrences
              .map((occurrence) => getAtPath(occurrence.section.fields, field.path))
              .find((candidate) => candidate !== undefined);
            const editorKey = `${selectedGroup.key}:${field.key}`;
            const inputId = `section-${editorKey.replace(/[^a-zA-Z0-9-]/g, "-")}`;
            const currentAsset = assets.find((asset) => asset.public_url === value);
            return <div key={field.key} className="min-w-0">
              {field.background ? <span className="flex items-center justify-between gap-3 text-[11px] font-medium text-black/60"><span className="truncate" title={field.label}>{field.label}</span><span className="shrink-0 text-[9px] font-normal text-black/30">{field.occurrences} emplacement(s)</span></span> : <label htmlFor={inputId} className="flex items-center justify-between gap-3 text-[11px] font-medium text-black/60"><span className="truncate" title={field.label}>{field.label}</span><span className="shrink-0 text-[9px] font-normal text-black/30">{field.occurrences} emplacement(s)</span></label>}
              {field.background ? <div className="mt-2 rounded-[10px] border border-black/10 bg-[#fbfbfb] p-2.5">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[7px] bg-[#e8e8e8]">{value ? <img src={String(value)} alt={currentAsset?.alt_text ?? ""} className="size-full object-cover" /> : <ImageIcon size={15} className="text-black/25" />}</span>
                  <span className="min-w-[120px] flex-1"><strong className="block truncate text-[11px] font-medium">{currentAsset?.title ?? (assets.length ? "Image extérieure à Assets" : "Image actuelle")}</strong><span className="mt-1 block truncate text-[9px] text-black/35">{currentAsset ? "Bibliothèque Assets" : assets.length ? "Sera remplacée par un asset" : "Conservée faute d’asset"}</span></span>
                  {assets.length ? <button type="button" onClick={() => setPickerKey(pickerKey === editorKey ? null : editorKey)} className="h-8 rounded-[8px] border border-black/10 bg-white px-2.5 text-[10px] font-medium shadow-sm hover:bg-black/[0.02]">Choisir</button> : null}
                  <label className={`${uploadingKey === editorKey ? "pointer-events-none opacity-50" : "cursor-pointer"} flex h-8 items-center gap-1.5 rounded-[8px] bg-[#222] px-2.5 text-[10px] font-medium text-white`}><UploadCloud size={12} />{uploadingKey === editorKey ? "Import…" : "Importer"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploadingKey === editorKey} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadForField(file, selectedGroup, field); event.currentTarget.value = ""; }} /></label>
                </div>
                {pickerKey === editorKey && assets.length ? <div className="mt-3 grid max-h-56 grid-cols-2 gap-2 overflow-y-auto border-t border-black/[0.07] pt-3 min-[420px]:grid-cols-3 sm:grid-cols-4">
                  {assets.map((asset) => <button key={asset.id} type="button" onClick={() => { updateGlobalField(selectedGroup, field, asset.public_url); setPickerKey(null); }} className={`${asset.public_url === value ? "ring-2 ring-[#00bbfe] ring-offset-2" : "hover:ring-1 hover:ring-black/20"} group overflow-hidden rounded-[8px] bg-white text-left`} title={asset.alt_text}><img src={asset.public_url} alt={asset.alt_text} className="aspect-[4/3] w-full object-cover" /><span className="block truncate px-2 py-1.5 text-[9px]">{asset.title}</span></button>)}
                </div> : null}
                {assets.length === 0 ? <input id={inputId} value={value == null ? "" : String(value)} onChange={(event) => updateGlobalField(selectedGroup, field, event.target.value)} placeholder="URL de l’image" className="mt-2 h-8 w-full border-t border-black/[0.06] bg-transparent px-1 pt-2 text-[10px] outline-none" /> : null}
              </div>
                : field.image ? <div className="mt-2 flex min-h-12 items-center gap-3 rounded-[9px] border border-black/10 bg-[#fbfbfb] p-2 focus-within:border-black/25"><span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-[6px] bg-[#e8e8e8]">{value ? <img src={String(value)} alt="" className="size-full object-cover" /> : <ImageIcon size={14} className="text-black/25" />}</span><input id={inputId} value={value == null ? "" : String(value)} onChange={(event) => updateGlobalField(selectedGroup, field, event.target.value)} placeholder="URL de l’image" className="min-w-0 flex-1 bg-transparent text-[11px] outline-none" /></div>
                : typeof value === "boolean" ? <span className="mt-2 flex h-11 items-center rounded-[9px] border border-black/10 bg-[#fbfbfb] px-3"><input id={inputId} type="checkbox" checked={value} onChange={(event) => updateGlobalField(selectedGroup, field, event.target.checked)} className="size-4 accent-black" /></span>
                : field.multiline ? <textarea id={inputId} value={value == null ? "" : String(value)} onChange={(event) => updateGlobalField(selectedGroup, field, event.target.value)} rows={3} className="mt-2 w-full resize-y rounded-[9px] border border-black/10 bg-[#fbfbfb] px-3 py-2.5 text-[11px] leading-5 outline-none focus:border-black/25" />
                : <input id={inputId} value={value == null ? "" : String(value)} onChange={(event) => updateGlobalField(selectedGroup, field, typeof value === "number" ? Number(event.target.value) : event.target.value)} className="mt-2 h-11 w-full rounded-[9px] border border-black/10 bg-[#fbfbfb] px-3 text-[11px] outline-none focus:border-black/25" />}
            </div>;
          })}
        </div>
      </div> : null}
    </section>
  );
}
