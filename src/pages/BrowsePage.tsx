import { useMemo } from 'react';
import { Link } from 'react-router';
import { FEATURED, NAMU_FOLLOWERS } from '../data/featured';
import { followCode, listCodes, peekCode, resetAll, useMySheet } from '../lib/mySheet';
import { useNavigate } from 'react-router';
import { NAMU_FETCHED } from '../data/namu';
import wikiIcon from '../assets/wiki.svg';
import { TopBar } from '../components/TopBar';
import { AccountChip } from '../components/Account';

/** 41.2만 · 4.7만 · 9,800 */
const fans = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')}만` : n.toLocaleString();

/**
 * 둘러보기 — 믿을 만한 사람의 상성을 골라 따라간다.
 *
 * 대부분은 상성을 직접 고치지 않는다. 해설자 · 스트리머가 건 표를 [따라가기] 한 번으로
 * 쓰게 하는 것이 이 화면의 일이다. 따라가면 그 사람이 고칠 때 같이 바뀐다.
 */
export function BrowsePage() {
  const sheet = useMySheet();
  const following = sheet.link?.code;
  // 추천에 건 것 말고 이 브라우저 장부에 있는 코드 — 서버가 붙으면 "인기 코드"가 된다.
  const others = useMemo(() => {
    const featured = new Set(FEATURED.map((f) => f.code));
    return listCodes()
      .filter((c) => !featured.has(c.code) && c.code !== sheet.code)
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [sheet.code]);

  const navigate = useNavigate();
  /** 따라가지 않고 그 사람 표로 추천을 구경하러 간다. */
  const look = (code: string) => {
    peekCode(code);
    navigate('/');
  };

  const follow = (code: string, owner: string) => {
    if (sheet.source.kind === 'mine' && !confirm(`지금 내 상성을 지우고 ${owner}의 상성을 따라갈까요?`)) return;
    followCode(code);
  };

  return (
    <>
      <TopBar>
        <AccountChip />
      </TopBar>

      <main className="edit browse">
        <div className="bw-now">
          지금 추천 기준 ·{' '}
          {sheet.link ? (
            <b>{sheet.link.owner}</b>
          ) : sheet.source.kind === 'mine' ? (
            <b>내 상성</b>
          ) : (
            <b>나무위키</b>
          )}
          <Link to="/" className="link">
            추천 보러 가기 →
          </Link>
        </div>

        <div className="bw-grid">
          {/* 기본 — 나무위키. 처음엔 다들 이걸 따라간다. */}
          <article
            className={'bw-card' + (sheet.source.kind === 'namu' ? ' on' : '')}
          >
            <div className="bw-top">
              <img className="bw-avatar wiki" src={wikiIcon} alt="" />
              <div className="bw-who">
                <b>나무위키 상성</b>
                <span>
                  기본 · {NAMU_FETCHED.slice(5).split('-').map(Number).join('/')} 기준
                </span>
              </div>
            </div>
            <p className="bw-blurb">
              나무위키 영웅 문서의 상성 절을 옮긴 것이에요. 나무위키가 바뀌면 같이 바뀌어요.
            </p>
            <div className="bw-foot">
              <span className="bw-count">
                따라가는 사람 <b>{fans(NAMU_FOLLOWERS + (sheet.source.kind === 'namu' ? 1 : 0))}</b>명
              </span>
              {sheet.source.kind === 'namu' ? (
                <span className="bw-following">✓ 따라가는 중</span>
              ) : (
                <button
                  type="button"
                  className="bw-follow"
                  onClick={() => {
                    if (sheet.source.kind === 'mine' && !confirm('지금 내 상성을 지우고 나무위키를 따라갈까요?')) return;
                    resetAll();
                  }}
                >
                  따라가기
                </button>
              )}
            </div>
          </article>

          {FEATURED.map((f) => {
            const on = following === f.code;
            return (
              <article
                key={f.code}
                className={'bw-card' + (on ? ' on' : '')}
              >
                <div className="bw-top">
                  <span className="bw-avatar" aria-hidden="true">
                    {f.name.slice(-1)}
                  </span>
                  <div className="bw-who">
                    <b>{f.name}의 카운터픽 추천</b>
                    <span>
                      구독자 {fans(f.fans)} ·{' '}
                      <span className="mono">{f.code}</span>
                    </span>
                  </div>
                </div>
                <p className="bw-blurb">{f.blurb}</p>

                <div className="bw-foot">
                  <span className="bw-count">
                    따라가는 사람 <b>{fans(f.followers + (on ? 1 : 0))}</b>명
                  </span>
                  {on ? (
                    <span className="bw-following">✓ 따라가는 중</span>
                  ) : (
                    <span className="bw-btns">
                      <button type="button" className="reset small" onClick={() => look(f.code)}>
                        둘러보기
                      </button>
                      <button type="button" className="bw-follow" onClick={() => follow(f.code, f.name)}>
                        따라가기
                      </button>
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {others.length > 0 && (
          <section className="bw-others">
            <h3 className="head">모두의 코드</h3>
            {others.map((c) => (
              <div key={c.code} className="bw-row">
                <b>{c.owner}</b>
                <span className="mono">{c.code}</span>
                {following === c.code ? (
                  <span className="bw-following">✓ 따라가는 중</span>
                ) : (
                  <span className="bw-btns">
                    <button type="button" className="reset small" onClick={() => look(c.code)}>
                      둘러보기
                    </button>
                    <button type="button" className="reset small" onClick={() => follow(c.code, c.owner)}>
                      따라가기
                    </button>
                  </span>
                )}
              </div>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
