import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * 방문자 세기 — 구글 애널리틱스(GA4).
 *
 * 측정 ID 는 analytics.google.com → 관리 → 데이터 스트림 에서 본다. 공개돼도 되는
 * 값이라 코드에 그대로 둔다. 비어 있으면 아무것도 안 한다.
 */
const MEASUREMENT_ID = '';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** 배포된 사이트에서만 센다. 개발 서버와 미리보기는 숫자를 흐린다. */
const enabled =
  MEASUREMENT_ID !== '' &&
  import.meta.env.PROD &&
  !/^(localhost|127\.|\[::1\])/.test(location.hostname);

let ready = false;

function load() {
  if (ready) return;
  ready = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer ?? [];
  // gtag 는 arguments 객체를 그대로 넣어야 한다 — 배열로 바꾸면 무시된다.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  // 첫 화면도 아래에서 직접 센다 — 자동으로 한 번 더 세지 않게.
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false });
}

/**
 * 화면이 바뀔 때마다 한 번 센다. 한 페이지 앱이라 주소가 바뀌어도 새로 불러오지
 * 않으니 직접 알려 줘야 한다.
 */
export function usePageView() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!enabled) return;
    load();
    window.gtag?.('event', 'page_view', {
      page_path: pathname,
      page_location: location.href,
      page_title: document.title,
    });
  }, [pathname]);
}
