"use client";

import {
  Check,
  ChevronDown,
  Copy,
  Ellipsis,
  ExternalLink,
  LoaderCircle,
  PencilLine,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardProject } from "@/components/dashboard/dashboard-shell";

type ProjectDialog =
  | { kind: "create" }
  | { kind: "rename"; project: DashboardProject }
  | null;

type SortMode = "updated" | "created" | "name";

function relativeDate(value: string) {
  const date = new Date(value);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  for (const [unit, size] of ranges) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.round(seconds / size), unit);
    }
  }

  return "à l’instant";
}

function ProjectThumbnail({ project }: { project: DashboardProject }) {
  const previewUrl = `/dashboard/preview/${encodeURIComponent(project.ownerId)}/${encodeURIComponent(project.key)}`;

  return (
    <div className="relative aspect-[1.08/1] overflow-hidden rounded-[12px] border border-black/[0.07] bg-[#f4f4f2] [perspective:1100px]">
      <div className="absolute inset-[10px] origin-bottom overflow-hidden rounded-[9px] bg-white shadow-[0_22px_60px_rgba(0,0,0,.09)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(.22,1,.36,1)] [transform:rotateX(2.5deg)_translateY(5px)_scale(.985)] group-hover:shadow-[0_30px_70px_rgba(0,0,0,.14)] group-hover:[transform:rotateX(0deg)_translateY(-6px)_scale(1)]">
        <div className="pointer-events-none h-[2440px] w-[1800px] origin-top-left [transform:scale(.215)]">
          <iframe
            src={previewUrl}
            title={`Aperçu de ${project.name}`}
            loading="lazy"
            tabIndex={-1}
            className="h-[2440px] w-[1800px] border-0 bg-white"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white/90" />
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  menuOpen,
  busy,
  onMenuToggle,
  onRename,
  onDuplicate,
}: {
  project: DashboardProject;
  menuOpen: boolean;
  busy: boolean;
  onMenuToggle: () => void;
  onRename: () => void;
  onDuplicate: () => void;
}) {
  return (
    <article className="group relative min-w-0 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1.5">
      <Link
        href={`/builder?project=${encodeURIComponent(project.key)}`}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-black/40"
        aria-label={`Ouvrir ${project.name}`}
      >
        <ProjectThumbnail project={project} />
      </Link>

      <div className="mt-4 flex min-w-0 items-start gap-3">
        <Link
          href={`/builder?project=${encodeURIComponent(project.key)}`}
          className="min-w-0 flex-1"
        >
          <h2 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#1c1c1c]">
            {project.name}
          </h2>
          <p className="mt-1 text-[12px] text-black/42">
            Modifié {relativeDate(project.updatedAt)}
          </p>
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={onMenuToggle}
            className="grid size-9 place-items-center rounded-[9px] text-black/45 transition hover:bg-black/[0.055] hover:text-black"
            aria-label={`Actions pour ${project.name}`}
            aria-expanded={menuOpen}
          >
            {busy ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Ellipsis size={19} />
            )}
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-11 z-30 w-48 rounded-[12px] border border-black/10 bg-white p-1.5 text-[13px] shadow-[0_18px_50px_rgba(0,0,0,.14)]">
              <Link
                href={`/builder?project=${encodeURIComponent(project.key)}`}
                className="flex h-10 items-center gap-3 rounded-[8px] px-3 hover:bg-black/[0.04]"
              >
                <ExternalLink size={15} />
                Ouvrir
              </Link>
              {project.role === "admin" ? (
                <>
                  <button
                    type="button"
                    onClick={onRename}
                    className="flex h-10 w-full items-center gap-3 rounded-[8px] px-3 text-left hover:bg-black/[0.04]"
                  >
                    <PencilLine size={15} />
                    Renommer
                  </button>
                  <button
                    type="button"
                    onClick={onDuplicate}
                    className="flex h-10 w-full items-center gap-3 rounded-[8px] px-3 text-left hover:bg-black/[0.04]"
                  >
                    <Copy size={15} />
                    Dupliquer
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ProjectsLibrary({
  projects,
}: {
  projects: DashboardProject[];
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [sortMode, setSortMode] = useState<SortMode>("updated");
  const [sortOpen, setSortOpen] = useState(false);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ProjectDialog>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const canCreate = projects.some((project) => project.role === "admin");

  useEffect(() => {
    function closeMenus(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuKey(null);
        setSortOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeMenus);
    return () => document.removeEventListener("pointerdown", closeMenus);
  }, []);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name, "fr");
      if (sortMode === "created") {
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      }
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });
  }, [projects, sortMode]);

  function openDialog(nextDialog: Exclude<ProjectDialog, null>) {
    setDialog(nextDialog);
    setName(nextDialog.kind === "rename" ? nextDialog.project.name : "");
    setMenuKey(null);
    setError("");
  }

  async function submitProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || !dialog) return;

    setSubmitting(true);
    setError("");
    const response = await fetch("/api/projects", {
      method: dialog.kind === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        dialog.kind === "create"
          ? { name: cleanName }
          : {
              action: "rename",
              ownerId: dialog.project.ownerId,
              projectKey: dialog.project.key,
              name: cleanName,
            },
      ),
    });
    const result = (await response.json()) as {
      projectKey?: string;
      error?: string;
    };
    setSubmitting(false);

    if (!response.ok) {
      setError(result.error ?? "L’action n’a pas pu être terminée.");
      return;
    }

    setDialog(null);
    router.refresh();
  }

  async function duplicateProject(project: DashboardProject) {
    setMenuKey(null);
    setBusyKey(project.key);
    setError("");
    const response = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "duplicate",
        ownerId: project.ownerId,
        projectKey: project.key,
      }),
    });
    const result = (await response.json()) as {
      projectKey?: string;
      error?: string;
    };
    setBusyKey(null);

    if (!response.ok) {
      setError(result.error ?? "La duplication n’a pas pu être terminée.");
      return;
    }

    router.refresh();
  }

  const sortLabels: Record<SortMode, string> = {
    updated: "Dernière modification",
    created: "Création récente",
    name: "Nom A–Z",
  };

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-[1720px] pb-16">
      <header className="flex flex-col gap-5 border-b border-black/[0.08] pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-[30px] leading-none tracking-[-0.045em]">
            Projets
          </h1>
          <p className="mt-3 text-[13px] text-black/48">
            Retrouvez et gérez tous vos sites depuis un seul espace.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((current) => !current)}
              className="flex h-10 w-full items-center justify-between gap-3 rounded-[10px] bg-[#f5f5f4] px-4 text-[12px] font-medium text-black/70 sm:w-[190px]"
              aria-expanded={sortOpen}
            >
              {sortLabels[sortMode]}
              <ChevronDown
                size={15}
                className={`transition-transform ${sortOpen ? "rotate-180" : ""}`}
              />
            </button>
            {sortOpen ? (
              <div className="absolute right-0 top-12 z-30 w-full rounded-[12px] border border-black/10 bg-white p-1.5 text-[12px] shadow-[0_18px_50px_rgba(0,0,0,.12)]">
                {(Object.keys(sortLabels) as SortMode[]).map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => {
                      setSortMode(mode);
                      setSortOpen(false);
                    }}
                    className="flex h-9 w-full items-center justify-between rounded-[8px] px-3 text-left hover:bg-black/[0.04]"
                  >
                    {sortLabels[mode]}
                    {sortMode === mode ? <Check size={14} /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {canCreate ? (
            <button
              type="button"
              onClick={() => openDialog({ kind: "create" })}
              className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-[#323232] to-[#222] px-5 text-[13px] font-semibold text-white shadow-[0_2px_4px_-1px_rgba(13,13,13,.5),0_0_0_1px_#333,inset_0_.5px_1px_rgba(255,255,255,.15),inset_0_-1px_1.2px_.35px_#121212]"
            >
              <Plus size={16} />
              Nouveau projet
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="mt-6 flex items-center justify-between rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
          {error}
          <button type="button" onClick={() => setError("")} aria-label="Fermer">
            <X size={15} />
          </button>
        </div>
      ) : null}

      <div className="mt-10 grid gap-x-7 gap-y-12 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {sortedProjects.map((project) => (
          <ProjectCard
            key={`${project.ownerId}:${project.key}`}
            project={project}
            menuOpen={menuKey === project.key}
            busy={busyKey === project.key}
            onMenuToggle={() =>
              setMenuKey((current) =>
                current === project.key ? null : project.key,
              )
            }
            onRename={() => openDialog({ kind: "rename", project })}
            onDuplicate={() => duplicateProject(project)}
          />
        ))}
      </div>

      {dialog ? (
        <div
          className="fixed inset-0 z-[200] grid place-items-center bg-black/24 p-5 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <form
            onSubmit={submitProject}
            className="w-full max-w-[430px] rounded-[22px] border border-black/10 bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,.18)]"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-[24px] tracking-[-0.04em]">
                {dialog.kind === "create"
                  ? "Nouveau projet"
                  : "Renommer le projet"}
              </h2>
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="grid size-9 place-items-center rounded-[9px] bg-black/[0.04]"
                aria-label="Fermer"
              >
                <X size={17} />
              </button>
            </div>
            <label
              htmlFor="project-library-name"
              className="mt-6 block text-[12px] font-medium text-black/55"
            >
              Nom du projet
            </label>
            <input
              id="project-library-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              placeholder="Ex. Jardin Dupont"
              className="mt-2 h-11 w-full rounded-[10px] border border-black/12 px-3 text-[14px] outline-none transition focus:border-black/40"
            />
            {error ? <p className="mt-2 text-[12px] text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-[#323232] to-[#222] text-[13px] font-semibold text-white disabled:opacity-45"
            >
              {submitting ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : null}
              {submitting
                ? "Enregistrement…"
                : dialog.kind === "create"
                  ? "Créer le projet"
                  : "Enregistrer"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
