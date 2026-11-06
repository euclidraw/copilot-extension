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
- Stage 4 partial: user-picked browser directory, list/read/write/exact patch,
  UTF-8/size/path checks and per-file approval. `.ecanvas.jsonl` writes are blocked.
  File revisions are best-effort checks, not atomic CAS against external editors;
  files are not part of canvas Undo. Automatic edit mode is not yet enabled. Sending without a
  provider reports that no request was sent. Live provider and browser Worker
  execution have not yet been verified; no credentials are bundled.
- Conversation history is local browser data, not document CRDT. No credentials
  are stored. Trusted extension code is not a security sandbox.
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

The chat, context chip, tool status chips and approval surfaces use original
React/CSS inspired by [Beautiful UI](https://www.beautifului.dev). Its site lists
an MIT license; no component source is copied and no UI dependency is added.
The host's single React root, IME guards and explicit approval remain unchanged.

When available, `workspace.tools` enables lazy read-only tool search, schema
description, invocation and selected-aspect semantic descriptors. Trusted tools
must honor their read-only contract; the registry is not a sandbox. Host runtime
binds registration identity and automatically revokes providers on unload.
