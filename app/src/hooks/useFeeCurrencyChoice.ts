'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FEE_CURRENCY_STORAGE_KEY,
  type FeeCurrencyChoice,
} from '@/lib/feeCurrency';

const DEFAULT: FeeCurrencyChoice = 'stable';

/**
 * Persist the user's gas-fee currency preference (Mento stable vs native CELO)
 * in localStorage so it survives reloads. Defaults to 'stable' to match
 * MiniPay's fee-abstraction UX out of the box.
 */
export function useFeeCurrencyChoice(): [
  FeeCurrencyChoice,
  (next: FeeCurrencyChoice) => void,
] {
  const [choice, setChoice] = useState<FeeCurrencyChoice>(DEFAULT);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(FEE_CURRENCY_STORAGE_KEY);
    if (stored === 'stable' || stored === 'celo') {
      setChoice(stored);
    }
  }, []);

  const update = useCallback((next: FeeCurrencyChoice) => {
    setChoice(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FEE_CURRENCY_STORAGE_KEY, next);
    }
  }, []);

  return [choice, update];
}
