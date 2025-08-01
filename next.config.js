/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    SKIP_ENV_VALIDATION: 'true',
    SKIP_PRISMA: 'true'
  },
  // Increase static generation timeout
  staticPageGenerationTimeout: 180,
  // Configure output for Vercel
  output: 'standalone',
  // Experimental features for better performance
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  }
}

module.exports = nextConfig