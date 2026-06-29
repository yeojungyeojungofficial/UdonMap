# animal-map

Next.js Pages Router 기반 프로젝트입니다. 이 문서는 새로 들어온 사람이 `src` 아래에서 파일을 찾고, 새 코드를 어디에 둘지 빠르게 판단할 수 있게 하기 위한 파일 구조 안내입니다.

## 한 줄 규칙

- `src/pages`: URL 라우트 진입점만 둔다.
- `src/pages/api`: 서버 API Route만 둔다.
- `src/features`: 실제 화면, 도메인 컴포넌트, hook, 모델/검증 로직을 둔다.
- `src/components/common`: 여러 도메인이 공유하는 전역 UI만 둔다.
- `src/core`: Supabase, fetch 래퍼, 서버 공통 유틸처럼 외부 시스템과 맞닿는 코드를 둔다.
- `src/store`: 여러 기능이 동시에 읽는 클라이언트 전역 상태만 둔다.

## 현재 구조

```txt
src/
  pages/                    Next.js 라우트 진입점
    index.tsx               /
    reviews/
      index.tsx             /reviews
      [postId].tsx          /reviews/:postId
    mypage/
      index.tsx             /mypage
      account.tsx           /mypage/account
      activity/             /mypage/activity/*
      policy.tsx            /mypage/policy
      support.tsx           /mypage/support
    support/
      index.tsx             /support
    api/                    서버 API Route

  components/
    common/                 전역 공통 UI

  features/
    home/                   홈 지도 화면 도메인
      pages/
      components/
    reviews/                게시판 도메인
      pages/
      components/
      hooks/
    mypage/                 마이페이지 도메인
      pages/
      components/
      hooks/
    hospitals/              병원 데이터/상호작용 도메인 로직
    auth/                   인증 세션 상태
    mapPopups/              지도 팝업
    images/                 이미지 변환
    responsive/             반응형 hook

  core/                     Supabase, API client, 서버 공통 로직
  constants/                전역 상수
  store/                    Zustand 전역 상태
  styles/                   전역 스타일
```

## `pages`는 왜 얇게 두는가

`src/pages`는 Next.js가 파일 경로를 URL로 해석하는 특수 폴더입니다. 그래서 이 폴더는 “URL 표”처럼 읽히는 것이 좋습니다.

예를 들어 `/reviews` 라우트는 이렇게만 둡니다.

```ts
// src/pages/reviews/index.tsx
export { default } from "@/src/features/reviews/pages/ReviewsPage";
```

실제 화면 구현은 `features/reviews/pages/ReviewsPage`에 있습니다. 이렇게 하면 라우트와 기능 구현이 섞이지 않습니다.

## 새 파일 위치 판단

| 만들 파일 | 위치 |
|---|---|
| 새 URL 페이지 | `src/pages/...`에 얇은 export 파일 + `src/features/<domain>/pages/...` |
| 특정 도메인에서만 쓰는 컴포넌트 | `src/features/<domain>/components/...` |
| 여러 도메인에서 재사용하는 UI | `src/components/common/...` |
| 특정 도메인의 화면 상태/hook | `src/features/<domain>/hooks/...` |
| Supabase/fetch 호출 래퍼 | `src/core/api/...` |
| API Route 서버 코드 | `src/pages/api/...` |
| 전역 클라이언트 상태 | `src/store/...` |
| 타입, 검증, mapper, formatter | 해당 `src/features/<domain>/...` |

## Feature 내부 기준

Feature는 도메인 단위입니다. 예를 들어 리뷰 도메인은 다음처럼 읽습니다.

```txt
src/features/reviews/
  pages/
    ReviewsPage/
    PostDetailPage/
  components/
    PostComposeSheet/
    ReportReasonDialog.tsx
  hooks/
  boardPosts.ts
  constants.ts
  validators.ts
  sanitize.ts
```

`pages`는 화면 단위, `components`는 그 도메인 전용 UI, `hooks`는 상태/동작 조합, 나머지 파일은 모델·검증·변환 로직입니다.

## 웹/모바일 분리 기준

웹과 모바일을 다르게 구현할 수 있는 화면은 feature 내부에서 `web` / `mob` 폴더를 유지합니다.

```txt
src/features/reviews/pages/ReviewsPage/
  index.tsx
  web/
  mob/
```

`index.tsx`는 viewport에 맞는 구현을 고르고, `web`과 `mob`은 각자 JSX와 CSS를 가질 수 있습니다. 단, 제출/업로드/데이터 로딩처럼 양쪽이 공유하는 동작은 hook으로 빼서 중복을 줄입니다.

## Import 방향

권장 흐름은 아래 방향입니다.

```txt
pages -> features -> core
pages -> features -> components/common
features -> components/common
```

피해야 할 흐름:

```txt
components/common -> features
components/common -> core
features/<A> -> features/<B>/pages
```

`components/common`은 전역 공통 UI이므로 특정 도메인을 알면 안 됩니다.

## 더 자세한 기준

세부 아키텍처와 상태관리 기준은 [docs/src-architecture.md](docs/src-architecture.md)를 참고하세요.
