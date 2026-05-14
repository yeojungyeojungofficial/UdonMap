# src 구조 및 상태관리 기준

> Next.js Pages Router 기반. 새 코드를 작성할 때 아래 판단 기준을 먼저 확인한다.

---

## 빠른 판단 기준

| 새 코드가 하는 일 | 위치 |
|---|---|
| 화면을 그린다 | `src/components/` |
| 화면 동작·상태를 조합한다 | `src/features/` |
| Supabase·fetch·인증 토큰을 직접 다룬다 | `src/core/` |
| 여러 화면/컴포넌트가 공유하는 클라이언트 UI 상태 | `src/store/` |
| 한 컴포넌트 안에서만 쓰는 입력값·메시지·플래그 | local `useState` |

---

## 웹/모바일 반응형 기준

뷰포트 너비가 `MOBILE_BREAKPOINT` 이하이면 모바일 트랙, 초과이면 웹 트랙으로 본다.
푸터는 필요할 때만 `FOOTER_BREAKPOINT`를 따로 조정한다.

### 단일 원본

반응형 숫자는 `src/constants/responsive-values.json`에만 둔다.
TS에서는 `src/constants/responsive.ts`를 import해서 사용하고, CSS Modules에서는 PostCSS가 아래 미디어 토큰을 실제 px 값으로 변환한다.

```css
@media --mobile {
  /* max-width: MOBILE_BREAKPOINT */
}

@media --desktop {
  /* min-width: MOBILE_BREAKPOINT + 1 */
}

@media --footer-mobile {
  /* max-width: FOOTER_BREAKPOINT */
}
```

스타일 파일에 `640px`, `670px`, `860px`, `960px` 같은 분기 숫자를 직접 쓰지 않는다.
기준을 바꿔야 하면 `responsive-values.json`만 수정한다.

### 컴포넌트 분기

공통 셸의 헤더/푸터처럼 골격은 같고 일부 컴포넌트만 바뀌는 경우 `useIsMobile`을 사용한다.

```ts
const isMobileNav = useIsMobile(MOBILE_BREAKPOINT);
const isMobileFooter = useIsMobile(FOOTER_BREAKPOINT);
```

페이지 전체가 웹/모바일에서 완전히 달라질 때만 `index.tsx`가 `web`/`mob` 진입 컴포넌트를 고르는 구조로 분리한다.
현재 CSS Modules 기반에서는 세부 간격 조정은 `@media --mobile` 토큰으로 처리한다.

---

## 폴더 책임

### `src/components/`
화면에 보이는 UI 컴포넌트.
- 여러 페이지에서 쓰이면 → `components/common/`
- 특정 페이지 안에서만 쓰이면 → `components/home/`, `components/mypage/`, `components/reviews/`

**NEVER** `components/`에서 `core/`를 직접 import하지 않는다. 반드시 `features/` hook을 거친다.

### `src/features/`
기능 단위의 커스텀 hook, 상태 조합, 타입 변환, 유효성 검사, 포맷터.

**규칙**
- `features/` hook이 `core/`를 import하는 것은 허용한다.
- `components/`는 `features/` hook만 호출한다. `core/`를 직접 호출하지 않는다.
- 서버 데이터(fetch 결과)는 hook 내부 `useState`로 관리하고, store에 올리지 않는다.

### `src/core/`
외부 시스템과 맞닿는 코드. Supabase client, auth session, API request helper, 서버 공통 로직.

**규칙**
- 클라이언트 `components/`, `pages/`(라우트 파일)는 `core/`를 직접 import하지 않는다.
- 예외: `pages/api/`(서버 API Route)는 `core/`를 직접 import한다. 서버 컨텍스트이기 때문이다.

### `src/store/`
Zustand 전역 상태. 아래 기준을 모두 따른다.

**규칙**
- UI 컴포넌트가 store를 직접 구독하지 않는 것을 기본값으로 한다.
- store 값은 feature/page hook에서 읽고, 컴포넌트에는 props로 내려준다.
- 앱 전역 UI처럼 props 전달이 더 복잡하게 만들 때만 예외를 둔다.

### `src/pages/`
URL 라우트 파일만 둔다. 비즈니스 로직은 `features/` hook으로 분리한다.

---

## 라우트 구조

```
src/pages/
  index.tsx              # /
  mypage/
    index.tsx            # /mypage
  reviews/
    index.tsx            # /reviews
    [postId].tsx         # /reviews/:postId
  support/
    index.tsx            # /support
  api/                   # Next.js API Routes (서버 전용)
```

홈은 `pages/index.tsx`를 유지한다. `pages/home/index.tsx`를 만들면 URL이 `/home`으로 바뀐다.

---

## Zustand 사용 기준

### store에 두는 것
- 로그인 세션, 현재 유저 id, 인증 준비 여부, 유저 프로필 — 여러 기능이 공통으로 읽는 상태
- 지도 검색어, 지역 필터, 선택 병원 id, 지도 줌 레벨 — 홈 지도·리스트·바텀시트가 같이 보는 상태
- 라우트 이동 후에도 유지하는 것이 자연스러운 클라이언트 UI 상태

### store에 두지 않는 것 (NEVER)
- 입력 폼의 임시 값 (email, password 등)
- 모달 내부 제출 메시지, 에러 메시지, 로딩 플래그 — 컴포넌트 생명주기에 묶인 상태
- fetch로 가져온 서버 데이터 전체 캐시
- `pages/api/` 내부 서버 상태

> 서버 데이터 캐싱이 커지면 Zustand 대신 React Query 도입을 검토한다.

---

## 현재 store

### `src/store/authStore.ts`
로그인 세션, 현재 유저 id, 인증 준비 여부(`isAuthReady`), 유저 프로필을 관리한다.
병원 댓글·찜 액션과 마이페이지가 같은 로그인 상태를 구독한다.

```ts
// 읽기 예시
const currentUserId = useAuthStore((state) => state.currentUserId);
const isLoggedIn = useAuthStore((state) => Boolean(state.session));
```

### `src/store/hospitalMapStore.ts`
홈 지도 화면의 검색어(`query`), 지역 필터(`selectedRegion`), 선택 병원 id(`selectedHospitalId`), 지도 줌 레벨(`mapLevel`)을 관리한다.
`useHospitalDirectory`가 store를 구독하고, `MapPanel`, `HospitalList`, `HospitalBottomSheet`에는 props로 상태와 핸들러를 내려준다.

---

## core API 기준

`src/core/api/`는 기능별 API 경계만 둔다. 파일을 너무 잘게 쪼개지 않는다.
같은 화면/기능에서 항상 같이 쓰이는 API는 하나의 책임 단위로 묶는다.

```
src/core/api/hospitals/
  hospitalsApi.ts              # 병원 목록, 병원 댓글 조회
  hospitalInteractionsApi.ts   # 찜, 댓글 작성/삭제, 좋아요/싫어요
  hospitalReportsApi.ts        # 병원 제보
```
