# Euclidraw Copilot

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
