// Groups a flat chronological timeline into natural conversational turns:
//   User prompt -> Thinking trace -> Collapsible ToolChips (with pre-tool notes)
//   -> Main Assistant response -> ApprovalCard(s) anchored at the bottom of the turn.
export function groupTimelineIntoTurns(timeline = [], proposals = []) {
  const proposalMap = new Map(proposals.map(item => [item.change.id, item]));
  const rawTurns = [];
  for (const item of timeline) {
    if (item.kind === 'message' && item.role === 'user') {
      rawTurns.push({ user: item, items: [] });
    } else {
      if (!rawTurns.length) rawTurns.push({ user: null, items: [] });
      rawTurns[rawTurns.length - 1].items.push(item);
    }
  }

  return rawTurns.map(turn => {
    let lastToolIndex = -1;
    turn.items.forEach((item, idx) => {
      if (item.kind === 'tool') lastToolIndex = idx;
    });
    const hasPostToolMessage = lastToolIndex >= 0 && turn.items.some(
      (item, idx) => idx > lastToolIndex && item.kind === 'message' && item.role !== 'user' && item.text?.trim(),
    );

    const reasoning = [];
    const tools = [];
    const notes = [];
    const messages = [];
    const turnProposals = [];

    turn.items.forEach((item, idx) => {
      if (item.kind === 'reasoning' && item.text) {
        reasoning.push(item.text);
      } else if (item.kind === 'tool') {
        tools.push(item);
      } else if (item.kind === 'proposal') {
        const resolved = proposalMap.get(item.id);
        if (resolved) turnProposals.push(resolved);
      } else if (item.kind === 'message' && item.role !== 'user' && item.text?.trim()) {
        if (idx < lastToolIndex && hasPostToolMessage) {
          notes.push(item.text.trim());
        } else {
          messages.push(item.text);
        }
      }
    });

    return {
      user: turn.user,
      reasoning: reasoning.join('\n\n'),
      tools,
      notes,
      assistantText: messages.join('\n\n'),
      proposals: turnProposals,
    };
  });
}
