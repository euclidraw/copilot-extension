// Original implementation inspired by Beautiful UI's Chat, Tool Chips and Approval Card patterns.
export const chatStyle = `
.copilot{gap:12px;padding:16px;background:var(--panel-bg,#fbfbfa);color:var(--text-primary,#2f3437)}
.copilot header{align-items:center;padding:2px 0 8px}.copilot h2{font-size:14px;letter-spacing:-.02em}
.copilot header small{font-size:10px;text-transform:uppercase;letter-spacing:.08em}
.copilot .context{display:flex;align-items:center;gap:6px;border:1px solid var(--border-color,#e7e7e4);border-radius:6px;padding:8px 10px;background:var(--surface-bg,#fff)}
.copilot .context::before{content:'';width:6px;height:6px;background:#64896c;border-radius:50%}
.copilot details{border:1px solid var(--border-color,#e7e7e4);border-radius:8px;background:var(--surface-bg,#fff);padding:10px 12px}
.copilot summary{cursor:pointer;font-size:12px;font-weight:500}.copilot details label{font-size:11px;margin-top:10px}
.copilot input{display:block;box-sizing:border-box;width:100%;padding:7px 8px;margin:4px 0;border:1px solid var(--border-color,#e7e7e4);border-radius:4px;background:transparent;color:inherit}
.copilot .messages{padding:8px 0}.copilot .messages>p{color:var(--text-secondary,#787774);max-width:28ch;margin:28px auto;line-height:1.8}
.copilot article{border:0;padding:12px 0 20px}.copilot article[data-role=user]{background:var(--surface-bg,#f1f1ee);padding:10px 12px;border-radius:8px;margin:0 0 12px 16px}
.copilot article small{font-size:10px;font-weight:600;letter-spacing:.04em}.copilot article>div{margin-top:5px}
.copilot textarea{min-height:96px;border-color:var(--border-color,#deded9);background:var(--surface-bg,#fff);border-radius:8px;padding:12px}
.copilot textarea:focus-visible,.copilot input:focus-visible,.copilot button:focus-visible,.copilot summary:focus-visible{outline:2px solid #7d9486;outline-offset:2px}
.copilot button{font-size:11px;padding:7px 11px}.copilot>button{align-self:flex-start;background:transparent;color:inherit}
.copilot .tool-chips{display:flex;flex-wrap:wrap;gap:5px;max-height:92px;overflow:auto}
.copilot .tool-chip{font:10px/1.6 ui-monospace,monospace;border:1px solid var(--border-color,#e7e7e4);border-radius:4px;padding:3px 6px;color:var(--text-secondary,#787774)}
.copilot .tool-chip[data-status=completed]{color:#467353}.copilot .tool-chip[data-status=failed]{color:#9f2f2d}
.copilot footer small{font-size:10px}.copilot pre{font-size:11px}.copilot details>button{margin-top:10px}
`;
