import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { CirclesList } from '@/components/CirclesList';

export default function HomePage() {
  return (
    <Shell>
      <section className="rounded-3xl bg-celo-forest p-6 text-celo">
        <h1 className="text-2xl font-extrabold leading-tight">
          Arisan onchain,
          <br /> stabil & transparan.
        </h1>
        <p className="mt-3 text-sm text-celo/85">
          Pamoja menjalankan arisan (ROSCA / tanda / chama) pakai cUSD di Celo.
          Setoran tiap ronde otomatis masuk smart contract; penerima ronde
          dibayar saat semua anggota setor. Tidak ada admin yang pegang dana.
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            href="/create"
            className="rounded-2xl bg-celo px-4 py-3 text-sm font-semibold text-celo-forest active:opacity-80"
          >
            Buat Circle
          </Link>
          <Link
            href="#circles"
            className="rounded-2xl border border-celo/40 px-4 py-3 text-sm font-semibold text-celo active:opacity-80"
          >
            Lihat Circle
          </Link>
        </div>
      </section>

      <section className="mt-8" id="circles">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-celo-fig/70">
          Circle terbaru
        </h2>
        <CirclesList />
      </section>

      <section className="mt-10 space-y-3 text-sm text-celo-fig/80">
        <h2 className="text-xs font-bold uppercase tracking-wider text-celo-fig/70">
          Kenapa Pamoja?
        </h2>
        <p>
          <strong>1. Tahan inflasi.</strong> Setoran pakai cUSD (stabil ke USD)
          jadi nilai tabungan tidak terkikis mata uang lokal yang volatil.
        </p>
        <p>
          <strong>2. Transparan.</strong> Semua kontribusi, payout, dan giliran
          tercatat di blockchain Celo dan dapat diverifikasi siapa saja.
        </p>
        <p>
          <strong>3. Tanpa admin tunggal.</strong> Smart contract jadi
          escrow-nya. Tidak ada bendahara yang bisa kabur bawa uang.
        </p>
        <p>
          <strong>4. Gas dibayar pakai cUSD.</strong> Anda tidak perlu pegang
          CELO sama sekali (fitur khas Celo + MiniPay).
        </p>
      </section>
    </Shell>
  );
}
