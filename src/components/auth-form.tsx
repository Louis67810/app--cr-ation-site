"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { createClient } from "@/lib/supabase/client";

const inputClass = "h-[50px] w-full rounded-[8px] border border-black/[0.07] bg-[#f6f6f6] px-5 text-[14px] font-medium text-[#121a2e] outline-none placeholder:text-[#121a2e]/45 focus:border-black/20";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "signup" && password !== confirmation) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setMessage("Consultez votre boîte mail pour confirmer votre compte.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout>
      <div className="mb-16">
        <h1 className="font-serif text-[48px] leading-[1.05] tracking-[-0.01em] text-[#121a2e]">{mode === "login" ? "Bienvenue !" : "Créez votre compte"}</h1>
        <p className="mt-4 text-[16px] font-medium leading-8 tracking-[-0.01em] text-[#121a2e]/70">{mode === "login" ? "Connectez-vous pour retrouver vos projets." : "Remplissez les champs ci-dessous pour créer votre compte."}</p>
      </div>
      <form onSubmit={submit} className="grid gap-8">
        <label className="grid gap-2.5 font-serif text-[24px] leading-8 text-[#121a2e]">Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="votre@email.com" /></label>
        <label className="grid gap-2.5 font-serif text-[24px] leading-8 text-[#121a2e]">Mot de passe<input type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder="Minimum 8 caractères" /></label>
        {mode === "signup" ? <label className="grid gap-2.5 font-serif text-[24px] leading-8 text-[#121a2e]">Confirmation du mot de passe<input type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputClass} placeholder="Répétez votre mot de passe" /></label> : null}
        {message ? <p className="rounded-[8px] bg-[#f6f6f6] px-4 py-3 text-[13px] text-[#121a2e]/70">{message}</p> : null}
        <button type="submit" disabled={loading} className="mt-8 flex h-[52px] items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232_0%,#222_100%)] text-[14px] font-semibold text-[#fcfcfc] shadow-[0_2px_4px_-1px_rgba(13,13,13,.5),0_0_0_1px_#333,inset_0_.5px_1px_rgba(255,255,255,.15)] disabled:opacity-60">{loading ? <LoaderCircle size={16} className="animate-spin" /> : null}{loading ? "Chargement…" : mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
      </form>
      <button type="button" onClick={() => { setMode((current) => current === "login" ? "signup" : "login"); setMessage(""); }} className="mt-6 text-[13px] font-medium text-[#121a2e]/55 hover:text-[#121a2e]">{mode === "login" ? "Première connexion ? Créer un compte" : "Vous avez déjà un compte ? Se connecter"}</button>
    </AuthLayout>
  );
}
