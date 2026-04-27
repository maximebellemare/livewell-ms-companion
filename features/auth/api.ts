import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase/client";

export const authApi = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }

    return data.session;
  },
  onAuthStateChange(callback: (session: Session | null, event: AuthChangeEvent) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session, event);
    });
  },
  async signOut() {
    await supabase.auth.signOut();
  },
};
