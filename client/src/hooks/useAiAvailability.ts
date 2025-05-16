import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface AiStatusResponse {
  isAvailable: boolean;
}

export function useAiAvailability() {
  const { data, isLoading } = useQuery<AiStatusResponse>({
    queryKey: ["/api/ai/status"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  return {
    isAiAvailable: data?.isAvailable ?? false,
    isLoading,
  };
}