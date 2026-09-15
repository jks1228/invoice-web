import next from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

// Next.js 16부터 eslint-config-next가 flat config를 직접 제공하므로 FlatCompat을 쓰지 않는다
const eslintConfig = [
  ...next,
  ...nextTypeScript,
  prettier,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
]

export default eslintConfig
