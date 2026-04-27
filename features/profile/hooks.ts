import { useQuery } from "@tanstack/react-query";
import { profileApi } from "./api";

export function useMyProfile(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => {
      if (!userId) {
        throw new Error("Missing user id for profile query");
      }

      return profileApi.getMyProfile(userId);
    },
    enabled: !!userId,
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}
