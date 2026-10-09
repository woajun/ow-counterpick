import { useEffect, useRef, useState } from 'react';
import { login, logout, useMySheet } from '../lib/mySheet';

/**
 * 로그인 창 — 목업. 단추를 누르면 바로 로그인된 것으로 친다.
 *
 * Battle.net 으로 들어오면 배틀태그가 확인된 사용자라 나중에 공유할 때 더 믿을 만하게
 * 보인다. 이메일은 그냥 계정이다.
 */
export function LoginDialog({ onClose }: { onClose: () => void }) {
  const first = useRef<HTMLButtonElement>(null);
  const { source } = useMySheet();

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const go = (via: 'battlenet' | 'email') => {
    login(via);
    onClose();
  };

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
          <p>
            {source.kind !== 'namu' ? (
              <>
                지금 <b>내 상성</b>은 이 창에만 있어요. 로그인하면 계정에 남아서
                다음에도 그대로 쓸 수 있어요.
              </>
            ) : (
              <>로그인하면 고친 상성이 계정에 남아서 다음에도 그대로 쓸 수 있어요.</>
            )}
          </p>

          <button ref={first} type="button" className="login-btn bnet" onClick={() => go('battlenet')}>
            Battle.net으로 로그인
            <span>배틀태그 인증 배지가 붙어요</span>
          </button>
          <button type="button" className="login-btn" onClick={() => go('email')}>
            이메일로 가입 · 로그인
          </button>

          <p className="mock-note">목업이에요 — 실제로 로그인하지 않고 이 브라우저에만 저장해요.</p>
          <button type="button" className="reset small" onClick={onClose}>
            나중에
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
        {user.verified && <span className="verified" title="배틀태그 인증">✓</span>}
        {user.name}
      </button>
      {menu && (
        <div className="acct-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              logout();
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
