'use client';

import type { Address } from 'viem';
import { useChainId, useReadContract } from 'wagmi';
import { erc20Abi } from '@/lib/abi';

/**
 * Read the on-chain `symbol()` of any ERC20 on the current chain. Falls back
 * to the provided label while the call is in flight or if it fails.
 */
export function useTokenSymbol(
  address: Address | undefined,
  fallback: string,
): string {
  const chainId = useChainId();
  const { data } = useReadContract({
    chainId,
    address,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: !!address },
  });
  return data ?? fallback;
}
