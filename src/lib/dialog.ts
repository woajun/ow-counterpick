import type { ReactNode } from 'react';

/**
 * 알림 · 확인 · 입력 창 — 브라우저 기본 창(alert · confirm · prompt) 대신.
 *
 * 기본 창은 앱과 모양이 따로 놀고 주소창 이름까지 붙어 나온다. 부르는 쪽은 기본 창처럼
 * 한 줄로 쓰고(await 로 답을 받는다), 그리는 것은 App 맨 아래의 <DialogHost /> 가 한다.
 *
 *   if (!(await confirmDialog({ title: '초기화할까요?', danger: true }))) return;
 *   const name = await promptDialog({ title: '이름 바꾸기', value: user.name });
 */

export interface Base {
  title: string;
  message?: ReactNode;
}
interface AlertReq extends Base {
  kind: 'alert';
  ok?: string;
}
interface ConfirmReq extends Base {
  kind: 'confirm';
  ok?: string;
  cancel?: string;
  /** 지우기처럼 되돌릴 수 없는 일 — 확인 단추가 빨갛다. */
  danger?: boolean;
}
interface PromptReq extends Base {
  kind: 'prompt';
  value?: string;
  placeholder?: string;
  maxLength?: number;
  ok?: string;
  cancel?: string;
}
export type Req = AlertReq | ConfirmReq | PromptReq;

export interface Open {
  req: Req;
  resolve: (v: unknown) => void;
}

// 한 번에 하나만 띄운다. 뒤에 온 것은 줄을 선다.
export let queue: Open[] = [];
export const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function open<T>(req: Req) {
  return new Promise<T>((resolve) => {
    queue = [...queue, { req, resolve: resolve as (v: unknown) => void }];
    emit();
  });
}
export function close(v: unknown) {
  const [head, ...rest] = queue;
  queue = rest;
  emit();
  head?.resolve(v);
}

export const alertDialog = (o: Omit<AlertReq, 'kind'>) => open<void>({ kind: 'alert', ...o });
/** 확인이면 true, 취소 · 바깥 클릭 · Esc 면 false. */
export const confirmDialog = (o: Omit<ConfirmReq, 'kind'>) => open<boolean>({ kind: 'confirm', ...o });
/** 넣은 글자, 취소면 null. */
export const promptDialog = (o: Omit<PromptReq, 'kind'>) => open<string | null>({ kind: 'prompt', ...o });
