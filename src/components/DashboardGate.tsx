"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import AccessCodeModal from "./AccessCodeModal";
import FuelRequestsBoard from "./FuelRequestsBoard";

interface StatusResponse {
  hasAccess: boolean;
}

export default function DashboardGate() {
  const { data, mutate, isLoading } = useSWR<StatusResponse>("/api/erau/status", fetcher);

  const handleGranted = useCallback(() => {
    mutate({ hasAccess: true }, { revalidate: false });
  }, [mutate]);

  const handleAccessLost = useCallback(() => {
    mutate({ hasAccess: false }, { revalidate: false });
  }, [mutate]);

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 justify-center items-center">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading Fueler Dashboard…</p>
      </div>
    );
  }

  if (!data.hasAccess) {
    return <AccessCodeModal onGranted={handleGranted} />;
  }

  return <FuelRequestsBoard onAccessLost={handleAccessLost} />;
}
