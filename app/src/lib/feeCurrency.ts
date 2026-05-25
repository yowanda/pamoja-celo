import type { Address } from 'viem';
import { getChainConfig } from './addresses';

/**
 * Build the Celo-specific `feeCurrency` field for a transaction so that gas is
 * paid in cUSD instead of native CELO.
 *
 * MiniPay only funds users with stablecoins; passing `feeCurrency` is required
 * for transactions to succeed inside MiniPay.
 */
export function getFeeCurrency(chainId: number | undefined): {
  feeCurrency?: Address;
} {
  if (!chainId) return {};
  const cfg = getChainConfig(chainId);
  return { feeCurrency: cfg.cUSD };
}
