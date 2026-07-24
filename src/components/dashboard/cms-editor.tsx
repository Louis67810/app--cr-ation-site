"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  GripVertical,
  ImageIcon,
  LoaderCircle,
  MapPin,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CMS_SECTION_OWNERS,
  isDerivedCollectionField,
  isDerivedCollectionSection,
} from "@/lib/content-sections";
import { ArticleContentEditor } from "@/components/dashboard/article-content-editor";
import {
  getArticleDetail,
  synchronizeArticleCollections,
} from "@/lib/article-content";
import {
  ARTICLE_CATEGORY_STYLES,
  normalizeArticleCategory,
} from "@/lib/article-categories";
import type { SitePage } from "@/lib/site-template";

type CmsProject = {
  key: string;
  ownerId: string;
  name: string;
  pages: SitePage[];
  publishedAt: string | null;
};
type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type Path = Array<string | number>;
type ContentColumn = { key: string; label: string; path: Path; image: boolean };

const collections = [
  { id: "all", label: "Tout le contenu", match: () => true },
  {
    id: "realisations",
    label: "Réalisations",
    match: (page: SitePage) => page.slug.includes("realisation"),
  },
  {
    id: "articles",
    label: "Articles",
    match: (page: SitePage) => page.slug.includes("blog"),
  },
  {
    id: "prestations",
    label: "Prestations",
    match: (page: SitePage) => page.slug.includes("prestation"),
  },
  {
    id: "secteurs",
    label: "Secteurs",
    match: (page: SitePage) => page.slug.includes("secteur"),
  },
  {
    id: "zones",
    label: "Zones d’intervention",
    match: (page: SitePage) => page.slug.startsWith("/zones/"),
  },
  {
    id: "pages",
    label: "Pages",
    match: (page: SitePage) =>
      !["realisation", "blog", "prestation", "secteur", "/zones/"].some((part) =>
        page.slug.includes(part),
      ),
  },
] as const;

const hiddenKeys = new Set(["id", "type", "variant"]);
const humanize = (value: string) =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
const isImage = (key: string) => /image|avatar|photo|logo/i.test(key);

function setAtPath<T>(source: T, path: Path, value: JsonValue): T {
  if (path.length === 0) return value as T;
  const [head, ...tail] = path;
  const clone = Array.isArray(source)
    ? [...source]
    : { ...(source as Record<string, unknown>) };
  (clone as Record<string | number, unknown>)[head] = setAtPath(
    (source as Record<string | number, unknown>)[head],
    tail,
    value,
  );
  return clone as T;
}

function getAtPath(source: unknown, path: Path): JsonValue | undefined {
  return path.reduce<unknown>(
    (current, part) =>
      current == null
        ? undefined
        : (current as Record<string | number, unknown>)[part],
    source,
  ) as JsonValue | undefined;
}

function collectColumns(
  value: JsonValue,
  path: Path = [],
  labels: string[] = [],
  sectionType?: SitePage["sections"][number]["type"],
  sectionFieldPath: Path = [],
): ContentColumn[] {
  if (
    sectionType &&
    sectionFieldPath.length > 0 &&
    isDerivedCollectionField(sectionType, sectionFieldPath)
  )
    return [];
  if (Array.isArray(value)) {
    return value.flatMap((child, index) =>
      collectColumns(
        child,
        [...path, index],
        [...labels, `${index + 1}`],
        sectionType,
        [...sectionFieldPath, index],
      ),
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      hiddenKeys.has(key)
        ? []
        : collectColumns(
            child,
            [...path, key],
            [...labels, humanize(key)],
            sectionType,
            [...sectionFieldPath, key],
          ),
    );
  }
  const lastKey = String(path.at(-1) ?? "champ");
  return [
    {
      key: path.join("."),
      path,
      label: labels.slice(-3).join(" · "),
      image: isImage(lastKey),
    },
  ];
}

function cellWidth(column: ContentColumn) {
  return column.image
    ? "110px"
    : /text|description|subtitle|excerpt|message/i.test(column.key)
      ? "280px"
      : "190px";
}

function slugifyEntry(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "nouvelle-zone"
  );
}

