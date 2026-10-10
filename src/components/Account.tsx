import { useEffect, useRef, useState } from 'react';
import { logout, sendLoginLink, useMySheet } from '../lib/mySheet';

/**
 * 로그인 창 — 이메일로 로그인 링크를 받는다(비밀번호 없음).
 */
export function LoginDialog({ onClose }: { onClose: () => void }) {
  const field = useRef<HTMLInputElement>(null);
  const { source } = useMySheet();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    field.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const send = async () => {
    setBusy(true);
    setError('');
    const err = await sendLoginLink(email.trim());
    setBusy(false);
    if (err) setError(err);
    else setSent(true);
  };

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <div
      className="sheet-back"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="hero-sheet login" role="dialog" aria-modal="true" aria-label="로그인">
        <div className="login-body">
          <h3>내 상성 저장하기</h3>
          {sent ? (
            <p>
              <b>{email.trim()}</b>로 로그인 링크를 보냈어요. 메일의 링크를 누르면 이 사이트로
              돌아와 로그인돼요. 이 창에서 고친 것도 같이 계정으로 옮겨져요.
            </p>
          ) : (
            <>
              <p>
                {source.kind !== 'namu'
                  ? '지금 고친 상성은 이 창에만 있어요. 로그인하면 계정에 남고, 코드로 친구에게 건넬 수 있어요.'
                  : '로그인하면 고친 상성이 계정에 남고, 코드로 친구에게 건넬 수 있어요.'}
              </p>
              <input
                ref={field}
                className="email-field"
                type="email"
                value={email}
                placeholder="이메일"
                autoComplete="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && valid && !busy) void send();
                }}
              />
              {error && <p className="code-error">{error}</p>}
              <button
                type="button"
                className="login-btn main"
                disabled={!valid || busy}
                onClick={() => void send()}
              >
                {busy ? '보내는 중…' : '로그인 링크 받기'}
                <span>비밀번호 없이 메일의 링크로 들어와요</span>
              </button>
            </>
          )}
          <button type="button" className="reset small" onClick={onClose}>
            {sent ? '닫기' : '나중에'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 상단 바 오른쪽 — 로그인 단추나 내 계정. */
export function AccountChip() {
  const { user } = useMySheet();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  if (!user) {
    return (
      <>
        <button type="button" className="reset acct" onClick={() => setOpen(true)}>
          로그인
        </button>
        {open && <LoginDialog onClose={() => setOpen(false)} />}
      </>
    );
  }

  return (
    <div className="acct-wrap">
      <button
        type="button"
        className="reset acct on"
        aria-expanded={menu}
        onClick={() => setMenu((m) => !m)}
      >
        {user.name}
      </button>
      {menu && (
        <div className="acct-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void logout();
              setMenu(false);
            }}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
