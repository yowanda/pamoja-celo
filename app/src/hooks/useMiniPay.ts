'use client';

import { useEffect, useState } from 'react';
import { useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

/**
 * useMiniPay
 * ----------
 * MiniPay is Opera's mobile wallet on Celo. Apps loaded inside MiniPay get an
 * injected EIP-1193 provider at `window.ethereum` that ALSO sets
 * `window.ethereum.isMiniPay === true`.
 *
 * MiniPay UX rules (https://docs.celo.org/build/build-on-minipay/overview):
 *   1. Auto-connect on load — do NOT show a "Connect Wallet" button.
 *   2. Hide standard wallet connect modals (RainbowKit etc).
 *   3. Only use stablecoins (cUSD, USDT, USDC) — never native CELO.
 *   4. Pay gas in cUSD by passing `feeCurrency` to txs (Celo-specific field).
 *
 * This single hook detects MiniPay, auto-connects via the injected connector,
 * and exposes a flag the rest of the app can use to hide RainbowKit.
 */
export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [ready, setReady] = useState(false);
  const { connect, connectors } = useConnect();

  useEffect(() => {
    if (typeof window === 'undefined') {
      setReady(true);
      return;
    }
    const eth = (window as unknown as { ethereum?: { isMiniPay?: boolean } })
      .ethereum;
    const inMiniPay = Boolean(eth?.isMiniPay);
    setIsMiniPay(inMiniPay);

    if (inMiniPay) {
      // MiniPay injects an EIP-1193 provider; auto-connect via the injected
      // connector — do not prompt the user.
      const injectedConn =
        connectors.find((c) => c.id === 'injected') ?? injected();
      connect({ connector: injectedConn });
    }
    setReady(true);
  }, [connect, connectors]);

  return { isMiniPay, ready };
}
