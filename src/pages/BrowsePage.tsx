import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { fetchBrowse, resetAll, useMySheet, type BrowseItem } from '../lib/mySheet';
import { NAMU_FETCHED } from '../data/namu';
import wikiIcon from '../assets/wiki.svg';
import { TopBar } from '../components/TopBar';
import { AccountChip } from '../components/Account';

/** 41.2만 · 4.7만 · 9,800 */
const count = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')}만` : n.toLocaleString();

/**
 * 둘러보기 — 믿을 만한 사람의 카운터픽을 골라 연다.
 *
 * 대부분은 상성을 직접 고치지 않는다. 해설자 · 스트리머가 건 카운터픽을 [열기] 한 번으로
 * 쓰게 하는 것이 이 화면의 일이다. 열리는 주소(?code=)를 북마크하면 그걸로 끝이다.
 */
export function BrowsePage() {
  const sheet = useMySheet();
  const navigate = useNavigate();
  const [data, setData] = useState<{ featured: BrowseItem[]; recent: BrowseItem[] } | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchBrowse().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, []);

  const open = (code: string) => navigate(`/?code=${code}`);
  const recent = data?.recent ?? [];

  return (
    <>
      <TopBar>
        <AccountChip />
      </TopBar>

      <main className="edit browse">
        <div className="bw-now">
          내 추천 기준 · <b>{sheet.source.kind === 'mine' ? '내 상성' : '나무위키'}</b>
          <Link to="/" className="link">
            추천 보러 가기 →
          </Link>
        </div>

        <div className="bw-grid">
          {/* 기본 — 나무위키. 고친 게 없으면 다들 이걸 쓴다. */}
          <article className={'bw-card' + (sheet.source.kind === 'namu' ? ' on' : '')}>
            <div className="bw-top">
              <img className="bw-avatar wiki" src={wikiIcon} alt="" />
              <div className="bw-who">
                <b>나무위키 상성</b>
                <span>기본 · {NAMU_FETCHED.slice(5).split('-').map(Number).join('/')} 기준</span>
              </div>
            </div>
            <p className="bw-blurb">
              나무위키 영웅 문서의 상성 절을 옮긴 것이에요. 나무위키가 바뀌면 같이 바뀌어요.
            </p>
            <div className="bw-foot">
              <span />
              {sheet.source.kind === 'namu' ? (
                <span className="bw-following">✓ 내 기본</span>
              ) : (
                <button
                  type="button"
                  className="reset small"
                  onClick={() => {
                    if (confirm('내 상성을 지우고 나무위키로 돌아갈까요?')) resetAll();
                  }}
                >
                  나무위키로 돌아가기
                </button>
              )}
            </div>
          </article>

          {data?.featured.map((f) => (
            <article key={f.code} className="bw-card">
              <div className="bw-top">
                <span className="bw-avatar" aria-hidden="true">
                  {f.name.slice(-1)}
                </span>
                <div className="bw-who">
                  <b>{f.name}의 카운터픽 추천</b>
                  <span className="mono">{f.code}</span>
                </div>
              </div>
              {f.blurb && <p className="bw-blurb">{f.blurb}</p>}
              <div className="bw-foot">
                <span className="bw-count">
                  ♥ <b>{count(f.likes)}</b>
                </span>
                <button type="button" className="bw-follow" onClick={() => open(f.code)}>
                  열기
                </button>
              </div>
            </article>
          ))}
        </div>

        {!data && <div className="rec-empty">불러오는 중…</div>}

        {recent.length > 0 && (
          <section className="bw-others">
            <h3 className="head">모두의 카운터픽</h3>
            {recent.map((c) => (
              <div key={c.code} className="bw-row">
                <b>{c.name}</b>
                {c.code === sheet.code && <span className="tag">나</span>}
                <span className="mono">{c.code}</span>
                <span className="dim">♥ {count(c.likes)}</span>
                <button type="button" className="reset small" onClick={() => open(c.code)}>
                  열기
                </button>
              </div>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
