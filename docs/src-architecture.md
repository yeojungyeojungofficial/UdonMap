# src Architecture Guide

이 문서는 animal-map 프로젝트의 `src/` 폴더 구조 기준을 정의합니다. 기준은 **Next.js Pages Router**입니다. Pages Router에서는 `src/pages` 안의 파일 경로가 URL 라우트가 됩니다.

## 현재 진단

현재 프로젝트는 `src/pages`를 라우팅 진입점으로 얇게 두고, `home`, `reviews`, `mypage`, `support`, `shared`로 화면과 공통 코드를 나눈 상태입니다. 큰 방향은 나쁘지 않지만, 아래 지점은 앞으로 구조를 정리해야 합니다.

- `src/shared/lib/hospitalComments.ts`, `src/shared/lib/reactions.ts`가 `src/home/types.ts`를 import합니다. `shared`가 feature인 `home`에 의존하고 있어 의존 방향이 깨져 있습니다.
- `src/reviews/ReviewsPage.tsx`, `src/reviews/PostComposeSheet.tsx`가 `src/home/regions.ts`, `src/home/types.ts`를 import합니다. 지역/반응/병원 타입은 `home` 소유가 아니라 공통 도메인 또는 feature 타입으로 분리되어야 합니다.
- `tsconfig.json`의 path alias가 `@/* -> ./*`라서 import가 `@/src/...` 형태입니다. `src` 기준 alias로 바꾸면 `@/features/...`, `@/components/...`처럼 더 명확해집니다.
- `src/mypage/MyPage.tsx`, `src/home/components/HospitalBottomSheet.tsx`, `src/reviews/PostComposeSheet.tsx`, `src/home/Home.module.css`는 한 파일에 너무 많은 책임이 있습니다. 기능 추가 시 충돌과 회귀 위험이 큽니다.

## 목표 구조

처음부터 과하게 쪼개지 않고, 다음 구조를 기준으로 확장합니다.

```bash
src/
  pages/
  components/
  features/
  lib/
  hooks/
  stores/
  types/
  constants/
  styles/
```

animal-map 기준 예시는 아래와 같습니다.

```bash
src/
  pages/
    _app.tsx
    _document.tsx
    index.tsx

    hospitals/
      index.tsx
      [id].tsx

    reviews/
      index.tsx
      write.tsx
      [id].tsx

    support/
      index.tsx

    mypage/
      index.tsx

    api/
      hospitals/
        [id]/
          comments.ts
          reaction.ts
      reviews/
        index.ts
        [id].ts
      me/
        profile.ts
        activity.ts

  components/
    common/
      Button.tsx
      Input.tsx
      Modal.tsx
      LoadingScreen.tsx

    layout/
      MainLayout.tsx
      Header.tsx
      Footer.tsx

  features/
    auth/
      api.ts
      hooks.ts
      types.ts

    hospitals/
      api.ts
      hooks.ts
      types.ts
      constants.ts
      components/
        HospitalCard.tsx
        HospitalList.tsx
        HospitalSearchBar.tsx
        HospitalBottomSheet.tsx
        MapPanel.tsx

    reviews/
      api.ts
      hooks.ts
      types.ts
      constants.ts
      components/
        ReviewCard.tsx
        ReviewForm.tsx
        PostComposeSheet.tsx

    reports/
      api.ts
      hooks.ts
      types.ts
      components/
        HospitalReportSheet.tsx

    mypage/
      api.ts
      hooks.ts
      types.ts
      components/
        ProfilePanel.tsx
        BookmarkSheet.tsx
        ActivitySheet.tsx

  lib/
    supabase.ts
    supabaseServer.ts
    apiRequest.ts

  hooks/
    useModal.ts
    useDebounce.ts

  stores/
    authStore.ts

  types/
    common.ts
    user.ts

  constants/
    routes.ts
    regions.ts

  styles/
    globals.css
```

## 라우팅 규칙

`pages/`는 URL로 접근 가능한 화면과 API Route만 둡니다. 페이지 파일은 가능한 한 얇게 유지합니다.

