/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
