import { useEffect, useState } from 'react';
import { DONATE_URL, REPO, REPO_URL, reportUrl } from '../lib/site';

/**
 * 스타 수를 곁들인 바깥 링크 묶음.
 *
 * 수를 못 받아 와도(요청 제한, 오프라인) 링크는 그대로 남는다 — 숫자 하나
 * 때문에 눌리는 자리가 없어지면 안 된다.
 */
export function SiteLinks() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    const stop = new AbortController();
    fetch(`https://api.github.com/repos/${REPO}`, { signal: stop.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (typeof d?.stargazers_count === 'number') setStars(d.stargazers_count);
      })
      .catch(() => {
        /* 못 받아 오면 숫자만 빠진다 */
      });
    return () => stop.abort();
  }, []);

  return (
    <div className="links">
      <a className="link star" href={REPO_URL} target="_blank" rel="noreferrer">
        <span aria-hidden="true">★</span> GitHub
        {stars !== null && <b>{stars}</b>}
      </a>

      <a className="link" href={reportUrl()} target="_blank" rel="noreferrer">
        <span aria-hidden="true">✎</span> 상성이 틀렸어요
      </a>

      {DONATE_URL && (
        <a
          className="link donate"
          href={DONATE_URL}
          target="_blank"
          rel="noreferrer"
        >
          <span aria-hidden="true">♡</span> 후원하기
        </a>
      )}
    </div>
  );
}
