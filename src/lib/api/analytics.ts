// API service for Analytics and Performance Metrics
import { supabase } from "@/lib/supabase";
import type { PerformanceMetric, InsertPerformanceMetric } from "@/types/database";

export const analyticsApi = {
  // Get performance metrics for a time period
  async getMetrics(
    betterAuthUserId: string,
    startDate: string,
    endDate: string
  ): Promise<PerformanceMetric[]> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Convert Better Auth ID to UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);
    
    if (!userUuid) {
      throw new Error("User not found in database");
    }

    const { data, error } = await supabase
      .from("performance_metrics")
      .select("*")
      .eq("user_id", userUuid)
      .gte("period_start", startDate)
      .lte("period_end", endDate)
      .order("period_start", { ascending: false });

    if (error) {
      console.error("Error fetching metrics:", error);
      throw new Error(`Failed to fetch metrics: ${error.message}`);
    }

    return data || [];
  },

  // Get latest metrics for each type
  async getLatestMetrics(betterAuthUserId: string): Promise<Record<string, PerformanceMetric>> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Convert Better Auth ID to UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);
    
    if (!userUuid) {
      throw new Error("User not found in database");
    }

    const metricTypes = ["reply_rate", "avg_response_time", "time_saved", "emails_sent", "leads_converted"];

    const results: Record<string, PerformanceMetric> = {};

    for (const type of metricTypes) {
      const { data, error } = await supabase
        .from("performance_metrics")
        .select("*")
        .eq("user_id", userUuid)
        .eq("metric_type", type)
        .order("period_end", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        results[type] = data;
      }
    }

    return results;
  },

  // Create a new metric
  async create(metric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await supabase
      .from("performance_metrics")
      .insert(metric)
      .select()
      .single();

    if (error) {
      console.error("Error creating metric:", error);
      throw new Error(`Failed to create metric: ${error.message}`);
    }

    return data;
  },

  // Get email performance stats
  async getEmailStats(betterAuthUserId: string, days: number = 7) {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Convert Better Auth ID to UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);
    
    if (!userUuid) {
      throw new Error("User not found in database");
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    const { data, error } = await supabase
      .from("emails")
      .select("status, direction, sent_at, received_at")
      .eq("user_id", userUuid)
      .or(`sent_at.gte.${startDateStr},received_at.gte.${startDateStr}`);

    if (error) {
      console.error("Error fetching email stats:", error);
      throw new Error(`Failed to fetch email stats: ${error.message}`);
    }

    // Calculate stats
    const sent = data?.filter((e) => e.direction === "outbound" && e.status === "sent").length || 0;
    const received = data?.filter((e) => e.direction === "inbound").length || 0;
    const replied = data?.filter((e) => e.direction === "outbound" && e.status === "sent").length || 0;

    return {
      sent,
      received,
      replied,
      replyRate: received > 0 ? (replied / received) * 100 : 0,
    };
  },

  // Get lead conversion stats
  async getLeadStats(betterAuthUserId: string) {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Use database function that accepts Better Auth TEXT ID
    const { data, error } = await supabase.rpc("get_lead_statistics", {
      p_better_auth_id: betterAuthUserId,
    });

    if (error) {
      console.error("Error fetching lead stats:", error);
      throw new Error(`Failed to fetch lead stats: ${error.message}`);
    }

    return data?.[0] || {
      total_leads: 0,
      hot_leads: 0,
      warm_leads: 0,
      cold_leads: 0,
      needs_follow_up: 0,
    };
  },
};



