/**
 * Smart Contract Configuration
 * Optimized for Pandem Protocol on Celo Sepolia.
 */

import type { Address } from 'viem';

/**
 * Network configuration
 */
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const NETWORKS: Record<string, NetworkConfig> = {
  baseSepolia: {
    chainId: 11142220,
    name: 'Celo Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

export function getCurrentNetwork(): NetworkConfig {
  return NETWORKS.baseSepolia;
}

/**
 * Contract addresses
 */
export const HANDOVER_CONTRACT_ADDRESS: Address = '0xF2436d6E98EbD303965C3Ef595C3a01B2561a6A4';
export const TOKEN_ADDRESS: Address = '0x405A5bAF6a66319de62ab6A86058dB4829F7487e';

export function getContractAddress(): Address {
  return HANDOVER_CONTRACT_ADDRESS;
}

export function getTokenAddress(): Address {
  return TOKEN_ADDRESS;
}

export const TX_CONFIG = {
  CONFIRMATION_BLOCKS: 1,
  TIMEOUT_MS: 60000,
} as const;
