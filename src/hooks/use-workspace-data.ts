import { useQuery } from "@tanstack/react-query";
import { useUserId } from "./useUserId";
import {
  leadsApi,
  emailsApi,
  emailConnectionsApi,
  actionQueueApi,
  insightsApi,
} from "@/lib/api";
export function useLeads() {
  const id = useUserId();
  return useQuery({
    queryKey: ["leads", id],
    queryFn: () => leadsApi.getAll(id!),
    enabled: !!id,
    staleTime: 30000,
  });
}
export function useThreads() {
  const id = useUserId();
  return useQuery({
    queryKey: ["threads", id],
    queryFn: () => emailsApi.getThreads(id!),
    enabled: !!id,
    staleTime: 30000,
  });
}
export function useDrafts() {
  const id = useUserId();
  return useQuery({
    queryKey: ["drafts", id],
    queryFn: () => emailsApi.getDrafts(id!),
    enabled: !!id,
    staleTime: 30000,
  });
}
export function useConnections() {
  const id = useUserId();
  return useQuery({
    queryKey: ["connections", id],
    queryFn: () => emailConnectionsApi.getAll(id!),
    enabled: !!id,
    staleTime: 30000,
  });
}
export function useQueue() {
  const id = useUserId();
  return useQuery({
    queryKey: ["queue", id],
    queryFn: () => actionQueueApi.getTasks(id!),
    enabled: !!id,
    staleTime: 30000,
  });
}
export function useInsights() {
  const id = useUserId();
  return useQuery({
    queryKey: ["insights", id],
    queryFn: () => insightsApi.getRecent(id!, 1),
    enabled: !!id,
    staleTime: 60000,
  });
}
