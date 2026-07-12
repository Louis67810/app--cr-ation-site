"use client";

import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Consultez votre boite mail pour confirmer votre compte.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-[430px] rounded-[20px] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-8">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#00d494]">
          Site Builder
        </p>
        <h1 className="mt-3 text-[34px] font-semibold text-white">
          {mode === "login" ? "Connexion" : "Creer un compte"}
        </h1>
        <p className="mt-3 text-[14px] leading-6 text-white/60">
          Retrouvez vos projets, brouillons et publications sur tous vos appareils.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-2 text-[13px] font-medium text-white/80">
          Adresse email
          <span className="flex h-12 items-center gap-3 rounded-[10px] border border-white/10 bg-white/[0.06] px-4">
            <Mail size={17} className="text-white/45" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/30"
              placeholder="vous@exemple.fr"
            />
          </span>
        </label>

        <label className="grid gap-2 text-[13px] font-medium text-white/80">
          Mot de passe
          <span className="flex h-12 items-center gap-3 rounded-[10px] border border-white/10 bg-white/[0.06] px-4">
            <LockKeyhole size={17} className="text-white/45" />
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/30"
              placeholder="8 caracteres minimum"
            />
          </span>
        </label>

        {message ? (
          <p className="rounded-[10px] bg-white/[0.06] px-4 py-3 text-[13px] leading-5 text-white/75">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#00d494] text-[14px] font-semibold text-[#002c24] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? <LoaderCircle size={17} className="animate-spin" /> : null}
          {loading
            ? "Connexion..."
            : mode === "login"
              ? "Se connecter"
              : "Creer mon compte"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode((current) => (current === "login" ? "signup" : "login"));
          setMessage("");
        }}
        className="mt-6 w-full text-center text-[13px] font-medium text-white/60 hover:text-white"
      >
        {mode === "login"
          ? "Premiere connexion ? Creer un compte"
          : "Vous avez deja un compte ? Se connecter"}
      </button>
    </div>
  );
}
