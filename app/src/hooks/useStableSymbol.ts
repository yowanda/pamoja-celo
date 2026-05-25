'use client';

import { useChainId, useReadContract } from 'wagmi';
import { erc20Abi } from '@/lib/abi';
import { getChainConfig } from '@/lib/addresses';

/**
 * Read the on-chain `symbol()` of the chain's Mento stablecoin and return it
 * so the UI can label amounts with whatever symbol the token actually reports.
 *
 * Mainnet: returns "USDm" (Mento Dollar — the token previously branded cUSD,
 * same contract at 0x765DE8...).
 * Celo Sepolia: returns "cUSD" (legacy branding).
 *
 * Falls back to `cfg.stableFallbackSymbol` while the RPC call is in flight or
 * if it fails.
 */
export function useStableSymbol(): string {
  const chainId = useChainId();
  const cfg = getChainConfig(chainId);
  const { data } = useReadContract({
    chainId,
    address: cfg.stable,
    abi: erc20Abi,
    functionName: 'symbol',
  });
  return data ?? cfg.stableFallbackSymbol;
}
