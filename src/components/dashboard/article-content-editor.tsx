"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  GripVertical,
  Heading2,
  ImageIcon,
  LayoutGrid,
  Lightbulb,
  Link2,
  MessageSquareQuote,
  Pilcrow,
  Plus,
  Puzzle,
  RefreshCw,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { getArticleDetail, touchArticlePage } from "@/lib/article-content";
import {
  ARTICLE_CATEGORIES,
  normalizeArticleCategory,
} from "@/lib/article-categories";
import type {
  ArticleBlock,
  ArticleDetailFields,
  SitePage,
} from "@/lib/site-template";

type BlockKind = ArticleBlock["kind"];

const blockChoices: Array<{
  kind: BlockKind;
  label: string;
  icon: typeof Pilcrow;
}> = [
  { kind: "paragraph", label: "Paragraphe", icon: Pilcrow },
  { kind: "heading", label: "Titre", icon: Heading2 },
  { kind: "image", label: "Image", icon: ImageIcon },
  { kind: "callout", label: "Encadré", icon: Lightbulb },
  { kind: "table", label: "Tableau", icon: Table2 },
  { kind: "cards", label: "Cases", icon: LayoutGrid },
  { kind: "link", label: "Lien", icon: Link2 },
  { kind: "quiz", label: "Quiz", icon: Puzzle },
];

function newBlock(kind: BlockKind, quizId?: string): ArticleBlock {
  const id = crypto.randomUUID();
  if (kind === "heading")
    return { id, kind, level: "h2", text: "Nouveau titre" };
  if (kind === "image")
    return {
      id,
      kind,
      imageUrl: "",
      alt: "",
      caption: "",
      size: "full",
      alignment: "center",
    };
  if (kind === "callout")
    return {
      id,
      kind,
      title: "À retenir",
      text: "Ajoutez ici l’information importante.",
      variant: "highlight",
      icon: "lightbulb",
    };
  if (kind === "table")
    return {
      id,
      kind,
      title: "Nouveau tableau",
      columns: ["Colonne 1", "Colonne 2"],
      rows: [["Valeur", "Valeur"]],
      variant: "default",
    };
  if (kind === "cards")
    return {
      id,
      kind,
      title: "",
      columns: 2,
      variant: "default",
      cards: [
        {
          icon: "leaf",
          title: "Première case",
          text: "Description de la case.",
        },
        {
          icon: "lightbulb",
          title: "Deuxième case",
          text: "Description de la case.",
        },
      ],
    };
  if (kind === "link")
    return {
      id,
      kind,
      text: "Pour aller plus loin :",
      label: "Découvrir la page",
      href: "/",
    };
  if (kind === "quiz") return { id, kind, quizId: quizId ?? "" };
  return { id, kind: "paragraph", text: "Nouveau paragraphe", size: "medium" };
}

function withBlockIds(blocks: ArticleBlock[]) {
  return blocks.map((block) =>
    block.id ? block : { ...block, id: crypto.randomUUID() },
  );
}

function normalizeSlug(value: string) {
  const clean = value
    .trim()
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/+/, "");
  return clean.startsWith("blog/")
    ? `/${clean}`
    : `/blog/${clean.replace(/^blog\/?/, "")}`;
}

const inputClass =
  "mt-1.5 h-10 w-full rounded-[9px] border border-black/10 bg-white px-3 text-[12px] outline-none focus:border-black/25";
const textareaClass =
  "mt-1.5 min-h-[112px] w-full resize-y rounded-[9px] border border-black/10 bg-white p-3 text-[12px] leading-5 outline-none focus:border-black/25";
const labelClass =
  "block text-[10px] font-semibold uppercase tracking-[.05em] text-black/40";

