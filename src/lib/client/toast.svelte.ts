export interface ToastAction { label: string; run: () => void | Promise<void> }
export interface Toast { id: number; text: string; icon?: string; tone?: 'normal' | 'error'; action?: ToastAction; printJob?: number; until: number }

let seq = 0;
export const toasts = $state<{ list: Toast[] }>({ list: [] });

export function toast(text: string, opts: { icon?: string; tone?: 'normal' | 'error'; action?: ToastAction; printJob?: number; ms?: number } = {}) {
  const id = ++seq;
  const ms = opts.ms ?? (opts.action ? 6000 : 3200);
  toasts.list = [...toasts.list.slice(-2), { id, text, icon: opts.icon, tone: opts.tone, action: opts.action, printJob: opts.printJob, until: Date.now() + ms }];
  setTimeout(() => dismiss(id), ms);
  return id;
}

export function dismiss(id: number) {
  toasts.list = toasts.list.filter((t) => t.id !== id);
}

export function update(id: number, patch: Partial<Toast>) {
  toasts.list = toasts.list.map((t) => (t.id === id ? { ...t, ...patch } : t));
}
