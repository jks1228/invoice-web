/**
 * 인보이스 도메인 타입
 *
 * PRD(docs/PRD.md "데이터 모델")를 기준으로 정의한 순수 타입 계약이다.
 * Notion 원본(NotionPage.properties: unknown)에서 이 타입으로의 매핑 구현은
 * Task 006(src/lib/notion/invoices.ts)에서 담당한다.
 *
 * 필드 명명은 PRD의 snake_case 대신 프로젝트 표준인 camelCase를 사용한다
 * (shrimp-rules.md 코드 스타일). Notion property 표시명과의 연결은
 * `INVOICE_PROPS`(src/lib/notion/invoices.ts)가 맡는다.
 */

// 실제 Notion 상태 필드의 옵션값(한글). 알 수 없는 값은 파서에서 안전하게 fallback 처리한다(Task 006).
export type InvoiceStatus = '대기' | '발송' | '확인함' | '완료'

export interface InvoiceItem {
  id: string
  itemName: string
  description?: string
  unitPrice: number
  quantity: number
  // 단가 × 수량. Notion 원본 값과 계산값이 다르면 항목 기준으로 표시한다(Task 007).
  amount: number
  // 표시 정렬 순서. 없으면 조회 순서를 따른다.
  order?: number
}

export interface BusinessInfo {
  id: string
  businessName: string
  ownerName?: string
  phone?: string
  email?: string
  address?: string
  taxId?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  // ISO 날짜 문자열('YYYY-MM-DD' 또는 ISO datetime). 표시 변환은 src/lib/format.ts.
  invoiceDate: string
  dueDate?: string
  // PRD의 items 관계/롤업을 배열로 평탄화한 결과. InvoiceItem.invoiceId는
  // 부모 Invoice에 종속되어 중복이므로 도메인 타입에서 제외한다.
  items: InvoiceItem[]
  // Notion에 별도 소계 필드가 없어 totalAmount와 동일하게 채운다(Task 006).
  subtotal: number
  // 세율(%). Notion에 세금 필드가 없어 MVP에서는 항상 미설정(세금 0%/할인 케이스 대비 선택 필드로 유지).
  taxRate?: number
  taxAmount?: number
  totalAmount: number
  status: InvoiceStatus
  // Notion에 비고 필드가 없어 MVP에서는 항상 미설정.
  notes?: string
  // 발행자 정보. 조회 실패에 대비해 선택 필드로 둔다(Task 008 오류 처리와 정합).
  businessInfo?: BusinessInfo
}

/**
 * 상세 렌더링 및 PDF 생성 입력용 뷰모델.
 * `computed`는 화면/PDF에서 반복 계산하지 않도록 파생값을 미리 담는다.
 */
export interface InvoiceView {
  invoice: Invoice
  business: BusinessInfo | null
  computed: {
    // 항목 금액 합계. Notion subtotal과 대조해 불일치 시 경고 로그를 남긴다(Task 007).
    itemsTotal: number
    subtotal: number
    // 세금 표시 라벨(예: 'VAT 10%'). 세금이 없으면 null.
    taxLabel: string | null
    taxAmount: number
    total: number
    // dueDate가 오늘보다 과거이면 true. "기한 지남" 배지에 사용한다(Task 008).
    isOverdue: boolean
  }
}

/**
 * 인보이스 조회 결과. 예외를 던지는 대신 판별 유니온으로 반환한다.
 * - not_found: ID 형식은 유효하나 해당 견적서가 없음
 * - invalid_id: ID 형식 자체가 잘못됨
 * - notion_error: Notion API 장애(재시도 소진 등)
 */
export type InvoiceLookupResult =
  | { ok: true; data: Invoice }
  | { ok: false; reason: 'not_found' | 'invalid_id' | 'notion_error' }

/**
 * 관리자 목록 화면용 경량 타입(Task 013·V2). 항목(items) 배열은 포함하지 않는다 —
 * 목록 조회에서 항목 relation을 개별 조회하면 N+1이 발생하므로 의도적으로 제외한다(Task 017).
 */
export interface InvoiceListItem {
  id: string
  invoiceNumber: string
  clientName: string
  invoiceDate: string
  dueDate?: string
  totalAmount: number
  status: InvoiceStatus
  // 조회 시점에 미리 계산해 채운다(매 렌더링마다 재계산하지 않도록).
  isOverdue: boolean
}

/**
 * 목록 조회 결과. 단건 조회(InvoiceLookupResult)와 달리 "0건"은 실패가 아니라
 * data: []인 정상 케이스이므로 실패 사유는 notion_error 하나만 둔다.
 */
export type InvoiceListResult =
  | { ok: true; data: InvoiceListItem[]; nextCursor?: string }
  | { ok: false; reason: 'notion_error' }

/**
 * 목록 조회 옵션 계약. 구현은 Task 017(getInvoiceList)에서 담당한다.
 * 정렬은 로드맵상 "발행일 내림차순 고정"이 기본이라 별도 sort 옵션은 두지 않는다.
 */
export interface InvoiceListQuery {
  status?: InvoiceStatus
  pageSize?: number
  cursor?: string
}

/**
 * 공개 인보이스 링크 생성 함수 시그니처. 구현은 Task 015(src/lib/invoice.ts)에서 담당한다.
 * 브라우저에서는 window.location.origin, 서버에서는 NEXT_PUBLIC_SITE_URL → 요청 origin 순으로 폴백한다.
 */
export type BuildInvoicePublicUrl = (id: string, origin?: string) => string
