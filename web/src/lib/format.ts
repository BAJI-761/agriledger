/**
 * Formatting utilities for the UI.
 */

/**
 * Formats a Unix timestamp to a human-readable date.
 * Display: "12 Aug 2026" — full timestamp on hover via title attribute.
 */
export function formatDate(timestamp: number | bigint): string {
  const ts = Number(timestamp);
  if (ts === 0) return "—";
  const date = new Date(ts * 1000);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Full ISO timestamp for title/tooltip.
 */
export function formatFullDate(timestamp: number | bigint): string {
  const ts = Number(timestamp);
  if (ts === 0) return "";
  return new Date(ts * 1000).toISOString();
}

/**
 * Shortens an Ethereum address: 0x12ab…89ef
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

/**
 * Shortens a CID or hash for display.
 */
export function shortenHash(hash: string, chars = 8): string {
  if (!hash) return "";
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars + 2)}…${hash.slice(-chars)}`;
}

/**
 * Formats latitude/longitude from E6 integer to decimal string.
 */
export function formatCoord(e6: number | bigint): string {
  return (Number(e6) / 1_000_000).toFixed(6);
}

/**
 * Returns the stage name as a human-readable string.
 */
export function stageName(stage: number): string {
  const names = ["Harvested", "Lab Approved", "Lab Rejected", "At Hub", "Revoked"];
  return names[stage] ?? "Unknown";
}

/**
 * Copies text to clipboard and returns true on success.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
