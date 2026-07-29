"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  FileText,
  Globe2,
  ImagePlus,
  Images,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Appointment = {
  id: string;
  place_id: string;
  prospect_name: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  starts_at: string;
  time_zone: string;
  booking_uid: string | null;
  source_website: string | null;
  status: string;
  intake_snapshot: Record<string, unknown>;
  project_key: string | null;
  created_at: string;
};

type CollectedPage = {
  url: string;
  title: string;
  type: "about" | "service" | "realisation" | "article" | "contact" | "other";
  excerpt: string;
};

type ImageCandidate = {
  id: string;
  url: string;
  pageUrl: string;
  alt: string;
  group: CollectedPage["type"];
};

type WebsiteScan = {
  sourceUrl: string;
  pages: CollectedPage[];
  images: ImageCandidate[];
  scannedAt: string;
};

type LocalAsset = {
  id: string;
  file: File;
  previewUrl: string;
};

const pageTypeLabels: Record<CollectedPage["type"], string> = {
  about: "À propos",
  service: "Prestations",
  realisation: "Réalisations",
  article: "Articles",
  contact: "Contact",
  other: "Autres pages",
};

function formatAppointmentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function websiteLabel(value: string) {
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
      .hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

export function AppointmentsDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [website, setWebsite] = useState("");
  const [scan, setScan] = useState<WebsiteScan | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [activeGroup, setActiveGroup] = useState<CollectedPage["type"] | "all">("all");
  const [localAssets, setLocalAssets] = useState<LocalAsset[]>([]);
  const [about, setAbout] = useState("");
  const [services, setServices] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdProjectKey, setCreatedProjectKey] = useState("");
  const [referenceTime] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    async function loadAppointments() {
      try {
        const response = await fetch("/api/appointments", { cache: "no-store" });
        const payload = (await response.json()) as {
          appointments?: Appointment[];
          migrationRequired?: boolean;
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error ?? "Chargement impossible.");
        if (!active) return;
        setAppointments(payload.appointments ?? []);
        setMigrationRequired(payload.migrationRequired === true);
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Chargement impossible.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadAppointments();
    return () => {
      active = false;
    };
  }, []);

  const selectedAppointment = appointments.find(
    (appointment) => appointment.id === selectedId,
  );
  const filteredImages = useMemo(
    () =>
      scan?.images.filter(
        (image) => activeGroup === "all" || image.group === activeGroup,
      ) ?? [],
    [activeGroup, scan],
  );
  const groups = useMemo(() => {
    const available = new Set(scan?.images.map((image) => image.group) ?? []);
    return (Object.keys(pageTypeLabels) as CollectedPage["type"][]).filter(
      (group) => available.has(group),
    );
  }, [scan]);
  const upcoming = appointments.filter(
    (appointment) =>
      Date.parse(appointment.starts_at) >= referenceTime - 2 * 60 * 60 * 1000,
  );
  const past = appointments.filter(
    (appointment) =>
      Date.parse(appointment.starts_at) < referenceTime - 2 * 60 * 60 * 1000,
  );

  function openPreparation(appointment: Appointment) {
    setSelectedId(appointment.id);
    setWebsite(appointment.source_website ?? "");
    setScan(null);
    setSelectedImages(new Set());
    setActiveGroup("all");
    setAbout("");
    setServices("");
    setNotes("");
    setScanError("");
    setCreateError("");
    setCreatedProjectKey(appointment.project_key ?? "");
  }

  async function scanWebsite() {
    if (!selectedAppointment || !website.trim()) return;
    setScanning(true);
    setScanError("");
    try {
      const response = await fetch("/api/appointments/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          website,
        }),
      });
      const payload = (await response.json()) as {
        scan?: WebsiteScan;
        error?: string;
      };
      if (!response.ok || !payload.scan) {
        throw new Error(payload.error ?? "Analyse impossible.");
      }
      setScan(payload.scan);
      setWebsite(payload.scan.sourceUrl);
      const aboutPage = payload.scan.pages.find((page) => page.type === "about");
      const servicePages = payload.scan.pages.filter(
        (page) => page.type === "service",
      );
      if (aboutPage) setAbout(aboutPage.excerpt);
      if (servicePages.length) {
        setServices(servicePages.map((page) => page.title).join(", "));
      }
    } catch (error) {
      setScanError(
        error instanceof Error ? error.message : "Analyse impossible.",
      );
    } finally {
      setScanning(false);
    }
  }

  function toggleImage(id: string) {
    setSelectedImages((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addLocalAssets(files: FileList | null) {
    if (!files) return;
    const accepted = [...files]
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, Math.max(0, 30 - localAssets.length))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));
    setLocalAssets((current) => [...current, ...accepted]);
  }

  async function createProject() {
    if (!selectedAppointment) return;
    setCreating(true);
    setCreateError("");
    try {
      const remoteImages =
        scan?.images.filter((image) => selectedImages.has(image.id)) ?? [];
      const response = await fetch("/api/appointments/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          projectName: selectedAppointment.prospect_name,
          sourceUrl: scan?.sourceUrl ?? website,
          businessProfile: {
            name: selectedAppointment.prospect_name,
            email: selectedAppointment.attendee_email,
            phone: selectedAppointment.attendee_phone,
            about,
            services: services
              .split(",")
              .map((service) => service.trim())
              .filter(Boolean),
            notes,
            source: scan ? "website_scan" : "manual",
          },
          collectedPages: scan?.pages ?? [],
          selectedImages: remoteImages,
        }),
      });
      const payload = (await response.json()) as {
        projectKey?: string;
        error?: string;
      };
      if (!response.ok || !payload.projectKey) {
        throw new Error(payload.error ?? "Création impossible.");
      }

      for (const asset of localAssets) {
        const formData = new FormData();
        formData.set("file", asset.file);
        formData.set("projectKey", payload.projectKey);
        await fetch("/api/assets", { method: "POST", body: formData });
      }

      setCreatedProjectKey(payload.projectKey);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === selectedAppointment.id
            ? {
                ...appointment,
                project_key: payload.projectKey ?? null,
                status: "project_created",
              }
            : appointment,
        ),
      );
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Création impossible.",
      );
    } finally {
      setCreating(false);
    }
  }

  if (selectedAppointment) {
    return (
      <div className="pb-16">
        <button
          type="button"
          onClick={() => setSelectedId("")}
          className="flex h-9 items-center gap-2 rounded-[9px] border border-black/10 bg-white px-3 text-[12px] font-semibold shadow-sm"
        >
          <ArrowLeft size={15} />
          Retour
        </button>

        <header className="mt-7 flex flex-col gap-5 border-b border-black/[0.08] pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/35">
              Préparation du projet
            </p>
            <h1 className="mt-2 font-serif text-[30px] tracking-[-0.045em]">
              {selectedAppointment.prospect_name}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-[12px] text-black/45">
              <CalendarDays size={14} />
              {formatAppointmentDate(selectedAppointment.starts_at)}
            </p>
          </div>
          {createdProjectKey ? (
            <Link
              href={`/dashboard?project=${encodeURIComponent(createdProjectKey)}&tab=overview`}
              className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-[#323232] to-[#222] px-5 text-[13px] font-semibold text-white"
            >
              Ouvrir le projet
              <ArrowRight size={15} />
            </Link>
          ) : null}
        </header>

        <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <section className="rounded-[18px] border border-black/[0.09] bg-[#fafafa] p-5">
              <div className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-white text-[#003441] shadow-sm">
                  <Globe2 size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-[21px]">Contenu existant</h2>
                  <p className="mt-1 text-[11px] leading-5 text-black/42">
                    L’analyse ne publie rien. Elle prépare uniquement les
                    contenus et les médias à valider.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                      placeholder="https://site-du-prospect.fr"
                      className="h-11 min-w-0 flex-1 rounded-[10px] border border-black/10 bg-white px-3 text-[12px] outline-none focus:border-[#003441]/40"
                    />
                    <button
                      type="button"
                      onClick={scanWebsite}
                      disabled={!website.trim() || scanning}
                      className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#003441] px-4 text-[12px] font-semibold text-white disabled:opacity-40"
                    >
                      {scanning ? (
                        <LoaderCircle size={15} className="animate-spin" />
                      ) : scan ? (
                        <RefreshCw size={15} />
                      ) : (
                        <Sparkles size={15} />
                      )}
                      {scanning
                        ? "Analyse en cours…"
                        : scan
                          ? "Relancer l’analyse"
                          : "Analyser le site"}
                    </button>
                  </div>
                  {!website.trim() ? (
                    <p className="mt-3 rounded-[10px] bg-[#fff4dc] px-3 py-2 text-[11px] leading-5 text-[#8a5a00]">
                      Aucun site : remplis la fiche entreprise et dépose
                      directement les photos fournies pendant le rendez-vous.
                    </p>
                  ) : null}
                  {scanError ? (
                    <p className="mt-3 text-[11px] text-red-600">{scanError}</p>
                  ) : null}
                </div>
              </div>
            </section>

            {scan ? (
              <section className="mt-7">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-[23px]">
                      Informations récupérées
                    </h2>
                    <p className="mt-1 text-[11px] text-black/40">
                      {scan.pages.length} page(s) classée(s) pour le brief.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#003441]/[0.06] px-3 py-1 text-[10px] font-semibold text-[#003441]">
                    Source conservée
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {scan.pages.map((page) => (
                    <article
                      key={page.url}
                      className="min-w-0 rounded-[13px] border border-black/[0.08] bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[9px] font-semibold text-black/45">
                          {pageTypeLabels[page.type]}
                        </span>
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-black/30 hover:text-black"
                          aria-label={`Ouvrir ${page.title}`}
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                      <h3 className="mt-3 truncate text-[13px] font-semibold">
                        {page.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-[10px] leading-5 text-black/42">
                        {page.excerpt}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-serif text-[23px]">Sélection des images</h2>
                  <p className="mt-1 text-[11px] text-black/40">
                    Seules les images cochées ou déposées seront ajoutées aux
                    Assets.
                  </p>
                </div>
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-black/10 bg-white px-4 text-[11px] font-semibold shadow-sm">
                  <Upload size={14} />
                  Déposer des images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(event) => addLocalAssets(event.target.files)}
                  />
                </label>
              </div>

              {scan?.images.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveGroup("all")}
                    className={`${activeGroup === "all" ? "bg-[#1c1c1c] text-white" : "bg-black/[0.04] text-black/50"} h-8 rounded-[8px] px-3 text-[10px] font-semibold`}
                  >
                    Toutes
                  </button>
                  {groups.map((group) => (
                    <button
                      type="button"
                      key={group}
                      onClick={() => setActiveGroup(group)}
                      className={`${activeGroup === group ? "bg-[#1c1c1c] text-white" : "bg-black/[0.04] text-black/50"} h-8 rounded-[8px] px-3 text-[10px] font-semibold`}
                    >
                      {pageTypeLabels[group]}
                    </button>
                  ))}
                  <span className="ml-auto self-center text-[10px] font-semibold text-[#003441]">
                    {selectedImages.size + localAssets.length} sélectionnée(s)
                  </span>
                </div>
              ) : null}

              {filteredImages.length || localAssets.length ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {localAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="relative aspect-[1.12/1] overflow-hidden rounded-[12px] border-2 border-[#003441] bg-[#f3f3f3] bg-cover bg-center"
                      style={{ backgroundImage: `url("${asset.previewUrl}")` }}
                    >
                      <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-[#003441] text-white shadow">
                        <Check size={13} />
                      </span>
                      <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[8px] font-semibold backdrop-blur">
                        Dépôt manuel
                      </span>
                    </div>
                  ))}
                  {filteredImages.map((image) => {
                    const selected = selectedImages.has(image.id);
                    return (
                      <button
                        type="button"
                        key={image.id}
                        onClick={() => toggleImage(image.id)}
                        className={`${selected ? "border-[#003441]" : "border-black/[0.08]"} relative aspect-[1.12/1] overflow-hidden rounded-[12px] border-2 bg-[#f3f3f3] bg-cover bg-center text-left`}
                        style={{ backgroundImage: `url("${image.url}")` }}
                        aria-pressed={selected}
                      >
                        <span
                          className={`${selected ? "bg-[#003441] text-white" : "bg-white/90 text-black/40"} absolute right-2 top-2 grid size-6 place-items-center rounded-full shadow backdrop-blur`}
                        >
                          {selected ? <Check size={13} /> : <ImagePlus size={12} />}
                        </span>
                        <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/65 to-transparent px-2 pb-2 pt-8 text-[9px] font-medium text-white">
                          {image.alt || pageTypeLabels[image.group]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <label className="mt-4 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[16px] border border-dashed border-black/15 bg-[#fafafa] text-center">
                  <Images size={22} className="text-black/25" />
                  <p className="mt-3 text-[12px] font-semibold">
                    Dépose les photos du prospect
                  </p>
                  <p className="mt-1 text-[10px] text-black/38">
                    Réalisations, équipe, locaux ou identité visuelle.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(event) => addLocalAssets(event.target.files)}
                  />
                </label>
              )}
            </section>
          </div>

          <aside className="h-fit rounded-[18px] border border-black/[0.09] bg-white p-5 xl:sticky xl:top-7">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[9px] bg-[#003441]/[0.06] text-[#003441]">
                <FileText size={16} />
              </span>
              <div>
                <h2 className="text-[13px] font-semibold">Brief source</h2>
                <p className="mt-0.5 text-[9px] text-black/38">
                  Référence commune pour tous les agents IA.
                </p>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="text-[10px] font-semibold text-black/50">
                Présentation de l’entreprise
              </span>
              <textarea
                value={about}
                onChange={(event) => setAbout(event.target.value)}
                rows={6}
                placeholder="Histoire, méthode, équipe, valeurs…"
                className="mt-2 w-full resize-y rounded-[10px] border border-black/10 bg-[#fafafa] p-3 text-[11px] leading-5 outline-none focus:border-[#003441]/35"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-[10px] font-semibold text-black/50">
                Prestations, séparées par une virgule
              </span>
              <textarea
                value={services}
                onChange={(event) => setServices(event.target.value)}
                rows={3}
                placeholder="Conception, création, entretien…"
                className="mt-2 w-full resize-y rounded-[10px] border border-black/10 bg-[#fafafa] p-3 text-[11px] leading-5 outline-none focus:border-[#003441]/35"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-[10px] font-semibold text-black/50">
                Notes du rendez-vous
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Objectifs, zone d’intervention, différences…"
                className="mt-2 w-full resize-y rounded-[10px] border border-black/10 bg-[#fafafa] p-3 text-[11px] leading-5 outline-none focus:border-[#003441]/35"
              />
            </label>

            <div className="mt-5 rounded-[11px] bg-[#003441]/[0.045] p-3 text-[10px] leading-5 text-black/48">
              L’IA utilisera ce brief, les pages classées et uniquement les
              images validées. La structure du site restera verrouillée.
            </div>
            {createError ? (
              <p className="mt-3 text-[10px] leading-5 text-red-600">
                {createError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={createProject}
              disabled={creating || Boolean(createdProjectKey)}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-[#323232] to-[#222] text-[12px] font-semibold text-white disabled:opacity-45"
            >
              {creating ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              {creating
                ? "Préparation du projet…"
                : createdProjectKey
                  ? "Projet créé"
                  : "Générer le projet"}
            </button>
          </aside>
        </div>
      </div>
    );
  }

  function appointmentSection(title: string, items: Appointment[]) {
    if (!items.length) return null;
    return (
      <section className="mt-9">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[22px]">{title}</h2>
          <span className="text-[10px] font-semibold text-black/35">
            {items.length} rendez-vous
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-[18px] border border-black/[0.09]">
          {items.map((appointment) => (
            <article
              key={appointment.id}
              className="grid gap-4 border-b border-black/[0.07] bg-white p-4 last:border-0 hover:bg-black/[0.015] sm:grid-cols-[minmax(0,1fr)_210px_auto] sm:items-center sm:px-5"
            >
              <div className="min-w-0">
                <h3 className="truncate text-[13px] font-semibold">
                  {appointment.prospect_name}
                </h3>
                <p className="mt-1 truncate text-[10px] text-black/40">
                  {appointment.attendee_email ||
                    appointment.attendee_phone ||
                    "Coordonnées à compléter"}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-[11px] font-medium text-black/60">
                  <Clock3 size={13} className="text-[#003441]" />
                  {formatAppointmentDate(appointment.starts_at)}
                </p>
                <p className="mt-1 flex items-center gap-2 text-[9px] text-black/35">
                  {appointment.source_website ? (
                    <>
                      <Globe2 size={11} />
                      {websiteLabel(appointment.source_website)}
                    </>
                  ) : (
                    <>
                      <MapPin size={11} />
                      Aucun site existant
                    </>
                  )}
                </p>
              </div>
              {appointment.project_key ? (
                <Link
                  href={`/dashboard?project=${encodeURIComponent(appointment.project_key)}&tab=overview`}
                  className="flex h-9 items-center justify-center gap-2 rounded-[9px] border border-black/10 bg-white px-3 text-[10px] font-semibold shadow-sm"
                >
                  Ouvrir le projet
                  <ExternalLink size={12} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openPreparation(appointment)}
                  className="flex h-9 items-center justify-center gap-2 rounded-[9px] bg-[#1c1c1c] px-3 text-[10px] font-semibold text-white"
                >
                  Préparer le site
                  <ArrowRight size={12} />
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="pb-16">
      <header className="border-b border-black/[0.08] pb-8">
        <div className="flex items-center gap-4">
          <h1 className="font-serif text-[30px] tracking-[-0.045em]">
            Rendez-vous
          </h1>
          <span className="h-[18px] w-px bg-black/10" />
          <p className="text-[13px] text-black/45">
            Préparez chaque projet avant sa génération.
          </p>
        </div>
      </header>
      {migrationRequired ? (
        <div className="mt-6 rounded-[12px] border border-[#d9a340]/30 bg-[#fff8e8] px-4 py-3 text-[11px] leading-5 text-[#805600]">
          La liste affiche les prospects marqués « Rendez-vous ». Applique la
          nouvelle migration Supabase pour enregistrer les dates Cal.com et les
          briefs de préparation.
        </div>
      ) : null}
      {loadError ? (
        <p className="mt-7 text-[12px] text-red-600">{loadError}</p>
      ) : null}
      {loading ? (
        <div className="grid min-h-[320px] place-items-center">
          <LoaderCircle size={20} className="animate-spin text-black/30" />
        </div>
      ) : appointments.length ? (
        <>
          {appointmentSection("À venir", upcoming)}
          {appointmentSection("Passés", past)}
        </>
      ) : (
        <div className="mt-10 flex min-h-[330px] flex-col items-center justify-center rounded-[18px] border border-dashed border-black/15 bg-[#fafafa] text-center">
          <CalendarDays size={24} className="text-black/25" />
          <h2 className="mt-4 font-serif text-[21px]">Aucun rendez-vous prévu</h2>
          <p className="mt-2 max-w-[390px] text-[11px] leading-5 text-black/40">
            Les rendez-vous créés depuis la prospection apparaîtront ici avec
            leur site, leurs coordonnées et le bouton de préparation.
          </p>
        </div>
      )}
    </div>
  );
}
