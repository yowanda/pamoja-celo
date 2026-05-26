/**
 * Protocol fee in basis points. Mirrors the immutable value baked into the
 * deployed SavingsCircle contract — kept here so the UI can show fee
 * previews before any contract call without paying for an RPC round-trip.
 *
 * 50 = 0.5%. Components that need the live on-chain value can fetch it via
 * `useReadContract({ functionName: 'protocolFeeBps' })`.
 */
export const PROTOCOL_FEE_BPS = 50;
