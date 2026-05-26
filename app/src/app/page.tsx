import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { CirclesList } from '@/components/CirclesList';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Eye,
  Coins,
  Users,
} from 'lucide-react';

export default function HomePage() {
  return (
    <Shell>
      <section className="relative overflow-hidden rounded-4xl border border-brand-700/40 bg-mesh-forest p-7 text-white shadow-card">
        <div className="pointer-events-none absolute inset-0 bg-grid-light bg-[size:24px_24px] opacity-[0.12]" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent backdrop-blur">
            <Sparkles className="h-3 w-3" /> Live on Celo · MiniPay-ready
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight">
            Save together,<br />
            <span className="text-accent">trust the contract.</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
            Pamoja runs rotating savings circles
            <span className="whitespace-nowrap"> (ROSCA · tanda · chama · arisan)</span> onchain
            with stablecoins. Every contribution and payout is on Celo — no
            treasurer, no missing pots, no inflation.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-brand-700 shadow-card transition active:scale-[0.98]"
            >
              Create a circle <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#circles"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition active:scale-[0.98]"
            >
              Browse circles
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-[11px] text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              Mainnet contract verified
            </span>
            <span className="text-white/30">·</span>
            <span>0.5% protocol fee</span>
            <span className="text-white/30">·</span>
            <span>Gas paid in stablecoin</span>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-3 gap-2">
        <MetricCard icon={<Users className="h-4 w-4" />} label="Circles" hint="onchain" />
        <MetricCard icon={<Coins className="h-4 w-4" />} label="Tokens" hint="USDm · CELO" />
        <MetricCard icon={<ShieldCheck className="h-4 w-4" />} label="Fee" hint="0.5%" />
      </section>

      <section className="mt-8" id="circles">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-ink-muted">
            Latest circles
          </h2>
          <Link
            href="/create"
            className="text-xs font-semibold text-brand-500 hover:text-brand-600"
          >
            + New
          </Link>
        </div>
        <CirclesList />
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-ink-muted">
          Why Pamoja
        </h2>
        <div className="grid gap-2.5">
          <FeatureRow
            icon={<ShieldCheck className="h-5 w-5" />}
            title="No single admin"
            body="The smart contract holds funds in escrow. No treasurer can run off with the pot."
          />
          <FeatureRow
            icon={<Coins className="h-5 w-5" />}
            title="Inflation-resistant"
            body="Contribute in USDm (Mento stablecoin pegged to USD) or in CELO — your call per circle."
          />
          <FeatureRow
            icon={<Eye className="h-5 w-5" />}
            title="Transparent by default"
            body="Every contribution, payout, and rotation is recorded on Celo. Auditable by anyone."
          />
          <FeatureRow
            icon={<Sparkles className="h-5 w-5" />}
            title="Gas paid in stablecoin"
            body="No need to hold CELO. Gas is paid in USDm/cUSD via Celo's fee abstraction."
          />
        </div>
      </section>
    </Shell>
  );
}

function MetricCard({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className="card flex flex-col gap-1 p-3 text-left">
      <div className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
        {icon}
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-subtle">
        {label}
      </div>
      <div className="font-display text-sm font-semibold text-ink">{hint}</div>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card flex items-start gap-3 p-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-500">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-display text-sm font-semibold text-ink">{title}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-ink-muted">
          {body}
        </div>
      </div>
    </div>
  );
}
