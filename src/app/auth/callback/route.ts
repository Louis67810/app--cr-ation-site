import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const invitationToken = url.searchParams.get("invite");
  let projectKey: string | null = null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && invitationToken) {
      const { data } = await supabase.rpc("accept_project_invitation", { invite_token: invitationToken });
      const membership = Array.isArray(data) ? data[0] : null;
      projectKey = membership?.project_key ?? null;
    }
  }

  const destination = projectKey ? `/dashboard?project=${encodeURIComponent(projectKey)}` : "/dashboard";
  return NextResponse.redirect(new URL(destination, url.origin));
}
