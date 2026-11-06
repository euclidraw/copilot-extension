// Adapted from Beautiful UI LoadingState.tsx (MIT, copyright 2026 Shane Levine).
// Uses the upstream 3x3 pixel-grid wavefront, shimmer label and mono elapsed timer
// driven by real agent status and phases instead of demo timers.
import { createElement as h, useEffect, useState } from 'react';

const CHEVRON_DELAYS = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3), c = i % 3;
  return (c + Math.abs(r - 1)) * 90;
});

function LoaderGrid() {
  return h('span', { 'aria-hidden': true, className: 'grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]' },
    ...CHEVRON_DELAYS.map((delay, index) => h('span', {
      key: index,
      className: 'size-[4px] rounded-[1px] bg-ink',
      style: {
        opacity: 0.15,
        animation: `pixel-on 650ms ease-in-out ${delay}ms infinite`,
      },
    })));
}

export function activityLabel(state) {
  if (state.status === 'cancelled') return '응답을 중단했습니다';
  if (state.status === 'error') return '요청을 완료하지 못했습니다';
  if (state.phase === 'tool') return '도구 실행 중';
  if (state.phase === 'reasoning') return '모델 추론 수신 중';
  if (state.phase === 'responding') return '응답 작성 중';
  return '모델 응답 대기 중';
}

export function RunActivity({ state }) {
  const [now, setNow] = useState(Date.now);
  const running = state.status === 'running';
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running, state.startedAt]);
  if (!running && !['cancelled', 'error'].includes(state.status)) return null;
  const seconds = Math.max(0, Math.floor(((now || Date.now()) - (state.startedAt || Date.now())) / 1000));

  return h('div', {
    className: 'bui-run-activity flex w-full items-center gap-2.5 py-1',
    'data-running': running,
    'data-beautiful-ui': 'loading-state',
  },
    running && h(LoaderGrid),
    h('span', {
      role: 'status',
      'aria-live': 'polite',
      className: `text-[13px] font-medium ${running ? 'bui-thinking-shimmer text-ink' : 'text-ink-2'}`,
    }, activityLabel(state)),
    running && state.phase === 'tool' && state.activeTool && h('span', {
      className: 'inline-flex h-5 items-center truncate rounded-chip bg-field px-1.5 font-mono text-[11px] text-ink-2 shadow-hairline',
    }, state.activeTool),
    running && h('span', {
      className: 'ml-auto font-mono text-[12px] text-ink-3 tabular-nums',
      'aria-label': '경과 시간',
    }, `${seconds}초`));
}
