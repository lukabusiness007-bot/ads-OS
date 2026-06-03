import { redirect } from "next/navigation";
import { getOptionalServerSupabaseClient } from "./server";

export async function requireAuthenticatedUser(nextPath: string) {
  const supabase = await getOptionalServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}
