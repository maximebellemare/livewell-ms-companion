import env from "../../lib/env";
import { getMockProfile } from "../../lib/dev-auth";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "./types";

export const profileApi = {
  async getMyProfile(userId: string) {
    if (!userId) {
      throw new Error("Missing user id for profile query");
    }

    if (!env.isSupabaseConfigured) {
      return getMockProfile();
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, onboarding_completed")
      .eq("user_id", userId)
      .single();

    if (error) {
      throw error;
    }

    return data as Profile;
  },
};
