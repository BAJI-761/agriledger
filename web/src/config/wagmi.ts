/**
 * Wagmi configuration for wallet-connected pages.
 * Uses only the injected connector (MetaMask) — no WalletConnect project ID needed.
 */
import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { polygonAmoy } from "./chain";
import { AMOY_RPC_URL } from "./env";

export const wagmiConfig = createConfig({
  chains: [polygonAmoy],
  connectors: [injected()],
  transports: {
    [polygonAmoy.id]: http(AMOY_RPC_URL),
  },
});
