'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { parseUnits, decodeEventLog } from 'viem';
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
      // pull circleId from CircleCreated event
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

  return (
    <Shell>
      <h1 className="mb-1 text-2xl font-extrabold">Create a new circle</h1>
      <p className="mb-6 text-sm text-celo-fig/70">
        You join as the first member automatically. Share the circle link with
        friends once it&apos;s created.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Circle name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Neighborhood savings"
            className="w-full rounded-2xl border border-celo-fig/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-celo-forest"
            maxLength={64}
          />
        </Field>

        <Field label="Circle currency">
          <div className="grid grid-cols-2 gap-2">
            <SegmentedButton
              active={tokenChoice === 'stable'}
              onClick={() => setTokenChoice('stable')}
              title={stableSymbol}
              subtitle="Mento stablecoin (USD-pegged)"
            />
            <SegmentedButton
              active={tokenChoice === 'celo'}
              onClick={() => setTokenChoice('celo')}
              title="CELO"
              subtitle="Native CELO (price floats)"
            />
          </div>
        </Field>

        <Field label={`Contribution per round (${tokenSymbol})`}>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            className="w-full rounded-2xl border border-celo-fig/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-celo-forest"
          />
        </Field>
        <Field label="Number of members (= number of rounds)">
          <input
            type="number"
            inputMode="numeric"
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            min="2"
            max="50"
            className="w-full rounded-2xl border border-celo-fig/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-celo-forest"
          />
        </Field>
        <Field label="Frequency">
          <div className="grid grid-cols-3 gap-2">
            {FREQUENCIES.map((f) => (
              <button
                type="button"
                key={f.label}
                onClick={() => setFreq(f)}
                className={`rounded-2xl border px-3 py-3 text-sm font-semibold active:opacity-80 ${
                  freq.label === f.label
                    ? 'border-celo-forest bg-celo-forest text-celo'
                    : 'border-celo-fig/15 bg-white/70 text-celo-fig'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Pay gas in">
          <div className="grid grid-cols-2 gap-2">
            <SegmentedButton
              active={feeCurrencyChoice === 'stable'}
              onClick={() => setFeeCurrencyChoice('stable')}
              title={stableSymbol}
              subtitle="MiniPay default"
            />
            <SegmentedButton
              active={feeCurrencyChoice === 'celo'}
              onClick={() => setFeeCurrencyChoice('celo')}
              title="CELO"
              subtitle="Native gas token"
            />
          </div>
        </Field>

        <div className="space-y-1 rounded-2xl bg-celo-fig/5 p-3 text-xs text-celo-fig/70">
          <div>
            Pot per round:{' '}
            <strong>
              {pot.toFixed(2)} {tokenSymbol}
            </strong>
          </div>
          <div>
            Protocol fee ({(PROTOCOL_FEE_BPS / 100).toFixed(2)}%):{' '}
            <strong>
              {feeAmount.toFixed(4)} {tokenSymbol}
            </strong>
          </div>
          <div>
            Round recipient receives:{' '}
            <strong>
              {payoutAmount.toFixed(4)} {tokenSymbol}
            </strong>
          </div>
          <div className="pt-1 text-celo-fig/60">
            First-round recipient: <strong>you</strong> (member #1).
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-celo-forest py-4 text-base font-bold text-celo disabled:opacity-50"
        >
          {busy ? 'Processing…' : 'Create circle'}
        </button>
      </form>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-celo-fig/70">
        {label}
      </span>
      {children}
    </label>
  );
}

function SegmentedButton({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-3 py-2.5 text-left text-xs active:opacity-80 ${
        active
          ? 'border-celo-forest bg-celo-forest text-celo'
          : 'border-celo-fig/15 bg-white/70 text-celo-fig'
      }`}
    >
      <div className="text-sm font-bold">{title}</div>
      <div className={`text-[10px] ${active ? 'text-celo/80' : 'text-celo-fig/60'}`}>
        {subtitle}
      </div>
    </button>
  );
}
