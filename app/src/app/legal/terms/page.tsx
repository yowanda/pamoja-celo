import type { Metadata } from 'next';
import Link from 'next/link';
import { Shell } from '@/components/Shell';

export const metadata: Metadata = {
  title: 'Terms of Service — Pamoja',
  description:
    'Terms of Service for Pamoja, a non-custodial onchain rotating savings circle protocol on Celo.',
};

export default function TermsPage() {
  return (
    <Shell>
      <article className="card prose-pamoja space-y-5 px-6 py-7">
        <header className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
            Legal
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Terms of Service
          </h1>
          <p className="text-xs text-ink-subtle">Last updated: 2026-05-26</p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-ink-muted">
          <h2 className="font-display text-base font-semibold text-ink">
            1. What Pamoja is
          </h2>
          <p>
            Pamoja is an open-source, non-custodial smart-contract protocol
            that lets groups of people run rotating savings circles (ROSCA /
            tanda / chama / arisan) on the Celo blockchain. The frontend at{' '}
            <a
              className="text-brand-600 underline-offset-2 hover:underline"
              href="https://pamoja-lyart.vercel.app"
            >
              pamoja-lyart.vercel.app
            </a>{' '}
            is a thin client over the publicly auditable{' '}
            <code className="rounded bg-surface-warm px-1">SavingsCircle</code>{' '}
            contract on Celo. By using the site you agree to these terms.
          </p>

          <h2 className="font-display text-base font-semibold text-ink">
            2. Non-custodial
          </h2>
          <p>
            Pamoja never holds, controls, or has access to your funds. All
            balances and payouts are enforced by an immutable smart contract.
            You connect your own self-custodial wallet (e.g. MiniPay,
            MetaMask) and sign every transaction yourself. We cannot reverse,
            refund, or recover transactions on your behalf.
          </p>

          <h2 className="font-display text-base font-semibold text-ink">
            3. Protocol fee
          </h2>
          <p>
            The smart contract charges a protocol fee of{' '}
            <strong>0.5%</strong> (50 basis points) on each round payout. The
            fee is hard-coded into the contract at deploy time, capped at 10%
            by a type-level invariant, and forwarded to an immutable recipient
            address in the same transaction as the payout. You can verify the
            fee on Celoscan before joining any circle.
          </p>

          <h2 className="font-display text-base font-semibold text-ink">
            4. No financial advice, no guarantees
          </h2>
          <p>
            Pamoja is provided strictly &quot;as is&quot;, without warranty of
            any kind. Nothing on this site is financial, legal, or tax advice.
            You are solely responsible for assessing whether participating in
            a savings circle is appropriate for you and for complying with the
            laws of your jurisdiction. Stablecoins, blockchains, and smart
            contracts carry risk including but not limited to loss of all
            funds, network outages, smart-contract bugs, and regulatory
            action.
          </p>

          <h2 className="font-display text-base font-semibold text-ink">
            5. Eligibility
          </h2>
          <p>
            You must be of legal age in your jurisdiction to enter into a
            binding contract and you must not be a resident of, or located in,
            any jurisdiction where use of the protocol is prohibited. You are
            responsible for your own KYC, AML, and tax obligations.
          </p>

          <h2 className="font-display text-base font-semibold text-ink">
            6. Prohibited use
          </h2>
          <p>
            You agree not to use Pamoja for money laundering, terrorism
            financing, fraud, sanctions evasion, or any other activity
            prohibited by applicable law. The protocol is public infrastructure
            — we reserve the right to refuse to maintain or feature any
            interface, integration, or listing that we believe is being used
            for illicit purposes.
          </p>

          <h2 className="font-display text-base font-semibold text-ink">
            7. Limitation of liability
          </h2>
          <p>
            To the maximum extent permitted by law, the publisher of this
            site, the contributors to the open-source repository, and any
            related parties will not be liable for any direct, indirect,
            incidental, consequential, or punitive damages arising from your
            use of Pamoja, including lost funds, lost profits, or data loss,
            even if advised of the possibility of such damages.
          </p>

          <h2 className="font-display text-base font-semibold text-ink">
            8. Open source
          </h2>
          <p>
            The smart contract and frontend code are released under the MIT
            license at{' '}
            <a
              className="text-brand-600 underline-offset-2 hover:underline"
              href="https://github.com/yowanda/pamoja-celo"
            >
              github.com/yowanda/pamoja-celo
            </a>
            . Anyone may fork, audit, or redeploy the code. The version of the
            frontend you are using is identified by the build SHA in the
            footer.
          </p>

          <h2 className="font-display text-base font-semibold text-ink">
            9. Changes
          </h2>
          <p>
            We may update these terms at any time. The current version is
            always available at{' '}
            <Link
              className="text-brand-600 underline-offset-2 hover:underline"
              href="/legal/terms"
            >
              /legal/terms
            </Link>
            . Continued use of the site after a change constitutes acceptance
            of the new terms.
          </p>

          <h2 className="font-display text-base font-semibold text-ink">
            10. Contact
          </h2>
          <p>
            Questions about these terms? Open an issue at{' '}
            <a
              className="text-brand-600 underline-offset-2 hover:underline"
              href="https://github.com/yowanda/pamoja-celo/issues"
            >
              github.com/yowanda/pamoja-celo/issues
            </a>{' '}
            or see the{' '}
            <Link
              className="text-brand-600 underline-offset-2 hover:underline"
              href="/support"
            >
              support page
            </Link>
            .
          </p>
        </section>
      </article>
    </Shell>
  );
}
