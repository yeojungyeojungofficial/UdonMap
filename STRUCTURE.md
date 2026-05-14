# 프로젝트 디렉토리 구조

## 책임 분리 원칙

| 레이어 | 경로 | 역할 |
|--------|------|------|
| **pages** | `src/pages/` | 라우트 진입점. 페이지 상태 관리 + UI 조립 |
| **components** | `src/components/` | 도메인별 UI 컴포넌트 + CSS Module |
| **features** | `src/features/` | 상태 훅, 타입, 포맷터, 도메인 로직 |
| **core/api** | `src/core/api/` | Supabase / fetch 호출 전용 API 함수 |
| **shared** | `src/shared/` | 여러 도메인에서 공유하는 컴포넌트·유틸 |
| **constants** | `src/constants/` | 앱 전역 상수 |

---

## 전체 구조

```
src/
├── pages/                        # Next.js 라우트 진입점
│   ├── _app.tsx
│   ├── index.tsx                 # 홈 (병원 지도)
│   ├── mypage.tsx                # 마이페이지
│   ├── support.tsx               # 후원하기
│   ├── reviews/
│   │   ├── index.tsx             # 후기 게시판 목록
│   │   └── [postId].tsx          # 게시글 상세
│   └── api/                      # Next.js API Routes
│       ├── board-posts.ts
│       ├── board-posts/[postId].ts
│       ├── board-posts/[postId]/comments.ts
│       ├── hospital-reports.ts
│       ├── hospitals/[hospitalId]/comments.ts
│       ├── hospitals/[hospitalId]/reaction.ts
│       ├── hospitals/[hospitalId]/comments/[commentId]/reaction.ts
│       └── me/
│           ├── activity.ts
│           └── profile.ts
│
├── components/                   # 도메인별 UI 컴포넌트
│   ├── home/                     # 홈(병원 지도) 전용
│   │   ├── Home.module.css
│   │   ├── HospitalBottomSheet.tsx
│   │   ├── HospitalList.tsx
│   │   ├── MapPanel.tsx
│   │   └── RegionFilter.tsx
│   ├── reviews/                  # 후기 게시판 전용
│   │   ├── PostComposeSheet.tsx
│   │   ├── PostComposeSheet.module.css
│   │   ├── ReviewsPage.module.css
│   │   └── PostDetailPage.module.css
│   ├── mypage/                   # 마이페이지 전용
│   │   ├── ActivitySheet.tsx
│   │   ├── AuthDialog.tsx
│   │   ├── BookmarkSheet.tsx
│   │   └── MyPage.module.css
│   └── support/                  # 후원 페이지 전용
│       └── SupportPage.module.css
│
├── features/                     # 도메인 로직 (훅·타입·포맷터)
│   ├── hospitals/                # 병원 도메인 로직
│   │   ├── types.ts
│   │   ├── bookmarkErrors.ts
│   │   ├── comments.ts
│   │   ├── reactions.ts
│   │   └── reports.ts
│   ├── reviews/                  # 후기 게시판 도메인 로직
│   │   ├── boardPosts.ts
│   │   ├── constants.ts
│   │   ├── mappers.ts
│   │   ├── postComposeConfig.ts
│   │   ├── sanitize.ts
│   │   ├── types.ts
│   │   ├── validators.ts
│   │   └── hooks/
│   │       ├── usePostComposeEditor.ts
│   │       ├── usePostComposeSubmit.ts
│   │       └── usePostImageUpload.ts
│   └── mypage/                   # 마이페이지 도메인 로직
│       ├── activityLabels.ts
│       ├── authRedirect.ts
│       ├── formatters.ts
│       ├── types.ts
│       └── hooks/
│           ├── useBookmarkedHospitals.ts
│           ├── useMyActivity.ts
│           └── useProfileEditor.ts
│
├── core/
│   └── api/                      # API 호출 함수 전용
│       ├── hospitals/
│       │   ├── hospitalsApi.ts
│       │   ├── bookmarkApi.ts
│       │   ├── commentApi.ts
│       │   └── reactionApi.ts
│       ├── reviews/
│       │   └── boardPostsApi.ts
│       └── mypage/
│           ├── activityApi.ts
│           ├── bookmarksApi.ts
│           └── profileApi.ts
│
├── shared/                       # 도메인 무관 공유 자원
│   ├── components/
│   │   ├── CommonFooter.tsx
│   │   ├── HospitalReportSheet.tsx
│   │   ├── LoadingScreen.tsx
│   │   └── TopNav.tsx
│   └── lib/
│       ├── apiRequest.ts
│       ├── authSession.ts
│       ├── database.types.ts
│       ├── supabase.ts
│       ├── supabaseServer.ts
│       ├── suspensions.ts
│       └── userProfiles.ts
│
├── constants/
│   └── regions.ts
│
└── styles/
    └── globals.css
```

---

## 레이어별 의존 방향

```
pages  →  components  →  features  →  core/api
  ↓            ↓              ↓
shared       shared         shared
```

- `pages`는 `components`, `features`, `core/api`, `shared` 모두 import 가능
- `components`는 `features`, `shared` import 가능 (다른 components 간 직접 참조 지양)
- `features`는 `core/api`, `shared` import 가능
- `core/api`는 `features`의 타입, `shared/lib` import 가능
- `shared`는 외부 의존 없음

---

## 규칙 요약

1. **feature 안에 UI 컴포넌트 금지** — `features/*/components/` 폴더를 두지 않는다
2. **API 호출은 `core/api/`** — `features/`나 `components/`에서 직접 Supabase/fetch 호출 금지
3. **페이지 진입점은 `pages/`** — 라우팅과 상태 조립은 pages에서 담당
4. **공유 자원은 `shared/`** — 도메인이 없는 범용 컴포넌트·유틸은 shared
