# 🤖 Claude Code 개발 지침

**Invoice Web MVP**는 Notion으로 관리하는 견적서를 클라이언트가 공개 웹 링크로 확인하고 PDF로 내려받는 공개 인보이스 플랫폼입니다. 상세 요구사항은 `@/docs/PRD.md`를 참조하세요.

## 🛠️ 핵심 기술 스택

- **Framework**: Next.js 16.3.4 (App Router + Turbopack)
- **Runtime**: React 19.2.8 + TypeScript 5
- **Styling**: TailwindCSS v4 + shadcn/ui (new-york style)
- **Forms**: React Hook Form + Zod + Server Actions
- **UI Components**: Radix UI + Lucide Icons
- **Data**: Notion API 연동 (`src/lib/notion/`, 서버 전용)
- **PDF**: 서버사이드 PDF 생성 (라이브러리 미도입 — 구현 시 선택)
- **Development**: ESLint + Prettier + Husky + lint-staged

## 📚 개발 가이드

- **🗺️ 개발 로드맵**: `@/docs/ROADMAP.md`
- **📋 프로젝트 요구사항**: `@/docs/PRD.md`
- **📁 프로젝트 구조**: `@/docs/guides/project-structure.md`
- **🎨 스타일링 가이드**: `@/docs/guides/styling-guide.md`
- **🧩 컴포넌트 패턴**: `@/docs/guides/component-patterns.md`
- **⚡ Next.js 16 전문 가이드**: `@/docs/guides/nextjs-16.md` (구 `nextjs-15.md` 갱신)
- **📝 폼 처리 완전 가이드**: `@/docs/guides/forms-react-hook-form.md`
- **🔗 Notion 빠른 시작**: `@/docs/guides/notion-quickstart.md`
- **🔍 Notion 필터링 가이드**: `@/docs/guides/notion-filtering.md`

## ⚡ 자주 사용하는 명령어

```bash
# 개발
npm run dev         # 개발 서버 실행 (Turbopack)
npm run build       # 프로덕션 빌드
npm run check-all   # 모든 검사 통합 실행 (권장)

# UI 컴포넌트
npx shadcn@latest add button    # 새 컴포넌트 추가
```

## ✅ 작업 완료 체크리스트

```bash
npm run check-all   # 모든 검사 통과 확인
npm run build       # 빌드 성공 확인
```

💡 **상세 규칙은 위 개발 가이드 문서들을 참조하세요**
