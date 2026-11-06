// Adapts Beautiful UI ChatComposer's Section label/sub/time hierarchy and
// resolving treatment to real agent events; no simulated reasoning or progress.
import { createElement as h, useEffect, useState } from 'react';

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
  return h('div', { className: 'bui-run-activity', 'data-running': running, 'data-beautiful-ui': 'section' },
    h('div', { className: 'bui-run-heading' },
      running && h('span', { className: 'bui-working-dots', 'aria-hidden': true }, h('i'), h('i'), h('i')),
      h('span', { role: 'status', 'aria-live': 'polite' }, activityLabel(state)),
      running && h('span', { className: 'bui-run-time', 'aria-label': '경과 시간' }, `${Math.max(0, Math.floor((now - state.startedAt) / 1000))}초`)),
    running && h('p', null, state.phase === 'tool' ? state.activeTool : state.phase === 'waiting' ? '응답이 도착하면 여기에 표시됩니다. 중단 버튼으로 취소할 수 있습니다.' : state.phase === 'reasoning' ? '모델이 제공한 추론을 아래에서 확인할 수 있습니다.' : '메시지를 실시간으로 받고 있습니다.'));
}

export function ReasoningSection({ text }) {
  return h('details', { className: 'bui-reasoning', 'data-beautiful-ui': 'section' },
    h('summary', null, '모델 추론', h('span', null, '내용 보기')),
    h('div', { className: 'bui-reasoning-body' }, text));
}
