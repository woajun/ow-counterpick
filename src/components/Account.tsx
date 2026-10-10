import { useEffect, useRef, useState } from 'react';
import { alertDialog, confirmDialog, promptDialog } from '../lib/dialog';
import { deleteAccount, loginWithKakao, logout, sendLoginLink, setName, useMySheet, verifyLoginCode } from '../lib/mySheet';

/**
 * 로그인 창 — 카카오. 비밀번호는 없다.
 *
 * 이메일 로그인(링크 · 숫자 코드)도 만들어 두었지만 끈다(EMAIL_LOGIN). 수파베이스 기본
 * 메일 서버는 시간당 몇 통밖에 못 보내서 사람이 몰리면 메일이 안 간다. 도메인과 메일
 * 서비스(SMTP)를 붙이면 켠다 — 숫자 코드는 메일에 코드를 넣어야 해서 따로 켠다(OTP_IN_MAIL).
 */
const EMAIL_LOGIN = false;
const OTP_IN_MAIL = false;

export function LoginDialog({ onClose }: { onClose: () => void }) {
  const field = useRef<HTMLInputElement>(null);
  const { source } = useMySheet();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

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

  const verify = async () => {
    setBusy(true);
    setError('');
    const err = await verifyLoginCode(email.trim(), token);
    setBusy(false);
    if (err) setError(err);
    else onClose();
  };

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  // 수파베이스 기본은 6자리, 설정에 따라 8자리까지.
  const tokenOk = /^\d{6,8}$/.test(token);

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
          {sent && !OTP_IN_MAIL ? (
            <p>
              <b>{email.trim()}</b>로 메일을 보냈어요. 메일의 링크를 누르면 로그인돼요. 새 탭이
              열리면 닫아도 돼요 — 이 창도 같이 로그인돼요.
            </p>
          ) : sent ? (
            <>
              <p>
                <b>{email.trim()}</b>로 메일을 보냈어요. 메일의 <b>숫자 코드</b>를 넣으면 이 창에서 바로
                로그인돼요.
              </p>
              <input
                className="code-field"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={token}
                placeholder="123456"
                maxLength={8}
                autoFocus
                aria-label="메일로 온 숫자 코드"
                onChange={(e) => {
                  setToken(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tokenOk && !busy) void verify();
                }}
              />
              {error && <p className="code-error">{error}</p>}
              <button
                type="button"
                className="login-btn main"
                disabled={!tokenOk || busy}
                onClick={() => void verify()}
              >
                {busy ? '확인 중…' : '로그인'}
                <span>메일의 링크를 눌러도 돼요 — 이 창도 같이 로그인돼요</span>
              </button>
            </>
          ) : (
            <>
              <p>
                {source.kind !== 'namu'
                  ? '지금 고친 상성은 이 창에만 있어요. 로그인하면 계정에 남고, 코드로 친구에게 건넬 수 있어요.'
                  : '로그인하면 고친 상성이 계정에 남고, 코드로 친구에게 건넬 수 있어요.'}
              </p>
              <button
                type="button"
                className="login-btn kakao"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void loginWithKakao().then((err) => {
                    // 성공하면 카카오 화면으로 넘어가서 여기로 안 돌아온다.
                    if (err) {
                      setError(err);
                      setBusy(false);
                    }
                  });
                }}
              >
                카카오로 로그인
              </button>
              {EMAIL_LOGIN && (
              <>
              <div className="login-or">또는 이메일로</div>
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
                {busy ? '보내는 중…' : '로그인 메일 받기'}
                <span>비밀번호 없이 메일의 링크로 들어와요</span>
              </button>
              </>
              )}
              {!EMAIL_LOGIN && error && <p className="code-error">{error}</p>}
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
            onClick={async () => {
              setMenu(false);
              const next = await promptDialog({
                title: '이름 바꾸기',
                message: '"○○의 카운터픽"에 들어갈 이름이에요. 20자까지 쓸 수 있어요.',
                value: user.name,
                maxLength: 20,
                ok: '바꾸기',
              });
              if (next) setName(next);
            }}
          >
            이름 바꾸기
          </button>
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
          <button
            type="button"
            role="menuitem"
            className="danger"
            onClick={async () => {
              setMenu(false);
              const ok = await confirmDialog({
                title: '회원 탈퇴할까요?',
                message: (
                  <>
                    계정과 내 상성표가 지워지고 <b>되돌릴 수 없어요.</b> 내 코드로 공유한 주소도 더
                    이상 열리지 않아요.
                  </>
                ),
                ok: '탈퇴하기',
                danger: true,
              });
              if (!ok) return;
              const err = await deleteAccount();
              if (err) await alertDialog({ title: '탈퇴하지 못했어요', message: err });
              else await alertDialog({ title: '탈퇴했어요', message: '그동안 고마웠어요. 언제든 다시 와 주세요.' });
            }}
          >
            회원 탈퇴
          </button>
        </div>
      )}
    </div>
  );
}
