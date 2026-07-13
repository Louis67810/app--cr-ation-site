"use client";

import { Check, Copy, Link2, LoaderCircle, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import type { DashboardInvitation, DashboardProject } from "@/components/dashboard/dashboard-shell";

export function ProjectSettings({ project, initialInvitations }: { project: DashboardProject; initialInvitations: DashboardInvitation[] }) {
  const [email, setEmail] = useState("");
  const [invitations, setInvitations] = useState(initialInvitations);
  const [latestLink, setLatestLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectKey: project.key, projectName: project.name, pages: project.pages, email }),
    });
    const result = (await response.json()) as { invitation?: DashboardInvitation; link?: string; error?: string };
    setLoading(false);

    if (!response.ok || !result.invitation || !result.link) {
      setMessage(result.error ?? "Impossible de créer l’invitation.");
      return;
    }

    setInvitations((current) => [result.invitation!, ...current]);
    setLatestLink(result.link);
    setEmail("");
    setMessage("Lien d’invitation créé.");
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setMessage("Lien copié.");
  }

  return (
    <div className="max-w-[920px] pb-16">
      <header><h1 className="font-serif text-[30px] tracking-[-0.05em]">Paramètres</h1><p className="mt-2 text-[14px] font-medium text-black/60">Gérez les accès au projet {project.name}.</p></header>
      <section className="mt-9 rounded-[14px] border border-[#e8ecee] bg-[#f9f9f9] p-6">
        <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-white shadow-sm"><Link2 size={17} /></span><div><h2 className="text-[15px] font-semibold">Inviter un collaborateur</h2><p className="mt-1 text-[12px] leading-5 text-black/45">Il pourra gérer le contenu du CMS, mais n’aura pas accès au builder, à la création de projets ni aux paramètres d’administration.</p></div></div>
        <form onSubmit={invite} className="mt-6 flex flex-col gap-2 sm:flex-row"><label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[9px] border border-black/10 bg-white px-3"><Mail size={15} className="text-black/35" /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="collaborateur@email.com" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" /></label><button type="submit" disabled={loading} className="flex h-11 items-center justify-center gap-2 rounded-[9px] bg-black px-5 text-[13px] font-semibold text-white disabled:opacity-50">{loading ? <LoaderCircle size={15} className="animate-spin" /> : null}Créer le lien</button></form>
        {latestLink ? <div className="mt-3 flex items-center gap-2 rounded-[9px] border border-black/[0.08] bg-white p-2 pl-3"><span className="min-w-0 flex-1 truncate text-[11px] text-black/55">{latestLink}</span><button type="button" onClick={() => copyLink(latestLink)} className="flex h-8 items-center gap-1.5 rounded-[7px] bg-[#f2f2f2] px-3 text-[11px] font-medium"><Copy size={13} />Copier</button></div> : null}
        {message ? <p className="mt-3 text-[11px] text-black/50">{message}</p> : null}
      </section>
      <section className="mt-9"><div className="flex items-end justify-between"><div><h2 className="font-serif text-[24px]">Accès au projet</h2><p className="mt-1 text-[12px] text-black/45">Vous verrez ici quand la personne aura créé son compte.</p></div><span className="text-[11px] text-black/40">{invitations.length} invitation(s)</span></div>
        <div className="mt-4 overflow-hidden rounded-[13px] border border-[#e8ecee] bg-white">{invitations.length ? invitations.map((invitation) => <div key={invitation.id} className="flex min-h-16 items-center gap-3 border-b border-black/[0.06] px-4 last:border-0"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f4f4f4]"><UserRound size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{invitation.email}</p><p className="mt-0.5 text-[10px] text-black/40">Invité le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(invitation.created_at))}</p></div><span className={`${invitation.status === "accepted" ? "bg-[#e7f8ef] text-[#24743a]" : "bg-[#fff3df] text-[#9a6200]"} flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold`}>{invitation.status === "accepted" ? <Check size={11} /> : null}{invitation.status === "accepted" ? "Compte créé" : "En attente"}</span></div>) : <div className="grid h-28 place-items-center text-[12px] text-black/35">Aucun collaborateur invité.</div>}</div>
      </section>
    </div>
  );
}
