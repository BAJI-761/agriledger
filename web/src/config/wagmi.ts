/**
 * Wagmi configuration for wallet-connected pages.
 * Uses only the injected connector (MetaMask) — no WalletConnect project ID needed.
 */
import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { hardhat } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [hardhat],
  connectors: [injected()],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});
