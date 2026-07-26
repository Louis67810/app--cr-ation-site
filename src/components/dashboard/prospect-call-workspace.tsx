"use client";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  ExternalLink,
  Globe2,
  LoaderCircle,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import type {
  Prospect,
  ProspectStatus,
} from "@/components/dashboard/prospecting-dashboard";

type CallOutcome = "answered" | "concluded" | "no_answer";

type ProspectCallWorkspaceProps = {
  prospects: Prospect[];
  initialProspectId: string;
  onBack: () => void;
  onStatusChange: (id: string, status: ProspectStatus) => void;
};

type CallRecord = {
  id: string;
  prospectId: string;
  durationSeconds: number;
  outcome: CallOutcome;
};

const waveform = [
  4, 4, 6, 10, 22, 36, 52, 42, 58, 48, 58, 48, 32, 48, 30, 28, 25, 20,
  18, 16,
];

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export function ProspectCallWorkspace({
  prospects,
  initialProspectId,
  onBack,
  onStatusChange,
}: ProspectCallWorkspaceProps) {
  const initialIndex = Math.max(
    0,
    prospects.findIndex((prospect) => prospect.id === initialProspectId),
  );
  const [prospectIndex, setProspectIndex] = useState(initialIndex);
  const [activeTab, setActiveTab] = useState<"script" | "booking">("script");
  const [callState, setCallState] = useState<"idle" | "active" | "ended">(
    "idle",
  );
  const [callSeconds, setCallSeconds] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [callSessionId, setCallSessionId] = useState("");
  const [bookingState, setBookingState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [bookingMessage, setBookingMessage] = useState("");
  const callStartedAt = useRef<Date | null>(null);
  const sessionStartedAt = useRef(0);

  const prospect = prospects[prospectIndex] ?? prospects[0];

  useEffect(() => {
    sessionStartedAt.current = Date.now();
    const timer = window.setInterval(() => {
      setSessionSeconds(
        Math.max(0, Math.floor((Date.now() - sessionStartedAt.current) / 1000)),
      );
      if (callStartedAt.current) {
        setCallSeconds(
          Math.max(
            0,
            Math.floor((Date.now() - callStartedAt.current.getTime()) / 1000),
          ),
        );
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  function resetProspectState() {
    setCallState("idle");
    setCallSeconds(0);
    setCallSessionId("");
    callStartedAt.current = null;
    setBookingState("idle");
    setBookingMessage("");
  }

  const metrics = useMemo(() => {
    const answered = records.filter(
      (record) => record.outcome !== "no_answer",
    ).length;
    const concluded = records.filter(
      (record) => record.outcome === "concluded",
    ).length;
    const totalDuration = records.reduce(
      (total, record) => total + record.durationSeconds,
      0,
    );
    return {
      calls: records.length,
      answered,
      concluded,
      average: records.length
        ? Math.round(totalDuration / records.length)
        : 0,
    };
  }, [records]);

  if (!prospect) return null;

  async function startCall() {
    if (!prospect.phone || callState === "active") return;

    callStartedAt.current = new Date();
    setCallSeconds(0);
    setCallState("active");
    onStatusChange(prospect.id, "Contacté");

    try {
      const response = await fetch("/api/prospects/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: prospect.id,
          prospectName: prospect.company,
          phone: prospect.phone,
          startedAt: callStartedAt.current.toISOString(),
        }),
      });
      const payload = (await response.json()) as { id?: string };
      if (response.ok && payload.id) setCallSessionId(payload.id);
    } catch {
      // The phone action remains usable if call history is not configured yet.
    }

    window.location.href = `tel:${normalizePhone(prospect.phone)}`;
  }

  function endCall() {
    setCallState("ended");
    callStartedAt.current = null;
  }

  async function saveOutcome(outcome: CallOutcome) {
    const record: CallRecord = {
      id: crypto.randomUUID(),
      prospectId: prospect.id,
      durationSeconds: callSeconds,
      outcome,
    };
    setRecords((current) => [...current, record]);

    const status: ProspectStatus =
      outcome === "concluded"
        ? "Qualifié"
        : outcome === "no_answer"
          ? "À relancer"
          : "Contacté";
    onStatusChange(prospect.id, status);

    if (callSessionId) {
      try {
        await fetch("/api/prospects/calls", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: callSessionId,
            endedAt: new Date().toISOString(),
            durationSeconds: callSeconds,
            answered: outcome !== "no_answer",
            concluded: outcome === "concluded",
          }),
        });
      } catch {
        // Local session statistics remain available.
      }
    }

    setCallState("idle");
    setCallSeconds(0);
    setCallSessionId("");
  }

  function goToNext() {
    resetProspectState();
    setProspectIndex((current) =>
      prospects.length > 0 ? (current + 1) % prospects.length : current,
    );
  }

  async function createBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingState("loading");
    setBookingMessage("");

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/prospects/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: prospect.id,
          prospectName: prospect.company,
          attendeeName: String(form.get("attendeeName") ?? ""),
          attendeeEmail: String(form.get("attendeeEmail") ?? ""),
          attendeePhone: String(form.get("attendeePhone") ?? ""),
          date: String(form.get("date") ?? ""),
          time: String(form.get("time") ?? ""),
          timeZone: "Europe/Paris",
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Le rendez-vous n’a pas été créé.");
      }
      setBookingState("success");
      setBookingMessage(
        payload.message ?? "Le rendez-vous et l’invitation ont été envoyés.",
      );
      onStatusChange(prospect.id, "Rendez-vous");
    } catch (error) {
      setBookingState("error");
      setBookingMessage(
        error instanceof Error
          ? error.message
          : "Le rendez-vous n’a pas été créé.",
      );
    }
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-1px)] bg-[#fbfbfb] lg:-m-8">
      <header className="border-b border-black/10 bg-white px-6 py-4 lg:px-10">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-[13px] font-semibold text-[#1c1c1c] hover:text-[#003441]"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-5">
            <SessionMetric label="Appels" value={String(metrics.calls)} />
            <SessionMetric
              label="Décrochés"
              value={String(metrics.answered)}
            />
            <SessionMetric
              label="Conclus"
              value={String(metrics.concluded)}
            />
            <SessionMetric
              label="Temps de session"
              value={formatDuration(sessionSeconds)}
            />
            <SessionMetric
              label="Moyenne / appel"
              value={formatDuration(metrics.average)}
            />
          </div>
        </div>
      </header>

      <main className="grid min-h-[832px] grid-cols-1 bg-white xl:grid-cols-[366px_minmax(380px,1fr)_394px]">
        <aside className="border-b border-black/[0.06] bg-white p-6 xl:border-b-0 xl:border-r xl:p-8">
          <p className="font-serif text-[22px] tracking-[-0.03em]">
            {prospect.company}
          </p>
          <p className="mt-2 flex items-start gap-2 text-[11px] leading-5 text-black/50">
            <MapPin size={13} className="mt-1 shrink-0" />
            {prospect.address || `${prospect.activity} · ${prospect.city}`}
          </p>

          <div className="mt-7 grid grid-cols-3 gap-2">
            <ScoreCard label="Perf." value={prospect.performance} />
            <ScoreCard label="SEO" value={prospect.seo} />
            <ScoreCard label="Opport." value={prospect.opportunity} />
          </div>

          <div className="mt-6 space-y-2 border-y border-black/[0.08] py-5 text-[12px]">
            <InfoRow
              icon={<Phone size={14} />}
              label={prospect.phone || "Téléphone indisponible"}
              href={
                prospect.phone
                  ? `tel:${normalizePhone(prospect.phone)}`
                  : undefined
              }
            />
            <InfoRow
              icon={<Globe2 size={14} />}
              label={
                prospect.website
                  ? prospect.website.replace(/^https?:\/\//, "")
                  : "Aucun site internet"
              }
              href={prospect.website || undefined}
            />
            <InfoRow
              icon={<MapPin size={14} />}
              label="Voir la fiche Google"
              href={prospect.mapsUrl || undefined}
            />
            <InfoRow
              icon={<ShieldCheck size={14} />}
              label={
                prospect.ssl === null
                  ? "SSL non vérifié"
                  : prospect.ssl
                    ? "Connexion HTTPS"
                    : "Site sans HTTPS"
              }
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-[14px] border border-black/10 bg-[#f4f4f2]">
            <div className="flex h-10 items-center justify-between border-b border-black/[0.07] bg-white px-4 text-[10px] font-semibold text-black/55">
              Aperçu du site
              {prospect.website ? (
                <a
                  href={prospect.website}
                  target="_blank"
                  rel="noreferrer"
                  title="Ouvrir le site"
                >
                  <ExternalLink size={13} />
                </a>
              ) : null}
            </div>
            {prospect.website ? (
              <iframe
                title={`Aperçu du site de ${prospect.company}`}
                src={prospect.website}
                className="h-[330px] w-full bg-white"
                loading="lazy"
              />
            ) : (
              <div className="flex h-[250px] items-center justify-center px-8 text-center text-[11px] leading-5 text-black/40">
                Cette entreprise n’a pas de site : c’est une opportunité
                prioritaire.
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-[650px] flex-col items-center justify-center px-6 py-12">
          <p className="text-[14px] text-black/45">
            {prospect.phone || "Aucun numéro disponible"}
          </p>
          <div className="mt-8 flex h-[214px] w-[214px] items-center justify-center overflow-hidden rounded-full border border-black/15 bg-white shadow-[0_9px_6px_rgba(0,0,0,.02),0_4px_4px_rgba(0,0,0,.03),0_1px_2px_rgba(0,0,0,.03)]">
            {callState === "active" ? (
              <div className="flex h-[60px] items-center gap-[2px]">
                {waveform.map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className="w-1 rounded-full bg-[#003441] motion-safe:animate-pulse"
                    style={{
                      height,
                      animationDelay: `${index * 45}ms`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="relative flex h-full w-full items-end justify-center overflow-hidden">
                <span className="absolute top-[46px] h-[99px] w-[99px] rounded-full bg-black/10" />
                <span className="absolute -bottom-[64px] h-[162px] w-[162px] rounded-full bg-black/[0.07]" />
                <UserRound
                  size={76}
                  strokeWidth={1.1}
                  className="relative z-10 mb-[55px] text-[#003441]"
                />
              </div>
            )}
          </div>
          <p className="mt-7 font-serif text-[26px] tracking-[-0.03em]">
            {prospect.company}
          </p>
          <p className="mt-3 text-[16px] tabular-nums text-black/55">
            {formatDuration(callSeconds)}
          </p>

          <div className="mt-9 w-full max-w-[440px] border-t border-black/[0.08] pt-8">
            {callState === "idle" ? (
              <button
                type="button"
                onClick={startCall}
                disabled={!prospect.phone}
                className="flex h-[97px] w-full items-center rounded-full border border-[#00a86b]/20 bg-gradient-to-r from-[#dff7eb] to-[#f4f4f4] px-1.5 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span className="flex h-[86px] w-[86px] items-center justify-center rounded-full border border-black/10 bg-[#00a86b] text-white shadow-[0_20px_14px_rgba(0,0,0,.07),0_5px_6px_rgba(0,0,0,.1)]">
                  <Phone size={35} />
                </span>
                <span className="flex-1 bg-gradient-to-r from-[#006f48] to-[#00a86b] bg-clip-text text-[18px] text-transparent">
                  Appeler
                </span>
              </button>
            ) : callState === "active" ? (
              <button
                type="button"
                onClick={endCall}
                className="flex h-[97px] w-full items-center rounded-full border border-[#eb3f2c]/20 bg-gradient-to-r from-[#f6e0dd] to-[#f4f4f4] px-1.5"
              >
                <span className="flex h-[86px] w-[86px] items-center justify-center rounded-full border border-black/10 bg-[#eb3f2c] text-white shadow-[0_20px_14px_rgba(0,0,0,.07),0_5px_6px_rgba(0,0,0,.1)]">
                  <Phone size={35} className="rotate-[135deg]" />
                </span>
                <span className="flex-1 bg-gradient-to-r from-[#d21a05] to-[#ed5e4e] bg-clip-text text-[18px] text-transparent">
                  Terminer l’appel
                </span>
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-[12px] font-semibold text-black/50">
                  Résultat de l’appel
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <OutcomeButton
                    label="Pas de réponse"
                    onClick={() => saveOutcome("no_answer")}
                  />
                  <OutcomeButton
                    label="Décroché"
                    onClick={() => saveOutcome("answered")}
                  />
                  <OutcomeButton
                    label="Conclu"
                    onClick={() => saveOutcome("concluded")}
                    primary
                  />
                </div>
              </div>
            )}
          </div>

          {callState === "idle" && records.length > 0 ? (
            <button
              type="button"
              onClick={goToNext}
              className="mt-5 h-11 w-full max-w-[440px] rounded-[10px] bg-gradient-to-b from-[#323232] to-[#222] text-[13px] font-semibold text-white shadow-[0_2px_4px_-1px_rgba(13,13,13,.5),0_0_0_1px_#333,inset_0_.5px_1px_rgba(255,255,255,.15)]"
            >
              Prospect suivant
            </button>
          ) : null}
        </section>

        <aside className="border-t border-black/[0.06] bg-white p-6 xl:border-l xl:border-t-0 xl:p-8">
          <div className="grid grid-cols-2 border-b border-black/10">
            <button
              type="button"
              onClick={() => setActiveTab("script")}
              className={`pb-4 text-[12px] font-semibold ${
                activeTab === "script"
                  ? "border-b border-[#1c1c1c] text-[#1c1c1c]"
                  : "text-black/40"
              }`}
            >
              Script
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("booking")}
              className={`pb-4 text-[12px] font-semibold ${
                activeTab === "booking"
                  ? "border-b border-[#1c1c1c] text-[#1c1c1c]"
                  : "text-black/40"
              }`}
            >
              Rendez-vous
            </button>
          </div>

          {activeTab === "script" ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#003441]/[0.06] text-[#003441]">
                <UserRound size={20} />
              </div>
              <p className="mt-5 font-serif text-[20px]">Script d’appel</p>
              <p className="mt-2 max-w-[250px] text-[11px] leading-5 text-black/40">
                Le script personnalisé sera ajouté ici lorsque vous me
                l’aurez transmis.
              </p>
            </div>
          ) : (
            <form onSubmit={createBooking} className="mt-7 space-y-4">
              <div className="flex items-center gap-3">
                <CalendarDays size={18} className="text-[#003441]" />
                <div>
                  <p className="text-[14px] font-semibold">Réserver avec Cal.com</p>
                  <p className="mt-1 text-[10px] text-black/40">
                    L’invitation sera envoyée au prospect.
                  </p>
                </div>
              </div>
              <BookingField
                label="Nom"
                name="attendeeName"
                defaultValue={prospect.contact || prospect.company}
                required
              />
              <BookingField
                label="E-mail"
                name="attendeeEmail"
                type="email"
                defaultValue={prospect.email}
                required
              />
              <BookingField
                label="Téléphone"
                name="attendeePhone"
                type="tel"
                defaultValue={prospect.phone}
              />
              <div className="grid grid-cols-2 gap-3">
                <BookingField label="Date" name="date" type="date" required />
                <BookingField label="Heure" name="time" type="time" required />
              </div>
              <button
                type="submit"
                disabled={bookingState === "loading"}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-[#323232] to-[#222] text-[13px] font-semibold text-white disabled:opacity-50"
              >
                {bookingState === "loading" ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : bookingState === "success" ? (
                  <Check size={16} />
                ) : (
                  <CalendarDays size={16} />
                )}
                {bookingState === "success"
                  ? "Rendez-vous réservé"
                  : "Confirmer le rendez-vous"}
              </button>
              {bookingMessage ? (
                <p
                  className={`text-[11px] leading-5 ${
                    bookingState === "error"
                      ? "text-[#9e252f]"
                      : "text-[#187a4c]"
                  }`}
                >
                  {bookingMessage}
                </p>
              ) : null}
            </form>
          )}
        </aside>
      </main>
    </div>
  );
}

function SessionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-serif text-[11px] text-black/50">{label}</p>
      <p className="mt-1 text-[13px] font-semibold tabular-nums text-[#1c1c1c]">
        {value}
      </p>
    </div>
  );
}

function ScoreCard({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-[10px] bg-[#003441]/[0.045] px-2 py-3 text-center">
      <p className="text-[9px] text-black/40">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-[#003441]">
        {value ?? "—"}
      </p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  href,
}: {
  icon: ReactNode;
  label: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="text-[#003441]/60">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {href ? <ExternalLink size={11} className="text-black/25" /> : null}
    </>
  );

  return href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="flex h-10 items-center gap-2 rounded-[8px] px-3 text-black/60 hover:bg-black/[0.035]"
    >
      {content}
    </a>
  ) : (
    <div className="flex h-10 items-center gap-2 px-3 text-black/45">
      {content}
    </div>
  );
}

function OutcomeButton({
  label,
  onClick,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-[9px] px-2 text-[10px] font-semibold ${
        primary
          ? "bg-[#003441] text-white"
          : "border border-black/10 bg-white text-black/55"
      }`}
    >
      {label}
    </button>
  );
}

function BookingField({
  label,
  name,
  type = "text",
  defaultValue = "",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold text-black/45">
        {label}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="h-11 w-full rounded-[8px] border border-black/10 bg-[#fbfbfb] px-3 text-[12px] outline-none transition focus:border-[#003441]/40 focus:bg-white"
      />
    </label>
  );
}
