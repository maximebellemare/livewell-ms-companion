import { createClient } from "@supabase/supabase-js";
import env from "../env";
import { authStorage } from "./auth-storage";
import type { Database } from "./types";

export const supabase = createClient<Database>(
  env.supabaseUrl || "https://mock.supabase.co",
  env.supabaseAnonKey || "mock-anon-key",
  {
  auth: {
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  },
);
