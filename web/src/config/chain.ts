/**
 * Chain configuration for Polygon Amoy testnet.
 * Used by wagmi (wallet-connected pages) and viem publicClient (consumer verify page).
 */
import { defineChain } from "viem";

export const polygonAmoy = defineChain({
  id: 80002,
  name: "Polygon Amoy",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology"],
    },
  },
  blockExplorers: {
    default: {
      name: "Polygonscan",
      url: "https://amoy.polygonscan.com",
    },
  },
  testnet: true,
});

/** Polygonscan URL helpers */
export const explorerUrl = {
  tx: (hash: string) => `${polygonAmoy.blockExplorers.default.url}/tx/${hash}`,
  address: (addr: string) => `${polygonAmoy.blockExplorers.default.url}/address/${addr}`,
  block: (num: number) => `${polygonAmoy.blockExplorers.default.url}/block/${num}`,
};
