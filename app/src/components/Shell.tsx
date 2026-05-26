'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ConnectBar } from './ConnectBar';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-12 pt-5">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-celo-forest text-celo">
            <span className="text-lg">◐</span>
          </div>
          <div className="leading-tight">
            <div className="text-base font-extrabold tracking-tight">Pamoja</div>
            <div className="text-[10px] uppercase text-celo-fig/60">Onchain savings · Celo</div>
          </div>
        </Link>
        <ConnectBar />
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-10 pt-6 text-center text-[11px] text-celo-fig/60">
        <div>Built on Celo · MiniPay-compatible</div>
        <div className="mt-1 font-mono text-[10px] text-celo-fig/50">
          build {process.env.NEXT_PUBLIC_BUILD_SHA ?? 'dev'}
        </div>
      </footer>
    </div>
  );
}
