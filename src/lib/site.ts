/** 리포 주소와 바깥으로 나가는 링크를 한 곳에 모은다. */
export const REPO = 'woajun/ow-counterpick';
export const REPO_URL = `https://github.com/${REPO}`;

/**
 * 토스 송금 링크. GitHub Pages 약관이 명시적으로 허용하는 수익화가
 * 기부 버튼과 크라우드펀딩 링크다 — 광고는 안 된다.
 *
 * 비워 두면 후원 자리가 화면에 안 뜬다. toss.me 주소를 받으면 여기에 넣을 것.
 */
export const DONATE_URL = '';

/** 상성이 틀렸을 때 이슈를 여는 링크. 양식을 미리 채워서 보낸다. */
export function reportUrl(subject?: string) {
  const body = [
    '### 어느 짝인가요',
    subject ?? '적: (영웅) / 내 픽: (영웅)',
    '',
    '### 지금 값과 맞다고 보시는 값',
    '지금: (예: +2) → 맞다고 보는 값: (예: -1)',
    '',
    '### 왜 그렇게 보시나요',
    '',
  ].join('\n');

  const q = new URLSearchParams({
    labels: '상성',
    title: subject ? `상성 수정: ${subject}` : '상성 수정 제안',
    body,
  });
  return `${REPO_URL}/issues/new?${q}`;
}
