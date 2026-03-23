import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { ReactNode } from "react";

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [baseSepolia],
    transports: {
      [baseSepolia.id]: http(import.meta.env.VITE_RPC_URL || "https://sepolia.base.org"),
    },

    // Required API Keys
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "PACTOR_PLACEHOLDER",

    // Required App Info
    appName: "Pandem Protocol",

    // Optional App Info
    appDescription: "The Integrity Layer for Agentic Commerce",
    appUrl: "https://pandem.xyz",
    appIcon: "https://pandem.xyz/logo.png",
  }),
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="auto">
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
