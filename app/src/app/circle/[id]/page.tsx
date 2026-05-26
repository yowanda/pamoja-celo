'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  useAccount,
  useChainId,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Crown,
  Fuel,
  Hourglass,
  Loader2,
  PartyPopper,
  Share2,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import { savingsCircleAbi, erc20Abi } from '@/lib/abi';
import { getChainConfig, getTokenByAddress } from '@/lib/addresses';
import { getFeeCurrency } from '@/lib/feeCurrency';
import { Shell } from '@/components/Shell';
import { useStableSymbol } from '@/hooks/useStableSymbol';
import { useTokenSymbol } from '@/hooks/useTokenSymbol';
import { useFeeCurrencyChoice } from '@/hooks/useFeeCurrencyChoice';
import { PROTOCOL_FEE_BPS } from '@/lib/protocolFee';

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
  const stableSymbol = useStableSymbol();
  const [feeCurrencyChoice, setFeeCurrencyChoice] = useFeeCurrencyChoice();

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

  const circleTokenAddress = (circle?.token as `0x${string}` | undefined) ?? cfg.stable.address;
  const circleTokenInfo = getTokenByAddress(chainId, circleTokenAddress);
  const tokenSymbol = useTokenSymbol(
    circleTokenAddress,
    circleTokenInfo?.fallbackSymbol ?? cfg.stable.fallbackSymbol,
  );

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
        address: circleTokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address ?? '0x0000000000000000000000000000000000000000', cfg.savingsCircle],
      },
      {
        chainId,
        address: circleTokenAddress,
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
  const tokenBalance = (misc?.[4]?.result as bigint | undefined) ?? 0n;

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
      ...getFeeCurrency(chainId, feeCurrencyChoice),
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
      ...getFeeCurrency(chainId, feeCurrencyChoice),
    });
    setTxHash(hash);
    await refresh();
  }

  async function onContribute() {
    if (!circle) return;
    if (allowance < circle.contributionAmount) {
      const approveHash = await writeContractAsync({
        address: circleTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [cfg.savingsCircle, parseUnits('1000000000', 18)],
        ...getFeeCurrency(chainId, feeCurrencyChoice),
      });
      setTxHash(approveHash);
    }
    const hash = await writeContractAsync({
      address: cfg.savingsCircle,
      abi: savingsCircleAbi,
      functionName: 'contribute',
      args: [circleId],
      ...getFeeCurrency(chainId, feeCurrencyChoice),
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
      ...getFeeCurrency(chainId, feeCurrencyChoice),
    });
    setTxHash(hash);
    await refresh();
  }

  if (!circle) {
    return (
      <Shell>
        <div className="space-y-3">
          <div className="card h-44 animate-pulse bg-surface-sunken" />
          <div className="card h-32 animate-pulse bg-surface-sunken" />
        </div>
      </Shell>
    );
  }

  const contributionLabel = formatUnits(circle.contributionAmount, 18);
  const pot = Number(contributionLabel) * Number(circle.memberCount);
  const feeAmount = (pot * PROTOCOL_FEE_BPS) / 10_000;
  const payoutAmount = pot - feeAmount;
  const busy = isPending || isMining;
  const isRecipient =
    !!recipient && !!address && recipient.toLowerCase() === address.toLowerCase();

  return (
    <Shell>
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <section className="relative overflow-hidden rounded-4xl border border-brand-700/40 bg-mesh-forest p-6 text-white shadow-card">
        <div className="pointer-events-none absolute inset-0 bg-grid-light bg-[size:24px_24px] opacity-[0.1]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
                Circle #{id}
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold leading-tight tracking-tight">
                {circle.name || `Circle #${id}`}
              </h1>
            </div>
            <StatusBadge
              completed={circle.completed}
              started={circle.started}
              current={Number(circle.currentRound)}
              max={Number(circle.maxMembers)}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
            <HeroStat
              label="Per round"
              value={`${contributionLabel} ${tokenSymbol}`}
            />
            <HeroStat
              label="Members"
              value={`${Number(circle.memberCount)} / ${Number(circle.maxMembers)}`}
            />
            <HeroStat
              label="Frequency"
              value={formatDuration(Number(circle.roundDuration))}
            />
            <HeroStat
              label="Pot per round"
              value={`${pot.toFixed(2)} ${tokenSymbol}`}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-3 text-[11px] leading-relaxed text-white/75 backdrop-blur">
            Each round&apos;s pot is paid in {tokenSymbol}. Protocol takes{' '}
            <strong className="text-accent">
              {(PROTOCOL_FEE_BPS / 100).toFixed(2)}%
            </strong>{' '}
            (~{feeAmount.toFixed(4)} {tokenSymbol}); the round recipient gets{' '}
            <strong className="text-white">
              {payoutAmount.toFixed(4)} {tokenSymbol}
            </strong>
            .
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        {!circle.started && !circle.completed && (
          <>
            {!isMember && circle.memberCount < circle.maxMembers && (
              <PrimaryButton onClick={onJoin} disabled={busy} busy={busy}>
                Join circle
              </PrimaryButton>
            )}
            {isMember && circle.memberCount >= 2 && (
              <SecondaryButton onClick={onStart} disabled={busy} busy={busy}>
                Start circle ({String(circle.memberCount)} member
                {circle.memberCount === 1n ? '' : 's'})
              </SecondaryButton>
            )}
            {isMember && circle.memberCount < circle.maxMembers && (
              <ShareLink id={id} />
            )}
          </>
        )}

        {circle.started && !circle.completed && (
          <>
            <RecipientCard
              round={Number(circle.currentRound)}
              recipient={recipient}
              isRecipient={isRecipient}
              deadline={deadline}
              tokenSymbol={tokenSymbol}
              payoutAmount={payoutAmount}
            />
            {isMember && !userHasContributed && (
              <PrimaryButton
                onClick={onContribute}
                disabled={busy}
                busy={busy}
              >
                Contribute {contributionLabel} {tokenSymbol}
              </PrimaryButton>
            )}
            {isMember && userHasContributed && (
              <div className="card flex items-center gap-3 p-4 text-sm">
                <CheckCircle2 className="h-5 w-5 text-brand-500" />
                <div>
                  <div className="font-display font-semibold text-ink">
                    Contribution confirmed
                  </div>
                  <div className="text-xs text-ink-muted">
                    Waiting on other members for round{' '}
                    {String(circle.currentRound)}.
                  </div>
                </div>
              </div>
            )}
            {isMember &&
              deadline &&
              Number(deadline) * 1000 < Date.now() && (
                <SecondaryButton
                  onClick={onForceAdvance}
                  disabled={busy}
                  busy={busy}
                >
                  Force-advance round (deadline passed)
                </SecondaryButton>
              )}
            <div className="card flex items-center gap-3 p-3 text-xs text-ink-muted">
              <Wallet className="h-4 w-4 text-brand-500" />
              Your balance:{' '}
              <strong className="font-mono text-ink">
                {formatUnits(tokenBalance, 18)} {tokenSymbol}
              </strong>
            </div>
          </>
        )}

        {circle.completed && (
          <div className="card flex items-center gap-3 bg-brand-50 p-4 text-sm">
            <PartyPopper className="h-6 w-6 text-brand-500" />
            <div>
              <div className="font-display font-semibold text-ink">
                Circle complete
              </div>
              <div className="text-xs text-ink-muted">
                Every member received their payout. Thanks for using Pamoja.
              </div>
            </div>
          </div>
        )}

        {!circle.completed && (
          <div className="card p-4">
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-brand-500" />
              <span className="label">Pay gas in</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <button
                type="button"
                onClick={() => setFeeCurrencyChoice('stable')}
                className={`segment py-2.5 text-center font-semibold ${
                  feeCurrencyChoice === 'stable' ? 'segment-active' : 'segment-idle'
                }`}
              >
                {stableSymbol}
              </button>
              <button
                type="button"
                onClick={() => setFeeCurrencyChoice('celo')}
                className={`segment py-2.5 text-center font-semibold ${
                  feeCurrencyChoice === 'celo' ? 'segment-active' : 'segment-idle'
                }`}
              >
                CELO
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-500" />
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-ink-muted">
            Payout order
          </h2>
        </div>
        <ol className="space-y-1.5">
          {members?.map((m, i) => {
            const round = i + 1;
            const isCurrent =
              circle.started && !circle.completed && Number(circle.currentRound) === round;
            const isPast =
              circle.started &&
              (circle.completed || Number(circle.currentRound) > round);
            const isYou = address && m.toLowerCase() === address.toLowerCase();
            return (
              <li
                key={m}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm ${
                  isCurrent
                    ? 'border-brand-500 bg-brand-50 font-semibold text-ink'
                    : isPast
                    ? 'border-border bg-surface-warm text-ink-muted'
                    : 'border-border bg-surface text-ink'
                }`}
              >
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? 'bg-brand-500 text-white'
                      : isPast
                      ? 'bg-surface-sunken text-ink-subtle'
                      : 'bg-brand-50 text-brand-500'
                  }`}
                >
                  {isPast ? <Trophy className="h-3.5 w-3.5" /> : round}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[12px] text-ink">
                      {formatAddr(m)}
                    </span>
                    {isYou && (
                      <span className="badge-accent">
                        <Crown className="h-3 w-3" /> You
                      </span>
                    )}
                  </div>
                  <div className="text-[10.5px] text-ink-subtle">
                    Round {round}
                  </div>
                </div>
                {isCurrent && (
                  <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    Now
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

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-white/60">
        {label}
      </div>
      <div className="mt-0.5 font-display text-sm font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

function RecipientCard({
  round,
  recipient,
  isRecipient,
  deadline,
  tokenSymbol,
  payoutAmount,
}: {
  round: number;
  recipient: string | undefined;
  isRecipient: boolean;
  deadline: bigint | undefined;
  tokenSymbol: string;
  payoutAmount: number;
}) {
  const expired =
    deadline !== undefined && Number(deadline) * 1000 < Date.now();
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-surface-warm px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="label">Round {round} recipient</span>
          {isRecipient && (
            <span className="badge-accent">
              <Crown className="h-3 w-3" /> That&apos;s you
            </span>
          )}
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="font-mono text-sm text-ink">
          {recipient ? formatAddr(recipient) : '—'}
        </div>
        <div className="mt-1 text-xs text-ink-muted">
          Will receive{' '}
          <strong className="font-mono text-ink">
            {payoutAmount.toFixed(4)} {tokenSymbol}
          </strong>{' '}
          once every member contributes.
        </div>
        <div
          className={`mt-3 flex items-center gap-1.5 text-[11px] ${
            expired ? 'text-red-600' : 'text-ink-subtle'
          }`}
        >
          <Hourglass className="h-3 w-3" />
          {deadline ? (
            <>
              Deadline{' '}
              <span className="font-medium text-ink-muted">
                {new Date(Number(deadline) * 1000).toLocaleString()}
              </span>
            </>
          ) : (
            '—'
          )}
        </div>
      </div>
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
      <span className="rounded-full bg-surface-sunken px-3 py-1 text-[10px] font-bold uppercase text-ink-subtle">
        Done
      </span>
    );
  if (started)
    return (
      <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase text-brand-700">
        Round {current}/{max}
      </span>
    );
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase text-white backdrop-blur">
      Open
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  busy,
}: {
  children: React.ReactNode;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} className="btn-primary w-full py-4 text-base">
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
  busy,
}: {
  children: React.ReactNode;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-secondary w-full py-4 text-base"
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
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
            await navigator.share({ title: 'Join my Pamoja circle', url });
            return;
          } catch {
            /* fall through to clipboard */
          }
        }
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface py-3 text-sm font-semibold text-ink-muted transition hover:border-brand-200 hover:text-ink active:scale-[0.98]"
    >
      {copied ? (
        <>
          <Copy className="h-4 w-4" />
          Link copied
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share invite link
        </>
      )}
    </button>
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

function formatAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
