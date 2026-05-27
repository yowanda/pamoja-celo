import { execSync } from 'node:child_process';

function readGitSha() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    // Fall back to the Vercel-provided commit SHA when not in a git checkout
    // (e.g. inside a Vercel build container without git history).
    const sha = process.env.VERCEL_GIT_COMMIT_SHA;
    return sha ? sha.slice(0, 7) : 'dev';
  }
}

const buildSha = process.env.NEXT_PUBLIC_BUILD_SHA ?? readGitSha();
const buildTime = new Date().toISOString();

// Content-Security-Policy. Tight by default; only the domains we actually
// hit at runtime are allowed.
//   - script/style: 'unsafe-inline' is required for Next.js' framework
//     hydration boot script and for libraries (RainbowKit, viem) that emit
//     inline <style> tags. Moving to nonces is a separate, larger change.
//   - connect: RPC endpoints (Celo mainnet + Sepolia) and the Reown /
//     WalletConnect relays / pulse / verify endpoints.
//   - img: WalletConnect serves wallet icons from imagedelivery.net.
//   - frame: the WalletConnect "Verify API" embed runs in an iframe.
//   - frame-ancestors 'self': we want to allow MiniPay's webview (which
//     does not iframe us — it opens the page in a top-level browser) but
//     deny third-party clickjacking.
const csp = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://*.walletconnect.com https://*.walletconnect.org https://explorer-api.walletconnect.com https://imagedelivery.net`,
    `font-src 'self' data:`,
    `connect-src 'self' https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org https://*.reown.com wss://*.reown.com https://pulse.walletconnect.org https://api.web3modal.org https://explorer-api.walletconnect.com https://forno.celo.org https://forno.celo-sepolia.celo-testnet.org`,
    `frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org`,
    `frame-ancestors 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
].join('; ');

const securityHeaders = [
  // Block MIME sniffing → blunts content-type confusion attacks.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Cross-origin referrer is a useful telemetry signal but leaks the URL
  // path on outbound clicks; clamp to origin for cross-origin requests.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Force HTTPS for ourselves and any subdomain for the next two years.
  // Vercel already serves us on HTTPS, so this is safe.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // We don't use any of these sensor/payment APIs — deny by default so a
  // third-party script can't silently turn them on.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  },
  // Legacy clickjacking guard. Modern browsers respect CSP frame-ancestors
  // instead, but XFO is still honoured by older WebViews.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Cross-origin isolation: keep our window context isolated from
  // attacker windows, but allow popups (RainbowKit opens wallet popups).
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  // Content-Security-Policy: see csp definition above.
  { key: 'Content-Security-Policy', value: csp },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_BUILD_SHA: buildSha,
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
  async headers() {
    return [
      {
        // Cache-bust the navigable shell: every request fetches the latest
        // HTML, but the hashed static chunks (under /_next/static/) keep
        // their long-lived cache below.
        source: '/:path((?!_next/static|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'X-Pamoja-Build', value: buildSha },
          ...securityHeaders,
        ],
      },
      {
        // Next.js fingerprints these — safe to cache aggressively forever.
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
  webpack: (config) => {
    // wagmi/walletconnect requires these to be marked external in webpack
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    // MetaMask SDK pulls in react-native-async-storage even on web — silence
    // the warning by marking it optional.
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

export default nextConfig;
