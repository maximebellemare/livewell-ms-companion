import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Recipe {
  id: string;
  name: string;
  meal: string;
  ingredients: string[];
  instructions: string;
  prep_time?: string;
  servings?: number;
  calories?: number;
}

export interface DietPlan {
  id: string;
  name: string;
  description: string;
  emoji: string;
  food_lists: {
    eat_more: string[];
    limit: string[];
    avoid: string[];
  };
  recipes: Recipe[];
  daily_goals: string[];
  sort_order: number;
}

// Weekly selections: { "monday": { "breakfast": "recipe_id", "lunch": "recipe_id", ... }, ... }
export type WeeklySelections = Record<string, Record<string, string>>;

export interface UserDietPlan {
  id: string;
  user_id: string;
  plan_id: string;
  active: boolean;
  swapped_recipes: Record<string, Recipe>;
  weekly_selections: WeeklySelections;
  created_at: string;
}

export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
export const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

export function useDietPlans() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["diet-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diet_plans" as any)
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        ...d,
        food_lists: typeof d.food_lists === "string" ? JSON.parse(d.food_lists) : d.food_lists,
        recipes: typeof d.recipes === "string" ? JSON.parse(d.recipes) : d.recipes,
        daily_goals: typeof d.daily_goals === "string" ? JSON.parse(d.daily_goals) : d.daily_goals,
      })) as DietPlan[];
    },
    enabled: !!user,
  });
}

export function useUserDietPlan() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-diet-plan", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_diet_plans" as any)
        .select("*")
        .eq("user_id", user!.id)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const d = data as any;
      return {
        ...d,
        swapped_recipes: typeof d.swapped_recipes === "string" ? JSON.parse(d.swapped_recipes) : d.swapped_recipes,
        weekly_selections: typeof d.weekly_selections === "string" ? JSON.parse(d.weekly_selections) : (d.weekly_selections ?? {}),
      } as UserDietPlan;
    },
    enabled: !!user,
  });
}

export function useSelectDietPlan() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      await supabase
        .from("user_diet_plans" as any)
        .update({ active: false } as any)
        .eq("user_id", user!.id)
        .eq("active", true);
      const { error } = await supabase
        .from("user_diet_plans" as any)
        .insert({ user_id: user!.id, plan_id: planId, active: true, swapped_recipes: {}, weekly_selections: {} } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-diet-plan"] }),
  });
}

export function useDeselectDietPlan() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_diet_plans" as any)
        .update({ active: false } as any)
        .eq("user_id", user!.id)
        .eq("active", true);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-diet-plan"] }),
  });
}

export function useSwapRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userDietPlanId, originalRecipeId, newRecipe, currentSwaps,
    }: {
      userDietPlanId: string;
      originalRecipeId: string;
      newRecipe: Recipe;
      currentSwaps: Record<string, Recipe>;
    }) => {
      const updated = { ...currentSwaps, [originalRecipeId]: newRecipe };
      const { error } = await supabase
        .from("user_diet_plans" as any)
        .update({ swapped_recipes: updated } as any)
        .eq("id", userDietPlanId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-diet-plan"] }),
  });
}

export function useResetRecipeSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userDietPlanId, originalRecipeId, currentSwaps,
    }: {
      userDietPlanId: string;
      originalRecipeId: string;
      currentSwaps: Record<string, Recipe>;
    }) => {
      const updated = { ...currentSwaps };
      delete updated[originalRecipeId];
      const { error } = await supabase
        .from("user_diet_plans" as any)
        .update({ swapped_recipes: updated } as any)
        .eq("id", userDietPlanId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-diet-plan"] }),
  });
}

export function useUpdateWeeklySelections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userDietPlanId, weekly_selections,
    }: {
      userDietPlanId: string;
      weekly_selections: WeeklySelections;
    }) => {
      const { error } = await supabase
        .from("user_diet_plans" as any)
        .update({ weekly_selections } as any)
        .eq("id", userDietPlanId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-diet-plan"] }),
  });
}

export function useAISwapSuggestions() {
  return useMutation({
    mutationFn: async ({
      recipe, dietName, mealType,
    }: {
      recipe: Recipe;
      dietName: string;
      mealType: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("diet-swap", {
        body: { recipe, diet_name: dietName, meal_type: mealType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.alternatives ?? []) as Recipe[];
    },
  });
}
