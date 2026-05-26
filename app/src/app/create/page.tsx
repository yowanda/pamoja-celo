'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { parseUnits, decodeEventLog } from 'viem';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Coins,
  Fuel,
  Info,
  Users,
} from 'lucide-react';
import { savingsCircleAbi } from '@/lib/abi';
import { getChainConfig, type TokenInfo } from '@/lib/addresses';
import { getFeeCurrency } from '@/lib/feeCurrency';
import { Shell } from '@/components/Shell';
import { useTokenSymbol } from '@/hooks/useTokenSymbol';
import { useFeeCurrencyChoice } from '@/hooks/useFeeCurrencyChoice';
import { useStableSymbol } from '@/hooks/useStableSymbol';
import { PROTOCOL_FEE_BPS } from '@/lib/protocolFee';

const FREQUENCIES = [
  { label: 'Daily', seconds: 24 * 60 * 60 },
  { label: 'Weekly', seconds: 7 * 24 * 60 * 60 },
  { label: 'Monthly', seconds: 30 * 24 * 60 * 60 },
];

export default function CreateCirclePage() {
  const router = useRouter();
  const chainId = useChainId();
  const cfg = getChainConfig(chainId);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [tokenChoice, setTokenChoice] = useState<TokenInfo['id']>('stable');
  const selectedToken: TokenInfo = tokenChoice === 'celo' ? cfg.celo : cfg.stable;
  const tokenSymbol = useTokenSymbol(
    selectedToken.address,
    selectedToken.fallbackSymbol,
  );
  const stableSymbol = useStableSymbol();
  const [feeCurrencyChoice, setFeeCurrencyChoice] = useFeeCurrencyChoice();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('10');
  const [members, setMembers] = useState('5');
  const [freq, setFreq] = useState(FREQUENCIES[1]);

  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isMining } = useWaitForTransactionReceipt({ hash: txHash });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) {
      alert('Connect your wallet first.');
      return;
    }
    if (cfg.savingsCircle === '0x0000000000000000000000000000000000000000') {
      alert('Contract is not deployed on this chain yet.');
      return;
    }
    try {
      const hash = await writeContractAsync({
        address: cfg.savingsCircle,
        abi: savingsCircleAbi,
        functionName: 'createCircle',
        args: [
          selectedToken.address,
          parseUnits(amount, selectedToken.decimals),
          BigInt(freq.seconds),
          Number(members),
          name || 'My circle',
        ],
        ...getFeeCurrency(chainId, feeCurrencyChoice),
      });
      setTxHash(hash);
      if (!publicClient) return;
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      let circleId: bigint | undefined;
      for (const log of receipt.logs) {
        try {
          const ev = decodeEventLog({
            abi: [
              {
                type: 'event',
                name: 'CircleCreated',
                inputs: [
                  { name: 'circleId', type: 'uint256', indexed: true },
                  { name: 'creator', type: 'address', indexed: true },
                  { name: 'token', type: 'address', indexed: true },
                  { name: 'contributionAmount', type: 'uint256', indexed: false },
                  { name: 'roundDuration', type: 'uint256', indexed: false },
                  { name: 'maxMembers', type: 'uint256', indexed: false },
                  { name: 'name', type: 'string', indexed: false },
                ],
              },
            ],
            data: log.data,
            topics: log.topics,
          });
          if (ev.eventName === 'CircleCreated') {
            circleId = ev.args.circleId as bigint;
            break;
          }
        } catch {
          // not our event
        }
      }
      if (circleId !== undefined) {
        router.push(`/circle/${String(circleId)}`);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    }
  }

  const busy = isPending || isMining;
  const numericAmount = Number(amount || 0);
  const numericMembers = Number(members || 0);
  const pot = numericAmount * numericMembers;
  const feeAmount = (pot * PROTOCOL_FEE_BPS) / 10_000;
  const payoutAmount = pot - feeAmount;
  const totalCommit = numericAmount * numericMembers;

  return (
    <Shell>
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          Create a new circle
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          You join as the first member automatically. Share the link with
          friends once the circle is created.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5">
        <Section
          icon={<Coins className="h-4 w-4" />}
          title="Circle currency"
          subtitle="All members of this circle must use the same token."
        >
          <div className="grid grid-cols-2 gap-2">
            <SegmentedTile
              active={tokenChoice === 'stable'}
              onClick={() => setTokenChoice('stable')}
              title={stableSymbol}
              subtitle="Stablecoin · USD-pegged"
              badge="Recommended"
            />
            <SegmentedTile
              active={tokenChoice === 'celo'}
              onClick={() => setTokenChoice('celo')}
              title="CELO"
              subtitle="Native · price floats"
            />
          </div>
        </Section>

        <Section
          icon={<Info className="h-4 w-4" />}
          title="Circle details"
        >
          <div className="space-y-3">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Neighborhood savings"
                className="input"
                maxLength={64}
              />
            </Field>
            <Field label={`Contribution per round (${tokenSymbol})`}>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                className="input"
              />
            </Field>
            <Field label="Members (= number of rounds)">
              <input
                type="number"
                inputMode="numeric"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                min="2"
                max="50"
                className="input"
              />
            </Field>
          </div>
        </Section>

        <Section
          icon={<CalendarClock className="h-4 w-4" />}
          title="Round frequency"
        >
          <div className="grid grid-cols-3 gap-2">
            {FREQUENCIES.map((f) => (
              <button
                type="button"
                key={f.label}
                onClick={() => setFreq(f)}
                className={`segment py-3 text-center text-sm font-semibold ${
                  freq.label === f.label ? 'segment-active' : 'segment-idle'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Section>

        <Section
          icon={<Fuel className="h-4 w-4" />}
          title="Pay gas in"
          subtitle="Celo lets you pay transaction fees in stablecoin instead of CELO."
        >
          <div className="grid grid-cols-2 gap-2">
            <SegmentedTile
              active={feeCurrencyChoice === 'stable'}
              onClick={() => setFeeCurrencyChoice('stable')}
              title={stableSymbol}
              subtitle="MiniPay default"
            />
            <SegmentedTile
              active={feeCurrencyChoice === 'celo'}
              onClick={() => setFeeCurrencyChoice('celo')}
              title="CELO"
              subtitle="Native gas"
            />
          </div>
        </Section>

        <div className="card overflow-hidden">
          <div className="border-b border-border bg-surface-warm px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="font-display text-sm font-semibold text-ink">
                Round payout summary
              </div>
              <span className="badge">
                Fee {(PROTOCOL_FEE_BPS / 100).toFixed(2)}%
              </span>
            </div>
          </div>
          <dl className="divide-y divide-border text-sm">
            <SummaryRow
              label="Pot per round"
              value={`${pot.toFixed(2)} ${tokenSymbol}`}
            />
            <SummaryRow
              label="Protocol fee"
              value={`− ${feeAmount.toFixed(4)} ${tokenSymbol}`}
              valueClass="text-ink-muted"
            />
            <SummaryRow
              label="Round recipient receives"
              value={`${payoutAmount.toFixed(4)} ${tokenSymbol}`}
              valueClass="font-bold text-brand-700"
            />
            <SummaryRow
              label="Your total commitment"
              value={`${totalCommit.toFixed(2)} ${tokenSymbol}`}
              hint={`${numericMembers} round${numericMembers === 1 ? '' : 's'} × ${numericAmount}`}
            />
          </dl>
          <div className="bg-surface-warm px-4 py-3 text-[11px] leading-relaxed text-ink-subtle">
            <Users className="mr-1 inline h-3 w-3 align-[-2px]" />
            You become member #1 and are paid in round #1. Each subsequent
            joiner takes the next round.
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full py-4 text-base"
        >
          {busy ? 'Processing…' : (<>Create circle <ArrowRight className="h-4 w-4" /></>)}
        </button>
      </form>
    </Shell>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-start gap-2.5">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-500">
          {icon}
        </div>
        <div>
          <div className="font-display text-sm font-semibold text-ink">{title}</div>
          {subtitle && (
            <div className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function SegmentedTile({
  active,
  onClick,
  title,
  subtitle,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`segment relative ${active ? 'segment-active' : 'segment-idle'}`}
    >
      {badge && !active && (
        <span className="absolute right-2 top-2 rounded-full bg-accent/40 px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand-700">
          {badge}
        </span>
      )}
      <div className="font-display text-sm font-bold">{title}</div>
      <div
        className={`mt-0.5 text-[10.5px] ${active ? 'text-white/80' : 'text-ink-muted'}`}
      >
        {subtitle}
      </div>
    </button>
  );
}

function SummaryRow({
  label,
  value,
  hint,
  valueClass,
}: {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <div>
        <div className="text-ink-muted">{label}</div>
        {hint && <div className="mt-0.5 text-[10.5px] text-ink-subtle">{hint}</div>}
      </div>
      <div className={`text-right font-mono text-sm ${valueClass ?? 'text-ink'}`}>
        {value}
      </div>
    </div>
  );
}
