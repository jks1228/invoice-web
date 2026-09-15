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
})

export type Env = z.infer<typeof envSchema>
