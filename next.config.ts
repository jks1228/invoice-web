import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 상위 디렉터리의 lockfile 때문에 워크스페이스 루트가 잘못 추론되는 것을 방지
  turbopack: {
    root: process.cwd(),
  },
  // CLAUDE.md / shrimp-rules.md 로 에이전트 지침을 직접 관리하므로 next dev 자동 주입을 끈다
  agentRules: false,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // PDF 생성(@react-pdf/renderer)이 런타임에 assets/fonts의 폰트 파일을 읽는다.
  // react-pdf 내부에서 파일을 읽어 Next의 자동 트레이싱이 감지하지 못하므로 명시적으로 포함한다.
  outputFileTracingIncludes: {
    '/invoice/[id]/pdf': ['./assets/fonts/**'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

export default nextConfig
