# src 구조 및 상태관리 기준

> Next.js Pages Router 기반. 새 파일을 만들기 전에 이 문서를 먼저 확인한다.

## 목표

이 프로젝트의 구조 목표는 단순합니다.

```txt
pages      URL 라우트
features   실제 기능 구현
common     전역 공통 UI
core       외부 시스템 경계
store      전역 클라이언트 상태
```

`components`에 페이지와 도메인 UI가 뒤섞이면 사람이 구조를 읽기 어렵다. 그래서 도메인별 화면과 도메인 전용 컴포넌트는 `features/<domain>` 안에 둔다.

## 빠른 판단표

| 새 코드가 하는 일 | 위치 |
|---|---|
| URL을 만든다 | `src/pages/...` |
| API Route를 만든다 | `src/pages/api/...` |
| 페이지 화면을 그린다 | `src/features/<domain>/pages/...` |
| 특정 도메인에서만 쓰는 UI를 만든다 | `src/features/<domain>/components/...` |
| 여러 도메인이 공유하는 UI를 만든다 | `src/components/common/...` |
| 화면 동작, 데이터 로딩, 상태를 조합한다 | `src/features/<domain>/hooks/...` |
| Supabase, fetch, auth token을 직접 다룬다 | `src/core/...` |
| 여러 기능이 공유하는 클라이언트 상태를 둔다 | `src/store/...` |
| 한 컴포넌트 안에서만 쓰는 입력값/메시지를 둔다 | local `useState` |

## 최상위 폴더 책임

### `src/pages`

Next.js Pages Router가 URL로 해석하는 폴더다. 사람이 봤을 때 “라우트 목록”처럼 읽혀야 한다.

```txt
src/pages/
  index.tsx
  reviews/
    index.tsx
    [postId].tsx
  mypage/
    index.tsx
    account.tsx
    activity/
    policy.tsx
    support.tsx
  support/
    index.tsx
  api/
```

일반 화면 라우트 파일은 얇게 유지한다.

```ts
export { default } from "@/src/features/reviews/pages/ReviewsPage";
```

비즈니스 로직, 화면 상태, JSX가 길어지는 구현은 `features/<domain>/pages`로 옮긴다.

### `src/pages/api`

서버 API Route만 둔다. 이 폴더는 Next.js 라우팅 규칙 때문에 `features`로 옮기지 않는다.

하위 라우트가 있는 API는 폴더형 구조를 선호한다.

```txt
src/pages/api/board-posts/
  index.ts                    /api/board-posts
  [postId]/
    index.ts                  /api/board-posts/:postId
    comments/
      index.ts                /api/board-posts/:postId/comments
```

API Route는 서버 컨텍스트이므로 `src/core`를 직접 import해도 된다.

### `src/features`

도메인별 실제 구현을 둔다.

```txt
src/features/
  home/
  reviews/
  mypage/
  support/
  hospitals/
  auth/
  mapPopups/
  images/
  responsive/
```

도메인 내부 기본 구조는 아래를 따른다.

```txt
src/features/<domain>/
  pages/          페이지 단위 화면
  components/     해당 도메인 전용 UI
  hooks/          상태/동작 조합
  *.ts            타입, mapper, validator, formatter, config
```

모든 feature가 모든 폴더를 가질 필요는 없다. 필요할 때만 만든다.

### `src/components/common`

전역 공통 UI만 둔다.

예시:

```txt
AppToast
CommonFooter
FilterChipGroup
HospitalReportSheet
LoadingScreen
MapPopupModal
TopNav
```

`components/common`은 특정 도메인 지식을 가지면 안 된다. 예를 들어 `reviews`, `mypage`, `hospitals` 전용 타입이나 hook을 import하지 않는다.

### `src/core`

외부 시스템과 닿는 경계다.

```txt
src/core/
  api/
  authSession.ts
  supabase.ts
  supabaseServer.ts
  apiRequest.ts
  rateLimit.ts
  userProfiles.ts
```

규칙:

- `pages/api`는 `core`를 직접 import할 수 있다.
- feature hook/API 래퍼는 `core`를 import할 수 있다.
- UI 컴포넌트는 가능한 한 `core`를 직접 import하지 않는다.

### `src/store`

Zustand 전역 상태를 둔다. 여러 기능이 동시에 읽고, 라우트 이동 후에도 유지되는 클라이언트 상태만 올린다.

현재 store:

```txt
authStore.ts          로그인 세션, 현재 유저, 인증 준비 여부
hospitalMapStore.ts   홈 지도 검색어, 지역 필터, 선택 병원, 지도 레벨
```

store에 두지 않는 것:

- 폼 입력 임시값
- 모달 내부 에러/로딩 메시지
- 서버 데이터 전체 캐시
- API Route 내부 서버 상태

## 현재 feature 구조

### `features/home`

홈 지도 화면 도메인.

