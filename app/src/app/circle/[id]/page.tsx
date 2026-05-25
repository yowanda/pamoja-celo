'use client';

import { use, useState } from 'react';
import {
  useAccount,
  useChainId,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { savingsCircleAbi, erc20Abi } from '@/lib/abi';
import { getChainConfig } from '@/lib/addresses';
import { getFeeCurrency } from '@/lib/feeCurrency';
import { Shell } from '@/components/Shell';

export default function CircleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const circleId = BigInt(id);
  const chainId = useChainId();
  const cfg = getChainConfig(chainId);
  const { address } = useAccount();

  const { data: circle, refetch: refetchCircle } = useReadContract({
    chainId,
    address: cfg.savingsCircle,
    abi: savingsCircleAbi,
    functionName: 'getCircle',
    args: [circleId],
  });

  const { data: members, refetch: refetchMembers } = useReadContract({
    chainId,
    address: cfg.savingsCircle,
    abi: savingsCircleAbi,
    functionName: 'getMembers',
    args: [circleId],
  });

  const { data: misc, refetch: refetchMisc } = useReadContracts({
    contracts: [
      {
        chainId,
        address: cfg.savingsCircle,
        abi: savingsCircleAbi,
        functionName: 'currentRecipient',
        args: [circleId],
      },
      {
        chainId,
        address: cfg.savingsCircle,
        abi: savingsCircleAbi,
        functionName: 'roundDeadline',
        args: [circleId],
      },
      {
        chainId,
        address: cfg.savingsCircle,
        abi: savingsCircleAbi,
        functionName: 'hasContributed',
        args: [circleId, circle?.currentRound ?? 0n, address ?? '0x0000000000000000000000000000000000000000'],
      },
      {
        chainId,
        address: cfg.cUSD,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address ?? '0x0000000000000000000000000000000000000000', cfg.savingsCircle],
      },
      {
        chainId,
        address: cfg.cUSD,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address ?? '0x0000000000000000000000000000000000000000'],
      },
    ],
    query: { enabled: !!circle },
  });

  const recipient = misc?.[0]?.result as string | undefined;
  const deadline = misc?.[1]?.result as bigint | undefined;
  const userHasContributed = (misc?.[2]?.result as boolean | undefined) ?? false;
  const allowance = (misc?.[3]?.result as bigint | undefined) ?? 0n;
  const cusdBalance = (misc?.[4]?.result as bigint | undefined) ?? 0n;

  const isMember = members?.some(
    (m) => address && m.toLowerCase() === address.toLowerCase(),
  );

  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isMining } = useWaitForTransactionReceipt({ hash: txHash });

  async function refresh() {
    await Promise.all([refetchCircle(), refetchMembers(), refetchMisc()]);
  }

  async function onJoin() {
    const hash = await writeContractAsync({
      address: cfg.savingsCircle,
      abi: savingsCircleAbi,
      functionName: 'joinCircle',
      args: [circleId],
      ...getFeeCurrency(chainId),
    });
    setTxHash(hash);
    await refresh();
  }

  async function onStart() {
    const hash = await writeContractAsync({
      address: cfg.savingsCircle,
      abi: savingsCircleAbi,
      functionName: 'startCircle',
      args: [circleId],
      ...getFeeCurrency(chainId),
    });
    setTxHash(hash);
    await refresh();
  }

  async function onContribute() {
    if (!circle) return;
    if (allowance < circle.contributionAmount) {
      const approveHash = await writeContractAsync({
        address: cfg.cUSD,
        abi: erc20Abi,
        functionName: 'approve',
        args: [cfg.savingsCircle, parseUnits('1000000000', 18)],
        ...getFeeCurrency(chainId),
      });
      setTxHash(approveHash);
    }
    const hash = await writeContractAsync({
      address: cfg.savingsCircle,
      abi: savingsCircleAbi,
      functionName: 'contribute',
      args: [circleId],
      ...getFeeCurrency(chainId),
    });
    setTxHash(hash);
    await refresh();
  }

  async function onForceAdvance() {
    const hash = await writeContractAsync({
      address: cfg.savingsCircle,
      abi: savingsCircleAbi,
      functionName: 'forceAdvance',
      args: [circleId],
      ...getFeeCurrency(chainId),
    });
    setTxHash(hash);
    await refresh();
  }

  if (!circle) {
    return (
      <Shell>
        <div className="rounded-2xl border border-dashed border-celo-fig/30 p-4 text-sm text-celo-fig/70">
          Memuat circle…
        </div>
      </Shell>
    );
  }

  const contributionLabel = formatUnits(circle.contributionAmount, 18);
  const busy = isPending || isMining;

  return (
    <Shell>
      <div className="rounded-3xl bg-celo-forest p-5 text-celo">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold">{circle.name || `Circle #${id}`}</h1>
          <StatusBadge
            completed={circle.completed}
            started={circle.started}
            current={Number(circle.currentRound)}
            max={Number(circle.maxMembers)}
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
          <Stat label="Setoran / ronde" value={`${contributionLabel} cUSD`} />
          <Stat label="Anggota" value={`${circle.memberCount}/${circle.maxMembers}`} />
          <Stat
            label="Frekuensi"
            value={formatDuration(Number(circle.roundDuration))}
          />
          <Stat
            label="Pot per ronde"
            value={`${(Number(contributionLabel) * Number(circle.memberCount)).toFixed(2)} cUSD`}
          />
        </div>
      </div>

      <section className="mt-5 space-y-3">
        {!circle.started && !circle.completed && (
          <>
            {!isMember && circle.memberCount < circle.maxMembers && (
              <Button onClick={onJoin} disabled={busy}>
                {busy ? 'Memproses…' : 'Gabung circle'}
              </Button>
            )}
            {isMember && circle.memberCount >= 2 && (
              <Button onClick={onStart} disabled={busy} variant="outline">
                Mulai circle ({circle.memberCount} anggota)
              </Button>
            )}
            {isMember && circle.memberCount < circle.maxMembers && (
              <ShareLink id={id} />
            )}
          </>
        )}
        {circle.started && !circle.completed && (
          <>
            <div className="rounded-2xl border border-celo-fig/15 bg-white/60 p-4 text-sm">
              <div className="font-semibold text-celo-fig">
                Penerima ronde {String(circle.currentRound)}
              </div>
              <div className="mt-1 text-xs text-celo-fig/70">
                {recipient ? formatAddr(recipient) : '—'}
                {recipient && address && recipient.toLowerCase() === address.toLowerCase() && (
                  <span className="ml-2 rounded-full bg-celo px-2 py-0.5 text-[10px] font-bold uppercase text-celo-forest">
                    Anda
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-celo-fig/70">
                Batas waktu ronde:{' '}
                {deadline
                  ? new Date(Number(deadline) * 1000).toLocaleString('id-ID')
                  : '—'}
              </div>
            </div>
            {isMember && !userHasContributed && (
              <Button onClick={onContribute} disabled={busy}>
                {busy
                  ? 'Memproses…'
                  : `Setor ${contributionLabel} cUSD`}
              </Button>
            )}
            {isMember && userHasContributed && (
              <div className="rounded-2xl bg-celo-forest/10 p-3 text-center text-sm font-medium text-celo-forest">
                Anda sudah setor ronde ini. Menunggu anggota lain.
              </div>
            )}
            {isMember &&
              deadline &&
              Number(deadline) * 1000 < Date.now() && (
                <Button onClick={onForceAdvance} disabled={busy} variant="outline">
                  Force-advance ronde (deadline lewat)
                </Button>
              )}
            <div className="rounded-2xl bg-white/40 p-3 text-xs text-celo-fig/70">
              Saldo Anda: <strong>{formatUnits(cusdBalance, 18)} cUSD</strong>
            </div>
          </>
        )}
        {circle.completed && (
          <div className="rounded-2xl bg-celo p-4 text-sm font-medium text-celo-forest">
            Circle ini sudah selesai. Semua anggota sudah menerima payout. 🎉
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-celo-fig/70">
          Urutan payout
        </h2>
        <ol className="space-y-1.5">
          {members?.map((m, i) => {
            const isCurrent =
              circle.started &&
              !circle.completed &&
              Number(circle.currentRound) === i + 1;
            return (
              <li
                key={m}
                className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm ${
                  isCurrent
                    ? 'border-celo-forest bg-celo-forest/5 font-semibold text-celo-forest'
                    : 'border-celo-fig/10 bg-white/40 text-celo-fig'
                }`}
              >
                <span>
                  #{i + 1} · {formatAddr(m)}
                </span>
                {isCurrent && (
                  <span className="rounded-full bg-celo-forest px-2 py-0.5 text-[10px] font-bold uppercase text-celo">
                    Sekarang
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-celo/10 p-2">
      <div className="text-[10px] uppercase opacity-70">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({
  completed,
  started,
  current,
  max,
}: {
  completed: boolean;
  started: boolean;
  current: number;
  max: number;
}) {
  if (completed)
    return (
      <span className="rounded-full bg-celo/20 px-2.5 py-1 text-[10px] font-bold uppercase">
        Selesai
      </span>
    );
  if (started)
    return (
      <span className="rounded-full bg-celo px-2.5 py-1 text-[10px] font-bold uppercase text-celo-forest">
        Ronde {current}/{max}
      </span>
    );
  return (
    <span className="rounded-full bg-celo/20 px-2.5 py-1 text-[10px] font-bold uppercase">
      Buka
    </span>
  );
}

function Button({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  variant?: 'outline';
}) {
  const base =
    'w-full rounded-2xl py-4 text-base font-bold active:opacity-80 disabled:opacity-50';
  const styles =
    variant === 'outline'
      ? 'border-2 border-celo-forest text-celo-forest'
      : 'bg-celo-forest text-celo';
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function ShareLink({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        const url = `${window.location.origin}/circle/${id}`;
        if (navigator.share) {
          try {
            await navigator.share({ title: 'Gabung circle Pamoja', url });
            return;
          } catch {
            /* fall through to clipboard */
          }
        }
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="w-full rounded-2xl border-2 border-dashed border-celo-fig/30 py-3 text-sm font-semibold text-celo-fig/80"
    >
      {copied ? 'Link tersalin!' : 'Bagikan link ke teman'}
    </button>
  );
}

function formatDuration(seconds: number): string {
  if (seconds >= 86400) return `${Math.round(seconds / 86400)} hari`;
  if (seconds >= 3600) return `${Math.round(seconds / 3600)} jam`;
  return `${Math.round(seconds / 60)} menit`;
}

function formatAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