function entryPresentation(page: SitePage, collectionId: string) {
  const detail = page.sections.find(
    (section) => section.type === "realisation-detail",
  );
  if (detail?.type === "realisation-detail") {
    return {
      title: detail.fields.title,
      subtitle: detail.fields.subtitle,
      image: detail.fields.heroImageUrl,
      meta: detail.fields.breadcrumbs.at(-1)?.label || "Ville non renseignée",
    };
  }
  const service = page.sections.find(
    (section) => section.type === "services-hub-hero",
  );
  if (service?.type === "services-hub-hero") {
    return {
      title: service.fields.title,
      subtitle: service.fields.subtitle,
      image: service.fields.backgroundImageUrl,
      meta: "Prestation",
    };
  }
  const sector = page.sections.find(
    (section) => section.type === "sector-hero",
  );
  if (sector?.type === "sector-hero") {
    return {
      title: sector.fields.title,
      subtitle: sector.fields.subtitle,
      image: sector.fields.tickerImages[0]?.imageUrl ?? "",
      meta: "Secteur",
    };
  }
  const hero = page.sections.find((section) => section.type === "hero");
  if (hero?.type === "hero") {
    return {
      title: hero.fields.title,
      subtitle: hero.fields.subtitle,
      image: hero.fields.backgroundImageUrl,
      meta:
        collectionId === "zones"
          ? "Zone d’intervention"
          : "Page du site",
    };
  }
  return {
    title: page.title,
    subtitle: page.slug,
    image: "",
    meta: collectionId,
  };
}

function isEditableSection(
  section: SitePage["sections"][number],
  collectionId: string,
) {
  if (section.type === "site-header" || section.type === "site-footer")
    return false;
  if (section.type === "blog-advice" || section.type === "blog-index")
    return false;
  if (isDerivedCollectionSection(section.type)) return false;
  if (collectionId === "all") return false;
  if (collectionId === "zones") return section.type === "hero";
  if (section.type === "article-detail" && collectionId !== "articles")
    return false;
  const owner = CMS_SECTION_OWNERS[section.type];
  if (!owner) return false;
  return owner === collectionId;
}

