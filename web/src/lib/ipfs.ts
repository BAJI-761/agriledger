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
