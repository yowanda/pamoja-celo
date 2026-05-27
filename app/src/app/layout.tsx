import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://pamoja-lyart.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Pamoja — Onchain Savings Circles on Celo',
  description:
    'Rotating savings circles (ROSCA / tanda / chama / arisan) onchain in Mento USDm on Celo. MiniPay-native, non-custodial, 0.5% protocol fee.',
  applicationName: 'Pamoja',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pamoja',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    url: APP_URL,
    title: 'Pamoja — Onchain Savings Circles on Celo',
    description:
      'Rotating savings circles (ROSCA · tanda · chama · arisan) onchain in Mento USDm on Celo. MiniPay-native, non-custodial.',
    siteName: 'Pamoja',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Pamoja — onchain savings circles on Celo',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pamoja — Onchain Savings Circles on Celo',
    description:
      'Rotating savings circles (ROSCA) onchain in Mento USDm. MiniPay-native, non-custodial.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#02513B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
