/**
 * Notion API 클라이언트 - 필터링과 페이지네이션 지원
 *
 * 환경 변수 설정:
 * NOTION_API_KEY=ntn_xxxxxxxxxxxxx
 */

import { env } from '@/lib/env'

import type {
  DatabaseQueryRequest,
  DatabaseQueryResponse,
  Filter,
  Sort,
  NotionPage,
} from './types'

export class NotionClient {
  private apiKey: string
  private baseUrl: string
  private version: string
  private retryCount: number = 3
  private retryDelayMs: number = 1000

  constructor(apiKey?: string) {
    // 컴포넌트/모듈에서 process.env.NOTION_*를 직접 읽지 않고 env.ts를 통해서만 접근한다.
    this.apiKey = apiKey || env.NOTION_API_KEY || ''
    this.baseUrl = 'https://api.notion.com/v1'
    // Notion API가 2024-06-15를 더 이상 허용하지 않음(400 missing_version).
    // 데이터소스 분리(2025-09-03) 이전의 마지막 안정 버전을 사용한다.
    this.version = '2022-06-28'

    if (!this.apiKey) {
      throw new Error('NOTION_API_KEY 환경 변수가 설정되지 않았습니다.')
    }
  }

  /**
   * 기본 HTTP 요청 헬퍼
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Notion-Version': this.version,
      'Content-Type': 'application/json',
    }

    let lastError: Error | null = null

    // 재시도 로직 (API 레이트 제한 처리)
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        })

        // 레이트 제한 감지
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const delayMs = retryAfter
            ? parseInt(retryAfter) * 1000
            : this.retryDelayMs * Math.pow(2, attempt)

          console.warn(`Notion API 레이트 제한. ${delayMs}ms 후 재시도...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          continue
        }

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ message: response.statusText }))
          throw new Error(
            `Notion API 오류 (${response.status}): ${error.message}`
          )
        }

        return await response.json()
      } catch (error) {
        lastError = error as Error
        if (attempt < this.retryCount - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, this.retryDelayMs * Math.pow(2, attempt))
          )
        }
      }
    }

    // 재시도 소진: 사용자에게는 상위 호출부(getInvoiceById 등)가 일반화된 메시지만 노출하고,
    // 실패 원인은 여기 서버 로그에만 남긴다.
    console.error(
      `Notion API 요청 실패 (${this.retryCount}회 재시도 소진): ${method} ${path}`,
      lastError
    )
    throw lastError || new Error('Notion API 요청 실패')
  }

  /**
   * 데이터베이스 쿼리 - 가장 중요한 메서드
   *
   * 예제:
   * const results = await notion.queryDatabase('db-id', {
   *   filter: { property: 'status', select: { equals: 'Done' } },
   *   sorts: [{ property: 'created_time', direction: 'descending' }],
   *   page_size: 100,
   * })
   */
  async queryDatabase<T = NotionPage>(
    databaseId: string,
    request?: DatabaseQueryRequest
  ): Promise<DatabaseQueryResponse<T>> {
    const body = {
      filter: request?.filter,
      sorts: request?.sorts,
      start_cursor: request?.start_cursor,
      page_size: request?.page_size || 100,
    }

    // undefined 값 제거
    Object.keys(body).forEach(key => {
      if (body[key as keyof typeof body] === undefined) {
        delete body[key as keyof typeof body]
      }
    })

    return this.request<DatabaseQueryResponse<T>>(
      'POST',
      `/databases/${databaseId}/query`,
      body
    )
  }

  /**
   * 모든 페이지 가져오기 (자동 페이지네이션)
   *
   * 주의: 많은 항목이 있는 경우 여러 API 호출이 발생합니다.
   * 성능을 위해 필터/정렬을 함께 사용하세요.
   */
  async getAllPages<T = NotionPage>(
    databaseId: string,
    filter?: Filter,
    sorts?: Sort[]
  ): Promise<T[]> {
    const allPages: T[] = []
    let cursor: string | undefined

    do {
      const response = await this.queryDatabase<T>(databaseId, {
        filter,
        sorts,
        start_cursor: cursor,
        page_size: 100, // 최대값
      })

      allPages.push(...response.results)
      cursor = response.next_cursor || undefined

      // API 레이트 제한을 위해 요청 사이에 약간의 지연
      if (response.has_more) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } while (cursor)

    return allPages
  }

  /**
   * 페이지네이션을 지원하는 반복자
   * 메모리 효율적으로 처리 가능
   *
   * 예제:
   * for await (const page of notion.iteratePages('db-id', filter)) {
   *   console.log(page)
   * }
   */
  async *iteratePages<T = NotionPage>(
    databaseId: string,
    filter?: Filter,
    sorts?: Sort[]
  ): AsyncGenerator<T, void, unknown> {
    let cursor: string | undefined

    do {
      const response = await this.queryDatabase<T>(databaseId, {
        filter,
        sorts,
        start_cursor: cursor,
        page_size: 100,
      })

      for (const page of response.results) {
        yield page
      }

      cursor = response.next_cursor || undefined

      if (response.has_more) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } while (cursor)
  }

  /**
   * 단일 페이지 가져오기
   */
  async getPage(pageId: string): Promise<NotionPage> {
    return this.request<NotionPage>('GET', `/pages/${pageId}`)
  }

  /**
   * 페이지의 모든 블록 가져오기
   */
  async getPageContent(pageId: string): Promise<unknown[]> {
    const blocks: unknown[] = []
    let cursor: string | undefined

    do {
      const response = await this.request<{
        object: 'list'
        results: unknown[]
        next_cursor: string | null
        has_more: boolean
      }>(
        'GET',
        `/blocks/${pageId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`
      )

      blocks.push(...response.results)
      cursor = response.next_cursor || undefined
    } while (cursor)

    return blocks
  }

  /**
   * 페이지 생성
   */
  async createPage(
    databaseId: string,
    properties: Record<string, unknown>
  ): Promise<NotionPage> {
    return this.request<NotionPage>('POST', '/pages', {
      parent: { database_id: databaseId },
      properties,
    })
  }

  /**
   * 페이지 수정
   */
  async updatePage(
    pageId: string,
    properties: Record<string, unknown>
  ): Promise<NotionPage> {
    return this.request<NotionPage>('PATCH', `/pages/${pageId}`, {
      properties,
    })
  }

  /**
   * 페이지 삭제 (보관 처리)
   */
  async archivePage(pageId: string): Promise<NotionPage> {
    return this.request<NotionPage>('PATCH', `/pages/${pageId}`, {
      archived: true,
    })
  }

  /**
   * 데이터베이스 스키마 가져오기
   * 필드 이름과 타입 확인에 유용
   */
  async getDatabase(databaseId: string): Promise<unknown> {
    return this.request('GET', `/databases/${databaseId}`)
  }

  /**
   * 레이트 제한 설정 변경
   */
  setRetryConfig(maxRetries: number, initialDelayMs: number): void {
    this.retryCount = maxRetries
    this.retryDelayMs = initialDelayMs
  }

  /**
   * API 키 검증
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // 권한 확인을 위해 current user 엔드포인트 사용
      await this.request('GET', '/users/me')
      return true
    } catch {
      return false
    }
  }
}

/**
 * 싱글톤 인스턴스 - 모든 곳에서 같은 클라이언트 사용
 */
let instance: NotionClient | null = null

export function getNotionClient(apiKey?: string): NotionClient {
  if (!instance) {
    instance = new NotionClient(apiKey)
  }
  return instance
}

/**
 * 클라이언트 인스턴스 재설정 (테스트용)
 */
export function resetNotionClient(): void {
  instance = null
}
