/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
  poweredByHeader: false,
  images: {
    domains: [],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  onDemandEntries: {
    maxInactiveAge: 300 * 1000,
    pagesBufferLength: 5,
  },
};

module.exports = nextConfig; 