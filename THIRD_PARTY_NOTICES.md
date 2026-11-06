# Beautiful UI

ToolChips.tsx, LoadingState.tsx, ApprovalCard.tsx, ThinkingState.tsx and Button.tsx
were retrieved from the official `tool-chips`, `loading-state`, `approval-card`,
`thinking-state` and `button` registry entries. Local adaptations are `ToolChips.js`,
`RunActivity.js`, `ApprovalCard.js`, `ThinkingState.js`, `Button.js`; demo
scheduling/questionnaire logic is replaced by real provider events and explicit
host approval callbacks.

`src/beautiful-ui/upstream/*` contains the original ChatComposer and foundation
registry source. The foundation is compiled and embedded, not merely imitated.
`Section.js` adapts the upstream Section; detailed changes are documented in
`src/beautiful-ui/README.md`. All these files are covered by the MIT notice below.

`src/beautiful-ui/RunActivity.js` also adapts the ChatComposer Section's
label/sub/time hierarchy for real waiting/tool/streaming state and a native
reasoning disclosure. Demo resolving blur and simulated phase timers are not used.

`src/beautiful-ui/ChatComposer.js` adapts the layout, composer and send glyph of
https://www.beautifului.dev/r/chat-composer.json (ChatComposer.tsx).
`src/chat-style.js` adapts foundation tokens and component utility styles from
https://www.beautifului.dev/r/foundation.json.
Retrieved 2026-11-06. Demo responses/timers removed; real agent state, settings,
approval content, scoped CSS, host theme and IME-safe multiline input integrated.

MIT License

Copyright (c) 2026 Shane Levine

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
