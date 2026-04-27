const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "[livewithms] Supabase env missing. Running in dev-only mock auth mode.",
    {
      missingUrl: !supabaseUrl,
      missingAnonKey: !supabaseAnonKey,
    },
  );
}

const env = {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
};

export default env;
