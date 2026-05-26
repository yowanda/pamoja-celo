'use client';

import { useChainId } from 'wagmi';
import { getChainConfig } from '@/lib/addresses';
import { useTokenSymbol } from './useTokenSymbol';

/**
 * Read the on-chain `symbol()` of the chain's Mento stablecoin.
 *
 * Mainnet: returns "USDm" (Mento Dollar — the token previously branded cUSD,
 * same contract at 0x765DE8...).
 * Celo Sepolia: returns "cUSD" (legacy branding).
 */
export function useStableSymbol(): string {
  const chainId = useChainId();
  const cfg = getChainConfig(chainId);
  return useTokenSymbol(cfg.stable.address, cfg.stable.fallbackSymbol);
}
