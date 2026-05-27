import type { Metadata } from 'next';
import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { Code2, ExternalLink, LifeBuoy } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support — Pamoja',
  description:
    'Get help with Pamoja, the non-custodial onchain savings circle protocol on Celo.',
};

const CONTRACT_MAINNET = '0xc3887311dC1f340aDEB8dc640A859D84C404Fae7';
const CONTRACT_SEPOLIA = '0x276e63880B96514A5Ae9fD4774E32D620B3f0039';

export default function SupportPage() {
  return (
    <Shell>
      <div className="space-y-4">
        <header className="space-y-1 px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
            Support
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Get help with Pamoja
          </h1>
          <p className="text-sm text-ink-subtle">
            Pamoja is a non-custodial protocol — we never touch your funds, so
            we can&apos;t reverse transactions. We can help you understand the
            contract, debug onchain errors, and triage UI bugs.
          </p>
        </header>

        <section className="card space-y-3 px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Code2 className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-base font-semibold text-ink">
                Open a GitHub issue
              </h2>
              <p className="mt-0.5 text-xs text-ink-subtle">
                Bug reports, feature requests, and contract questions go on
                GitHub. Public, searchable, and our primary support channel.
              </p>
              <a
                href="https://github.com/yowanda/pamoja-celo/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                github.com/yowanda/pamoja-celo/issues
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>

        <section className="card space-y-3 px-5 py-5">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-brand-600" />
            <h2 className="font-display text-base font-semibold text-ink">
              Verify before you trust
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-ink-muted">
            Every payout, contribution, and fee is enforced by an immutable
            smart contract. You can read the source and recent transactions on
            the explorer:
          </p>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
                Celo mainnet
              </dt>
              <dd>
                <a
                  href={`https://celoscan.io/address/${CONTRACT_MAINNET}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-mono text-xs text-brand-600 hover:text-brand-700"
                >
                  {CONTRACT_MAINNET}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
                Celo Sepolia testnet
              </dt>
              <dd>
                <a
                  href={`https://celo-sepolia.blockscout.com/address/${CONTRACT_SEPOLIA}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-mono text-xs text-brand-600 hover:text-brand-700"
                >
                  {CONTRACT_SEPOLIA}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section className="card space-y-2 px-5 py-5">
          <h2 className="font-display text-base font-semibold text-ink">
            Common questions
          </h2>
          <ul className="space-y-2 text-xs leading-relaxed text-ink-muted">
            <li>
              <strong className="text-ink">Why is my MiniPay gas paid in USDm?</strong>{' '}
              Celo supports paying gas in stablecoins via the{' '}
              <code className="rounded bg-surface-warm px-1">feeCurrency</code>{' '}
              field. Pamoja sets this automatically so you never need to hold
              CELO.
            </li>
            <li>
              <strong className="text-ink">Can I leave a circle early?</strong>{' '}
              No. The contract is designed to enforce the social commitment of
              a rotating savings circle. You can choose not to start a circle
              you joined, but once it&apos;s active your seat is locked.
            </li>
            <li>
              <strong className="text-ink">What if a member doesn&apos;t pay?</strong>{' '}
              After the round deadline, anyone can call{' '}
              <code className="rounded bg-surface-warm px-1">forceAdvance</code>
              . Missing members forfeit that round&apos;s pot but still receive
              their own payout when their turn comes.
            </li>
          </ul>
          <p className="pt-1 text-[11px] text-ink-subtle">
            More details:{' '}
            <Link
              href="/legal/terms"
              className="text-brand-600 underline-offset-2 hover:underline"
            >
              terms
            </Link>
            {' · '}
            <Link
              href="/legal/privacy"
              className="text-brand-600 underline-offset-2 hover:underline"
            >
              privacy
            </Link>
          </p>
        </section>
      </div>
    </Shell>
  );
}
