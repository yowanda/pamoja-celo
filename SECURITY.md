# Security policy

Pamoja is non-custodial: the protocol never holds user keys, and contributions
are escrowed by an **immutable** smart contract with no admin, no upgrade path,
and no privileged accounts.

This document describes the security posture and how to report issues
responsibly.

## Reporting a vulnerability

Please **do not** open public GitHub issues for security findings.

Report privately by opening a [private security advisory](https://github.com/yowanda/pamoja-celo/security/advisories/new)
on the GitHub repo. Include:

- A description of the issue and its impact
- Repro steps or a proof-of-concept (PoC) call trace / transaction
- Affected contract address or frontend URL
- Your handle for credit (optional)

We will acknowledge reports within 7 days and provide an initial assessment
within 14 days.

## Scope

In scope:

- The deployed `SavingsCircle` smart contract on Celo mainnet
  ([`0xc3887311dC1f340aDEB8dc640A859D84C404Fae7`](https://celoscan.io/address/0xc3887311dC1f340aDEB8dc640A859D84C404Fae7#code))
  and Celo Sepolia
  ([`0x276e63880B96514A5Ae9fD4774E32D620B3f0039`](https://celo-sepolia.blockscout.com/address/0x276e63880B96514A5Ae9fD4774E32D620B3f0039))
- The frontend deployed at https://pamoja-celo.vercel.app

Out of scope:

- Issues that require physical access to a user's device
- Social-engineering attacks (phishing pages mimicking Pamoja, etc.)
- Volunteered third-party services that are not part of the protocol
  (e.g. wallet UI bugs, Celo RPC outages, WalletConnect relays)
- Self-XSS that requires a user to paste attacker-supplied code into devtools
- Theoretical issues without a working proof-of-concept

## Threat model — smart contract

The contract is **immutable** and the deployer holds no special privileges.
There is no proxy, no admin, no pause function, and no upgradeable component.

Security properties enforced at deploy time:

- Protocol fee is fixed at deploy via constructor and capped at 10% (1000 bps)
  by `MAX_PROTOCOL_FEE_BPS` at the type level. The currently deployed fee is
  **0.5% (50 bps)**.
- Fee recipient is fixed at deploy and cannot be rotated.
- No `onlyOwner` / `onlyAdmin` modifiers exist.
- Funds for an active round are escrowed in the contract until the round's
  recipient claims them via `claim()`. The contract cannot transfer funds to
  any address other than the deterministic round recipient (plus protocol
  fee transfer).
- The contract uses OpenZeppelin's `SafeERC20` for all token transfers.
- All accounting (contributions, payouts, rounds, member ordering) is on
  immutable state — there is no off-chain oracle, no signed message
  bypass, no upgrade hook.

Invariant test suite: 21/21 forge tests pass (`forge test -vv` from
`contracts/`). See the test file
`contracts/test/SavingsCircle.t.sol` for the enforced invariants.

The contract source is verified on Celoscan:
https://celoscan.io/address/0xc3887311dC1f340aDEB8dc640A859D84C404Fae7#code

## Threat model — frontend

The frontend is a static Next.js application served from Vercel.

- **No backend**. There is no Pamoja-operated server, database, or API that
  brokers contract calls. The frontend talks directly to the Celo RPC
  (`forno.celo.org` / `forno.celo-sepolia.celo-testnet.org`) and to
  WalletConnect / Reown relays. There is no centralised data plane to
  compromise.
- **No custodial state**. The frontend never holds user keys, signs
  transactions, or stores private data. All transactions are signed by the
  user's wallet (MiniPay, MetaMask, Rainbow, WalletConnect-paired mobile
  wallet, etc.).
- **No tracking / analytics**. No analytics SDKs, fingerprinters, or
  third-party scripts are loaded.
- **Strict CSP**. The Content-Security-Policy header restricts which
  domains can be contacted and embedded; see `app/next.config.mjs`.
  Additional protective headers shipped:
  - `Strict-Transport-Security` (HSTS, 2 years, includeSubDomains, preload)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` denying camera / microphone / geolocation /
    payment / USB / sensors
  - `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- **No `dangerouslySetInnerHTML` / `eval` / `Function()`** in application
  code — React's default escaping handles all rendered user input
  (circle names, etc.).
- **Dependency audits** run via `pnpm audit`; transitive vulnerabilities
  are pinned away from via `pnpm.overrides` in `app/package.json` when
  upstream packages have not yet released a clean version.

## Operational policy

- The deployer key is held by the project maintainer offline. The deployer
  has no privileges on the deployed contract.
- Vercel environment variables: only `NEXT_PUBLIC_*` variables are exposed
  to the client bundle (by Next.js convention). No private RPC keys,
  private keys, or API tokens are present in client-side code.
- WalletConnect Project ID is `NEXT_PUBLIC_` by design — Reown's threat
  model treats it as a public identifier.

## Acknowledgements

We thank security researchers who responsibly disclose issues. We do not
currently operate a paid bounty program.
