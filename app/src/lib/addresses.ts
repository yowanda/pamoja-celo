import type { Address } from 'viem';

export type ChainConfig = {
  chainId: number;
  name: string;
  rpc: string;
  explorer: string;
  savingsCircle: Address;
  cUSD: Address;
};

// Official cUSD addresses
// - Mainnet: https://docs.celo.org/contract-addresses
// - Alfajores: https://docs.celo.org/network/alfajores
export const CELO_MAINNET: ChainConfig = {
  chainId: 42220,
  name: 'Celo',
  rpc: 'https://forno.celo.org',
  explorer: 'https://celoscan.io',
  // Update after `forge script ... --rpc-url celo --broadcast`
  savingsCircle:
    (process.env.NEXT_PUBLIC_SAVINGS_CIRCLE_CELO as Address) ??
    '0x0000000000000000000000000000000000000000',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
};

export const ALFAJORES: ChainConfig = {
  chainId: 44787,
  name: 'Alfajores',
  rpc: 'https://alfajores-forno.celo-testnet.org',
  explorer: 'https://alfajores.celoscan.io',
  savingsCircle:
    (process.env.NEXT_PUBLIC_SAVINGS_CIRCLE_ALFAJORES as Address) ??
    '0x0000000000000000000000000000000000000000',
  cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
};

export function getChainConfig(chainId: number | undefined): ChainConfig {
  if (chainId === CELO_MAINNET.chainId) return CELO_MAINNET;
  return ALFAJORES;
}
