/**
 * IPFS helper functions: fetching files and building URLs with gateway fallback.
 */
import { IPFS_GATEWAYS } from "../config/env";

/**
 * Fetches a file from IPFS, trying multiple gateways in order.
 * Returns the Response on success or null if all gateways fail.
 */
export async function fetchFromIPFS(
  cid: string,
  filename?: string
): Promise<Response | null> {
  for (const gw of IPFS_GATEWAYS) {
    try {
      const url = `${gw}/ipfs/${cid}${filename ? `?filename=${filename}` : ""}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) return res;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Fetches a file from IPFS and returns it as a Uint8Array.
 */
export async function fetchIPFSBytes(cid: string): Promise<Uint8Array | null> {
  const res = await fetchFromIPFS(cid);
  if (!res) return null;
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Returns the best available IPFS gateway URL for a CID.
 */
export function ipfsGatewayUrl(cid: string): string {
  if (IPFS_GATEWAYS.length > 0) {
    return `${IPFS_GATEWAYS[0]}/ipfs/${cid}`;
  }
  return `https://ipfs.io/ipfs/${cid}`;
}

/**
 * Upload a file to IPFS via the backend proxy
 */
export async function uploadFile(file: File): Promise<{ cid: string; size: number; name: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to upload file");
  }

  return res.json();
}

/**
 * Upload a JSON object to IPFS via the backend proxy
 */
export async function uploadJson(data: Record<string, any>): Promise<{ cid: string; size: number }> {
  const res = await fetch("/api/upload-json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const resData = await res.json().catch(() => ({}));
    throw new Error(resData.error || "Failed to upload JSON");
  }

  return res.json();
}
