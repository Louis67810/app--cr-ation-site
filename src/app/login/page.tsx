import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims?.sub) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#001c23] px-5 py-16 font-[var(--font-inter)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(0,212,148,0.12),transparent_36%)]" />
      <div className="relative z-10 flex w-full justify-center">
        <AuthForm />
      </div>
    </main>
  );
}
