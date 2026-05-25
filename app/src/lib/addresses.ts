import type { Address } from 'viem';

export type ChainConfig = {
  chainId: number;
  name: string;
  rpc: string;
  explorer: string;
  savingsCircle: Address;
  /**
   * Mento stablecoin used as default circle currency. On Celo mainnet
   * (0x765DE...) the on-chain `symbol()` was rebranded from `cUSD` to `USDm`
   * (Mento Dollar) in 2025 — same contract, same peg, just new branding.
   * Celo Sepolia still reports `cUSD`. Components should call `useStableSymbol`
   * to get the actual symbol from chain at runtime.
   */
  stable: Address;
  /** Fallback label when the on-chain `symbol()` read hasn't returned yet. */
  stableFallbackSymbol: string;
};

// Token addresses sourced from https://docs.celo.org/tooling/contracts/token-contracts.
export const CELO_MAINNET: ChainConfig = {
  chainId: 42220,
  name: 'Celo',
  rpc: 'https://forno.celo.org',
  explorer: 'https://celoscan.io',
  savingsCircle:
    (process.env.NEXT_PUBLIC_SAVINGS_CIRCLE_CELO as Address) ??
    '0x0000000000000000000000000000000000000000',
  stable: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  stableFallbackSymbol: 'USDm',
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
  stable: '0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80',
  stableFallbackSymbol: 'cUSD',
};

export function getChainConfig(chainId: number | undefined): ChainConfig {
  if (chainId === CELO_MAINNET.chainId) return CELO_MAINNET;
  return CELO_SEPOLIA;
}
