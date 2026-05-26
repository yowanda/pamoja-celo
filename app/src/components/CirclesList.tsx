'use client';

import Link from 'next/link';
import { useReadContract, useReadContracts, useChainId } from 'wagmi';
import { savingsCircleAbi } from '@/lib/abi';
import { getChainConfig, getTokenByAddress } from '@/lib/addresses';
import { formatUnits } from 'viem';
import { ChevronRight, Users, Coins, Plus } from 'lucide-react';

export function CirclesList() {
  const chainId = useChainId();
  const cfg = getChainConfig(chainId);

  const { data: next, isLoading: isCountLoading } = useReadContract({
    chainId,
    address: cfg.savingsCircle,
    abi: savingsCircleAbi,
    functionName: 'nextCircleId',
    query: { enabled: cfg.savingsCircle !== '0x0000000000000000000000000000000000000000' },
  });

  const total = next ? Number(next) : 0;
  const ids = Array.from({ length: Math.min(total, 20) }, (_, i) => BigInt(total - 1 - i));

  const { data: circles, isLoading: isCirclesLoading } = useReadContracts({
    allowFailure: true,
    contracts: ids.map((id) => ({
      chainId,
      address: cfg.savingsCircle,
      abi: savingsCircleAbi,
      functionName: 'getCircle' as const,
      args: [id] as const,
    })),
    query: { enabled: ids.length > 0 },
  });

  if (cfg.savingsCircle === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="card border-dashed p-4 text-sm text-ink-muted">
        Contract not deployed to this chain yet. Set
        <code className="mx-1 rounded bg-surface-sunken px-1 py-0.5 text-xs">
          NEXT_PUBLIC_SAVINGS_CIRCLE_{cfg.chainId === 42220 ? 'CELO' : 'CELO_SEPOLIA'}
        </code>
        after deploying.
      </div>
    );
  }

  if (isCountLoading || (total > 0 && isCirclesLoading && !circles)) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-[68px] animate-pulse bg-surface-sunken" />
        ))}
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 px-4 py-7 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-500">
          <Plus className="h-6 w-6" />
        </div>
        <div>
          <div className="font-display text-sm font-semibold text-ink">
            No circles yet
          </div>
          <div className="mt-0.5 text-xs text-ink-muted">
            Be the first to start a savings circle.
          </div>
        </div>
        <Link href="/create" className="btn-primary px-4 py-2.5 text-xs">
          Create the first circle
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {ids.map((id, i) => {
        const res = circles?.[i];
        if (!res || res.status !== 'success') return null;
        const c = res.result;
        const amount = formatUnits(c.contributionAmount, 18);
        const tokenInfo = getTokenByAddress(chainId, c.token as `0x${string}`);
        const rowSymbol = tokenInfo?.fallbackSymbol ?? 'token';
        const status = c.completed ? 'done' : c.started ? 'active' : 'open';
        const statusLabel = c.completed
          ? 'Completed'
          : c.started
          ? `Round ${c.currentRound}/${c.maxMembers}`
          : `Open · ${c.memberCount}/${c.maxMembers}`;
        return (
          <li key={String(id)}>
            <Link
              href={`/circle/${String(id)}`}
              className="card group flex items-center gap-3 p-4 transition hover:shadow-cardHover"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-500">
                <Coins className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate font-display text-sm font-semibold text-ink">
                    {c.name || `Circle #${String(id)}`}
                  </div>
                  <StatusPill status={status} label={statusLabel} />
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                  <span className="font-medium text-ink">
                    {amount} {rowSymbol}
                  </span>
                  <span>/ round</span>
                  <span className="text-ink-subtle">·</span>
                  <span>{formatDuration(Number(c.roundDuration))}</span>
                  <span className="text-ink-subtle">·</span>
                  <span className="inline-flex items-center gap-0.5">
                    <Users className="h-3 w-3" />
                    {Number(c.memberCount)}/{Number(c.maxMembers)}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: 'open' | 'active' | 'done';
  label: string;
}) {
  const cls =
    status === 'open'
      ? 'bg-accent/30 text-brand-700'
      : status === 'active'
      ? 'bg-brand-500 text-white'
      : 'bg-surface-sunken text-ink-subtle';
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}
    >
      {label}
    </span>
  );
}

function formatDuration(seconds: number): string {
  if (seconds >= 86400) {
    const d = Math.round(seconds / 86400);
    return `${d} day${d === 1 ? '' : 's'}`;
  }
  if (seconds >= 3600) {
    const h = Math.round(seconds / 3600);
    return `${h} hour${h === 1 ? '' : 's'}`;
  }
  const m = Math.round(seconds / 60);
  return `${m} min${m === 1 ? '' : 's'}`;
}
