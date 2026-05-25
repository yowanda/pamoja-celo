'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMiniPay } from '@/hooks/useMiniPay';
import { useAccount } from 'wagmi';

export function ConnectBar() {
  const { isMiniPay, ready } = useMiniPay();
  const { address, chain } = useAccount();

  if (!ready) return null;

  // In MiniPay we auto-connect; the user already has a wallet and we should not
  // show a RainbowKit modal trigger. Show a tiny status pill instead.
  if (isMiniPay) {
    return (
      <div className="rounded-full border border-celo-forest/20 bg-white/40 px-3 py-1 text-xs font-medium text-celo-fig">
        MiniPay · {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '…'}
        {chain ? ` · ${chain.name}` : ''}
      </div>
    );
  }

  return <ConnectButton showBalance={false} chainStatus="icon" />;
}
