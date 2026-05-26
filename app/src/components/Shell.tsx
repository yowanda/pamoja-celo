'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ConnectBar } from './ConnectBar';
import { Coins } from 'lucide-react';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-brand-50 via-surface-warm to-transparent" />
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-12 pt-5">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <div className="leading-tight">
              <div className="font-display text-base font-bold tracking-tight text-ink">
                Pamoja
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-subtle">
                Onchain savings · Celo
              </div>
            </div>
          </Link>
          <ConnectBar />
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-12 border-t border-border pt-6">
          <div className="flex items-center justify-between gap-2 text-[11px] text-ink-subtle">
            <div className="flex items-center gap-2">
              <Coins className="h-3.5 w-3.5 text-brand-500" />
              <span className="font-medium text-ink-muted">Built on Celo</span>
              <span>· MiniPay-compatible</span>
            </div>
            <a
              href="https://github.com/yowanda/pamoja-celo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              className="font-semibold text-ink-subtle hover:text-ink-muted"
            >
              GitHub →
            </a>
          </div>
          <div className="mt-1.5 font-mono text-[10px] text-ink-subtle/80">
            build {process.env.NEXT_PUBLIC_BUILD_SHA ?? 'dev'}
          </div>
        </footer>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-brand-500 shadow-card">
      <div className="absolute inset-0 bg-mesh-forest opacity-80" />
      <svg
        viewBox="0 0 24 24"
        className="relative h-5 w-5 text-accent"
        fill="none"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
        <path
          d="M12 3a9 9 0 0 1 0 18"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="3.2" fill="currentColor" />
      </svg>
    </div>
  );
}
