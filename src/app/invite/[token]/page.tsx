import { notFound } from "next/navigation";
import { InvitationSignupForm } from "@/components/invitation-signup-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_project_invitation", { invite_token: token });
  const invitation = Array.isArray(data) ? data[0] as { email: string; project_name: string; status: string } | undefined : undefined;

  if (error || !invitation || invitation.status !== "pending") notFound();

  return <InvitationSignupForm token={token} email={invitation.email} projectName={invitation.project_name} />;
}
