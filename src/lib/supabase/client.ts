"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { hasSupabase, supabaseKey, supabaseUrl } from "./env";

export function createClient() {
  if (!hasSupabase) return null;
  return createBrowserClient<Database>(supabaseUrl!, supabaseKey!);
}
