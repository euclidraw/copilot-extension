# Beautiful UI integration

`upstream/ChatComposer.tsx` and `upstream/foundation.css` are unmodified registry
downloads from beautifului.dev/r/{chat-composer,foundation}.json (2026-11-06).
MIT, copyright Shane Levine; see THIRD_PARTY_NOTICES.md.

`scripts/build-beautiful-ui.mjs` compiles the official foundation using pinned
Tailwind 4 and shadow-plugin. It scopes root tokens to the ShadowRoot host,
maps dark selectors to host-context(.dark), and removes one unmatched closing
brace/orphan `.records-footer-hint` demo fragment present in the registry CSS.
Generated CSS is embedded as a JS string: no CDN, fonts or runtime CSS imports.

ChatComposer uses upstream utility classes for tabs, header, thread and composer.
Section preserves the upstream label/sub/time hierarchy, spacing and typography
and is used for real assistant responses and live request feedback.

Intentional differences: no nested outer card shell (user request), live data
instead of fake messages/timers, textarea + IME protection, accessible cancel/new
session/settings/folder controls, chronological timeline, scrolling, Markdown,
reasoning disclosure and explicit approval cards. Those integrations are local,
not upstream Beautiful UI components. Resolving text is not blurred, and motion
honors reduced-motion. No claim of pixel identity or browser visual validation.
