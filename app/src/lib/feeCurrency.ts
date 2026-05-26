import type { Address } from 'viem';
import { getChainConfig } from './addresses';

export type FeeCurrencyChoice = 'stable' | 'celo';

export const FEE_CURRENCY_STORAGE_KEY = 'pamoja:feeCurrency';

/**
 * Build the Celo-specific `feeCurrency` field for a transaction.
 *
 * - choice = 'stable' → pay gas in Mento USDm/cUSD (MiniPay default).
 * - choice = 'celo'   → pay gas in native CELO (omit `feeCurrency`).
 *
 * MiniPay only funds users with stablecoins by default, so 'stable' is the
 * recommended choice when running inside MiniPay. Users that hold CELO can
 * opt in to paying gas with CELO instead.
 */
export function getFeeCurrency(
  chainId: number | undefined,
  choice: FeeCurrencyChoice = 'stable',
): { feeCurrency?: Address } {
  if (!chainId) return {};
  if (choice === 'celo') return {};
  const cfg = getChainConfig(chainId);
  return { feeCurrency: cfg.stable.address };
}
