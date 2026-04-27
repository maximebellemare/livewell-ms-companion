import env from "../../lib/env";
import { getMockProfile } from "../../lib/dev-auth";
import { normalizeError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "./types";

export type ProfileUpdateInput = Partial<
  Pick<
    Profile,
    | "display_name"
    | "ms_type"
    | "year_diagnosed"
    | "symptoms"
    | "goals"
    | "country"
    | "age_range"
    | "onboarding_completed"
  >
>;

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
      .select("user_id, onboarding_completed, display_name, ms_type, year_diagnosed, symptoms, goals, country, age_range")
      .eq("user_id", userId)
      .single();

    if (error) {
      const normalizedError = normalizeError(error);
      logger.error("Profile lookup failed", {
        userId,
        message: normalizedError.message,
        code: normalizedError.code,
        details: normalizedError.details,
        hint: normalizedError.hint,
      });
      throw error;
    }

    return data as Profile;
  },
  async updateMyProfile(userId: string, input: ProfileUpdateInput) {
    if (!userId) {
      throw new Error("Missing user id for profile update");
    }

    if (!env.isSupabaseConfigured) {
      return {
        ...getMockProfile(),
        ...input,
      } as Profile;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(input)
      .eq("user_id", userId)
      .select("user_id, onboarding_completed, display_name, ms_type, year_diagnosed, symptoms, goals, country, age_range")
      .single();

    if (error) {
      throw error;
    }

    return data as Profile;
  },
};
