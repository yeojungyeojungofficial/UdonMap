import type { AppProps } from "next/app";
import Head from "next/head";
import "@/src/styles/globals.css";

const SITE_URL = "https://우동맵.com";
const OG_TITLE = "우리동네 동물병원";
const OG_DESCRIPTION = "동물병원 지도, 지역 필터, 후기와 좋아요를 한 화면에서 확인합니다.";
const OG_IMAGE = `${SITE_URL}/intro/intro.png`;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/logo/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo/favicon.png" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={OG_TITLE} />
        <meta property="og:description" content={OG_DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="ko_KR" />

        {/* Twitter / KakaoTalk 공유 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={OG_TITLE} />
        <meta name="twitter:description" content={OG_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
