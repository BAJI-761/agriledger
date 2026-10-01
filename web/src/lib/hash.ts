/**
 * Hash utilities for file integrity verification.
 * Uses keccak256 from viem to match the on-chain Solidity keccak256.
 */
import { keccak256 } from "viem";

/**
 * Computes the keccak256 hash of a Uint8Array.
 * This is the same hash function used in Solidity, so the output
 * can be directly compared to on-chain `reportHash` values.
 */
export function hashBytes(data: Uint8Array): `0x${string}` {
  return keccak256(data);
}

/**
 * Compares two hex hash strings (case-insensitive).
 */
export function hashesMatch(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}
