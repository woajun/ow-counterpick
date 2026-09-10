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

/**
 * 도구 자체에 대한 의견을 남기는 링크.
 *
 * 상성 값이 틀렸다는 제보는 여기가 아니라 나무위키로 간다 — 이 도구는 옮겨
 * 적은 사본이라 여기서 고쳐 봐야 원본은 그대로다. 상성표에서 칸을 짚으면
 * 그 영웅의 원본 문서로 가는 링크가 뜬다.
 */
export function feedbackUrl() {
  const body = [
    '### 무엇이',
    '',
    '### 어디서',
    '추천 화면 / 상성표 중 어디인가요',
    '',
    '(상성 값이 틀렸다는 제보는 나무위키 원본 문서를 고쳐 주세요.',
    ' 상성표에서 칸을 짚으면 그 영웅의 문서로 가는 링크가 뜹니다.)',
    '',
  ].join('\n');

  return `${REPO_URL}/issues/new?${new URLSearchParams({ body })}`;
}
