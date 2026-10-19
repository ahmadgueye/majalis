"use client";

import { createBrowserClient } from "@supabase/ssr";
import { hasSupabase, supabaseKey, supabaseUrl } from "./env";

export function createClient() {
  if (!hasSupabase) return null;
  return createBrowserClient(supabaseUrl!, supabaseKey!);
}
