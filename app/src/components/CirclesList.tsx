'use client';

import Link from 'next/link';
import { useReadContract, useReadContracts, useChainId } from 'wagmi';
import { savingsCircleAbi } from '@/lib/abi';
import { getChainConfig } from '@/lib/addresses';
import { formatUnits } from 'viem';

export function CirclesList() {
  const chainId = useChainId();
  const cfg = getChainConfig(chainId);

  const { data: next } = useReadContract({
    chainId,
    address: cfg.savingsCircle,
    abi: savingsCircleAbi,
    functionName: 'nextCircleId',
    query: { enabled: cfg.savingsCircle !== '0x0000000000000000000000000000000000000000' },
  });

  const total = next ? Number(next) : 0;
  const ids = Array.from({ length: Math.min(total, 20) }, (_, i) => BigInt(total - 1 - i));

  const { data: circles } = useReadContracts({
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
      <div className="rounded-2xl border border-dashed border-celo-fig/30 p-4 text-sm text-celo-fig/70">
        Kontrak belum di-deploy ke chain ini. Set
        <code className="mx-1 rounded bg-celo-fig/10 px-1 py-0.5 text-xs">
          NEXT_PUBLIC_SAVINGS_CIRCLE_{cfg.chainId === 42220 ? 'CELO' : 'ALFAJORES'}
        </code>
        setelah deploy.
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-celo-fig/30 p-4 text-sm text-celo-fig/70">
        Belum ada circle. Jadilah yang pertama —{' '}
        <Link href="/create" className="underline">
          buat circle
        </Link>
        .
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {ids.map((id, i) => {
        const res = circles?.[i];
        if (!res || res.status !== 'success') return null;
        const c = res.result;
        const amount = formatUnits(c.contributionAmount, 18);
        const statusLabel = c.completed
          ? 'Selesai'
          : c.started
          ? `Ronde ${c.currentRound}/${c.maxMembers}`
          : `Buka · ${c.memberCount}/${c.maxMembers}`;
        return (
          <li key={String(id)}>
            <Link
              href={`/circle/${String(id)}`}
              className="block rounded-2xl border border-celo-fig/15 bg-white/50 p-4 active:opacity-80"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-celo-fig">
                    {c.name || `Circle #${String(id)}`}
                  </div>
                  <div className="text-xs text-celo-fig/60">
                    {amount} cUSD / ronde · {formatDuration(Number(c.roundDuration))}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                    c.completed
                      ? 'bg-celo-fig/10 text-celo-fig/60'
                      : c.started
                      ? 'bg-celo-forest text-celo'
                      : 'bg-celo text-celo-forest'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function formatDuration(seconds: number): string {
  if (seconds >= 86400) return `${Math.round(seconds / 86400)} hari`;
  if (seconds >= 3600) return `${Math.round(seconds / 3600)} jam`;
  return `${Math.round(seconds / 60)} menit`;
}
