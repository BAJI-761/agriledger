/**
 * Creates a public viem client for read-only chain access.
 * Used by the consumer verify page (no wallet needed).
 */
import { createPublicClient, http } from "viem";
import { polygonAmoy } from "../config/chain";
import { AMOY_RPC_URL } from "../config/env";

export const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(AMOY_RPC_URL),
});
