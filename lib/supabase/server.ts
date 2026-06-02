import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, isSupabaseConfigured } from "./config";

export async function createServerSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always set cookies; middleware refreshes sessions.
        }
      }
    }
  });
}

export async function getOptionalServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createServerSupabaseClient();
}

export function isSupabaseServiceRoleConfigured() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createServiceRoleSupabaseClient() {
  const { url } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Supabase service role key is not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
