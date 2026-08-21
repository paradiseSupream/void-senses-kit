import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type VaultAsset = {
  id: string;
  title: string;
  category: string;
  description: string;
  drive_link: string;
  download_count: number;
};

export const VAULT_CATEGORIES = ["All", "Dev", "Design", "AI", "Books"] as const;

export const vaultQueryOptions = queryOptions({
  queryKey: ["vault_assets"],
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<VaultAsset[]> => {
    const { data, error } = await supabase
      .from("vault_assets")
      .select("id,title,category,description,drive_link,download_count")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as VaultAsset[];
  },
});
