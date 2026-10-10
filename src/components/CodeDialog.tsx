import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { CODE_LEN, findCode, normalizeCode, publishCode, useMySheet } from '../lib/mySheet';
import { LoginDialog } from './Account';

/**
 * 상성 코드 창 — 내 코드 · 주소 보기(share) · 남의 코드로 열기(enter).
 *
 * 로그인 창과 같은 껍데기를 쓴다.
 */
export function CodeDialog({ mode, onClose }: { mode: 'share' | 'enter'; onClose: () => void }) {
  const { user, diff, code: myCode } = useMySheet();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [login, setLogin] = useState(false);
  const field = useRef<HTMLInputElement>(null);

  // 열 때마다 지금 상성을 내 코드에 싣는다. 로그인 전이면 코드가 없다.
  useEffect(() => {
    if (mode === 'share' && user) publishCode();
  }, [mode, user]);

  useEffect(() => {
    field.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !login) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, login]);

  // 내 코드는 저장소에서 읽는다 — 처음 열면 publishCode() 가 받아 둔다.
  const code = myCode ?? null;

  /** 내 카운터픽 주소 — 누구나 로그인 없이 바로 연다. */
  const link = code ? `${location.origin}${import.meta.env.BASE_URL}?code=${code}` : '';

  const copy = async (what: 'code' | 'link') => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(what === 'code' ? code : link);
      setCopied(what);
    } catch {
      field.current?.select();
    }
  };

  const use = async () => {
    const hit = await findCode(input);
    if (!hit) {
      setError('없는 코드예요. 글자를 다시 확인해 주세요.');
      return;
    }
    if (normalizeCode(input) === myCode) {
      setError('내 코드예요. 친구 코드를 넣어 주세요.');
      return;
    }
    // 그 사람 카운터픽 주소로 연다 — 내 상성은 그대로다.
    navigate(`/?code=${hit.code}`);
    onClose();
  };

  return (
    <div
      className="sheet-back"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="hero-sheet login" role="dialog" aria-modal="true" aria-label="상성 코드">
        <div className="login-body">
          {mode === 'share' ? (
            !user ? (
              <>
                <h3>내 상성 코드</h3>
                <p>코드는 계정에 붙어요. 로그인하면 고친 상성을 코드 하나로 건넬 수 있어요.</p>
                <button type="button" className="login-btn main" onClick={() => setLogin(true)}>
                  로그인
                </button>
              </>
            ) : (
              <>
                <h3>내 상성 코드</h3>
                <p>
                  주소를 열면 누구나 로그인 없이 내 상성(나무위키와 다른 짝 <b>{diff}</b>)으로 추천을
                  받아요. 내가 더 고치면 다음에 열 때 바로 반영돼요.
                </p>
                <input
                  ref={field}
                  className="code-field"
                  readOnly
                  value={code ?? ''}
                  aria-label="내 상성 코드"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button type="button" className="login-btn main" onClick={() => void copy('link')} disabled={!code}>
                  {copied === 'link' ? '복사했어요' : '내 카운터픽 주소 복사'}
                  <span>{link || '코드를 받는 중…'}</span>
                </button>
                <button type="button" className="login-btn" onClick={() => void copy('code')} disabled={!code}>
                  {copied === 'code' ? '복사했어요' : '코드만 복사'}
                </button>
              </>
            )
          ) : (
            <>
              <h3>상성 코드 입력</h3>
              <p>
                친구 코드를 넣으면 그 사람 카운터픽을 열어요. 내 상성은 그대로예요.
              </p>
              <input
                ref={field}
                className="code-field"
                value={input}
                placeholder="ABC123"
                maxLength={CODE_LEN + 2}
                spellCheck={false}
                autoComplete="off"
                aria-label="상성 코드"
                onChange={(e) => {
                  setInput(normalizeCode(e.target.value));
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && input.length === CODE_LEN) void use();
                }}
              />
              {error && <p className="code-error">{error}</p>}
              <button
                type="button"
                className="login-btn main"
                disabled={input.length !== CODE_LEN}
                onClick={() => void use()}
              >
                이 카운터픽 열기
              </button>
            </>
          )}
          <button type="button" className="reset small" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
      {login && <LoginDialog onClose={() => setLogin(false)} />}
    </div>
  );
}