```txt
features/home/
  pages/HomePage/
    index.tsx
    web/
    mob/
  components/
    HospitalBottomSheet.tsx
    HospitalList.tsx
    MapPanel.tsx
    RegionFilter.tsx
    Home.module.css
```

### `features/reviews`

게시판 도메인.

```txt
features/reviews/
  pages/
    ReviewsPage/
    PostDetailPage/
  components/
    PostComposeSheet/
    ReportReasonDialog.tsx
  hooks/
  boardPosts.ts
  comments.ts
  constants.ts
  mappers.ts
  postComposeConfig.ts
  reportReasons.ts
  sanitize.ts
  validators.ts
```

`PostComposeSheet`는 웹/모바일 UI를 분리하되, 공통 상태와 제출/업로드 동작은 `usePostComposeSheetController.ts`에서 공유한다.

### `features/mypage`

마이페이지 도메인.

```txt
features/mypage/
  pages/
    MyPage/
    AccountPage.tsx
    PolicyPage.tsx
    MyPageSupportPage.tsx
    activity/
  components/
    AccountAuthInline.tsx
    ActivitySheet.tsx
    AuthDialog.tsx
    BookmarkSheet.tsx
    MyPageBackLink/
    PrivacyPolicyContent.tsx
    PrivacyPolicyDialog.tsx
  hooks/
  formatters.ts
  privacyPolicy.ts
  types.ts
```

### `features/support`

지원/문의 화면 도메인.

```txt
features/support/
  pages/SupportPage/
    index.tsx
    web/
    mob/
```

### `features/hospitals`

병원 데이터와 병원 관련 상호작용 로직.

홈 화면에서 많이 쓰지만, 병원 댓글/반응/제보 등 여러 기능과 연결되므로 `home`이 아니라 별도 도메인으로 둔다.

### `features/auth`

전역 인증 세션 상태를 앱에 연결하는 hook과 bootstrap 컴포넌트.

### `features/responsive`

반응형 판단 hook. 현재 `useIsMobile`을 둔다.

## 웹/모바일 분기 기준

뷰포트 너비가 `MOBILE_BREAKPOINT` 이하이면 모바일 트랙, 초과이면 웹 트랙이다.

반응형 숫자는 `src/constants/responsive-values.json`에만 둔다.

TS에서는:

```ts
import { MOBILE_BREAKPOINT } from "@/src/constants/responsive";
```

CSS Modules에서는 PostCSS 미디어 토큰을 사용한다.

```css
@media --mobile {
}

@media --desktop {
}
```

웹과 모바일 화면이 크게 다르면 아래 구조를 유지한다.

```txt
SomePage/
  index.tsx      web/mob 선택
  web/
  mob/
```

웹/모바일이 다르게 발전할 수 있는 JSX는 합치지 않는다. 대신 데이터 로딩, 제출, 업로드, 선택 상태처럼 양쪽이 공유하는 동작만 hook으로 분리한다.

## Import 방향

권장 방향:

```txt
pages -> features
features -> core
features -> components/common
features/<domain>/pages -> features/<domain>/components
```

금지 또는 지양:

```txt
components/common -> features
components/common -> core
features/<A>/pages -> features/<B>/pages
```

도메인 간 공유가 필요하면 다음 중 하나로 옮긴다.

- 진짜 전역 UI면 `components/common`
- 도메인 모델이면 관련 `features/<domain>`
- 외부 시스템 경계면 `core`

## 상태관리 기준

### local state

컴포넌트 생명주기에 묶인 값은 local state를 쓴다.

- input 값
- 모달 열림/닫힘
- 에러 메시지
- 제출 중 플래그

### feature hook

페이지나 컴포넌트 여러 개가 함께 쓰는 동작 조합은 feature hook으로 뺀다.

- API 호출 후 화면 상태 구성
- auth/session 확인
- 업로드/삭제 라이프사이클
- web/mob 공통 컨트롤러

### Zustand store

앱의 여러 도메인이 동시에 읽거나 라우트 이동 후 유지되어야 하는 상태만 둔다.

서버 데이터 캐싱이 커지면 Zustand가 아니라 React Query 같은 서버 상태 도구 도입을 검토한다.

## 새 코드 추가 체크리스트

1. URL이 필요한가? `src/pages`에 얇은 라우트 파일을 만든다.
2. 특정 도메인 화면인가? `src/features/<domain>/pages`에 둔다.
3. 특정 도메인 전용 UI인가? `src/features/<domain>/components`에 둔다.
4. 여러 도메인이 공유하는 순수 UI인가? `src/components/common`에 둔다.
5. Supabase/fetch/auth token을 직접 만지는가? `src/core` 또는 feature hook/API 래퍼에 둔다.
6. 웹/모바일이 앞으로 달라질 가능성이 큰가? JSX는 `web`/`mob`로 분리하고 동작만 hook으로 공유한다.