```bash
src/pages/index.tsx              -> /
src/pages/hospitals/index.tsx    -> /hospitals
src/pages/hospitals/[id].tsx     -> /hospitals/123
src/pages/reviews/index.tsx      -> /reviews
src/pages/reviews/write.tsx      -> /reviews/write
src/pages/reviews/[id].tsx       -> /reviews/123
src/pages/support/index.tsx      -> /support
src/pages/mypage/index.tsx       -> /mypage
```

페이지 파일은 아래처럼 feature의 page component를 export하는 정도로 유지합니다.

```tsx
import HospitalsPage from "@/features/hospitals/components/HospitalsPage";

export default HospitalsPage;
```

## 폴더 역할

### pages

라우팅만 담당합니다. URL로 접근 가능한 화면 파일과 `pages/api` Route Handler만 둡니다.

좋은 예:

```bash
src/pages/reviews/index.tsx
src/pages/reviews/[id].tsx
src/pages/api/reviews/index.ts
```

피해야 할 예:

```bash
src/pages/reviews/ReviewCard.tsx
src/pages/reviews/reviewApi.ts
src/pages/reviews/reviewTypes.ts
```

### components

여러 feature에서 재사용되는 UI만 둡니다. 특정 도메인 지식이 강한 컴포넌트는 `features/*/components` 안에 둡니다.

좋은 예:

```bash
src/components/common/Button.tsx
src/components/common/Input.tsx
src/components/layout/MainLayout.tsx
```

피해야 할 예:

```bash
src/components/HospitalBottomSheet.tsx
src/components/ReviewForm.tsx
```

위 파일들은 병원/리뷰 도메인에 강하게 묶여 있으므로 feature 내부가 더 적합합니다.

### features

기능 단위 코드를 둡니다. API 호출, 훅, 타입, feature 전용 컴포넌트를 한 곳에 모읍니다.

```bash
src/features/hospitals/
  api.ts
  hooks.ts
  types.ts
  constants.ts
  components/
```

feature 간 직접 import는 피합니다.

좋지 않은 예:

```tsx
import { REGION_FILTERS } from "@/features/hospitals/constants";
```

위 코드를 `reviews`에서 사용해야 한다면 `REGION_FILTERS`는 `src/constants/regions.ts`로 올립니다.

### lib

외부 라이브러리 설정과 범용 유틸만 둡니다.

좋은 예:

```bash
src/lib/supabase.ts
src/lib/supabaseServer.ts
src/lib/apiRequest.ts
```

피해야 할 예:

```bash
src/lib/boardPosts.ts
src/lib/hospitalComments.ts
```

게시글, 병원 댓글처럼 도메인 의미가 강한 코드는 `features/reviews`, `features/hospitals`, 또는 공통 도메인 타입으로 옮깁니다.

### hooks

여러 feature에서 쓰는 범용 hook만 둡니다. 특정 feature 전용 hook은 `features/*/hooks.ts`에 둡니다.

좋은 예:

```bash
src/hooks/useModal.ts
src/hooks/useDebounce.ts
```

### stores

전역 상태 관리 파일을 둡니다. Zustand 등을 도입할 때 사용합니다. feature 내부 상태로 충분하면 store로 올리지 않습니다.

### types

전역에서 쓰는 타입만 둡니다. 특정 feature 타입은 해당 feature의 `types.ts`에 둡니다.

좋은 예:

```bash
src/types/common.ts
src/types/user.ts
```

피해야 할 예:

```bash
src/types/hospital.ts
```

단, 병원 타입이 여러 feature에서 모두 쓰이는 핵심 도메인이라면 `src/features/hospitals/types.ts`를 공용 진실 공급원으로 삼거나, 별도 `src/domain/hospitals/types.ts` 계층을 둡니다.

### constants

라우트 경로, 지역 목록, 고정 옵션값처럼 여러 곳에서 쓰는 상수를 둡니다.

