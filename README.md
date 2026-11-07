# Euclidraw Copilot

0.1.14 raises run limits: default output 32,768 tokens (configurable 256–200,000
in connection settings, saved with the connection), declared context window
200,000 tokens, up to 100 tool calls per request, 600-second execution budget,
and history of the last 60 messages (32,000 characters each). Hitting the tool or
time limit reports which limit stopped the run. Selection context and individual
tool results remain capped at 64 KB. A value above the model's own output limit
may be rejected by the provider; lower it if requests fail.

0.1.13 restructures conversational turns and composer layout for a natural flow:
each turn renders a single Copilot header, groups consecutive tool calls into an
adapted Beautiful UI `ToolChips` trace (expanded while running, collapsed when
done), folds intermediate pre-tool narration into the trace once the final
answer arrives, anchors `ApprovalCard` proposals right below the assistant's
explanation, and adapts Beautiful UI `LoadingState` (pixel-grid wavefront +
shimmer + tabular timer) for live request activity. Selection, folder and model
chips are unified inside the composer toolbar.

0.1.12 bridges Beautiful UI semantic colors and shadows to inherited `--alid-*`
variables. The actual host uses `data-alid-theme`, not `.dark`; the bridge follows
live host theme changes across Shadow DOM without relying on `:host-context`.

0.1.11 adapts the official Beautiful UI ApprovalCard, Button and ThinkingState
Reasoning sources for change approvals and expandable reasoning. Approval cards
offer explicit reject/apply actions and collapsible operation details; demo
auto-advance/submit is not used. Rejected plans cannot subsequently be applied.

0.1.10 vendors the official Beautiful UI registry sources and compiles the
foundation with Tailwind 4 + shadow-plugin into the runtime bundle. ChatComposer
uses upstream utilities and a shared Section for assistant replies/progress.
See `src/beautiful-ui/README.md` for exact adaptations and integration boundaries.

0.1.9 adds a header **새 대화** action. After confirmation it aborts the active
request, clears messages/draft/tool events/pending approvals and stored chat
history, and starts with no model history. Connection settings, folder access
and canvas contents remain unchanged. This resets the current conversation;
it does not archive or provide a session history picker.

0.1.8 adds Beautiful UI Section-based live request feedback: waiting, tool
execution, response streaming, elapsed time, cancellation/error and approval
waiting. Actual provider `thinking_delta` events appear as collapsed reasoning
disclosures in chronological order; reasoning is never fabricated, persisted
or included in subsequent conversation history. Providers/models that do not
emit thinking events show progress only, not a reasoning transcript.

AI chat extension, started from `jiwonMe/alid-extension-template`.

## Development

Requires Node 22.12+ and pnpm. Run `pnpm install`, `pnpm test`, then `pnpm dev`.
Connect the local development URL in the host extension manager, or install
`euclidraw/copilot-extension` from GitHub after reviewing the source.

The host must provide `ui.react-panels` (introduced on alid's
`plan/copilot-chat` branch). React is external and mounts through the existing
host root. No sticky-note aspects or canvas writes are registered.

## Implementation status

- Stage 1: left document panel, selection context, local conversation store,
  cancellation, IME-aware composer, single ESM and manifest hashing.
- Stage 2 spike: pinned MIT Pi agent-core/pi-ai 1.5.0, inline Blob Worker,
  OpenAI-compatible streaming, locally persisted endpoint/model/key form, frozen
  selected canonical reads. Read-only, 64 KiB tool budget, 120s execution budget.
- Stage 3 partial: selected existing fields can be proposed and explicitly
  applied through host `workspace.changes`, with conflict checks and one Undo.
  Generic rich-text, opaque, creation and deletion patches are rejected.
- Stage 4 partial: user-picked browser directory, list/read/write/exact patch,
  UTF-8/size/path checks and per-file approval. `.ecanvas.jsonl` writes are blocked.
  File revisions are best-effort checks, not atomic CAS against external editors;
  files are not part of canvas Undo. Automatic edit mode is not yet enabled. Sending without a
  provider reports that no request was sent. Live provider and browser Worker
  execution have not yet been verified; no credentials are bundled.
- Conversation history is local browser data, not document CRDT. No credentials
  are stored in conversation history. Since 0.1.3, connection settings (including
  the API key) are stored separately in unencrypted browser localStorage under
  a stable key, surviving extension updates on the same origin/browser profile.
  Settings can be cleared from the connection view. Clearing site data removes
  them; blocked storage reports a warning and keeps edits in memory only.
  Trusted extension code is not a security sandbox.
- Real OS IME, browser hot reload and performance profiling remain manual gates.

## Document lifetime and history

Requires the host's `workspace.changes.getContext()` document-lifetime contract.
Requests capture document/view identity. Importing another document aborts an
active request; stale proposals cannot be applied to the replacement document,
even if entity IDs and values match. File approval checks this lifetime too.
The last 20 messages for the same document generation are supplied as bounded
history; old replies are historical text, not proof that changes were applied.

The built inline Worker is exercised with web APIs and a fake OpenAI streaming
endpoint in a Node VM without Node globals: Pi calls a context tool and completes
a second streamed turn. This is not a real-browser/CSP or live-model test.

## UI and extension discovery

Since 0.1.4, extension planning tools can return an opaque `changeProposalId`.
Copilot resolves the host-owned plan and displays creation, deletion, relation
and layout operations in its approval card without applying them. A current
host with scoped `prepareChange` / `getChangeProposal` is required. Whole-document
conflicts and provider/document revocation reject stale plans. Direct generic
`changes_propose` remains limited to selected existing fields.

0.1.5 clarifies complete tool discovery (`tools_search` with an empty query),
the location of approval cards inside Copilot, and that refreshing discards
pending plans. Repeated validation errors must not trigger invented payloads.

0.1.7 displays message segments, tool executions and approval cards in arrival
order, rather than grouping by type. Tool status and approval updates keep their
original position. The conversation automatically scrolls to the bottom as
responses stream or cards arrive. Pending approvals and tool events remain
runtime-only; reloading restores saved message history, not actionable plans.

As of 0.1.1, the chat uses an adapted official Beautiful UI `chat-composer`
registry component and scoped foundation styles, not just inspired CSS.
The upstream scripted replies/timers are replaced by real agent events, and
IME-safe multiline input is retained. See `THIRD_PARTY_NOTICES.md` for the MIT
license and adaptation details. Tool/approval surfaces are local integrations.
The host's single React root, IME guards and explicit approval remain unchanged.

As of 0.1.2, chat fills the host dock panel directly, without a nested outer
card's padding, border, rounded corners or shadow. The integrated composer and
approval surfaces remain. User and assistant messages render Markdown headings,
lists, fenced code, GFM tables and LaTeX math (`$…$` inline, `$$…$$` display).
KaTeX emits native MathML without external font assets. Raw HTML is skipped,
unsafe link protocols are sanitized, remote images display alt text only, and
trusted TeX commands are disabled. Incomplete streamed markup remains renderable.
The single ESM bundle is minified to stay below the host's 2 MiB source limit.

When available, `workspace.tools` enables lazy read-only tool search, schema
description, invocation and selected-aspect semantic descriptors. Trusted tools
must honor their read-only contract; the registry is not a sandbox. Host runtime
binds registration identity and automatically revokes providers on unload.
