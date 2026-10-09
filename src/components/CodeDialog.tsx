import { useEffect, useRef, useState } from 'react';
import {
  CODE_LEN,
  findCode,
  followCode,
  normalizeCode,
  diffCount,
  publishCode,
  useMySheet,
} from '../lib/mySheet';
import { LoginDialog } from './Account';

/**
 * 상성 코드 창 — 내 코드 보기(share) · 남의 코드 넣기(enter).
 *
 * 로그인 창과 같은 껍데기를 쓴다.
 */
export function CodeDialog({ mode, onClose }: { mode: 'share' | 'enter'; onClose: () => void }) {
  const { user, source, diff, code: myCode } = useMySheet();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [login, setLogin] = useState(false);
  const field = useRef<HTMLInputElement>(null);

  // 열 때마다 지금 상성을 내 코드에 싣는다. 로그인 전이면 코드가 없다.
  useEffect(() => {
    if (mode === 'share' && user) setCode(publishCode());
  }, [mode, user]);

  useEffect(() => {
    field.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !login) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, login]);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      field.current?.select();
    }
  };

  const use = () => {
    const hit = findCode(input);
    if (!hit) {
      setError('없는 코드예요. 글자를 다시 확인해 주세요.');
      return;
    }
    if (normalizeCode(input) === myCode) {
      setError('내 코드예요. 친구 코드를 넣어 주세요.');
      return;
    }
    const n = diffCount(hit.sheet);
    if (
      source.kind === 'mine' &&
      !confirm(`지금 내 상성을 지우고 ${hit.owner}의 상성(나무위키와 다른 짝 ${n})을 따라갈까요?`)
    )
      return;
    followCode(input);
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
                <button type="button" className="login-btn bnet" onClick={() => setLogin(true)}>
                  로그인
                </button>
              </>
            ) : (
              <>
                <h3>내 상성 코드</h3>
                <p>
                  친구가 [코드 입력]에 넣으면 내 상성(나무위키와 다른 짝 <b>{diff}</b>)을 따라와요. 내가 더 고치면
                  친구 쪽도 자동으로 바뀌어요.
                </p>
                <input
                  ref={field}
                  className="code-field"
                  readOnly
                  value={code ?? ''}
                  aria-label="내 상성 코드"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button type="button" className="login-btn bnet" onClick={copy} disabled={!code}>
                  {copied ? '복사했어요' : '코드 복사'}
                </button>
              </>
            )
          ) : (
            <>
              <h3>상성 코드 입력</h3>
              <p>
                친구 코드를 넣으면 그 사람의 상성을 따라가요. 그 사람이 고치면 나도 자동으로 바뀌고,
                내가 한 칸이라도 고치면 연결이 끊겨요.
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
                  if (e.key === 'Enter' && input.length === CODE_LEN) use();
                }}
              />
              {error && <p className="code-error">{error}</p>}
              <button
                type="button"
                className="login-btn bnet"
                disabled={input.length !== CODE_LEN}
                onClick={use}
              >
                이 상성 따라가기
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
