import type { Metadata } from 'next';
import Link from 'next/link';
import { Shell } from '@/components/Shell';

export const metadata: Metadata = {
  title: 'Privacy Policy — Pamoja',
  description:
    'Privacy Policy for Pamoja, a non-custodial onchain rotating savings circle protocol on Celo.',
};

export default function PrivacyPage() {
  return (
    <Shell>
      <article className="card space-y-5 px-6 py-7">
        <header className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
            Legal
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Privacy Policy
          </h1>
          <p className="text-xs text-ink-subtle">Last updated: 2026-05-26</p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-ink-muted">
          <h2 className="font-display text-base font-semibold text-ink">
            Summary
          </h2>
          <p>
            Pamoja is a non-custodial smart-contract protocol. We do not run
            user accounts, we do not collect KYC, and we do not store personal
            data on our servers. Anything you do onchain (creating a circle,
            contributing, receiving a payout) is recorded on the public Celo
            blockchain, which anyone in the world can inspect via tools like{' '}
            <a
              className="text-brand-600 underline-offset-2 hover:underline"
              href="https://celoscan.io"
            >
              celoscan.io
            </a>
            . That is a property of the public blockchain, not a choice we
            make.
          </p>

          <h2 className="font-display text-base font-semibold text-ink">
            1. What we do not collect
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>No accounts, no passwords, no email signup.</li>
            <li>No KYC documents or personally identifying information.</li>
            <li>No tracking pixels, no third-party advertising.</li>
            <li>
              No private keys or seed phrases — these stay inside your wallet
              software.
            </li>
          </ul>

          <h2 className="font-display text-base font-semibold text-ink">
            2. What is unavoidable
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <strong>Public blockchain data.</strong> Your wallet address and
              the transactions you sign (creating circles, contributing,
              payouts) are recorded permanently on the Celo blockchain and are
              visible to anyone. We cannot delete or modify this data.
            </li>
            <li>
              <strong>Standard server logs.</strong> Our hosting provider
              (Vercel) automatically receives short-lived HTTP request logs
              (IP address, user agent, request path) for security and abuse
              prevention. We do not aggregate or sell this data and we do not
              join it with onchain activity.
            </li>
            <li>
              <strong>RPC and wallet provider data.</strong> When you connect
              your wallet or your browser fetches onchain data, your wallet
              software and the RPC endpoints it talks to (e.g. Celo Forno,
              Reown / WalletConnect relays, MiniPay infrastructure) may see
              your IP address. These are third parties governed by their own
              privacy policies.
            </li>
          </ul>

          <h2 className="font-display text-base font-semibold text-ink">
            3. Cookies and local storage
          </h2>
          <p>
            Pamoja stores a small number of non-tracking preferences in your
            browser&apos;s local storage (for example, your preferred fee
            currency for gas). These never leave your device. We do not set
            any analytics or advertising cookies.
          </p>

          <h2 className="font-display text-base font-semibold text-ink">
            4. Children
          </h2>
          <p>
            Pamoja is not intended for users under the age of majority in
            their jurisdiction. We do not knowingly collect data about
            minors.
          </p>

          <h2 className="font-display text-base font-semibold text-ink">
            5. Changes
          </h2>
          <p>
            We may update this policy at any time. The current version is
            always available at{' '}
            <Link
              className="text-brand-600 underline-offset-2 hover:underline"
              href="/legal/privacy"
            >
              /legal/privacy
            </Link>
            . Material changes will be reflected in the &quot;Last updated&quot; date
            above.
          </p>

          <h2 className="font-display text-base font-semibold text-ink">
            6. Contact
          </h2>
          <p>
            Questions about privacy? See the{' '}
            <Link
              className="text-brand-600 underline-offset-2 hover:underline"
              href="/support"
            >
              support page
            </Link>{' '}
            or open an issue at{' '}
            <a
              className="text-brand-600 underline-offset-2 hover:underline"
              href="https://github.com/yowanda/pamoja-celo/issues"
            >
              github.com/yowanda/pamoja-celo/issues
            </a>
            .
          </p>
        </section>
      </article>
    </Shell>
  );
}
