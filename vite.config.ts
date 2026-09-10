import { copyFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** GitHub Pages 프로젝트 사이트라 리포 이름이 경로 앞에 붙는다. */
const BASE = '/ow-counterpick/';

/**
 * GitHub Pages 에는 서버 rewrite 이 없다. 모르는 경로에는 404.html 을 내주는데
 * 그게 곧 앱이면 `/ow-counterpick/table` 로 바로 들어와도 화면이 뜬다.
 */
function spaFallback() {
  return {
    name: 'spa-fallback',
    closeBundle() {
      const dist = new URL('./dist/', import.meta.url);
      copyFileSync(new URL('index.html', dist), new URL('404.html', dist));
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [react(), spaFallback()],
});
