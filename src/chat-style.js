import foundation from './beautiful-ui/foundation.generated.js';
// Compiled official foundation/utilities, followed by integration-only styles.
export const chatStyle = foundation + `
/* Host theme bridge: inherited variables cross Shadow DOM in every browser,
   unlike :host-context(), which is not supported by all host browsers. */
.copilot{--surface:var(--alid-bg-surface);--canvas:var(--alid-bg-canvas);--inset:var(--alid-bg-muted);--field:var(--alid-bg-muted);--hover:var(--alid-bg-muted);--hover-2:var(--alid-border-subtle);--ink:var(--alid-text);--ink-2:var(--alid-text-secondary);--ink-3:var(--alid-text-muted);--line:var(--alid-border-subtle);--line-strong:var(--alid-border-strong);--accent:var(--alid-accent);--accent-ink:var(--alid-accent-hover);--accent-tint:var(--alid-accent-soft);--green:var(--alid-success);--red:var(--alid-danger);--shadow-card:0 0 0 1px var(--line),var(--alid-shadow);--shadow-btn:0 0 0 1px var(--line-strong),var(--alid-shadow);color-scheme:inherit}
.bui-header-actions{display:flex;align-items:center;gap:4px;flex-shrink:0}.bui-new-session{border:0;background:transparent}
.bui-activity-stack,.bui-reasoning,.bui-turn{flex-shrink:0;min-width:0}
.bui-activity-stack:empty{display:none}
.bui-markdown{white-space:normal;overflow-wrap:anywhere;min-width:0}.bui-markdown>:first-child{margin-top:0}.bui-markdown>:last-child{margin-bottom:0}
.bui-markdown p{margin:8px 0;white-space:pre-wrap}.bui-markdown :is(h1,h2,h3,h4,h5,h6){font-weight:600;line-height:1.4;margin:16px 0 8px;font-size:14px}.bui-markdown h1{font-size:18px}.bui-markdown h2{font-size:16px}
.bui-markdown :is(ul,ol){padding-left:22px;margin:8px 0}.bui-markdown li+li{margin-top:4px}.bui-markdown blockquote{margin:10px 0;padding:0 10px;border-left:3px solid var(--line);color:var(--ink-2)}
.bui-markdown code{font:11px/1.6 ui-monospace,monospace;background:var(--field);border-radius:4px;padding:2px 4px}.bui-markdown pre{max-width:100%;overflow:auto;background:var(--field);border:1px solid var(--line);border-radius:8px;padding:10px;white-space:pre;tab-size:2}.bui-markdown pre code{padding:0;background:transparent}
.bui-markdown table{display:block;max-width:100%;overflow:auto;border-collapse:collapse;font-size:12px}.bui-markdown :is(th,td){padding:6px 8px;border:1px solid var(--line);text-align:left}.bui-markdown th{background:var(--field)}.bui-markdown a{color:inherit;text-decoration:underline;text-underline-offset:3px}.bui-markdown hr{border:0;border-top:1px solid var(--line);margin:12px 0}
.bui-markdown .katex-display{display:block;max-width:100%;overflow-x:auto;padding:10px 0;margin:6px 0}.bui-markdown math{font-size:1.1em}.bui-markdown .katex-error{color:var(--ink-2);font:11px/1.5 ui-monospace,monospace}.bui-markdown input[type=checkbox]{pointer-events:none}.bui-image-alt{color:var(--ink-2);font-size:12px}
.copilot{height:100%;min-height:0;padding:0;box-sizing:border-box;background:var(--surface);color:var(--ink);font:13px/1.5 system-ui,sans-serif;letter-spacing:-.01em}
.copilot *{box-sizing:border-box}.copilot button,.copilot textarea,.copilot input{font:inherit;color:inherit}
.copilot button{cursor:pointer}.copilot button:disabled{cursor:default;opacity:.45}.copilot button:focus-visible,.copilot summary:focus-visible{outline:2px solid var(--ink-2);outline-offset:2px}
.bui-chat{display:flex;height:100%;min-height:0;width:100%;flex-direction:column;overflow:hidden;background:transparent}
.bui-tabs{display:flex;gap:2px}
.bui-thread{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain}
/* The thread owns scrolling; its content must never shrink to fit its height.
   Include grandchildren promoted by the conversation's display:contents. */
.bui-thread :is(.bui-message,.bui-approval,.bui-tool-list,.bui-empty,.bui-settings,.bui-error){flex-shrink:0;min-width:0}
.bui-empty{margin:auto 0;padding:28px 8px}.bui-empty h3{font-size:18px;font-weight:500;letter-spacing:-.04em;margin:0 0 8px}.bui-empty p{color:var(--ink-2);font-size:12px;line-height:1.7;margin:0;max-width:27ch}
.bui-message{white-space:pre-wrap;overflow-wrap:anywhere;padding:2px 0}.bui-message[data-role=user]{align-self:flex-end;max-width:88%;border-radius:12px;background:var(--field);padding:7px 12px;font-size:13px;line-height:1.4;margin-left:28px}
.bui-compose-wrap{flex-shrink:0;margin-top:auto}
.bui-section{transform-origin:top left}.bui-section[data-resolving=true]{opacity:.75}@media(prefers-reduced-motion:no-preference){.bui-section{animation:fade-up 400ms cubic-bezier(.23,1,.32,1) both}}
.bui-composer textarea{width:100%;min-height:44px;max-height:160px;resize:vertical;border:0;background:transparent;font-size:13px;line-height:1.45;outline:none;padding:0}.bui-composer textarea::placeholder{color:var(--ink-3)}
.bui-folder,.bui-model{border:0;background:transparent;white-space:nowrap}
.bui-send{display:flex;flex-shrink:0;align-items:center;justify-content:center;width:28px;height:28px;border:0;border-radius:8px;background:var(--ink);color:var(--surface)!important}.bui-send:disabled{background:var(--line-strong);color:var(--ink-2)!important;opacity:1}
.bui-tool-list{display:flex;flex-direction:column;gap:2px}
.bui-approval{flex-shrink:0;margin:1px;min-width:0}.bui-approval h3{margin:0}.bui-approval button{white-space:nowrap}.bui-approval pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:180px;overflow:auto;padding:10px;margin:8px 0 0;font:11px/1.6 ui-monospace,monospace;background:var(--field);border-radius:var(--radius-control)}
.bui-thinking{flex-shrink:0;min-width:0}.bui-thinking-body{white-space:pre-wrap;overflow-wrap:anywhere;max-height:240px;overflow:auto}
@media(prefers-reduced-motion:no-preference){.bui-thinking-shimmer{background-image:linear-gradient(90deg,var(--ink-3) 35%,var(--ink) 50%,var(--ink-3) 65%);background-size:200% 100%;background-clip:text;color:transparent;animation:shimmer-text 1.4s linear infinite}}
.bui-settings{display:flex;flex-direction:column;gap:14px}.bui-settings label{font-size:12px;font-weight:500;color:var(--ink)}.bui-settings input{display:block;width:100%;margin-top:5px;padding:7px 10px;border:1px solid var(--line);border-radius:var(--radius-control);background:var(--field);font-size:13px}.bui-settings input:focus{border-color:var(--line-strong);outline:none}.bui-settings small{font-size:11px;line-height:1.6;color:var(--ink-2)}.bui-error{font-size:12px;border:1px solid var(--red);background:color-mix(in srgb,var(--red) 8%,var(--surface));color:var(--ink);border-radius:8px;padding:10px}
@media(prefers-reduced-motion:no-preference){.bui-send{transition:transform .2s}.bui-send:active{transform:scale(.96)}}
`;
