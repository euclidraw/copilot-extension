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
  OpenAI-compatible streaming, session-only endpoint/model/key form, frozen
  selected canonical reads. Read-only, 64 KiB tool budget, 120s execution budget.
- Stage 3 partial: selected existing fields can be proposed and explicitly
  applied through host `workspace.changes`, with conflict checks and one Undo.
  Generic rich-text, opaque, creation and deletion patches are rejected.
- Workspace files and automatic edit mode are not yet enabled. Sending without a
  provider reports that no request was sent. Live provider and browser Worker
  execution have not yet been verified; no credentials are bundled.
- Conversation history is local browser data, not document CRDT. No credentials
  are stored. Trusted extension code is not a security sandbox.
- Real OS IME, browser hot reload and performance profiling remain manual gates.
