import type { ClaimInfo } from "@/types/fuelRequest";

export interface RequestPatch {
  claim?: ClaimInfo | null;
  fueled?: ClaimInfo | null;
}

export async function patchRequest(requestId: number, patch: RequestPatch): Promise<void> {
  const res = await fetch(`/api/erau/requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`Failed to update request ${requestId} (${res.status})`);
  }
}
