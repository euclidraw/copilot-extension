import { createElement, useEffect, useRef, useState, useSyncExternalStore } from "react";
var extension_default = {
	id: "euclidraw.copilot",
	title: "Copilot",
	version: "0.1.0",
	summary: "현재 문맥을 확인하고 AI와 캔버스 작업을 진행합니다.",
	engine: "^0.1.0",
	dependencies: {},
	optionalDependencies: {},
	conflicts: [],
	provides: {
		"services": [],
		"hsmSlots": []
	}
};
// src/manifest.js
/** Shared by the bundle and build script; keep the reviewed and executed contracts identical. */
function createPackageManifest(metadata) {
	return {
		id: metadata.id,
		version: metadata.version,
		engine: metadata.engine,
		dependencies: { ...metadata.dependencies },
		optionalDependencies: { ...metadata.optionalDependencies },
		conflicts: [...metadata.conflicts],
		provides: {
			services: [...metadata.provides.services],
			aspects: [],
			hsmSlots: [...metadata.provides.hsmSlots]
		}
	};
}
// src/panel.js
var css = `:host{color:var(--text-primary,#2f3437)}.copilot{display:flex;flex-direction:column;height:100%;padding:16px;box-sizing:border-box;font:13px/1.6 system-ui,sans-serif;gap:16px}.copilot header{display:flex;justify-content:space-between}.copilot h2{font-size:16px;margin:0}.copilot small{color:var(--text-secondary,#787774)}.copilot .context{font-size:11px;border-block:1px solid #eaeaea;padding:8px 0}.copilot .messages{flex:1;overflow:auto;min-height:60px}.copilot article{padding:12px 0;border-bottom:1px solid #eaeaea;white-space:pre-wrap;overflow-wrap:anywhere}.copilot textarea{box-sizing:border-box;width:100%;min-height:100px;resize:vertical;background:transparent;color:inherit;border:1px solid #eaeaea;border-radius:6px;padding:10px;font:inherit}.copilot button{border:1px solid #eaeaea;border-radius:4px;padding:7px 12px;background:#2f3437;color:white;cursor:pointer}.copilot button:disabled{opacity:.4}.copilot footer{display:flex;justify-content:space-between;align-items:center}.copilot [role=alert]{color:#9f2f2d}`;
function ChatPanel({ store, panelContext, run }) {
	const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
	const [selected, setSelected] = useState(() => [...panelContext.getSelectedIds()]);
	const composing = useRef(false), ended = useRef(-Infinity);
	useEffect(() => panelContext.onSelectionChange((ids) => setSelected([...ids])), [panelContext]);
	useEffect(() => () => store.cancel(), [store]);
	const send = () => store.send({ selectedIds: [...panelContext.getSelectedIds()] }, run);
	return createElement("section", {
		className: "copilot",
		"aria-label": "AI chat"
	}, createElement("style", null, css), createElement("header", null, createElement("h2", null, "Copilot"), createElement("small", null, state.status)), createElement("div", { className: "context" }, `현재 캔버스 · 선택 ${selected.length}개`), createElement("div", {
		className: "messages",
		"aria-live": "polite",
		role: "log"
	}, !state.messages.length && createElement("p", null, "현재 선택을 문맥으로 사용합니다. 필요한 작업을 적어 주세요."), ...state.messages.map((message, index) => createElement("article", { key: index }, createElement("small", null, message.role === "user" ? "You" : "Copilot"), createElement("div", null, message.text)))), state.error && createElement("div", { role: "alert" }, state.error), createElement("textarea", {
		value: state.draft,
		"aria-label": "메시지",
		placeholder: "캔버스에 관해 요청하기…",
		onChange: (event) => store.setDraft(event.target.value),
		onCompositionStart: () => {
			composing.current = true;
		},
		onCompositionEnd: () => {
			composing.current = false;
			ended.current = performance.now();
		},
		onKeyDown(event) {
			if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229 || event.key === "Process" || performance.now() - ended.current < 16) return;
			if (event.key === "Enter" && !event.shiftKey) {
				event.preventDefault();
				send();
			}
		}
	}), createElement("footer", null, createElement("small", null, "Shift + Enter 줄바꿈"), state.status === "running" ? createElement("button", { onClick: () => store.cancel() }, "중단") : createElement("button", {
		onClick: send,
		disabled: !state.draft.trim()
	}, "보내기")));
}
// src/store.js
var key = "euclidraw.copilot.chat.v1";
function createChatStore(storage = globalThis.localStorage) {
	let saved;
	try {
		saved = JSON.parse(storage?.getItem(key) ?? "null");
	} catch {}
	let state = {
		messages: Array.isArray(saved?.messages) ? saved.messages.filter((m) => ["user", "assistant"].includes(m.role) && typeof m.text === "string").slice(-100) : [],
		draft: "",
		status: "idle",
		error: null
	};
	const listeners = /* @__PURE__ */ new Set();
	let controller;
	const publish = (patch) => {
		state = {
			...state,
			...patch
		};
		try {
			storage?.setItem(key, JSON.stringify({ messages: state.messages.slice(-100) }));
		} catch {}
		listeners.forEach((fn) => fn());
	};
	return {
		getSnapshot: () => state,
		subscribe(fn) {
			listeners.add(fn);
			return () => listeners.delete(fn);
		},
		setDraft: (draft) => publish({ draft }),
		cancel() {
			controller?.abort();
			controller = void 0;
			if (state.status === "running") publish({ status: "cancelled" });
		},
		async send(context, run) {
			if (state.status === "running" || !state.draft.trim()) return;
			if (!run) {
				publish({ error: "모델 연결이 필요합니다. 아직 요청을 전송하지 않았습니다." });
				return;
			}
			const frozenContext = structuredClone(context);
			const text = state.draft.trim();
			const current = controller = new AbortController();
			publish({
				draft: "",
				error: null,
				status: "running",
				messages: [
					...state.messages,
					{
						role: "user",
						text
					},
					{
						role: "assistant",
						text: ""
					}
				]
			});
			try {
				await run({
					text,
					context: frozenContext,
					signal: current.signal,
					onText(delta) {
						if (controller !== current || current.signal.aborted) return;
						const messages = state.messages.slice();
						messages[messages.length - 1] = {
							role: "assistant",
							text: messages.at(-1).text + delta
						};
						publish({ messages });
					}
				});
				if (controller === current && !current.signal.aborted) publish({ status: "idle" });
			} catch (error) {
				if (controller === current && !current.signal.aborted) publish({
					status: "error",
					error: String(error.message ?? error)
				});
			} finally {
				if (controller === current) controller = void 0;
			}
		}
	};
}
// src/index.js
var src_default = {
	...createPackageManifest(extension_default),
	summary: extension_default.summary,
	aspects: [],
	activate(context) {
		const mounts = context.services.get("ui.react-panels");
		if (!mounts) throw new Error("Copilot requires the ui.react-panels host service. Update the host.");
		const store = createChatStore();
		const off = context.services.get("ui.workbench").register(extension_default.id, { panels: [{
			panelId: "euclidraw.copilot.chat",
			title: "Copilot",
			icon: "chat",
			defaultZone: "left",
			navigation: {
				group: "document",
				order: 10
			},
			mount(host, panelContext) {
				return mounts.mount(host, {
					panelId: "euclidraw.copilot.chat",
					Component: ChatPanel,
					props: {
						store,
						panelContext
					}
				});
			}
		}] });
		return { dispose() {
			store.cancel();
			off();
		} };
	}
};
export { src_default as default };
