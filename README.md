# Pamoja — Onchain ROSCA on Celo

Rotating savings circles (ROSCA / Arisan / Tanda / Chama / Ajo) onchain, settled in
**Mento USDm** stablecoin on **Celo mainnet**, fully [**MiniPay**](https://www.opera.com/products/minipay)-compatible.

**Live frontend:** <https://pamoja-lyart.vercel.app>

## Live mainnet deployment

| Network        | Chain ID  | SavingsCircle (v2)                                                                                                                  | Status                |
| -------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **Celo**       | `42220`   | [`0xc3887311dC1f340aDEB8dc640A859D84C404Fae7`](https://celoscan.io/address/0xc3887311dC1f340aDEB8dc640A859D84C404Fae7)               | **Live, verified**    |
| Celo Sepolia   | `11142220`| [`0x276e63880B96514A5Ae9fD4774E32D620B3f0039`](https://celo-sepolia.blockscout.com/address/0x276e63880B96514A5Ae9fD4774E32D620B3f0039) | Live (public testnet) |

Both deployments bake in immutable constructor args: `protocolFeeBps = 50` (0.5%) and
`protocolFeeRecipient = 0x15efcbf1…d09cac`. The contract type-asserts
`MAX_PROTOCOL_FEE_BPS = 1000` (10%), so the fee can never exceed 10% even at deploy
time.

## Why Pamoja

ROSCAs are how hundreds of millions of unbanked people already save — through
trust, peer pressure, and a rotating pot. Pamoja replaces the trusted treasurer
with a smart contract while keeping the social model intact.

- **No single admin.** The contract holds funds in escrow. No treasurer can run
  off with the pot.
- **Inflation-resistant.** Contributions are denominated in Mento USDm
  (USD-pegged) by default, with optional CELO-denominated circles.
- **Gas paid in stablecoin.** Members never need to hold CELO — gas is paid in
  USDm via Celo's `feeCurrency` field, the same UX MiniPay ships with.
- **Transparent.** Every contribution and payout is an onchain event, auditable
  by anyone.
- **MiniPay-native.** Auto-connects inside MiniPay (Opera's wallet, 7M+ users in
  Africa & Asia) — no "Connect Wallet" modal, just open and pay.

## How the contract works

`contracts/src/SavingsCircle.sol` is a single-file ROSCA factory:

1. `createCircle(token, contribution, period, members, name)` — spawns a circle.
   The creator is auto-enrolled as member #1. The token can be any ERC20 (USDm
   on mainnet, cUSD on Sepolia, CELO via wrapped, or anything else).
2. `joinCircle` — others join until the member cap is reached. Join order =
   payout order.
3. `startCircle` — once full, round 1 begins.
4. `contribute` — each member deposits one period. When the final member
   deposits, the pot is paid to that round's recipient in the same tx, minus
   `pot * 50 / 10000` forwarded to the immutable `protocolFeeRecipient`. The
   next round starts atomically.
5. `forceAdvance` — if a round's deadline passes with missing contributions, any
   member can force-advance. The missing members forfeit *that* round's pot but
   still receive their own payout when their turn comes.

Total rounds = number of members. Each member receives the pot exactly once.

**Tests:** `forge test` — 21/21 passing (17 baseline + 4 protocol-fee specific).

## Architecture

```
pamoja-celo/
├── contracts/                    # Foundry, Solidity 0.8.24
│   ├── src/SavingsCircle.sol
│   └── test/SavingsCircle.t.sol
├── app/                          # Next.js 15, wagmi 2, viem 2, RainbowKit 2
│   ├── src/hooks/useMiniPay.ts   # MiniPay detect + auto-connect
│   ├── src/hooks/useStableSymbol.ts
│   └── src/lib/{wagmi,feeCurrency}.ts
└── README.md
```

## Stablecoin note: USDm vs cUSD

Mento's stablecoin at `0x765DE816845861e75A25fCA122bb6898B8B1282a` was rebranded
in 2025: `name = "Mento Dollar"`, `symbol = "USDm"` on mainnet, while Celo
Sepolia still reports `"Celo Dollar"` / `"cUSD"`. The UI reads `symbol()` from
the contract via `useStableSymbol`, so labels auto-switch without code changes.
The smart contract itself is token-agnostic, so future Mento rebrands or new
stablecoin issuers require zero contract changes.

## Quickstart

```bash
# contracts
cd contracts && forge install --no-git OpenZeppelin/openzeppelin-contracts
forge build && forge test

# frontend
cd ../app && pnpm install
cp .env.example .env.local   # set NEXT_PUBLIC_WC_PROJECT_ID from cloud.reown.com
pnpm dev
```

## Deploy

Deploy the contract to Sepolia / mainnet:

```bash
cd contracts
export PRIVATE_KEY=0x...
export PROTOCOL_FEE_RECIPIENT=0x15efcbf10a8e328e38090c28b1e95ba8a6d09cac
export PROTOCOL_FEE_BPS=50
forge script script/Deploy.s.sol:Deploy --rpc-url celo --broadcast -vvv
```

Frontend deploys via Vercel (root directory: `app`). Required env vars:
`NEXT_PUBLIC_WC_PROJECT_ID`, `NEXT_PUBLIC_SAVINGS_CIRCLE_CELO`,
`NEXT_PUBLIC_SAVINGS_CIRCLE_CELO_SEPOLIA`.

## License

MIT.
