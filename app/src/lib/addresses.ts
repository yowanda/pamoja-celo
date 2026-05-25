import type { Address } from 'viem';

export type ChainConfig = {
  chainId: number;
  name: string;
  rpc: string;
  explorer: string;
  savingsCircle: Address;
  cUSD: Address;
};

// Token addresses sourced from https://docs.celo.org/tooling/contracts/token-contracts.
// The stablecoin formerly known as cUSD is now branded "Mento Dollar" / USDm
// at the same address — MiniPay still uses it as its main stablecoin.
export const CELO_MAINNET: ChainConfig = {
  chainId: 42220,
  name: 'Celo',
  rpc: 'https://forno.celo.org',
  explorer: 'https://celoscan.io',
  savingsCircle:
    (process.env.NEXT_PUBLIC_SAVINGS_CIRCLE_CELO as Address) ??
    '0x0000000000000000000000000000000000000000',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
};

// Celo Sepolia (chainId 11142220) replaced Alfajores in 2025 as the official
// Celo developer testnet.
export const CELO_SEPOLIA: ChainConfig = {
  chainId: 11142220,
  name: 'Celo Sepolia',
  rpc: 'https://forno.celo-sepolia.celo-testnet.org',
  explorer: 'https://celo-sepolia.blockscout.com',
  savingsCircle:
    (process.env.NEXT_PUBLIC_SAVINGS_CIRCLE_CELO_SEPOLIA as Address) ??
    '0x0000000000000000000000000000000000000000',
  cUSD: '0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80',
};

export function getChainConfig(chainId: number | undefined): ChainConfig {
  if (chainId === CELO_MAINNET.chainId) return CELO_MAINNET;
  return CELO_SEPOLIA;
}
