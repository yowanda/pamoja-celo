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
import { getChainConfig } from '@/lib/addresses';
import { getFeeCurrency } from '@/lib/feeCurrency';
import { Shell } from '@/components/Shell';
import { useStableSymbol } from '@/hooks/useStableSymbol';

const FREQUENCIES = [
  { label: 'Harian', seconds: 24 * 60 * 60 },
  { label: 'Mingguan', seconds: 7 * 24 * 60 * 60 },
  { label: 'Bulanan', seconds: 30 * 24 * 60 * 60 },
];

export default function CreateCirclePage() {
  const router = useRouter();
  const chainId = useChainId();
  const cfg = getChainConfig(chainId);
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const symbol = useStableSymbol();

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
      alert('Hubungkan wallet dulu.');
      return;
    }
    if (cfg.savingsCircle === '0x0000000000000000000000000000000000000000') {
      alert('Kontrak belum di-deploy ke chain ini.');
      return;
    }
    try {
      const hash = await writeContractAsync({
        address: cfg.savingsCircle,
        abi: savingsCircleAbi,
        functionName: 'createCircle',
        args: [
          cfg.stable,
          parseUnits(amount, 18),
          BigInt(freq.seconds),
          Number(members),
          name || 'Circle saya',
        ],
        ...getFeeCurrency(chainId),
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

  return (
    <Shell>
      <h1 className="mb-1 text-2xl font-extrabold">Buat Circle baru</h1>
      <p className="mb-6 text-sm text-celo-fig/70">
        Anda jadi anggota pertama otomatis. Bagikan link circle ke teman setelah
        dibuat.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nama circle">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Misal: Arisan tetangga"
            className="w-full rounded-2xl border border-celo-fig/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-celo-forest"
            maxLength={64}
          />
        </Field>
        <Field label={`Setoran tiap ronde (${symbol})`}>
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
        <Field label="Jumlah anggota (= jumlah ronde)">
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
        <Field label="Frekuensi">
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

        <div className="rounded-2xl bg-celo-fig/5 p-3 text-xs text-celo-fig/70">
          Total pot tiap ronde:{' '}
          <strong>
            {Number(amount || 0) * Number(members || 0)} {symbol}
          </strong>{' '}
          · Penerima ronde pertama: <strong>Anda</strong> (anggota #1).
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-celo-forest py-4 text-base font-bold text-celo disabled:opacity-50"
        >
          {busy ? 'Memproses…' : 'Buat circle'}
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
