"use client";

import {
  AudioLines,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Globe2,
  LoaderCircle,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

type AvailableSlot = {
  start: string;
  date: string;
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
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [slotsState, setSlotsState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [slotsMessage, setSlotsMessage] = useState("");
  const [audioLevels, setAudioLevels] = useState<number[]>(
    waveform.map(() => 5),
  );
  const callStartedAt = useRef<Date | null>(null);
  const sessionStartedAt = useRef(0);
  const audioStream = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioTimer = useRef<number | null>(null);

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

    return () => {
      window.clearInterval(timer);
      stopAudioVisualizer();
    };
  }, []);

  function resetProspectState() {
    setCallState("idle");
    setCallSeconds(0);
    setCallSessionId("");
    callStartedAt.current = null;
    setBookingState("idle");
    setBookingMessage("");
    stopAudioVisualizer();
  }

  function stopAudioVisualizer() {
    if (audioTimer.current !== null) {
      window.clearInterval(audioTimer.current);
      audioTimer.current = null;
    }
    audioStream.current?.getTracks().forEach((track) => track.stop());
    audioStream.current = null;
    if (audioContext.current) {
      void audioContext.current.close();
      audioContext.current = null;
    }
    setAudioLevels(waveform.map(() => 5));
  }

  async function startAudioVisualizer() {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.frequencyBinCount);

      audioStream.current = stream;
      audioContext.current = context;
      audioTimer.current = window.setInterval(() => {
        analyser.getByteFrequencyData(samples);
        setAudioLevels(
          waveform.map((_, index) => {
            const sampleIndex = Math.floor(
              (index / waveform.length) * samples.length,
            );
            return Math.max(5, Math.round((samples[sampleIndex] / 255) * 58));
          }),
        );
      }, 90);
    } catch {
      // The phone call remains available if microphone access is refused.
    }
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

  useEffect(() => {
    if (activeTab !== "booking" || slotsState !== "idle") return;

    const controller = new AbortController();
    async function loadSlots() {
      setSlotsState("loading");
      setSlotsMessage("");
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + 30);
      try {
        const response = await fetch(
          `/api/prospects/slots?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`,
          { cache: "no-store", signal: controller.signal },
        );
        const payload = (await response.json()) as {
          slots?: AvailableSlot[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Créneaux indisponibles.");
        }
        const slots = payload.slots ?? [];
        setAvailableSlots(slots);
        setSelectedDate(slots[0]?.date ?? "");
        setSlotsState("ready");
        if (slots.length === 0) {
          setSlotsMessage(
            "Aucun créneau disponible dans les 30 prochains jours.",
          );
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setSlotsState("error");
        setSlotsMessage(
          error instanceof Error ? error.message : "Créneaux indisponibles.",
        );
      }
    }
    void loadSlots();
    return () => controller.abort();
  }, [activeTab, slotsState]);

  if (!prospect) return null;

  const reputationScore =
    prospect.rating === null
      ? null
      : Math.max(0, Math.min(100, Math.round((prospect.rating / 5) * 100)));
  const qualityValues = [
    prospect.performance,
    prospect.accessibility,
    prospect.bestPractices,
    prospect.seo,
    prospect.ssl === null ? null : prospect.ssl ? 100 : 0,
  ].filter((value): value is number => value !== null);
  const qualityScore =
    qualityValues.length > 0
      ? Math.round(
          qualityValues.reduce((total, value) => total + value, 0) /
            qualityValues.length,
        )
      : null;

  async function startCall() {
    if (!prospect.phone || callState === "active") return;

    callStartedAt.current = new Date();
    setCallSeconds(0);
    setCallState("active");
    onStatusChange(prospect.id, "Contacté");
    void startAudioVisualizer();

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
    stopAudioVisualizer();
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
          start: selectedSlot,
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
    <div className="-m-6 min-h-[100dvh] overflow-hidden bg-white lg:-m-8">
      <header className="grid min-h-[68px] grid-cols-[112px_minmax(0,1fr)] items-center gap-6 border-b border-black/10 bg-white px-6 lg:px-10">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-fit items-center gap-2 rounded-[8px] bg-white px-2 text-[12px] font-semibold text-[#222] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.08)]"
          >
            <span className="flex size-5 items-center justify-center rounded-[5px] bg-[#f6f6f6] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
              <ArrowLeft size={13} />
            </span>
            Retour
          </button>
        </div>
        <div className="grid grid-cols-5 items-center gap-8">
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
      </header>

      <main className="grid min-h-[calc(100dvh-68px)] grid-cols-1 bg-white xl:grid-cols-[366px_minmax(380px,1fr)_394px]">
        <aside className="border-b border-black/[0.06] bg-white p-6 xl:border-b-0 xl:border-r xl:p-8">
          <p className="font-serif text-[22px] tracking-[-0.03em]">
            {prospect.company}
          </p>
          <p className="mt-2 flex items-start gap-2 text-[11px] leading-5 text-black/50">
            <MapPin size={13} className="mt-1 shrink-0" />
            {prospect.address || `${prospect.activity} · ${prospect.city}`}
          </p>

          <div className="mt-7 grid grid-cols-1 gap-3 2xl:grid-cols-2">
            <AnalysisCard
              title="Potentiel commercial"
              score={prospect.opportunity}
              accent="#f59e0b"
              values={[
                {
                  label: "Réputation",
                  value:
                    prospect.rating === null
                      ? "—"
                      : `${prospect.rating.toFixed(1)}/5`,
                  score: reputationScore,
                },
                {
                  label: "Avis",
                  value: String(prospect.reviewCount),
                },
                {
                  label: "Site",
                  value: prospect.website ? "Présent" : "Absent",
                  negative: !prospect.website,
                },
                { label: "Statut", value: prospect.status },
              ]}
            />
            <AnalysisCard
              title="Qualité du site"
              score={qualityScore}
              accent="#f05a67"
              values={[
                {
                  label: "Mobile",
                  value: prospect.performance?.toString() ?? "—",
                  score: prospect.performance,
                },
                {
                  label: "Accessibilité",
                  value: prospect.accessibility?.toString() ?? "—",
                  score: prospect.accessibility,
                },
                {
                  label: "Bonnes pratiques",
                  value: prospect.bestPractices?.toString() ?? "—",
                  score: prospect.bestPractices,
                },
                {
                  label: "SEO",
                  value: prospect.seo?.toString() ?? "—",
                  score: prospect.seo,
                },
                {
                  label: "SSL",
                  value:
                    prospect.ssl === null
                      ? "—"
                      : prospect.ssl
                        ? "100"
                        : "0",
                  score:
                    prospect.ssl === null ? null : prospect.ssl ? 100 : 0,
                },
              ]}
            />
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

        <section className="flex min-h-[650px] flex-col items-center justify-center px-6 py-10">
          <div className="flex items-center gap-2 text-[14px] tabular-nums text-black/45">
            <Clock3 size={14} />
            {formatDuration(callSeconds)}
          </div>
          <div className="mt-8 flex h-[214px] w-[214px] items-center justify-center overflow-hidden rounded-full border border-black/15 bg-white shadow-[0_9px_6px_rgba(0,0,0,.02),0_4px_4px_rgba(0,0,0,.03),0_1px_2px_rgba(0,0,0,.03)]">
            <div className="relative flex h-full w-full items-end justify-center overflow-hidden">
              <span className="absolute top-[46px] h-[99px] w-[99px] rounded-full bg-black/10" />
              <span className="absolute -bottom-[64px] h-[162px] w-[162px] rounded-full bg-black/[0.07]" />
              <UserRound
                size={76}
                strokeWidth={1.1}
                className="relative z-10 mb-[55px] text-[#003441]"
              />
            </div>
          </div>
          <p className="mt-7 font-serif text-[26px] tracking-[-0.03em]">
            {prospect.company}
          </p>
          <p className="mt-3 text-[14px] text-black/45">
            {prospect.phone || "Aucun numéro disponible"}
          </p>
          <div
            className={`mt-5 flex h-[62px] items-center gap-[3px] rounded-full border px-5 transition-colors ${
              callState === "active"
                ? "border-[#003441]/15 bg-[#003441]/[0.035]"
                : "border-black/[0.07] bg-black/[0.018]"
            }`}
            aria-label={
              callState === "active"
                ? "Niveau sonore du microphone"
                : "Visualisation audio inactive"
            }
          >
            <AudioLines
              size={17}
              className={
                callState === "active" ? "text-[#003441]" : "text-black/20"
              }
            />
            {audioLevels.map((height, index) => (
              <span
                key={`${index}-${height}`}
                className={`w-[3px] rounded-full transition-[height,background-color] duration-75 ${
                  callState === "active" ? "bg-[#003441]" : "bg-black/12"
                }`}
                style={{ height: callState === "active" ? height : 5 }}
              />
            ))}
          </div>

          <div className="mt-7 w-full max-w-[500px] border-t border-black/[0.08] pt-8">
            {callState === "idle" ? (
              <SlideToCall
                disabled={!prospect.phone}
                onComplete={startCall}
              />
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

        <aside className="max-h-[calc(100dvh-68px)] overflow-y-auto border-t border-black/[0.06] bg-white p-6 xl:border-l xl:border-t-0 xl:p-8">
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
              <AvailabilityPicker
                slots={availableSlots}
                state={slotsState}
                message={slotsMessage}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                onDateChange={(date) => {
                  setSelectedDate(date);
                  setSelectedSlot("");
                }}
                onSlotChange={setSelectedSlot}
              />
              <button
                type="submit"
                disabled={bookingState === "loading" || !selectedSlot}
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

function AnalysisCard({
  title,
  score,
  accent,
  values,
}: {
  title: string;
  score: number | null;
  accent: string;
  values: Array<{
    label: string;
    value: string;
    score?: number | null;
    negative?: boolean;
  }>;
}) {
  const safeScore = score === null ? 0 : Math.max(0, Math.min(100, score));

  return (
    <div className="rounded-[8px] border border-black/10 bg-white p-3 shadow-[0_4px_3px_rgba(0,0,0,.02),0_2px_2px_rgba(0,0,0,.03)]">
      <p className="text-[11px] font-medium text-[#f05a00]">{title}</p>
      <div className="mt-3 flex items-center gap-3">
        <div
          className="relative flex size-12 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${accent} ${safeScore * 3.6}deg, #eceff1 0deg)`,
          }}
          aria-label={
            score === null ? `${title} non calculé` : `${title} : ${score} sur 100`
          }
        >
          <span className="absolute inset-[4px] rounded-full bg-white" />
          <span className="relative text-[12px] font-semibold text-[#1c1c1c]">
            {score ?? "—"}
          </span>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
          {values.map((item) => (
            <div
              key={item.label}
              className="flex min-w-0 items-center justify-between gap-1 rounded-[4px] border border-black/[0.07] px-1.5 py-1"
            >
              <span className="truncate text-[7px] text-black/55">
                {item.label}
              </span>
              <span
                className={`truncate text-[8px] font-semibold ${
                  item.negative
                    ? "text-[#e55500]"
                    : typeof item.score === "number"
                      ? item.score >= 70
                        ? "text-[#00a86b]"
                        : item.score >= 45
                          ? "text-[#e17600]"
                          : "text-[#d52626]"
                      : "text-[#1c1c1c]"
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideToCall({
  disabled,
  onComplete,
}: {
  disabled: boolean;
  onComplete: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragPosition = useRef(6);
  const [dragX, setDragX] = useState(6);
  const [dragging, setDragging] = useState(false);

  function maxPosition() {
    return Math.max(6, (trackRef.current?.getBoundingClientRect().width ?? 0) - 92);
  }

  function updatePosition(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const position = Math.max(
      6,
      Math.min(rect.width - 92, clientX - rect.left - 43),
    );
    dragPosition.current = position;
    setDragX(position);
  }

  function finishDrag() {
    if (!dragging) return;
    const maximum = maxPosition();
    const completed =
      maximum > 6 && dragPosition.current >= maximum * 0.78;
    setDragging(false);
    if (completed) {
      setDragX(maximum);
      dragPosition.current = maximum;
      onComplete();
    } else {
      setDragX(6);
      dragPosition.current = 6;
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updatePosition(event.clientX);
  }

  return (
    <div
      ref={trackRef}
      className={`relative h-[97px] w-full overflow-hidden rounded-full border border-[#00a86b]/20 bg-gradient-to-r from-[#dff7eb] to-[#f4f4f4] ${
        disabled ? "opacity-35" : ""
      }`}
    >
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-r from-[#006f48] to-[#00a86b] bg-clip-text text-[18px] text-transparent transition-opacity"
        style={{ opacity: Math.max(0.15, 1 - dragX / Math.max(maxPosition(), 1)) }}
      >
        Glisser pour appeler
      </span>
      <span className="pointer-events-none absolute right-7 top-1/2 flex -translate-y-1/2 items-center text-[#00a86b]/45">
        <ChevronRight size={16} />
        <ChevronRight size={16} className="-ml-2" />
      </span>
      <button
        type="button"
        aria-label="Glisser vers la droite pour appeler"
        disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerMove={(event) => {
          if (dragging) updatePosition(event.clientX);
        }}
        onPointerUp={finishDrag}
        onPointerCancel={() => {
          setDragging(false);
          setDragX(6);
          dragPosition.current = 6;
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onComplete();
        }}
        className={`absolute top-[5px] flex h-[86px] w-[86px] touch-none items-center justify-center rounded-full border border-black/10 bg-[#00a86b] text-white shadow-[0_20px_14px_rgba(0,0,0,.07),0_5px_6px_rgba(0,0,0,.1)] ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 280ms ease-in-out",
        }}
      >
        <Phone size={35} />
      </button>
    </div>
  );
}

function AvailabilityPicker({
  slots,
  state,
  message,
  selectedDate,
  selectedSlot,
  onDateChange,
  onSlotChange,
}: {
  slots: AvailableSlot[];
  state: "idle" | "loading" | "ready" | "error";
  message: string;
  selectedDate: string;
  selectedSlot: string;
  onDateChange: (date: string) => void;
  onSlotChange: (slot: string) => void;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const availableDates = Array.from(new Set(slots.map((slot) => slot.date)));
  const baseDate = selectedDate || availableDates[0] || "";
  const month = baseDate ? addMonths(baseDate.slice(0, 7), monthOffset) : "";
  const days = month ? calendarDays(month) : [];
  const monthLabel = month
    ? new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${month}-01T00:00:00Z`))
    : "Disponibilités";
  const slotsForDate = slots.filter((slot) => slot.date === selectedDate);

  return (
    <div className="border-y border-black/10 py-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold capitalize text-[#1c1c1c]">
          {monthLabel}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMonthOffset((current) => current - 1)}
            disabled={!baseDate}
            className="flex size-7 items-center justify-center rounded-[6px] border border-black/10 disabled:opacity-30"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() => setMonthOffset((current) => current + 1)}
            disabled={!baseDate}
            className="flex size-7 items-center justify-center rounded-[6px] border border-black/10 disabled:opacity-30"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {state === "loading" || state === "idle" ? (
        <div className="flex h-36 items-center justify-center text-black/35">
          <LoaderCircle size={17} className="animate-spin" />
        </div>
      ) : days.length > 0 ? (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-semibold text-black/40">
            {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
              <span key={`${day}-${index}`} className="py-1">
                {day}
              </span>
            ))}
            {days.map((day) => {
              if (!day.date) return <span key={day.key} />;
              const available = availableDates.includes(day.date);
              const selected = selectedDate === day.date;
              return (
                <button
                  key={day.key}
                  type="button"
                  disabled={!available}
                  onClick={() => onDateChange(day.date)}
                  className={`flex aspect-square items-center justify-center rounded-[5px] text-[9px] ${
                    selected
                      ? "bg-[#1c1c1c] text-white"
                      : available
                        ? "border border-black/15 bg-white text-[#1c1c1c]"
                        : "bg-[#f0f1f2] text-black/25"
                  }`}
                >
                  {day.day}
                </button>
              );
            })}
          </div>
          <p className="mb-2 mt-4 text-[9px] font-semibold text-black/40">
            Créneaux disponibles
          </p>
          <div className="grid grid-cols-3 gap-2">
            {slotsForDate.length > 0 ? (
              slotsForDate.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => onSlotChange(slot.start)}
                  className={`h-9 rounded-[7px] border text-[10px] font-semibold ${
                    selectedSlot === slot.start
                      ? "border-[#003441] bg-[#003441] text-white"
                      : "border-black/10 bg-white text-[#1c1c1c]"
                  }`}
                >
                  {new Intl.DateTimeFormat("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Paris",
                  }).format(new Date(slot.start))}
                </button>
              ))
            ) : (
              <p className="col-span-3 py-2 text-[10px] text-black/35">
                Sélectionnez une date disponible.
              </p>
            )}
          </div>
        </>
      ) : null}
      {message ? (
        <p
          className={`mt-3 text-[10px] leading-4 ${
            state === "error" ? "text-[#9e252f]" : "text-black/40"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function addMonths(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function calendarDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7;
  return [
    ...Array.from({ length: leading }, (_, index) => ({
      key: `empty-${index}`,
      date: "",
      day: 0,
    })),
    ...Array.from({ length: dayCount }, (_, index) => {
      const day = index + 1;
      return {
        key: `${month}-${day}`,
        date: `${month}-${String(day).padStart(2, "0")}`,
        day,
      };
    }),
  ];
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
