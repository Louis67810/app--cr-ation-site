"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ExternalLink,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  X,
} from "lucide-react";

type ProspectStatus =
  | "Nouveau"
  | "À contacter"
  | "Contacté"
  | "À relancer"
  | "Qualifié"
  | "Refusé";

type Prospect = {
  id: string;
  company: string;
  activity: string;
  city: string;
  address: string;
  website: string;
  mapsUrl: string;
  contact: string;
  phone: string;
  email: string;
  rating: number | null;
  reviewCount: number;
  performance: number | null;
  ssl: boolean | null;
  seo: number | null;
  opportunity: number | null;
  status: ProspectStatus;
  auditStatus: "complete" | "failed" | "unavailable";
};

type SearchResponse = {
  prospects?: Prospect[];
  meta?: {
    city: string;
    sector: string;
    found: number;
    audited: number;
    pageSpeedFailed: number;
    skippedPreviouslySeen: number;
    deduplicationReady: boolean;
  };
  error?: string;
};

const statusOptions: ProspectStatus[] = [
  "Nouveau",
  "À contacter",
  "Contacté",
  "À relancer",
  "Qualifié",
  "Refusé",
];

function metricColor(value: number | null) {
  if (value === null) return "text-black/30";
  if (value >= 75) return "text-[#00a86b]";
  if (value >= 55) return "text-[#e17600]";
  return "text-[#d52626]";
}

function opportunityStyle(value: number | null) {
  if (value === null) {
    return "border-black/10 bg-black/[0.025] text-black/35";
  }
  if (value >= 70) {
    return "border-[#9e252f]/35 bg-[#9e252f]/8 text-[#9e252f]";
  }
  if (value >= 50) {
    return "border-[#d17800]/35 bg-[#d17800]/8 text-[#a85f00]";
  }
  return "border-[#003441]/20 bg-[#003441]/5 text-[#003441]";
}

