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

const projectId =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? '00000000000000000000000000000000';

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
