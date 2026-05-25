# Pamoja — Onchain Arisan / ROSCA di Celo

> _"Pamoja"_ artinya **bersama** dalam bahasa Swahili. Arisan onchain pakai stablecoin (cUSD) di Celo. Kompatibel dengan **MiniPay** (wallet mobile Opera di Celo, dipakai 7M+ user di Afrika & Asia).

Arisan / Tanda / Chama / Susu / Ajo / Ayuuto — ratusan juta orang di luar sistem perbankan formal sudah pakai pola **rotating savings** ini selama berabad-abad. Pamoja membawanya onchain:

- **Tahan inflasi** — setoran di cUSD (stabil ke USD), bukan mata uang lokal yang melemah.
- **Transparan** — semua kontribusi & payout tercatat di blockchain Celo, bisa diaudit siapa saja.
- **Tanpa admin tunggal** — smart contract jadi escrow-nya. Tidak ada bendahara yang bisa kabur bawa uang.
- **Gas dibayar pakai cUSD** — user tidak perlu pegang CELO sama sekali (fitur khas Celo + MiniPay).

## Arsitektur

```
pamoja-celo/
├── contracts/        # Smart contract (Foundry, Solidity 0.8.24)
│   └── src/SavingsCircle.sol
├── app/              # Frontend (Next.js 15 + wagmi 2 + viem 2)
│   └── src/hooks/useMiniPay.ts   # auto-connect untuk MiniPay
└── README.md
```

## Cara kerja kontrak

`SavingsCircle.sol` adalah factory ROSCA:

1. **createCircle** — Bikin circle: token (cUSD), jumlah setoran, durasi ronde, jumlah anggota, nama. Creator otomatis jadi anggota #1.
2. **joinCircle** — Anggota gabung sebelum circle dimulai. Urutan join = urutan terima payout.
3. **startCircle** — Setelah ≥2 anggota, mulai circle. Ronde 1 dimulai.
4. **contribute** — Tiap anggota setor `contributionAmount` cUSD. Ketika anggota terakhir setor, pot langsung dibayarkan ke penerima ronde itu, dan ronde berikutnya dimulai otomatis.
5. **forceAdvance** — Kalau deadline ronde lewat dan ada yang belum setor, anggota lain bisa paksa lanjut. Yang belum setor "hangus" untuk ronde ini (mereka tetap dapat giliran payout sendiri, tapi pot saat itu lebih kecil).

Total ronde = jumlah anggota. Tiap anggota terima pot sekali. Selesai.

Tes lengkap di `contracts/test/SavingsCircle.t.sol` (14 test, semua pass).

## Setup lokal

### Prasyarat

- Node.js ≥ 18 + pnpm
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`)

### Install

```bash
# contracts
cd contracts
forge install --no-git OpenZeppelin/openzeppelin-contracts
forge build
forge test

# frontend
cd ../app
pnpm install
cp .env.example .env.local
# isi NEXT_PUBLIC_WC_PROJECT_ID dari https://cloud.walletconnect.com
pnpm dev
```

## Deploy

### 1. Deploy ke Celo Sepolia (testnet) — gratis

Celo Sepolia menggantikan Alfajores sebagai testnet resmi Celo per 2025
(chain id `11142220`). Ambil CELO testnet dari
[Celo Sepolia faucet](https://faucet.celo.org/celo-sepolia) (login GitHub), lalu:

```bash
cd contracts
export PRIVATE_KEY=0x...   # wallet kamu
forge script script/Deploy.s.sol:Deploy \
  --rpc-url celo_sepolia \
  --broadcast \
  -vvv
```

Catat address yang dicetak, lalu di `app/.env.local`:

```
NEXT_PUBLIC_SAVINGS_CIRCLE_CELO_SEPOLIA=0xDeploymentAddress
```

Verifikasi (opsional, butuh `CELOSCAN_API_KEY`):

```bash
forge verify-contract <ADDRESS> src/SavingsCircle.sol:SavingsCircle \
  --chain celo \
  --etherscan-api-key $CELOSCAN_API_KEY
```

### 2. Deploy ke Celo mainnet

Butuh CELO mainnet (sangat sedikit — kontrak ini kecil, ~$0.05 gas):

```bash
cd contracts
export PRIVATE_KEY=0x...
forge script script/Deploy.s.sol:Deploy \
  --rpc-url celo \
  --broadcast \
  -vvv
```

Set `NEXT_PUBLIC_SAVINGS_CIRCLE_CELO=0x...` di `.env.local` dan/atau di Vercel.

### 3. Deploy frontend ke Vercel

1. Push repo ke GitHub.
2. Import di [vercel.com/new](https://vercel.com/new), **Root Directory: `app`**.
3. Tambah env vars di Vercel: `NEXT_PUBLIC_WC_PROJECT_ID`, `NEXT_PUBLIC_SAVINGS_CIRCLE_CELO`, `NEXT_PUBLIC_SAVINGS_CIRCLE_ALFAJORES`.
4. Deploy.

## Integrasi MiniPay

`useMiniPay` hook ([app/src/hooks/useMiniPay.ts](app/src/hooks/useMiniPay.ts)) menangani:

1. **Deteksi** — cek `window.ethereum.isMiniPay`.
2. **Auto-connect** — tanpa modal "Connect Wallet" (MiniPay UX rule).
3. **Hide ConnectButton** — RainbowKit diganti status pill kecil.
4. **`feeCurrency`** — semua tx pakai `feeCurrency: cUSD` supaya gas dibayar pakai stablecoin ([lib/feeCurrency.ts](app/src/lib/feeCurrency.ts)).

## Lisensi

MIT.
