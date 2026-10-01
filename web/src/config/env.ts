/**
 * Environment variable access with validation.
 * All VITE_ prefixed vars are public and embedded in the browser bundle.
 */

/** Public RPC URL for read-only access (consumer verify page, no wallet) */
export const AMOY_RPC_URL =
  import.meta.env.VITE_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";

/** Pinata dedicated gateway domain (e.g. "your-name.mypinata.cloud") */
export const PINATA_GATEWAY =
  import.meta.env.VITE_PINATA_GATEWAY || "";

/** The deployed app's public URL (for QR code generation) */
export const PUBLIC_APP_URL =
  import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

/**
 * Returns the full IPFS gateway URL for a CID.
 * Falls back through multiple gateways if the primary isn't set.
 */
export function ipfsUrl(cid: string, gateway?: string): string {
  const gw = gateway || PINATA_GATEWAY;
  if (gw) {
    return `https://${gw}/ipfs/${cid}`;
  }
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

/** IPFS gateway fallback chain for the integrity check */
export const IPFS_GATEWAYS = [
  PINATA_GATEWAY ? `https://${PINATA_GATEWAY}` : null,
  "https://gateway.pinata.cloud",
  "https://ipfs.io",
].filter(Boolean) as string[];
