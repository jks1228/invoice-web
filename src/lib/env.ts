import { z } from 'zod'

// 서버 전용 환경 변수 스키마
// NOTION_* 값은 절대 클라이언트 번들에 노출하지 않는다 (NEXT_PUBLIC_ 접두사 금지)
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // Notion 실조회(Task 006)가 이 값들에 의존하므로 필수화한다.
  NOTION_API_KEY: z.string().min(1),
  NOTION_DATABASE_ID: z.string().min(1),
  // 발행자 정보는 Notion에 별도 DB가 없어 환경 변수로 고정 관리한다(Task 006).
  // BUSINESS_NAME이 없으면 getBusinessInfo()는 null을 반환한다.
  BUSINESS_NAME: z.string().min(1).optional(),
  BUSINESS_OWNER_NAME: z.string().min(1).optional(),
  BUSINESS_PHONE: z.string().min(1).optional(),
  BUSINESS_EMAIL: z.string().min(1).optional(),
  BUSINESS_ADDRESS: z.string().min(1).optional(),
  BUSINESS_TAX_ID: z.string().min(1).optional(),
  // 공개 링크 생성(Task 015, A002)용 클라이언트 노출 값. NOTION_*와 달리 NEXT_PUBLIC_ 접두사로
  // 분리한다. 주의: buildInvoicePublicUrl(lib/invoice.ts)은 클라이언트 컴포넌트에서도 호출되므로
  // 이 env 객체를 import하지 않고 process.env.NEXT_PUBLIC_SITE_URL을 직접 읽는다(아래 참고).
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  // 관리자 인증(Task 018, A005). 값이 없으면 앱 시작 시 즉시 실패해 인증이 비활성화된 채로
  // 배포되는 사고를 막는다. 저장 형식은 src/lib/auth/password.ts 참고(salt:hash, scrypt hex).
  ADMIN_PASSWORD_HASH: z.string().min(1),
  // 세션 JWT(HS256) 서명 키. 32자 이상 무작위 문자열 — src/lib/auth/session.ts 참고.
  ADMIN_SESSION_SECRET: z.string().min(32),
})

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NOTION_API_KEY: process.env.NOTION_API_KEY,
  NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
  BUSINESS_NAME: process.env.BUSINESS_NAME,
  BUSINESS_OWNER_NAME: process.env.BUSINESS_OWNER_NAME,
  BUSINESS_PHONE: process.env.BUSINESS_PHONE,
  BUSINESS_EMAIL: process.env.BUSINESS_EMAIL,
  BUSINESS_ADDRESS: process.env.BUSINESS_ADDRESS,
  BUSINESS_TAX_ID: process.env.BUSINESS_TAX_ID,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
})

export type Env = z.infer<typeof envSchema>