export function CmsEditor({
  project,
  canOpenBuilder,
}: {
  project: CmsProject;
  canOpenBuilder: boolean;
}) {
  const [pages, setPages] = useState(project.pages);
  const [collectionId, setCollectionId] = useState("articles");
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "publishing">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const collection =
    collections.find((item) => item.id === collectionId) ?? collections[0];
  const rows = useMemo(
    () =>
      pages.filter(
        (page) =>
          collection.match(page) &&
          (collectionId !== "realisations" ||
            page.slug !== "/realisations") &&
          (collectionId !== "prestations" || page.slug !== "/prestations") &&
          `${page.title} ${page.slug}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [collection, collectionId, pages, query],
  );
  const columns = useMemo(() => {
    const seen = new Set<string>();
    return rows
      .flatMap((page) => [
        { key: "title", label: "Titre", path: ["title"], image: false },
        { key: "slug", label: "Slug", path: ["slug"], image: false },
        ...page.sections.flatMap((section, index) =>
          isEditableSection(section, collectionId)
            ? collectColumns(
                section.fields as unknown as JsonValue,
                ["sections", index, "fields"],
                [humanize(section.type)],
                section.type,
              )
            : [],
        ),
      ])
      .filter(
        (column) => !seen.has(column.key) && Boolean(seen.add(column.key)),
      );
  }, [collectionId, rows]);
  const articleRows = useMemo(
    () =>
      rows.filter(
        (page) => page.slug.startsWith("/blog/") && getArticleDetail(page),
      ),
    [rows],
  );
  const activeArticle =
    pages.find((page) => page.id === activeArticleId) ?? null;
  const activeEntry = pages.find((page) => page.id === activeEntryId) ?? null;

  function updateCell(pageId: string, path: Path, value: JsonValue) {
    setPages((current) =>
      current.map((page) =>
        page.id === pageId ? setAtPath(page, path, value) : page,
      ),
    );
    setMessage("Modifications non enregistrées");
  }

  function addZone(cityName: string) {
    const city = cityName.trim();
    if (!city) return;
    const slug = `/zones/${slugifyEntry(city)}`;
    const existing = pages.find((page) => page.slug === slug);
    if (existing) {
      setActiveEntryId(existing.id);
      return;
    }
    const template =
      pages.find((page) => page.slug.startsWith("/zones/")) ??
      pages.find((page) => page.slug === "/");
    if (!template) return;
    const id = `zone-${slugifyEntry(city)}-${Date.now()}`;
    const page = structuredClone(template);
    page.id = id;
    page.slug = slug;
    page.title = `Paysagiste à ${city}`;
    delete page.editorial;
    page.sections = page.sections.map((section, index) => {
      const next = structuredClone(section);
      next.id = `${id}-${index + 1}`;
      if (next.type === "hero") {
        next.fields = {
          ...next.fields,
          title: `Paysagiste à ${city}`,
          subtitle: `Découvrez nos prestations paysagères autour de ${city}.`,
        };
      }
      if (next.type === "recent-projects") {
        next.fields = { ...next.fields, cities: [city], projects: [] };
      }
      return next;
    });
    setPages((current) => [...current, page]);
    setActiveEntryId(id);
    setMessage("Nouvelle ville non enregistrée");
  }

  async function save(nextStatus: "saving" | "publishing" = "saving") {
    setStatus(nextStatus);
    setMessage("");
    const synchronizedPages = synchronizeArticleCollections(pages);
    const response = await fetch("/api/projects/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectKey: project.key,
        projectOwnerId: project.ownerId,
        projectName: project.name,
        pages: synchronizedPages,
      }),
    });
    const result = (await response.json()) as {
      error?: string;
      pages?: SitePage[];
    };
    if (!response.ok) {
      setStatus("idle");
      setMessage(result.error ?? "Enregistrement impossible");
      return false;
    }
    const savedPages = result.pages ?? synchronizedPages;
    setPages(savedPages);
    if (nextStatus === "saving") {
      setStatus("idle");
      setMessage("Contenu synchronisé");
    }
    return savedPages;
  }

  async function play() {
    if (await save())
      window.open(
        `/builder?project=${encodeURIComponent(project.key)}`,
        "_blank",
        "noopener,noreferrer",
      );
  }

  async function publish() {
    const savedPages = await save("publishing");
    if (!savedPages) return;
    const pagesToPublish = synchronizeArticleCollections(savedPages);
    const response = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectKey: project.key,
        projectOwnerId: project.ownerId,
        projectName: project.name,
        pages: pagesToPublish,
      }),
    });
    const result = (await response.json()) as {
      url?: string;
      error?: string;
      pages?: SitePage[];
    };
    if (result.pages) setPages(result.pages);
    setStatus("idle");
    setMessage(
      response.ok ? "Publié" : (result.error ?? "Publication impossible"),
    );
    if (response.ok && result.url)
      window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white font-[var(--font-inter)] text-[#1c1c1c]">
      <header className="grid min-h-[92px] shrink-0 grid-cols-[1fr_auto] grid-rows-2 items-center gap-x-2 border-b border-[#e8e8e8] px-2 py-1.5 sm:h-12 sm:min-h-0 sm:grid-cols-[1fr_auto_1fr] sm:grid-rows-1 sm:px-3 sm:py-0">
        <Link
          href={`/dashboard?project=${encodeURIComponent(project.key)}`}
          className="col-start-1 row-start-1 flex h-8 w-fit items-center gap-2 rounded-[8px] bg-white px-2 text-[11px] font-semibold text-[#222] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.08)] sm:text-[12px]"
        >
          <span className="flex size-5 items-center justify-center rounded-[5px] bg-[#f6f6f6] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
            <ArrowLeft size={13} />
          </span>
          Retour
        </Link>
        <div className="relative col-span-2 col-start-1 row-start-2 justify-self-center sm:col-span-1 sm:col-start-2 sm:row-start-1">
          <button
            type="button"
            onClick={() => setCollectionOpen((current) => !current)}
            className="flex items-center gap-2 px-3 py-2 font-serif text-[12px]"
          >
            {collection.label}
            <ChevronDown size={13} className="opacity-70" />
          </button>
          {collectionOpen ? (
            <div className="absolute left-1/2 top-full z-40 w-48 -translate-x-1/2 rounded-[8px] border border-black/10 bg-white p-1 shadow-xl">
              {collections.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCollectionId(item.id);
                    setActiveEntryId(null);
                    setActiveArticleId(null);
                    setCollectionOpen(false);
                  }}
                  className={`${item.id === collectionId ? "bg-black/[0.05]" : "hover:bg-black/[0.03]"} flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[11px]`}
                >
                  <span>{item.label}</span>
                  {item.id === collectionId ? <Check size={12} /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 sm:col-start-3">
          <span className="mr-2 hidden text-[10px] text-black/40 xl:block">
            {message}
          </span>
          {canOpenBuilder ? (
            <button
              type="button"
              onClick={play}
              disabled={status !== "idle"}
              aria-label="Prévisualiser le CMS"
              className="flex size-8 items-center justify-center rounded-[9px] bg-[#f3f3f3] text-[#222] hover:bg-[#eee] disabled:opacity-50"
            >
              <Play size={15} fill="currentColor" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={publish}
            disabled={status !== "idle"}
            className="flex h-9 w-[98px] items-center justify-center gap-1.5 rounded-[10px] bg-[linear-gradient(180deg,#323232_0%,#222222_100%)] px-3 py-2 text-[12px] font-semibold leading-5 tracking-[-0.02em] text-[#fcfcfc] shadow-[0_2px_4px_-1px_rgba(13,13,13,0.5),0_0_0_1px_#333333,inset_0_0.5px_1px_rgba(255,255,255,0.15),inset_0_-1px_1.2px_0.35px_#121212] hover:brightness-110 disabled:opacity-50 sm:w-[141px] sm:px-5 sm:text-[14px]"
          >
            {status === "publishing" ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : null}
            Publier
          </button>
        </div>
      </header>
      <div className="flex min-h-11 shrink-0 items-center gap-2 border-b border-black/[0.07] px-3 sm:h-10 sm:min-h-0 sm:px-4">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-black/35">
          <Search size={13} className="shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher dans la collection"
            className="min-w-0 flex-1 bg-transparent text-[10px] outline-none sm:w-48 sm:flex-none"
          />
        </label>
        <button
          type="button"
          onClick={() => save()}
          disabled={status !== "idle"}
          className="shrink-0 text-[10px] font-medium text-black/50 hover:text-black"
        >
          {status === "saving" ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      {message ? (
        <div className="shrink-0 border-b border-black/[0.06] px-3 py-1.5 text-[9px] text-black/45 xl:hidden">
          {message}
        </div>
      ) : null}
      {collectionId === "articles" ? (
        <ArticleCollection
          pages={articleRows}
          onOpen={(page) => setActiveArticleId(page.id)}
        />
      ) : (
        <>
          <EntryCollection
            pages={rows}
            collectionId={collectionId}
            collectionLabel={collection.label}
            onOpen={(page) => setActiveEntryId(page.id)}
            onAddZone={addZone}
          />
          <div className="hidden">
          <table className="w-max min-w-full table-fixed border-collapse text-[10px]">
            <colgroup>
              <col className="w-[34px]" />
              <col className="w-[155px]" />
              <col className="w-[110px]" />
              {columns.map((column) => (
                <col key={column.key} style={{ width: cellWidth(column) }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-20 bg-white text-left text-black/45">
              <tr className="h-10 border-b border-black/[0.07]">
                <th />
                <th className="border-r border-black/[0.07] px-3 font-medium">
                  Entrée
                </th>
                <th className="border-r border-black/[0.07] px-3 font-medium">
                  Aperçu
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="border-r border-black/[0.07] px-3 font-medium"
                  >
                    <span
                      className="block max-w-[250px] truncate"
                      title={column.label}
                    >
                      {column.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((page) => {
                const firstImage = columns.find(
                  (column) =>
                    column.image &&
                    typeof getAtPath(page, column.path) === "string",
                );
                const preview = firstImage
                  ? String(getAtPath(page, firstImage.path) ?? "")
                  : "";
                return (
                  <tr
                    key={page.id}
                    className="h-[74px] border-b border-black/[0.07] bg-white hover:bg-[#fcfcfb]"
                  >
                    <td className="text-center text-black/20">
                      <GripVertical size={13} className="mx-auto" />
                    </td>
                    <td className="border-r border-black/[0.07] px-3 font-serif text-[11px]">
                      <span className="block max-w-[130px] truncate">
                        {page.title}
                      </span>
                    </td>
                    <td className="border-r border-black/[0.07] px-3">
                      {preview ? (
                        <img
                          src={preview}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-[45px] w-[62px] rounded-[5px] border border-black/[0.07] object-cover"
                        />
                      ) : (
                        <span className="grid h-[45px] w-[62px] place-items-center rounded-[5px] bg-[#d9d9d9] text-black/20">
                          <ImageIcon size={14} />
                        </span>
                      )}
                    </td>
                    {columns.map((column) => {
                      const value = getAtPath(page, column.path);
                      const exists = value !== undefined;
                      return (
                        <td
                          key={column.key}
                          className="border-r border-black/[0.07] p-0"
                        >
                          {exists ? (
                            column.image ? (
                              <label className="flex h-[74px] cursor-pointer items-center gap-2 px-3">
                                <span className="grid h-[45px] w-[62px] shrink-0 place-items-center overflow-hidden rounded-[5px] bg-[#d9d9d9]">
                                  {value ? (
                                    <img
                                      src={String(value)}
                                      alt=""
                                      loading="lazy"
                                      decoding="async"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <ImageIcon
                                      size={14}
                                      className="text-black/20"
                                    />
                                  )}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute h-px w-px opacity-0"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = () =>
                                      updateCell(
                                        page.id,
                                        column.path,
                                        String(reader.result),
                                      );
                                    reader.readAsDataURL(file);
                                  }}
                                />
                              </label>
                            ) : typeof value === "boolean" ? (
                              <label className="grid h-[74px] place-items-center">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={(event) =>
                                    updateCell(
                                      page.id,
                                      column.path,
                                      event.target.checked,
                                    )
                                  }
                                  className="size-4 accent-black"
                                />
                              </label>
                            ) : (
                              <input
                                value={value == null ? "" : String(value)}
                                onChange={(event) =>
                                  updateCell(
                                    page.id,
                                    column.path,
                                    typeof value === "number"
                                      ? Number(event.target.value)
                                      : event.target.value,
                                  )
                                }
                                className="h-[74px] w-full bg-transparent px-3 text-[10px] outline-none focus:bg-[#fffdf5]"
                              />
                            )
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <div className="grid h-48 place-items-center text-[11px] text-black/35">
              Aucune entrée dans cette collection.
            </div>
          ) : null}
          </div>
        </>
      )}
      {activeArticle ? (
        <ArticleContentEditor
          page={activeArticle}
          projectKey={project.key}
          projectOwnerId={project.ownerId}
          onChange={(updated) => {
            setPages((current) =>
              current.map((page) => (page.id === updated.id ? updated : page)),
            );
            setMessage("Modifications non enregistrées");
          }}
          onClose={() => setActiveArticleId(null)}
        />
      ) : null}
      {activeEntry ? (
        <EntryDetailEditor
          page={activeEntry}
          collectionId={collectionId}
          allPages={pages}
          onChange={(path, value) => updateCell(activeEntry.id, path, value)}
          onClose={() => setActiveEntryId(null)}
        />
      ) : null}
    </section>
  );
}

function EntryCollection({
  pages,
  collectionId,
  collectionLabel,
  onOpen,
  onAddZone,
}: {
  pages: SitePage[];
  collectionId: string;
  collectionLabel: string;
  onOpen: (page: SitePage) => void;
  onAddZone: (city: string) => void;
}) {
  const [addingZone, setAddingZone] = useState(false);
  const [city, setCity] = useState("");

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-auto bg-[#fafaf8] p-4 [scrollbar-gutter:stable] sm:p-7">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-[24px]">{collectionLabel}</h2>
            <p className="mt-1 text-[10px] text-black/40">
              Ouvre une fiche pour modifier ses informations et son contenu.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-[10px] text-black/40 shadow-sm">
              {pages.length} entrée{pages.length > 1 ? "s" : ""}
            </span>
            {collectionId === "zones" ? (
              <button
                type="button"
                onClick={() => setAddingZone((current) => !current)}
                className="flex h-8 items-center gap-1.5 rounded-[9px] bg-[#222] px-3 text-[10px] font-semibold text-white"
              >
                <Plus size={13} />
                Ajouter une ville
              </button>
            ) : null}
          </div>
        </div>

        {addingZone ? (
          <form
            className="mb-4 flex gap-2 rounded-[14px] border border-black/[0.07] bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!city.trim()) return;
              onAddZone(city);
              setCity("");
              setAddingZone(false);
            }}
          >
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[9px] bg-[#f5f5f3] px-3">
              <MapPin size={14} className="text-black/35" />
              <input
                autoFocus
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Nom de la ville"
                className="h-10 min-w-0 flex-1 bg-transparent text-[12px] outline-none"
              />
            </label>
            <button
              type="submit"
              className="rounded-[9px] bg-[#222] px-4 text-[11px] font-semibold text-white"
            >
              Créer
            </button>
          </form>
        ) : null}

        <div className="overflow-hidden rounded-[16px] border border-black/[0.07] bg-white">
          {pages.map((page) => {
            const presentation = entryPresentation(page, collectionId);
            return (
              <button
                key={page.id}
                type="button"
                onClick={() => onOpen(page)}
                className="grid min-h-[92px] w-full grid-cols-[82px_minmax(0,1fr)_auto] items-center gap-4 border-b border-black/[0.06] px-4 text-left transition last:border-0 hover:bg-[#fcfcfa] sm:grid-cols-[96px_minmax(0,1fr)_180px]"
              >
                {presentation.image ? (
                  <img
                    src={presentation.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-[62px] w-[82px] rounded-[9px] object-cover sm:w-[96px]"
                  />
                ) : (
                  <span className="grid h-[62px] w-[82px] place-items-center rounded-[9px] bg-[#e8e8e3] text-black/20 sm:w-[96px]">
                    <ImageIcon size={18} />
                  </span>
                )}
                <span className="min-w-0">
                  <strong className="block truncate text-[13px]">
                    {presentation.title}
                  </strong>
                  <span className="mt-1 block truncate text-[10px] leading-4 text-black/40">
                    {presentation.subtitle}
                  </span>
                </span>
                <span className="hidden items-center justify-end gap-2 text-[10px] text-black/40 sm:flex">
                  {collectionId === "zones" ||
                  collectionId === "realisations" ? (
                    <MapPin size={13} />
                  ) : null}
                  {presentation.meta}
                </span>
              </button>
            );
          })}
          {!pages.length ? (
            <div className="p-16 text-center text-[11px] text-black/35">
              Aucune entrée dans cette collection.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EntryDetailEditor({
  page,
  collectionId,
  allPages,
  onChange,
  onClose,
}: {
  page: SitePage;
  collectionId: string;
  allPages: SitePage[];
  onChange: (path: Path, value: JsonValue) => void;
  onClose: () => void;
}) {
  const presentation = entryPresentation(page, collectionId);
  const detailSectionIndex = page.sections.findIndex(
    (section) => section.type === "realisation-detail",
  );
  const detail =
    detailSectionIndex >= 0 ? page.sections[detailSectionIndex] : undefined;
  const currentCity =
    detail?.type === "realisation-detail"
      ? detail.fields.breadcrumbs.at(-1)?.label ?? ""
      : "";
  const cityBreadcrumbIndex =
    detail?.type === "realisation-detail"
      ? detail.fields.breadcrumbs.length - 1
      : -1;
  const zoneHeroIndex = page.sections.findIndex(
    (section) => section.type === "hero",
  );
  const zoneHero =
    zoneHeroIndex >= 0 ? page.sections[zoneHeroIndex] : undefined;
  const zoneCity =
    collectionId === "zones"
      ? (zoneHero?.type === "hero" ? zoneHero.fields.title : page.title)
          .replace(/^paysagiste\s+[àa]\s+/i, "")
          .trim()
      : "";
  const knownCities = Array.from(
    new Set(
      allPages
        .map((candidate) => {
          const candidateDetail = candidate.sections.find(
            (section) => section.type === "realisation-detail",
          );
          return candidateDetail?.type === "realisation-detail"
            ? candidateDetail.fields.breadcrumbs.at(-1)?.label
            : undefined;
        })
        .filter((city): city is string => Boolean(city)),
    ),
  );

  const editableSections = page.sections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => isEditableSection(section, collectionId));

  return (
    <div className="absolute inset-0 z-50 flex min-h-0 flex-col bg-[#fafaf8]">
      <header className="flex min-h-[74px] shrink-0 items-center justify-between gap-4 border-b border-black/[0.07] bg-white px-4 sm:px-7">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 items-center gap-2 rounded-[9px] bg-[#f3f3f3] px-3 text-[11px] font-semibold"
        >
          <ArrowLeft size={14} />
          Retour
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate font-serif text-[17px]">
            {presentation.title}
          </p>
          <p className="mt-1 truncate text-[9px] text-black/35">{page.slug}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="grid size-9 place-items-center rounded-[9px] bg-[#f3f3f3]"
        >
          <X size={15} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
        <div className="mx-auto grid max-w-[1120px] gap-5">
          <section className="rounded-[18px] border border-black/[0.07] bg-white p-5 sm:p-7">
            <h3 className="font-serif text-[21px]">Informations générales</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <CmsTextField
                label="Nom dans le CMS"
                value={page.title}
                onChange={(value) => onChange(["title"], value)}
              />
              <CmsTextField
                label="Slug"
                value={page.slug}
                onChange={(value) => onChange(["slug"], value)}
              />
              {collectionId === "zones" && zoneHero?.type === "hero" ? (
                <CmsTextField
                  label="Ville"
                  value={zoneCity}
                  onChange={(value) => {
                    onChange(["title"], `Paysagiste à ${value}`);
                    onChange(["slug"], `/zones/${slugifyEntry(value)}`);
                    onChange(
                      ["sections", zoneHeroIndex, "fields", "title"],
                      `Paysagiste à ${value}`,
                    );
                  }}
                />
              ) : null}
              {detail?.type === "realisation-detail" &&
              cityBreadcrumbIndex >= 0 ? (
                <label className="grid gap-2">
                  <span className="text-[10px] font-semibold text-black/50">
                    Ville
                  </span>
                  <input
                    list="cms-known-cities"
                    value={currentCity}
                    onChange={(event) =>
                      onChange(
                        [
                          "sections",
                          detailSectionIndex,
                          "fields",
                          "breadcrumbs",
                          cityBreadcrumbIndex,
                          "label",
                        ],
                        event.target.value,
                      )
                    }
                    className="h-11 rounded-[10px] border border-black/10 bg-[#f7f7f5] px-3 text-[12px] outline-none focus:border-black/25"
                  />
                  <datalist id="cms-known-cities">
                    {knownCities.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </label>
              ) : null}
            </div>
          </section>

          {editableSections.map(({ section, index }) => {
            const fields = collectColumns(
              section.fields as unknown as JsonValue,
              ["sections", index, "fields"],
              [humanize(section.type)],
              section.type,
            ).filter(
              (field) =>
                !(
                  section.type === "realisation-detail" &&
                  field.key.includes(".breadcrumbs.")
                ),
            );
            if (!fields.length) return null;
            return (
              <section
                key={section.id}
                className="rounded-[18px] border border-black/[0.07] bg-white p-5 sm:p-7"
              >
                <div>
                  <h3 className="font-serif text-[21px]">
                    {humanize(section.type)}
                  </h3>
                  <p className="mt-1 text-[9px] text-black/35">
                    Texte, images et contenu propres à cette fiche.
                  </p>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {fields.map((field) => {
                    const value = getAtPath(page, field.path);
                    if (value === undefined) return null;
                    if (field.image) {
                      return (
                        <label
                          key={field.key}
                          className="grid cursor-pointer gap-2"
                        >
                          <span className="text-[10px] font-semibold text-black/50">
                            {field.label}
                          </span>
                          <span className="relative grid min-h-[170px] place-items-center overflow-hidden rounded-[12px] bg-[#e8e8e3]">
                            {value ? (
                              <img
                                src={String(value)}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="absolute inset-0 size-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={20} className="text-black/20" />
                            )}
                            <span className="relative z-10 rounded-full bg-black/70 px-3 py-1.5 text-[9px] font-semibold text-white">
                              Remplacer l’image
                            </span>
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () =>
                                onChange(field.path, String(reader.result));
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                      );
                    }
                    if (typeof value === "boolean") {
                      return (
                        <label
                          key={field.key}
                          className="flex h-11 items-center justify-between rounded-[10px] bg-[#f7f7f5] px-3 text-[10px] font-semibold text-black/50"
                        >
                          {field.label}
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(event) =>
                              onChange(field.path, event.target.checked)
                            }
                            className="size-4 accent-black"
                          />
                        </label>
                      );
                    }
                    return (
                      <CmsTextField
                        key={field.key}
                        label={field.label}
                        value={value == null ? "" : String(value)}
                        multiline={
                          String(value ?? "").length > 90 ||
                          /description|subtitle|text|message/i.test(field.key)
                        }
                        onChange={(nextValue) =>
                          onChange(
                            field.path,
                            typeof value === "number"
                              ? Number(nextValue)
                              : nextValue,
                          )
                        }
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CmsTextField({
  label,
  value,
  multiline = false,
  onChange,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-semibold text-black/50">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="resize-y rounded-[10px] border border-black/10 bg-[#f7f7f5] px-3 py-3 text-[12px] leading-5 outline-none focus:border-black/25"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-[10px] border border-black/10 bg-[#f7f7f5] px-3 text-[12px] outline-none focus:border-black/25"
        />
      )}
    </label>
  );
}

function ArticleCollection({
  pages,
  onOpen,
}: {
  pages: SitePage[];
  onOpen: (page: SitePage) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-auto bg-[#fafaf8] p-4 [scrollbar-gutter:stable] sm:p-7">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-[24px]">Articles</h2>
            <p className="mt-1 text-[10px] text-black/40">
              Double-clique sur un article pour modifier son contenu structuré.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] text-black/40 shadow-sm">
            {pages.length} articles
          </span>
        </div>
        <div className="overflow-hidden rounded-[16px] border border-black/[0.07] bg-white">
          {pages.map((page) => {
            const detail = getArticleDetail(page);
            if (!detail) return null;
            const category = normalizeArticleCategory(
              page.editorial?.category,
              detail.fields.title,
            );
            return (
              <button
                key={page.id}
                type="button"
                onDoubleClick={() => onOpen(page)}
                onClick={() => onOpen(page)}
                className="grid min-h-[82px] w-full grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-4 border-b border-black/[0.06] px-4 text-left transition last:border-0 hover:bg-[#fcfcfa] sm:grid-cols-[82px_minmax(0,1fr)_150px_130px]"
              >
                <div
                  className="h-[52px] w-[72px] rounded-[8px] bg-[#deded9] bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${detail.fields.thumbnailImageUrl || detail.fields.heroImageUrl})`,
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">
                    {detail.fields.title}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-black/35">
                    {page.slug}
                  </p>
                </div>
                <span
                  className="hidden rounded-full px-3 py-1.5 text-center text-[10px] sm:block"
                  style={ARTICLE_CATEGORY_STYLES[category]}
                >
                  {category}
                </span>
                <div className="text-right">
                  <p className="text-[10px] text-black/45">
                    {detail.fields.updatedAt}
                  </p>
                  <p className="mt-1 text-[9px] text-black/25">
                    {detail.fields.blocks.length} blocs
                  </p>
                </div>
              </button>
            );
          })}
          {!pages.length ? (
            <div className="p-16 text-center text-[11px] text-black/35">
              Aucun article dans cette collection.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