export function ArticleContentEditor({
  page,
  projectKey,
  projectOwnerId,
  onChange,
  onClose,
}: {
  page: SitePage;
  projectKey: string;
  projectOwnerId: string;
  onChange: (page: SitePage) => void;
  onClose: () => void;
}) {
  const detail = getArticleDetail(page);
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(
    detail?.fields.blocks[0]?.id ?? null,
  );
  const [regeneratingImageId, setRegeneratingImageId] = React.useState<
    string | null
  >(null);
  const [imageError, setImageError] = React.useState("");

  React.useEffect(() => {
    if (!detail || detail.fields.blocks.every((block) => block.id)) return;
    const next = structuredClone(page);
    const nextDetail = getArticleDetail(next);
    if (!nextDetail) return;
    nextDetail.fields.blocks = withBlockIds(nextDetail.fields.blocks);
    onChange(next);
  }, [detail, onChange, page]);

  if (!detail) return null;
  const fields = detail.fields as ArticleDetailFields;
  const selectedIndex = fields.blocks.findIndex(
    (block) => block.id === selectedBlockId,
  );
  const selectedBlock =
    selectedIndex >= 0 ? fields.blocks[selectedIndex] : null;

  function updatePage(
    mutator: (next: SitePage, nextFields: ArticleDetailFields) => void,
  ) {
    const next = structuredClone(page);
    const nextDetail = getArticleDetail(next);
    if (!nextDetail) return;
    mutator(next, nextDetail.fields);
    onChange(touchArticlePage(next));
  }

  function updateField<K extends keyof ArticleDetailFields>(
    key: K,
    value: ArticleDetailFields[K],
  ) {
    updatePage((next, nextFields) => {
      nextFields[key] = value;
      if (key === "title") next.title = `Article - ${String(value)}`;
    });
  }

  function updateBlock(index: number, block: ArticleBlock) {
    updatePage((_next, nextFields) => {
      nextFields.blocks[index] = block;
    });
  }

  function addBlock(kind: BlockKind) {
    if (kind === "quiz" && fields.quizzes.length === 0) return;
    const block = newBlock(kind, fields.quizzes[0]?.id);
    updatePage((_next, nextFields) => {
      nextFields.blocks.push(block);
    });
    setSelectedBlockId(block.id ?? null);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.blocks.length) return;
    updatePage((_next, nextFields) => {
      [nextFields.blocks[index], nextFields.blocks[target]] = [
        nextFields.blocks[target],
        nextFields.blocks[index],
      ];
    });
  }

  function removeBlock(index: number) {
    updatePage((_next, nextFields) => {
      nextFields.blocks.splice(index, 1);
    });
    setSelectedBlockId(
      fields.blocks[index + 1]?.id ?? fields.blocks[index - 1]?.id ?? null,
    );
  }

  function duplicateBlock(index: number) {
    const copy = {
      ...structuredClone(fields.blocks[index]),
      id: crypto.randomUUID(),
    } as ArticleBlock;
    updatePage((_next, nextFields) => {
      nextFields.blocks.splice(index + 1, 0, copy);
    });
    setSelectedBlockId(copy.id ?? null);
  }

  function splitParagraphIntoHeading(index: number, start: number, end: number) {
    const block = fields.blocks[index];
    if (block?.kind !== "paragraph" || start === end) return;
    const before = block.text.slice(0, start).trim();
    const headingText = block.text.slice(start, end).trim();
    const after = block.text.slice(end).trim();
    if (!headingText) return;
    const headingId = crypto.randomUUID();
    const replacements: ArticleBlock[] = [
      ...(before ? [{ ...block, text: before }] : []),
      { id: headingId, kind: "heading", level: "h3", text: headingText },
      ...(after
        ? [{ id: crypto.randomUUID(), kind: "paragraph" as const, text: after, size: block.size }]
        : []),
    ];
    updatePage((_next, nextFields) => {
      nextFields.blocks.splice(index, 1, ...replacements);
    });
    setSelectedBlockId(headingId);
  }

  async function regenerateImage(imageId: string) {
    setRegeneratingImageId(imageId);
    setImageError("");
    const response = await fetch("/api/ai-agents/images/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectKey,
        projectOwnerId,
        pageId: page.id,
        imageId,
      }),
    });
    const result = (await response.json()) as {
      page?: SitePage;
      error?: string;
    };
    setRegeneratingImageId(null);
    if (!response.ok || !result.page) {
      setImageError(result.error ?? "Régénération impossible.");
      return;
    }
    onChange(result.page);
  }

  const heroRequest = page.editorial?.outline?.imageRequests.find(
    (request) => request.kind === "hero",
  );

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-[#f4f3f0] font-[var(--font-inter)]"
      role="dialog"
      aria-modal="true"
      aria-label={`Modifier ${fields.title}`}
    >
      <header className="flex min-h-[72px] shrink-0 items-center gap-4 border-b border-black/[0.08] bg-white px-5 sm:px-8">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[.08em] text-black/35">
            CMS · Article
          </p>
          <h2 className="mt-1 truncate font-serif text-[22px]">
            {fields.title}
          </h2>
        </div>
        <span className="hidden text-[11px] text-black/40 md:block">
          Dernière modification : {fields.updatedAt}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer l’éditeur"
          className="grid size-10 place-items-center rounded-full bg-[#f3f3f3] text-black/55"
        >
          <X size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-auto [scrollbar-gutter:stable]">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-8">
          <section className="grid gap-4 rounded-[20px] border border-black/[0.07] bg-white p-5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Titre">
              <input
                value={fields.title}
                onChange={(event) => updateField("title", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Slug">
              <input
                value={page.slug}
                onChange={(event) =>
                  updatePage((next) => {
                    next.slug = normalizeSlug(event.target.value);
                  })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Catégorie">
              <select
                value={normalizeArticleCategory(
                  page.editorial?.category,
                  fields.title,
                )}
                onChange={(event) =>
                  updatePage((next) => {
                    if (next.editorial)
                      next.editorial.category = event.target.value;
                  })
                }
                className={inputClass}
              >
                {ARTICLE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Temps de lecture">
              <input
                value={fields.readingTime}
                onChange={(event) =>
                  updateField("readingTime", event.target.value)
                }
                className={inputClass}
              />
            </Field>
            <Field label="Introduction" wide>
              <textarea
                value={fields.subtitle}
                onChange={(event) =>
                  updateField("subtitle", event.target.value)
                }
                className={textareaClass}
              />
            </Field>
            <Field label="Image principale · URL" wide>
              <input
                value={fields.heroImageUrl}
                onChange={(event) =>
                  updateField("heroImageUrl", event.target.value)
                }
                className={inputClass}
              />
              <input
                value={fields.heroImageAlt}
                onChange={(event) =>
                  updateField("heroImageAlt", event.target.value)
                }
                placeholder="Texte alternatif"
                className={inputClass}
              />
              {heroRequest ? (
                <button
                  type="button"
                  onClick={() => regenerateImage(heroRequest.id)}
                  disabled={Boolean(regeneratingImageId)}
                  className="mt-3 flex h-9 items-center gap-2 rounded-[9px] bg-[#f3f3f3] px-3 text-[11px] font-semibold normal-case tracking-normal text-[#222] disabled:opacity-40"
                >
                  {" "}
                  <RefreshCw
                    size={14}
                    className={
                      regeneratingImageId === heroRequest.id
                        ? "animate-spin"
                        : ""
                    }
                  />
                  Régénérer l’image
                </button>
              ) : null}
            </Field>
          </section>

          <section className="mt-5 rounded-[20px] border border-black/[0.07] bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 font-serif text-[18px]">
                Ajouter un bloc
              </span>
              {blockChoices.map(({ kind, label, icon: Icon }) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => addBlock(kind)}
                  disabled={kind === "quiz" && fields.quizzes.length === 0}
                  className="flex h-9 items-center gap-2 rounded-[9px] border border-black/[0.08] bg-[#fafafa] px-3 text-[11px] font-semibold hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <main className="grid gap-3">
              {fields.blocks.map((block, index) => (
                <BlockPreview
                  key={block.id ?? `${block.kind}-${index}`}
                  block={block}
                  index={index}
                  selected={block.id === selectedBlockId}
                  onSelect={() => setSelectedBlockId(block.id ?? null)}
                  onMove={moveBlock}
                  onDuplicate={duplicateBlock}
                  onRemove={removeBlock}
                />
              ))}
              {!fields.blocks.length ? (
                <div className="rounded-[20px] border border-dashed border-black/10 bg-white p-14 text-center text-[12px] text-black/40">
                  Ajoute ton premier bloc de contenu.
                </div>
              ) : null}
            </main>
            <aside className="rounded-[20px] border border-black/[0.07] bg-white p-5 xl:sticky xl:top-5">
              {selectedBlock ? (
                <BlockSettings
                  block={selectedBlock}
                  fields={fields}
                  onChange={(block) => updateBlock(selectedIndex, block)}
                  onSplitHeading={(start, end) =>
                    splitParagraphIntoHeading(selectedIndex, start, end)
                  }
                  onRegenerate={
                    page.editorial?.outline?.imageRequests.some(
                      (request) => request.id === selectedBlock.id,
                    )
                      ? () => regenerateImage(selectedBlock.id!)
                      : undefined
                  }
                  regenerating={regeneratingImageId === selectedBlock.id}
                />
              ) : (
                <div className="py-12 text-center">
                  <GripVertical className="mx-auto text-black/15" />
                  <p className="mt-3 text-[12px] text-black/40">
                    Double-clique sur un bloc pour afficher ses options.
                  </p>
                </div>
              )}
              {imageError ? (
                <p className="mt-4 rounded-[9px] bg-[#fff0ec] p-3 text-[10px] leading-4 text-[#9a4936]">
                  {imageError}
                </p>
              ) : null}
            </aside>
          </div>

          <section className="mt-5 rounded-[20px] border border-black/[0.07] bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-[18px]">Autres articles</h3>
                <p className="mt-1 text-[11px] text-black/40">
                  Aperçu automatique, non modifiable. Les articles de la même
                  catégorie sont prioritaires.
                </p>
              </div>
              <ExternalLink size={17} className="text-black/25" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {fields.relatedPosts.slice(0, 4).map((post) => (
                <div
                  key={post.href}
                  className="rounded-[12px] bg-[#f7f7f5] p-3"
                >
                  <div
                    className="aspect-[16/9] rounded-[8px] bg-[#deded9] bg-cover bg-center"
                    style={{ backgroundImage: `url(${post.imageUrl})` }}
                  />
                  <p className="mt-3 line-clamp-2 text-[11px] font-semibold">
                    {post.title}
                  </p>
                  <p className="mt-1 text-[9px] text-black/35">
                    {post.category}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`${labelClass} ${wide ? "md:col-span-2" : ""}`}>
      {label}
      {children}
    </label>
  );
}

function BlockPreview({
  block,
  index,
  selected,
  onSelect,
  onMove,
  onDuplicate,
  onRemove,
}: {
  block: ArticleBlock;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  const label =
    blockChoices.find((choice) => choice.kind === block.kind)?.label ?? "Quiz";
  return (
    <article
      onDoubleClick={onSelect}
      className={`group rounded-[18px] border bg-white p-4 transition ${selected ? "border-[#222] shadow-sm" : "border-black/[0.07] hover:border-black/15"}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-[#f3f3f3] text-black/30"
          aria-label={`Modifier le bloc ${label}`}
        >
          <GripVertical size={15} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[.06em] text-black/30">
            {label}
          </p>
          <BlockSummary block={block} />
        </div>
        <div className="flex items-center gap-1 opacity-50 transition group-hover:opacity-100">
          <IconButton label="Monter" onClick={() => onMove(index, -1)}>
            <ArrowUp size={14} />
          </IconButton>
          <IconButton label="Descendre" onClick={() => onMove(index, 1)}>
            <ArrowDown size={14} />
          </IconButton>
          <IconButton label="Dupliquer" onClick={() => onDuplicate(index)}>
            <Copy size={14} />
          </IconButton>
          <IconButton label="Supprimer" onClick={() => onRemove(index)} danger>
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>
    </article>
  );
}

function BlockSummary({ block }: { block: ArticleBlock }) {
  if (block.kind === "heading")
    return (
      <p
        className={`${block.level === "h2" ? "text-[21px]" : "text-[17px]"} mt-1 truncate font-serif`}
      >
        {block.text}
      </p>
    );
  if (block.kind === "paragraph")
    return (
      <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-black/60">
        {block.text}
      </p>
    );
  if (block.kind === "image")
    return (
      <div className="mt-2 flex items-center gap-3">
        <div
          className="size-12 rounded-[7px] bg-[#ddd] bg-cover bg-center"
          style={{ backgroundImage: `url(${block.imageUrl})` }}
        />
        <span className="truncate text-[11px] text-black/45">
          {block.alt || "Image sans texte alternatif"}
        </span>
      </div>
    );
  if (block.kind === "table")
    return (
      <p className="mt-1 text-[12px] text-black/55">
        {block.title} · {block.columns.length} colonnes · {block.rows.length}{" "}
        lignes
      </p>
    );
  if (block.kind === "cards")
    return (
      <p className="mt-1 text-[12px] text-black/55">
        {block.title || "Groupe de cases"} · {block.cards.length} cases
      </p>
    );
  if (block.kind === "callout")
    return (
      <p className="mt-1 line-clamp-2 text-[12px] text-black/55">
        {block.title ? `${block.title} · ` : ""}
        {block.text}
      </p>
    );
  if (block.kind === "link")
    return (
      <p className="mt-1 truncate text-[12px] text-[#006a7f]">
        {block.label} → {block.href}
      </p>
    );
  return (
    <p className="mt-1 text-[12px] text-black/45">
      Quiz interactif : {block.quizId}
    </p>
  );
}

function BlockSettings({
  block,
  fields,
  onChange,
  onSplitHeading,
  onRegenerate,
  regenerating,
}: {
  block: ArticleBlock;
  fields: ArticleDetailFields;
  onChange: (block: ArticleBlock) => void;
  onSplitHeading: (start: number, end: number) => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
}) {
  if (block.kind === "paragraph")
    return <ParagraphSettings block={block} onChange={onChange} onSplitHeading={onSplitHeading} />;
  if (block.kind === "heading")
    return (
      <Settings title="Titre de section">
        <Field label="Titre">
          <textarea
            value={block.text}
            onChange={(event) =>
              onChange({ ...block, text: event.target.value })
            }
            className={textareaClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Niveau">
            <Select
              value={block.level}
              onChange={(value) =>
                onChange({ ...block, level: value as "h2" | "h3" })
              }
              options={["h2", "h3"]}
            />
          </Field>
          <Field label="Alignement">
            <Select
              value={block.alignment ?? "left"}
              onChange={(value) =>
                onChange({ ...block, alignment: value as "left" | "center" })
              }
              options={["left", "center"]}
            />
          </Field>
        </div>
      </Settings>
    );
  if (block.kind === "image")
    return (
      <Settings title="Image">
        <Field label="URL">
          <input
            value={block.imageUrl}
            onChange={(event) =>
              onChange({ ...block, imageUrl: event.target.value })
            }
            className={inputClass}
          />
        </Field>
        <Field label="Texte alternatif">
          <input
            value={block.alt}
            onChange={(event) =>
              onChange({ ...block, alt: event.target.value })
            }
            className={inputClass}
          />
        </Field>
        <Field label="Légende">
          <input
            value={block.caption ?? ""}
            onChange={(event) =>
              onChange({ ...block, caption: event.target.value })
            }
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Taille">
            <Select
              value={block.size ?? "full"}
              onChange={(value) =>
                onChange({
                  ...block,
                  size: value as "small" | "medium" | "full",
                })
              }
              options={["small", "medium", "full"]}
            />
          </Field>
          <Field label="Alignement">
            <Select
              value={block.alignment ?? "center"}
              onChange={(value) =>
                onChange({
                  ...block,
                  alignment: value as "left" | "center" | "right",
                })
              }
              options={["left", "center", "right"]}
            />
          </Field>
        </div>
        {onRegenerate ? (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="flex h-10 items-center justify-center gap-2 rounded-[9px] bg-[#f3f3f3] px-4 text-[11px] font-semibold disabled:opacity-40"
          >
            <RefreshCw
              size={14}
              className={regenerating ? "animate-spin" : ""}
            />
            Régénérer cette image
          </button>
        ) : null}
      </Settings>
    );
  if (block.kind === "callout")
    return (
      <Settings title="Encadré">
        <Field label="Titre facultatif">
          <input
            value={block.title ?? ""}
            onChange={(event) =>
              onChange({ ...block, title: event.target.value })
            }
            className={inputClass}
          />
        </Field>
        <Field label="Texte">
          <textarea
            value={block.text}
            onChange={(event) =>
              onChange({ ...block, text: event.target.value })
            }
            className={textareaClass}
          />
        </Field>
      </Settings>
    );
  if (block.kind === "link")
    return (
      <Settings title="Lien">
        <Field label="Texte avant le lien">
          <textarea
            value={block.text}
            onChange={(event) =>
              onChange({ ...block, text: event.target.value })
            }
            className={textareaClass}
          />
        </Field>
        <Field label="Libellé du lien">
          <input
            value={block.label}
            onChange={(event) =>
              onChange({ ...block, label: event.target.value })
            }
            className={inputClass}
          />
        </Field>
        <Field label="Destination">
          <input
            value={block.href}
            onChange={(event) =>
              onChange({ ...block, href: event.target.value })
            }
            className={inputClass}
          />
        </Field>
      </Settings>
    );
  if (block.kind === "table")
    return <TableSettings block={block} onChange={onChange} />;
  if (block.kind === "cards")
    return <CardsSettings block={block} onChange={onChange} />;
  return (
    <Settings title="Quiz interactif">
      <Field label="Quiz affiché">
        <select
          value={block.quizId}
          onChange={(event) =>
            onChange({ ...block, quizId: event.target.value })
          }
          className={inputClass}
        >
          {fields.quizzes.map((quiz) => (
            <option key={quiz.id} value={quiz.id}>
              {quiz.name || quiz.title}
            </option>
          ))}
        </select>
      </Field>
      <p className="text-[11px] leading-5 text-black/40">
        La configuration détaillée du quiz reste dans son éditeur spécialisé.
      </p>
    </Settings>
  );
}

function ParagraphSettings({
  block,
  onChange,
  onSplitHeading,
}: {
  block: Extract<ArticleBlock, { kind: "paragraph" }>;
  onChange: (block: ArticleBlock) => void;
  onSplitHeading: (start: number, end: number) => void;
}) {
  const [selection, setSelection] = React.useState({ start: 0, end: 0 });
  return (
    <Settings title="Paragraphe">
      <Field label="Texte">
        <textarea
          value={block.text}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          onSelect={(event) =>
            setSelection({
              start: event.currentTarget.selectionStart,
              end: event.currentTarget.selectionEnd,
            })
          }
          className={textareaClass}
        />
      </Field>
      <button
        type="button"
        onClick={() => onSplitHeading(selection.start, selection.end)}
        disabled={selection.start === selection.end}
        className="flex h-10 items-center justify-center gap-2 rounded-[9px] bg-[#f3f3f3] px-4 text-[11px] font-semibold disabled:opacity-35"
      >
        <Heading2 size={14} />
        Transformer la sélection en sous-titre H3
      </button>
      <Field label="Taille">
        <Select
          value={block.size ?? "medium"}
          onChange={(value) =>
            onChange({
              ...block,
              size: value as "small" | "medium" | "large",
            })
          }
          options={["small", "medium", "large"]}
        />
      </Field>
    </Settings>
  );
}

function TableSettings({
  block,
  onChange,
}: {
  block: Extract<ArticleBlock, { kind: "table" }>;
  onChange: (block: ArticleBlock) => void;
}) {
  function changeColumn(index: number, value: string) {
    const columns = [...block.columns];
    columns[index] = value;
    onChange({ ...block, columns });
  }
  function addColumn() {
    onChange({
      ...block,
      columns: [...block.columns, `Colonne ${block.columns.length + 1}`],
      rows: block.rows.map((row) => [...row, ""]),
    });
  }
  function removeColumn(index: number) {
    if (block.columns.length <= 1) return;
    onChange({
      ...block,
      columns: block.columns.filter((_, itemIndex) => itemIndex !== index),
      rows: block.rows.map((row) =>
        row.filter((_, itemIndex) => itemIndex !== index),
      ),
    });
  }
  function changeCell(rowIndex: number, cellIndex: number, value: string) {
    const rows = block.rows.map((row) => [...row]);
    rows[rowIndex][cellIndex] = value;
    onChange({ ...block, rows });
  }
  return (
    <Settings title="Tableau">
      <Field label="Titre">
        <input
          value={block.title}
          onChange={(event) =>
            onChange({ ...block, title: event.target.value })
          }
          className={inputClass}
        />
      </Field>
      <Field label="Style">
        <Select
          value={block.variant ?? "default"}
          onChange={(value) =>
            onChange({ ...block, variant: value as "default" | "comparison" })
          }
          options={["default", "comparison"]}
        />
      </Field>
      <div>
        <div className="flex items-center justify-between">
          <span className={labelClass}>Colonnes</span>
          <button
            type="button"
            onClick={addColumn}
            className="text-[10px] font-semibold"
          >
            <Plus size={12} className="inline" /> Ajouter
          </button>
        </div>
        <div className="mt-2 grid gap-2">
          {block.columns.map((column, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={column}
                onChange={(event) => changeColumn(index, event.target.value)}
                className="h-9 min-w-0 flex-1 rounded-[8px] border border-black/10 px-2 text-[11px]"
              />
              <IconButton
                label="Retirer la colonne"
                onClick={() => removeColumn(index)}
                danger
              >
                <Trash2 size={13} />
              </IconButton>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <span className={labelClass}>Lignes</span>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...block,
                rows: [...block.rows, block.columns.map(() => "")],
              })
            }
            className="text-[10px] font-semibold"
          >
            <Plus size={12} className="inline" /> Ajouter
          </button>
        </div>
        <div className="mt-2 grid gap-2">
          {block.rows.map((row, rowIndex) => (
            <div key={rowIndex} className="rounded-[9px] bg-[#f7f7f5] p-2">
              <div className="grid gap-2">
                {block.columns.map((_, cellIndex) => (
                  <input
                    key={cellIndex}
                    value={row[cellIndex] ?? ""}
                    onChange={(event) =>
                      changeCell(rowIndex, cellIndex, event.target.value)
                    }
                    className="h-8 rounded-[7px] border border-black/10 px-2 text-[10px]"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...block,
                    rows: block.rows.filter((_, index) => index !== rowIndex),
                  })
                }
                className="mt-2 text-[9px] text-[#a14f3d]"
              >
                Supprimer la ligne
              </button>
            </div>
          ))}
        </div>
      </div>
    </Settings>
  );
}

function CardsSettings({
  block,
  onChange,
}: {
  block: Extract<ArticleBlock, { kind: "cards" }>;
  onChange: (block: ArticleBlock) => void;
}) {
  function changeCard(
    index: number,
    changes: Partial<(typeof block.cards)[number]>,
  ) {
    const cards = block.cards.map((card, itemIndex) =>
      itemIndex === index ? { ...card, ...changes } : card,
    );
    onChange({ ...block, cards });
  }
  return (
    <Settings title="Groupe de cases">
      <Field label="Titre facultatif">
        <input
          value={block.title ?? ""}
          onChange={(event) =>
            onChange({ ...block, title: event.target.value })
          }
          className={inputClass}
        />
      </Field>
      <Field label="Colonnes">
        <Select
          value={String(block.columns ?? 2)}
          onChange={(value) =>
            onChange({ ...block, columns: Number(value) as 1 | 2 | 3 | 4 })
          }
          options={["1", "2", "3", "4"]}
        />
      </Field>
      <div className="flex items-center justify-between">
        <span className={labelClass}>Cases</span>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...block,
              cards: [
                ...block.cards,
                {
                  icon: "lightbulb",
                  title: `Case ${block.cards.length + 1}`,
                  text: "Description",
                },
              ],
            })
          }
          className="text-[10px] font-semibold"
        >
          <Plus size={12} className="inline" /> Ajouter
        </button>
      </div>
      <div className="grid gap-3">
        {block.cards.map((card, index) => (
          <div key={index} className="rounded-[10px] bg-[#f7f7f5] p-3">
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <select
                value={card.icon ?? "lightbulb"}
                onChange={(event) =>
                  changeCard(index, { icon: event.target.value })
                }
                className="h-9 rounded-[8px] border border-black/10 bg-white px-2 text-[10px]"
              >
                <option value="lightbulb">Idée</option>
                <option value="leaf">Feuille</option>
                <option value="sprout">Pousse</option>
                <option value="tree">Arbre</option>
                <option value="shield">Bouclier</option>
              </select>
              <input
                value={card.title}
                onChange={(event) =>
                  changeCard(index, { title: event.target.value })
                }
                className="h-9 rounded-[8px] border border-black/10 px-2 text-[11px]"
              />
            </div>
            <textarea
              value={card.text}
              onChange={(event) =>
                changeCard(index, { text: event.target.value })
              }
              className="mt-2 min-h-20 w-full rounded-[8px] border border-black/10 p-2 text-[10px] leading-4"
            />
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...block,
                  cards: block.cards.filter(
                    (_, itemIndex) => itemIndex !== index,
                  ),
                })
              }
              className="mt-2 text-[9px] text-[#a14f3d]"
            >
              Supprimer la case
            </button>
          </div>
        ))}
      </div>
    </Settings>
  );
}

function Settings({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2 border-b border-black/[0.07] pb-4">
        <MessageSquareQuote size={16} className="text-black/30" />
        <h3 className="font-serif text-[18px]">{title}</h3>
      </div>
      {children}
    </div>
  );
}
function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={`grid size-8 place-items-center rounded-[7px] ${danger ? "text-[#a14f3d] hover:bg-[#fff0ec]" : "text-black/45 hover:bg-[#f3f3f3]"}`}
    >
      {children}
    </button>
  );
}
