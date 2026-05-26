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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
