import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { CirclesList } from '@/components/CirclesList';

export default function HomePage() {
  return (
    <Shell>
      <section className="rounded-3xl bg-celo-forest p-6 text-celo">
        <h1 className="text-2xl font-extrabold leading-tight">
          Onchain savings circles,
          <br /> stable & transparent.
        </h1>
        <p className="mt-3 text-sm text-celo/85">
          Pamoja runs rotating savings circles (ROSCA / tanda / chama / arisan)
          using Mento stablecoins (USDm / cUSD) on Celo. Each round&apos;s
          contributions go straight into the smart contract; the round
          recipient is paid once everyone has contributed. No admin holds
          your money.
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            href="/create"
            className="rounded-2xl bg-celo px-4 py-3 text-sm font-semibold text-celo-forest active:opacity-80"
          >
            Create circle
          </Link>
          <Link
            href="#circles"
            className="rounded-2xl border border-celo/40 px-4 py-3 text-sm font-semibold text-celo active:opacity-80"
          >
            Browse circles
          </Link>
        </div>
      </section>

      <section className="mt-8" id="circles">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-celo-fig/70">
          Latest circles
        </h2>
        <CirclesList />
      </section>

      <section className="mt-10 space-y-3 text-sm text-celo-fig/80">
        <h2 className="text-xs font-bold uppercase tracking-wider text-celo-fig/70">
          Why Pamoja?
        </h2>
        <p>
          <strong>1. Inflation-resistant.</strong> Contributions are in Mento
          stablecoins (USDm / cUSD, pegged to USD), so your savings don&apos;t
          erode with volatile local currencies.
        </p>
        <p>
          <strong>2. Transparent.</strong> Every contribution, payout, and
          rotation is recorded on Celo and verifiable by anyone.
        </p>
        <p>
          <strong>3. No single admin.</strong> The smart contract holds the
          funds in escrow — no treasurer can run off with the pot.
        </p>
        <p>
          <strong>4. Gas paid in stablecoin.</strong> You don&apos;t need to
          hold CELO — gas is paid in USDm/cUSD via Celo + MiniPay&apos;s
          fee-abstraction.
        </p>
      </section>
    </Shell>
  );
}
