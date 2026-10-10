import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { close, queue, subs, type Req } from '../lib/dialog';

/** 알림 · 확인 · 입력 창을 그린다. 부르는 쪽은 lib/dialog 의 alertDialog · confirmDialog · promptDialog. */

export function DialogHost() {
  const head = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => queue[0],
  );
  if (!head) return null;
  // key 로 창마다 새로 그린다 — 입력 칸의 처음 값이 이전 창 것으로 남지 않게.
  return <Dialog key={queue.length + head.req.title} req={head.req} />;
}

function Dialog({ req }: { req: Req }) {
  const [text, setText] = useState(req.kind === 'prompt' ? (req.value ?? '') : '');
  const okRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cancel = () => close(req.kind === 'confirm' ? false : req.kind === 'prompt' ? null : undefined);
  const ok = () => close(req.kind === 'confirm' ? true : req.kind === 'prompt' ? text.trim() : undefined);

  useEffect(() => {
    // 입력 창은 칸에, 나머지는 확인 단추에 손이 가 있게. 지우기 확인은 실수로 Enter 를
    // 눌러도 안 지워지게 취소 쪽에 둔다.
    if (req.kind === 'prompt') inputRef.current?.select();
    else if (!(req.kind === 'confirm' && req.danger)) okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const danger = req.kind === 'confirm' && req.danger;
  const disabled = req.kind === 'prompt' && text.trim() === '';

  return (
    <div
      className="sheet-back dlg-back"
      onClick={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div className="hero-sheet dlg" role={req.kind === 'alert' ? 'alertdialog' : 'dialog'} aria-modal="true" aria-label={req.title}>
        <div className="dlg-body">
          <h3>{req.title}</h3>
          {req.message && <div className="dlg-msg">{req.message}</div>}
          {req.kind === 'prompt' && (
            <input
              ref={inputRef}
              className="email-field"
              value={text}
              placeholder={req.placeholder}
              maxLength={req.maxLength}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !disabled) ok();
              }}
            />
          )}
        </div>
        <div className="dlg-foot">
          {req.kind !== 'alert' && (
            <button type="button" className="reset" onClick={cancel}>
              {req.cancel ?? '취소'}
            </button>
          )}
          <button
            ref={okRef}
            type="button"
            className={'dlg-ok' + (danger ? ' danger' : '')}
            disabled={disabled}
            onClick={ok}
          >
            {req.ok ?? '확인'}
          </button>
        </div>
      </div>
    </div>
  );
}
