"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import type { Plan } from "@/types/plan";

interface MenuListTemplatesData {
  recipes?: unknown[];
  templates?: Plan[];
}

const MENU_LIST_TEMPLATES_PATH = "menu/list?type=templates";

export interface UsePlansResult {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Resolve plan label by id (from fetched plans). */
  getPlanLabel: (id: string) => string | undefined;
}

export function usePlans(): UsePlansResult {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<MenuListTemplatesData>(
        MENU_LIST_TEMPLATES_PATH,
      );
      const templates = res.data?.templates;
      setPlans(Array.isArray(templates) ? templates : []);
    } catch {
      setError("Could not load plans.");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const getPlanLabel = useCallback(
    (id: string) => plans.find((p) => p._id === id)?.title,
    [plans]
  );

  return { plans, loading, error, refetch: fetchPlans, getPlanLabel };
}
