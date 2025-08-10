/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  // Remove static export config for local development
  // distDir: 'out', // Only enable for static builds
  
  // Move serverComponentsExternalPackages to top level (Next.js 15+)
  serverExternalPackages: [],
  
  // Improve local development experience
  reactStrictMode: false, // Disable strict mode to reduce console warnings
}

export default nextConfig
