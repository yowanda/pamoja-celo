'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { celo, celoAlfajores } from 'wagmi/chains';
import { http } from 'wagmi';

const projectId =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? '00000000000000000000000000000000';

export const wagmiConfig = getDefaultConfig({
  appName: 'Pamoja',
  projectId,
  chains: [celo, celoAlfajores],
  transports: {
    [celo.id]: http('https://forno.celo.org'),
    [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org'),
  },
  ssr: true,
});
