'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { celo } from 'wagmi/chains';
import { http } from 'wagmi';
import { defineChain } from 'viem';

// Celo Sepolia replaced Alfajores as the official developer testnet in 2025
// (https://docs.celo.org/build-on-celo/network-overview). viem doesn't ship a
// definition for it yet — define one here.
export const celoSepolia = defineChain({
  id: 11142220,
  name: 'Celo Sepolia',
  nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://forno.celo-sepolia.celo-testnet.org'] },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://celo-sepolia.blockscout.com',
    },
  },
  testnet: true,
});

// WalletConnect / Reown Cloud project ID. Required for the RainbowKit modal
// that desktop wallets (e.g. Trust Wallet, Rainbow mobile via QR) use to
// connect. Injected wallets (MetaMask, MiniPay) work without it.
//
// Get one for free at https://cloud.reown.com and set it as
// `NEXT_PUBLIC_WC_PROJECT_ID` in your env / Vercel project settings. A real
// project ID is a 32-char hex string; anything else is treated as missing and
// disables the WalletConnect transport (RainbowKit still renders for injected
// wallets, just without WC QR).
const rawProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID?.trim() ?? '';
const isValidProjectId = /^[0-9a-f]{32}$/i.test(rawProjectId);

if (!isValidProjectId && typeof window !== 'undefined') {
  console.warn(
    '[pamoja] NEXT_PUBLIC_WC_PROJECT_ID is missing or invalid. ' +
      'Desktop WalletConnect modal will not work. ' +
      'Get a free project ID at https://cloud.reown.com and set it in your ' +
      'env / Vercel project settings.',
  );
}

// RainbowKit's getDefaultConfig requires a non-empty projectId at construction
// time even when the connector is unused. Use a clearly-marked placeholder so
// a misconfigured deploy fails loudly in the WC SDK instead of silently
// pretending to work with an all-zero dummy.
const projectId = isValidProjectId ? rawProjectId : 'pamoja-wc-not-configured';

export const wagmiConfig = getDefaultConfig({
  appName: 'Pamoja',
  projectId,
  chains: [celo, celoSepolia],
  transports: {
    [celo.id]: http('https://forno.celo.org'),
    [celoSepolia.id]: http('https://forno.celo-sepolia.celo-testnet.org'),
  },
  ssr: true,
});
