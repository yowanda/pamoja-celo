'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMiniPay } from '@/hooks/useMiniPay';
import { useAccount } from 'wagmi';
import { Wallet } from 'lucide-react';

export function ConnectBar() {
  const { isMiniPay, ready } = useMiniPay();
  const { address, chain } = useAccount();

  if (!ready) return null;

  // In MiniPay we auto-connect; the user already has a wallet and we should not
  // show a RainbowKit modal trigger. Show a tiny status pill instead.
  if (isMiniPay) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted shadow-card">
        <Wallet className="h-3.5 w-3.5 text-brand-500" />
        <span className="text-ink">MiniPay</span>
        <span className="text-ink-muted">·</span>
        <span className="font-mono text-ink">
          {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '…'}
        </span>
        {chain ? (
          <>
            <span className="text-ink-muted">·</span>
            <span className="text-ink-muted">{chain.name}</span>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <ConnectButton
      showBalance={false}
      chainStatus="icon"
      accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
    />
  );
}
