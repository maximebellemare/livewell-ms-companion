import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Relapse {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  severity: string;
  symptoms: string[];
  triggers: string[];
  treatment: string | null;
  notes: string | null;
  is_recovered: boolean;
  created_at: string;
  updated_at: string;
}

export const useRelapses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["relapses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relapses" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as unknown as Relapse[];
    },
    enabled: !!user,
  });
};

export const useCreateRelapse = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (relapse: Omit<Relapse, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("relapses" as any)
        .insert({ ...relapse, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relapses"] });
    },
  });
};

export const useUpdateRelapse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Relapse> & { id: string }) => {
      const { data, error } = await supabase
        .from("relapses" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relapses"] });
    },
  });
};

export const useDeleteRelapse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("relapses" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relapses"] });
    },
  });
};