function statusStyle(status: ProspectStatus) {
  if (status === "Qualifié") return "bg-[#dff7eb] text-[#187a4c]";
  if (status === "À contacter") return "bg-[#e9eefc] text-[#3857a5]";
  if (status === "Contacté") return "bg-[#e5f6f4] text-[#0a6d65]";
  if (status === "À relancer") return "bg-[#fff0d7] text-[#a45b00]";
  if (status === "Refusé") return "bg-[#f5e8e9] text-[#9e252f]";
  return "bg-[#ffbd35] text-[#3b2900]";
}

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function displayWebsite(website: string) {
  return website.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function ProspectingDashboard() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [city, setCity] = useState("");
  const [sector, setSector] = useState("Paysagistes");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [lastSearch, setLastSearch] = useState<{
    city: string;
    sector: string;
    found: number;
    audited: number;
    pageSpeedFailed: number;
    skippedPreviouslySeen: number;
    deduplicationReady: boolean;
  } | null>(null);

  useEffect(() => {
    if (!searchOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSearching) {
        setSearchOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSearching, searchOpen]);

  function updateStatus(id: string, status: ProspectStatus) {
    setProspects((currentProspects) =>
      currentProspects.map((prospect) =>
        prospect.id === id ? { ...prospect, status } : prospect,
      ),
    );
  }

  async function searchProspects(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSearching) return;

    setSearchError("");
    setIsSearching(true);

    try {
      const response = await fetch("/api/prospects/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          sector,
          excludedPlaceIds: prospects.map((prospect) => prospect.id),
        }),
      });
      const responseText = await response.text();
      let payload: SearchResponse;

      try {
        payload = JSON.parse(responseText) as SearchResponse;
      } catch {
        throw new Error(
          response.status === 504
            ? "La recherche a dépassé le temps maximal. Relancez-la dans quelques secondes."
            : "Le serveur n’a pas renvoyé une réponse valide. Réessayez dans quelques secondes.",
        );
      }

      if (!response.ok || !payload.prospects || !payload.meta) {
        throw new Error(
          payload.error ?? "La recherche de prospects a échoué.",
        );
      }

      if (payload.prospects.length === 0) {
        throw new Error(
          "Aucun nouveau prospect n’a été trouvé dans cette recherche. Essayez une ville voisine ou un autre secteur.",
        );
      }

      setProspects(payload.prospects);
      setLastSearch(payload.meta);
      setSearchOpen(false);
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "La recherche de prospects a échoué.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="pb-16">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h1 className="font-serif text-[28px] leading-none tracking-[-0.04em] sm:text-[32px]">
            Prospection
          </h1>
          <span className="hidden h-[18px] w-px bg-black/10 sm:block" />
          <p className="font-serif text-[14px] leading-5 text-black/50 sm:text-[16px]">
            Identifiez et priorisez les entreprises à contacter.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchError("");
            setSearchOpen(true);
          }}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-[#323232] to-[#222] px-5 text-[13px] font-semibold text-white shadow-[0_2px_4px_-1px_rgba(13,13,13,.5),0_0_0_1px_#333,inset_0_.5px_1px_rgba(255,255,255,.15)] transition-transform hover:-translate-y-px sm:w-auto"
        >
          <Search size={15} />
          Trouver de nouveaux prospects
        </button>
      </header>

      {lastSearch ? (
        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-black/[0.07] py-4 text-[12px] text-black/48">
          <span className="font-semibold text-[#1c1c1c]">
            {lastSearch.found} prospect
            {lastSearch.found > 1 ? "s" : ""}
          </span>
          <span className="h-1 w-1 rounded-full bg-black/20" />
          <span>
            {lastSearch.sector} à {lastSearch.city}
          </span>
          <span className="h-1 w-1 rounded-full bg-black/20" />
          <span>{lastSearch.audited} site(s) analysé(s) sur mobile</span>
          {lastSearch.pageSpeedFailed > 0 ? (
            <>
              <span className="h-1 w-1 rounded-full bg-black/20" />
              <span className="text-[#a85f00]">
                {lastSearch.pageSpeedFailed} audit(s) indisponible(s)
              </span>
            </>
          ) : null}
          {lastSearch.skippedPreviouslySeen > 0 ? (
            <>
              <span className="h-1 w-1 rounded-full bg-black/20" />
              <span>
                {lastSearch.skippedPreviouslySeen} doublon(s) écarté(s)
              </span>
            </>
          ) : null}
          <span className="ml-auto text-[#003441]">
            Triés par opportunité
          </span>
        </div>
      ) : null}

      <div className="mt-10 overflow-hidden rounded-[20px] border border-[#003441]/20 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <colgroup>
              <col className="w-[42px]" />
              <col className="w-[260px]" />
              <col className="w-[150px]" />
              <col className="w-[190px]" />
              <col className="w-[105px]" />
              <col className="w-[72px]" />
              <col className="w-[64px]" />
              <col className="w-[64px]" />
              <col className="w-[104px]" />
              <col className="w-[128px]" />
            </colgroup>
            <thead className="bg-[#003441] font-serif text-[12px] text-white">
              <tr className="h-14">
                {[
                  "#",
                  "Entreprise",
                  "Téléphone",
                  "E-mail",
                  "Avis",
                  "Perf.",
                  "SSL",
                  "SEO",
                  "Opportunité",
                  "Statut",
                ].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className="border-r border-white/[0.07] px-4 font-normal last:border-r-0"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-[var(--font-inter)] text-[12px]">
              {prospects.map((prospect, index) => {
                const destination = prospect.website || prospect.mapsUrl;

                return (
                  <tr
                    key={prospect.id}
                    className="group h-[70px] border-b border-[#003441]/8 odd:bg-[#003441]/[0.025] last:border-b-0 hover:bg-[#003441]/[0.055]"
                  >
                    <td className="px-4 text-center text-[#003441]/45">
                      {index + 1}
                    </td>
                    <td className="px-4">
                      {destination ? (
                        <a
                          href={destination}
                          target="_blank"
                          rel="noreferrer"
                          title={`Ouvrir ${prospect.company}`}
                          className="flex min-w-0 items-start gap-2 rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#003441]/35"
                        >
                          <ExternalLink
                            size={12}
                            className="mt-0.5 shrink-0 text-[#003441]/40 transition-colors group-hover:text-[#003441]"
                          />
                          <ProspectIdentity prospect={prospect} />
                        </a>
                      ) : (
                        <div className="flex min-w-0 items-start gap-2">
                          <MapPin
                            size={12}
                            className="mt-0.5 shrink-0 text-[#003441]/40"
                          />
                          <ProspectIdentity prospect={prospect} />
                        </div>
                      )}
                    </td>
                    <td className="px-4">
                      {prospect.phone ? (
                        <a
                          href={phoneHref(prospect.phone)}
                          title={`Appeler ${prospect.phone}`}
                          className="flex items-center gap-1.5 font-medium text-[#00a86b] underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a86b]/30"
                        >
                          <Phone size={12} />
                          {prospect.phone}
                        </a>
                      ) : (
                        <span className="text-black/25">—</span>
                      )}
                    </td>
                    <td className="px-4 text-black/60">
                      {prospect.email ? (
                        <a
                          href={`mailto:${prospect.email}`}
                          className="flex items-center gap-1.5 truncate underline-offset-2 hover:text-[#003441] hover:underline"
                        >
                          <Mail
                            size={12}
                            className="shrink-0 text-black/35"
                          />
                          {prospect.email}
                        </a>
                      ) : (
                        <span className="text-black/25">—</span>
                      )}
                    </td>
                    <td className="px-4">
                      {prospect.rating === null ? (
                        <span className="text-black/25">—</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Star
                            size={12}
                            className="fill-[#ffb300] text-[#ffb300]"
                          />
                          <span className="font-semibold text-black/70">
                            {prospect.rating.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-black/35">
                            ({prospect.reviewCount})
                          </span>
                        </div>
                      )}
                    </td>
                    <td
                      className={`px-4 text-center font-semibold ${metricColor(prospect.performance)}`}
                    >
                      {prospect.performance ?? "—"}
                    </td>
                    <td className="px-4 text-center text-black/60">
                      {prospect.ssl === null
                        ? "—"
                        : prospect.ssl
                          ? "oui"
                          : "non"}
                    </td>
                    <td
                      className={`px-4 text-center font-semibold ${metricColor(prospect.seo)}`}
                    >
                      {prospect.seo ?? "—"}
                    </td>
                    <td className="px-4 text-center">
                      <span
                        className={`inline-flex min-w-9 items-center justify-center rounded-[8px] border px-2 py-1.5 text-[12px] font-semibold ${opportunityStyle(prospect.opportunity)}`}
                        title={
                          prospect.opportunity === null
                            ? "PageSpeed n’a pas pu analyser ce site"
                            : "Score d’opportunité"
                        }
                      >
                        {prospect.opportunity ?? "—"}
                      </span>
                    </td>
                    <td className="px-4">
                      <span
                        className={`relative inline-flex items-center rounded-[9px] pr-1 ${statusStyle(prospect.status)}`}
                      >
                        <select
                          value={prospect.status}
                          onChange={(event) =>
                            updateStatus(
                              prospect.id,
                              event.target.value as ProspectStatus,
                            )
                          }
                          aria-label={`Modifier le statut de ${prospect.company}`}
                          className="h-8 min-w-[104px] cursor-pointer appearance-none bg-transparent py-1 pl-3 pr-7 text-[11px] font-semibold outline-none"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={12}
                          aria-hidden="true"
                          className="pointer-events-none absolute right-2"
                        />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {prospects.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#003441]/[0.06] text-[#003441]">
              <Search size={20} />
            </span>
            <p className="mt-5 font-serif text-[20px] text-[#1c1c1c]">
              Lancez votre première recherche
            </p>
            <p className="mt-2 max-w-[430px] text-[12px] leading-5 text-black/45">
              Choisissez une ville et un secteur. Les entreprises seront
              trouvées avec Google Places, auditées sur mobile, puis classées
              automatiquement.
            </p>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-[11px] leading-5 text-black/40">
        Le score d’opportunité favorise les entreprises sans site ou avec un
        site lent, peu optimisé pour le SEO ou non sécurisé. Les meilleurs
        prospects commerciaux apparaissent en premier.
      </p>

      {searchOpen ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSearching) {
              setSearchOpen(false);
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f4f2ed]/75 p-4 backdrop-blur-[10px]"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prospect-search-title"
            className="w-full max-w-[650px] overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_38px_80px_rgba(0,0,0,.14)]"
          >
            <div className="flex items-start justify-between border-b border-black/[0.07] px-7 py-7 sm:px-9">
              <div>
                <h2
                  id="prospect-search-title"
                  className="font-serif text-[25px] leading-none tracking-[-0.035em] text-[#1c1c1c]"
                >
                  Trouver de nouveaux prospects
                </h2>
                <p className="mt-3 text-[12px] leading-5 text-black/45">
                  Choisissez la zone et le métier à analyser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                disabled={isSearching}
                aria-label="Fermer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-black/10 text-black/50 transition-colors hover:bg-black/[0.04] hover:text-black disabled:opacity-40"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={searchProspects} className="px-7 py-7 sm:px-9">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[12px] font-semibold text-black/70">
                    Ville
                  </span>
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
                    />
                    <input
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      required
                      minLength={2}
                      maxLength={80}
                      autoFocus
                      placeholder="Ex. Périgueux"
                      className="h-12 w-full rounded-[11px] border border-black/10 bg-[#fafafa] pl-11 pr-4 text-[13px] text-[#1c1c1c] outline-none transition focus:border-[#003441]/35 focus:ring-4 focus:ring-[#003441]/[0.06]"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-semibold text-black/70">
                    Secteur
                  </span>
                  <div className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
                    />
                    <input
                      value={sector}
                      onChange={(event) => setSector(event.target.value)}
                      required
                      minLength={2}
                      maxLength={80}
                      placeholder="Paysagistes"
                      className="h-12 w-full rounded-[11px] border border-black/10 bg-[#fafafa] pl-11 pr-4 text-[13px] text-[#1c1c1c] outline-none transition focus:border-[#003441]/35 focus:ring-4 focus:ring-[#003441]/[0.06]"
                    />
                  </div>
                </label>
              </div>

              <div className="mt-6 rounded-[14px] border border-[#003441]/10 bg-[#003441]/[0.035] px-5 py-4">
                <p className="text-[12px] font-semibold text-[#003441]">
                  Classement automatique
                </p>
                <p className="mt-1.5 text-[11px] leading-5 text-black/45">
                  Google Places trouve les entreprises. PageSpeed analyse
                  ensuite chaque site en version mobile. Les opportunités les
                  plus intéressantes remontent en haut du tableau.
                </p>
              </div>

              {searchError ? (
                <div className="mt-5 flex items-start gap-3 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[11px] leading-5 text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{searchError}</span>
                </div>
              ) : null}

              <div className="mt-7 flex justify-end">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="flex h-11 min-w-[190px] items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-[#323232] to-[#222] px-5 text-[13px] font-semibold text-white shadow-[0_2px_4px_-1px_rgba(13,13,13,.5),0_0_0_1px_#333,inset_0_.5px_1px_rgba(255,255,255,.15)] disabled:cursor-wait disabled:opacity-65"
                >
                  {isSearching ? (
                    <>
                      <LoaderCircle size={15} className="animate-spin" />
                      Analyse des sites…
                    </>
                  ) : (
                    <>
                      <Search size={15} />
                      Lancer la recherche
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProspectIdentity({ prospect }: { prospect: Prospect }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[13px] font-semibold text-[#1c1c1c] transition-colors group-hover:text-[#003441]">
        {prospect.company}
      </p>
      <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-black/45">
        <MapPin size={9} className="shrink-0" />
        {prospect.address || `${prospect.activity} · ${prospect.city}`}
      </p>
      <p className="mt-0.5 truncate text-[9px] text-[#003441]/55 underline-offset-2 group-hover:underline">
        {prospect.website
          ? displayWebsite(prospect.website)
          : "Aucun site trouvé · Ouvrir dans Google Maps"}
      </p>
    </div>
  );
}
