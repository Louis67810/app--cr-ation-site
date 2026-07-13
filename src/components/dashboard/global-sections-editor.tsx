"use client";

import { Check, ChevronDown, ImageIcon, Layers3, LoaderCircle, Search, Variable } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { isGlobalEditableSection, SECTION_LABELS } from "@/lib/content-sections";
import type { SectionInstance, SitePage } from "@/lib/site-template";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type Path = Array<string | number>;
type Field = { key: string; label: string; path: Path; image: boolean; multiline: boolean; occurrences: number };
type SectionOccurrence = { pageTitle: string; section: SectionInstance };
type SectionGroup = { key: SectionInstance["type"]; label: string; occurrences: SectionOccurrence[]; fields: Field[] };
type SectionsProject = { key: string; ownerId: string; name: string; pages: SitePage[] };

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
    multiline: /text|description|subtitle|excerpt|message|answer|content|quote/i.test(lastKey),
  }];
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

export function GlobalSectionsEditor({ project }: { project: SectionsProject }) {
  const router = useRouter();
  const [pages, setPages] = useState(project.pages);
  const groups = useMemo(() => buildGroups(pages), [pages]);
  const [selectedKey, setSelectedKey] = useState<SectionInstance["type"] | null>(null);
  const [query, setQuery] = useState("");
  const [fieldQuery, setFieldQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [message, setMessage] = useState("");
  const selectedGroup = groups.find((group) => group.key === selectedKey) ?? null;
  const filteredGroups = groups.filter((group) => `${group.label} ${group.key}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")));
  const visibleFields = selectedGroup?.fields.filter((field) => field.label.toLocaleLowerCase("fr").includes(fieldQuery.toLocaleLowerCase("fr"))) ?? [];

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
          <div className="flex items-center gap-2"><Layers3 size={19} className="text-black/35" /><h2 className="font-serif text-[25px]">Sections du site</h2></div>
          <p className="mt-1 max-w-2xl text-[13px] leading-5 text-black/45">Chaque composant est regroupé ici. Une variable modifiée est synchronisée sur toutes les pages qui utilisent ce composant.</p>
        </div>
        <div className="text-[11px] text-black/40">{groups.length} composant(s) global(aux)</div>
      </div>

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
        <div className="flex flex-col gap-4 border-b border-black/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-serif text-[21px]">{selectedGroup.label}</p><p className="mt-1 text-[11px] text-black/40">Les champs compatibles sont appliqués aux {selectedGroup.occurrences.length} occurrences de ce composant.</p></div>
          <div className="flex items-center gap-3"><span className="max-w-[240px] truncate text-[10px] text-black/40">{message}</span><button type="button" onClick={save} disabled={status !== "idle"} className="flex h-9 min-w-[124px] items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232_0%,#222_100%)] px-4 text-[13px] font-semibold text-white shadow-md disabled:opacity-50">{status === "saving" ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}{status === "saving" ? "Enregistrement…" : "Enregistrer"}</button></div>
        </div>
        <div className="border-b border-black/[0.07] p-4"><label className="flex max-w-sm items-center gap-2 rounded-[8px] bg-[#f6f6f6] px-3 py-2"><Search size={13} className="text-black/35" /><input value={fieldQuery} onChange={(event) => setFieldQuery(event.target.value)} placeholder="Rechercher une variable" className="min-w-0 flex-1 bg-transparent text-[11px] outline-none" /></label></div>
        <div className="grid gap-x-5 gap-y-4 p-5 lg:grid-cols-2">
          {visibleFields.map((field) => {
            const value = selectedGroup.occurrences
              .map((occurrence) => getAtPath(occurrence.section.fields, field.path))
              .find((candidate) => candidate !== undefined);
            return <label key={field.key} className="min-w-0">
              <span className="flex items-center justify-between gap-3 text-[11px] font-medium text-black/60"><span className="truncate" title={field.label}>{field.label}</span><span className="shrink-0 text-[9px] font-normal text-black/30">{field.occurrences} emplacement(s)</span></span>
              {field.image ? <div className="mt-2 flex min-h-12 items-center gap-3 rounded-[9px] border border-black/10 bg-[#fbfbfb] p-2 focus-within:border-black/25"><span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-[6px] bg-[#e8e8e8]">{value ? <img src={String(value)} alt="" className="size-full object-cover" /> : <ImageIcon size={14} className="text-black/25" />}</span><input value={value == null ? "" : String(value)} onChange={(event) => updateGlobalField(selectedGroup, field, event.target.value)} placeholder="URL de l’image" className="min-w-0 flex-1 bg-transparent text-[11px] outline-none" /></div>
                : typeof value === "boolean" ? <span className="mt-2 flex h-11 items-center rounded-[9px] border border-black/10 bg-[#fbfbfb] px-3"><input type="checkbox" checked={value} onChange={(event) => updateGlobalField(selectedGroup, field, event.target.checked)} className="size-4 accent-black" /></span>
                : field.multiline ? <textarea value={value == null ? "" : String(value)} onChange={(event) => updateGlobalField(selectedGroup, field, event.target.value)} rows={3} className="mt-2 w-full resize-y rounded-[9px] border border-black/10 bg-[#fbfbfb] px-3 py-2.5 text-[11px] leading-5 outline-none focus:border-black/25" />
                : <input value={value == null ? "" : String(value)} onChange={(event) => updateGlobalField(selectedGroup, field, typeof value === "number" ? Number(event.target.value) : event.target.value)} className="mt-2 h-11 w-full rounded-[9px] border border-black/10 bg-[#fbfbfb] px-3 text-[11px] outline-none focus:border-black/25" />}
            </label>;
          })}
        </div>
      </div> : null}
    </section>
  );
}
