import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (logos, imagens de login)
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/**' },
      { protocol: 'https', hostname: '*.supabase.in', pathname: '/storage/v1/object/**' },
      // URLs externas genéricas (CDN de clínicas)
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
