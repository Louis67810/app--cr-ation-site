import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();

  if (!authData?.claims?.sub) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const payload = (await request.json()) as { token?: string };
  if (!payload.token) {
    return NextResponse.json({ error: "Invitation invalide." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("accept_project_invitation", {
    invite_token: payload.token,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const membership = Array.isArray(data) ? data[0] : null;
  return NextResponse.json({ projectKey: membership?.project_key });
}
