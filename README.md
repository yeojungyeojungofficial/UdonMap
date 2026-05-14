# animal-map

특수동물 진료 병원 지도, 병원 후기, 병원 제보, 마이페이지 기능을 제공하는 Next.js 프로젝트입니다.

이 프로젝트는 **Next.js Pages Router** 기준으로 관리합니다. 화면 라우트와 API 라우트는 `src/pages` 아래에 둡니다.

## Documentation

- [src Architecture Guide](./docs/src-architecture.md)

## Getting Started

개발 서버 실행:

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Project Structure

현재 구조는 `src/pages`를 라우팅 진입점으로 사용합니다. 새 기능을 추가하거나 리팩터링할 때는 `docs/src-architecture.md`의 기준을 우선합니다.
