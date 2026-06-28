import type { AppProps } from "next/app";
import Head from "next/head";
import { AppToastProvider } from "@/src/components/common/AppToast";
import MapPopupModal from "@/src/components/common/MapPopupModal";
import AuthSessionBootstrap from "@/src/features/auth/AuthSessionBootstrap";
import "@/src/styles/globals.css";

const SITE_URL = "https://www.xn--2q1bx9ikpm.com";
const SITE_NAME = "우동맵";
const OG_TITLE = "우동맵 | 우리동네 동물병원 지도";
const OG_DESCRIPTION =
  "우동맵에서 특수동물 진료 병원, 동물병원 지도, 지역 필터, 후기와 좋아요를 한 화면에서 확인합니다.";
const OG_IMAGE = `${SITE_URL}/intro/og-image.png`;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>{OG_TITLE}</title>
        <meta name="description" content={OG_DESCRIPTION} />
        <meta
          name="keywords"
          content="우동맵, 우리동네 동물병원, 동물병원 지도, 특수동물 병원, 특수동물 진료"
        />
        <link rel="canonical" href={SITE_URL} />

        <link rel="icon" href="/logo/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo/favicon.png" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={OG_TITLE} />
        <meta property="og:description" content={OG_DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:secure_url" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content="ko_KR" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={OG_TITLE} />
        <meta name="twitter:description" content={OG_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Head>

      <AppToastProvider>
        <AuthSessionBootstrap />
        <Component {...pageProps} />
        <MapPopupModal />
      </AppToastProvider>
    </>
  );
}
