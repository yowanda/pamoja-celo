import type { Address } from 'viem';

export type TokenInfo = {
  /** ERC20 address used for `transferFrom` and as `feeCurrency`. */
  address: Address;
  /** Default symbol shown before the on-chain `symbol()` read returns. */
  fallbackSymbol: string;
  /** ERC20 decimals — both CELO and the Mento stablecoins are 18. */
  decimals: number;
  /** Identifier referenced by UI selectors. */
  id: 'stable' | 'celo';
};

export type ChainConfig = {
  chainId: number;
  name: string;
  rpc: string;
  explorer: string;
  savingsCircle: Address;
  /**
   * Mento stablecoin used as a circle currency. On Celo mainnet
   * (0x765DE...) the on-chain `symbol()` was rebranded from `cUSD` to `USDm`
   * (Mento Dollar) in 2025 — same contract, same peg, just new branding.
   * Celo Sepolia still reports `cUSD`. Components should call `useStableSymbol`
   * or `useTokenSymbol` to get the actual symbol from chain at runtime.
   */
  stable: TokenInfo;
  /**
   * Native CELO exposed as an ERC20 at a stable address on every Celo chain.
   * Used both as a circle currency and as an alternative `feeCurrency` when
   * users prefer to pay gas with CELO instead of stablecoin.
   */
  celo: TokenInfo;
};

// CELO is exposed as an ERC20 at the same address across all Celo networks
// (mainnet, Alfajores, Sepolia). It debits the same balance as native CELO.
const CELO_ERC20: Address = '0x471EcE3750Da237f93B8E339c536989b8978a438';

// Token addresses sourced from https://docs.celo.org/tooling/contracts/token-contracts.
export const CELO_MAINNET: ChainConfig = {
  chainId: 42220,
  name: 'Celo',
  rpc: 'https://forno.celo.org',
  explorer: 'https://celoscan.io',
  savingsCircle:
    (process.env.NEXT_PUBLIC_SAVINGS_CIRCLE_CELO as Address) ??
    '0x0000000000000000000000000000000000000000',
  stable: {
    id: 'stable',
    address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    fallbackSymbol: 'USDm',
    decimals: 18,
  },
  celo: {
    id: 'celo',
    address: CELO_ERC20,
    fallbackSymbol: 'CELO',
    decimals: 18,
  },
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
  stable: {
    id: 'stable',
    address: '0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80',
    fallbackSymbol: 'cUSD',
    decimals: 18,
  },
  celo: {
    id: 'celo',
    address: CELO_ERC20,
    fallbackSymbol: 'CELO',
    decimals: 18,
  },
};

export function getChainConfig(chainId: number | undefined): ChainConfig {
  if (chainId === CELO_MAINNET.chainId) return CELO_MAINNET;
  return CELO_SEPOLIA;
}

export function getTokenById(
  chainId: number | undefined,
  id: TokenInfo['id'],
): TokenInfo {
  const cfg = getChainConfig(chainId);
  return id === 'celo' ? cfg.celo : cfg.stable;
}

export function getTokenByAddress(
  chainId: number | undefined,
  address: Address | undefined,
): TokenInfo | undefined {
  if (!address) return undefined;
  const cfg = getChainConfig(chainId);
  const a = address.toLowerCase();
  if (cfg.celo.address.toLowerCase() === a) return cfg.celo;
  if (cfg.stable.address.toLowerCase() === a) return cfg.stable;
  return undefined;
}
