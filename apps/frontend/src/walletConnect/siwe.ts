import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { baseSepolia } from 'viem/chains';

// Get projectId from https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'PACTOR_PLACEHOLDER';

export const metadata = {
  name: 'Pandem Protocol',
  description: 'The Integrity Layer for Agentic Commerce',
  url: 'https://pandem.xyz',
  icons: ['https://pandem.xyz/logo.png'],
};

// Create wagmiConfig
const chains = [baseSepolia] as const;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
});
