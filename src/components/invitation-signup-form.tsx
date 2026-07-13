"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { createClient } from "@/lib/supabase/client";

const inputClass = "h-[50px] w-full rounded-[8px] border border-black/[0.07] bg-[#f6f6f6] px-5 text-[14px] font-medium text-[#121a2e] outline-none placeholder:text-[#121a2e]/45 focus:border-black/20 disabled:text-[#121a2e]/50";

export function InvitationSignupForm({ token, invitedEmail, projectName }: { token: string; invitedEmail: string | null; projectName: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(invitedEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?invite=${encodeURIComponent(token)}`,
        data: { account_role: "collaborator", invitation_token: token },
      },
    });

    if (result.error) {
      setLoading(false);
      setMessage(result.error.message);
      return;
    }

    if (!result.data.session) {
      setLoading(false);
      setMessage("Votre compte est créé. Confirmez votre adresse depuis l’email reçu pour rejoindre le projet.");
      return;
    }

    const acceptance = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const accepted = (await acceptance.json()) as { projectKey?: string; error?: string };
    setLoading(false);

    if (!acceptance.ok) {
      setMessage(accepted.error ?? "Impossible d’accepter l’invitation.");
      return;
    }

    router.push(`/dashboard?project=${encodeURIComponent(accepted.projectKey ?? "default")}`);
    router.refresh();
  }

  return (
    <AuthLayout>
      <div className="mb-16">
        <h1 className="font-serif text-[48px] leading-[1.05] tracking-[-0.01em] text-[#121a2e]">Bienvenue !</h1>
        <p className="mt-4 text-[16px] font-medium leading-8 tracking-[-0.01em] text-[#121a2e]/70">Créez votre compte pour rejoindre le projet « {projectName} ».</p>
      </div>
      <form onSubmit={submit} className="grid gap-8">
        <label className="grid gap-2.5 font-serif text-[24px] leading-8 text-[#121a2e]">Email<input type="email" required autoComplete="email" disabled={Boolean(invitedEmail)} value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="votre@email.com" /></label>
        <label className="grid gap-2.5 font-serif text-[24px] leading-8 text-[#121a2e]">Mot de passe<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder="Minimum 8 caractères" /></label>
        <label className="grid gap-2.5 font-serif text-[24px] leading-8 text-[#121a2e]">Confirmation du mot de passe<input type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputClass} placeholder="Répétez votre mot de passe" /></label>
        {message ? <p className="rounded-[8px] bg-[#f6f6f6] px-4 py-3 text-[13px] leading-5 text-[#121a2e]/70">{message}</p> : null}
        <button type="submit" disabled={loading} className="mt-8 flex h-[52px] items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232_0%,#222_100%)] text-[14px] font-semibold text-[#fcfcfc] shadow-[0_2px_4px_-1px_rgba(13,13,13,.5),0_0_0_1px_#333,inset_0_.5px_1px_rgba(255,255,255,.15)] disabled:opacity-60">{loading ? <LoaderCircle size={16} className="animate-spin" /> : null}{loading ? "Création…" : "Créer mon compte"}</button>
      </form>
    </AuthLayout>
  );
}