```bash
src/constants/routes.ts
src/constants/regions.ts
```

## 의존 방향 규칙

아래 방향으로만 import합니다.

```bash
pages -> features -> components/common
pages -> features -> lib
features -> components/common
features -> hooks
features -> types
features -> constants
features -> lib
```

금지할 방향은 아래와 같습니다.

```bash
shared/lib -> features/*
components/common -> features/*
features/reviews -> features/hospitals
features/mypage -> features/reviews
```

feature 간 공유가 필요하면 `constants`, `types`, `components/common`, 또는 별도 도메인 계층으로 올립니다.

## API Route 규칙

`pages/api`는 HTTP 경계만 담당합니다.

담당해야 하는 것:

- method 검사
- query/body 파싱
- 인증 토큰 확인
- feature API/service 호출
- HTTP status와 response 반환

담당하지 않아야 하는 것:

- 긴 Supabase query 조합
- 응답 DTO 매핑 전체
- 도메인 validation 전체
- 여러 테이블을 조합하는 비즈니스 로직

예시:

```tsx
// src/pages/api/reviews/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createReview, listReviews } from "@/features/reviews/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const reviews = await listReviews(req.query);
    res.status(200).json({ reviews });
    return;
  }

  if (req.method === "POST") {
    const review = await createReview(req.body, req.headers.authorization);
    res.status(201).json({ review });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "GET, POST 요청만 지원합니다." });
}
```

## Path Alias 기준

현재는 `@/src/...` 형태를 사용하고 있지만, 목표 구조에서는 `src` 기준 alias를 권장합니다.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

이후 import는 아래처럼 씁니다.

```tsx
import TopNav from "@/components/layout/Header";
import { REGION_FILTERS } from "@/constants/regions";
import { fetchHospitals } from "@/features/hospitals/api";
```

## 리팩터링 순서

한 번에 전체 구조를 바꾸지 말고, 아래 순서로 진행합니다.

1. `src/constants/regions.ts`, `src/constants/routes.ts`를 만들고 지역/라우트 상수를 이동합니다.
2. `src/features/hospitals/types.ts`를 만들고 `src/home/types.ts`의 병원 관련 타입을 이동합니다.
3. `shared/lib`가 `home`을 import하는 문제를 제거합니다.
4. `home`, `reviews`, `mypage`, `support` 폴더를 `features/*` 아래로 이동합니다.
5. `shared/components` 중 진짜 공통 UI는 `components/common` 또는 `components/layout`으로 이동합니다.
6. `HospitalReportSheet`처럼 특정 기능에 가까운 컴포넌트는 `features/reports/components`로 이동합니다.
7. 큰 파일을 책임 단위로 분리합니다.
8. `tsconfig.json` alias를 `@/* -> src/*`로 정리하고 import를 갱신합니다.

## 큰 파일 분리 기준

아래 기준 중 하나라도 해당하면 분리합니다.

- 파일이 300줄을 넘는다.
- React state가 8개 이상이다.
- API 호출, validation, UI rendering이 한 컴포넌트에 같이 있다.
- modal/sheet/list/form이 한 파일에 동시에 있다.
- CSS Module이 400줄을 넘거나 여러 컴포넌트가 한 CSS Module을 공유한다.

현재 우선 분리 대상:

- `src/mypage/MyPage.tsx`
- `src/home/components/HospitalBottomSheet.tsx`
- `src/reviews/PostComposeSheet.tsx`
- `src/shared/components/HospitalReportSheet.tsx`
- `src/home/Home.module.css`

## 최종 원칙

핵심은 단순합니다.

- `pages`는 라우팅만 담당합니다.
- `features`는 기능별 로직과 feature 전용 UI를 담당합니다.
- `components`는 여러 기능에서 재사용 가능한 순수 UI만 담당합니다.
- `lib`는 외부 라이브러리 설정과 범용 유틸만 담당합니다.
- 특정 feature가 다른 feature를 직접 import하기 시작하면 구조가 무너지는 신호입니다.
