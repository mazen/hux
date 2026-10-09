// PROTOTYPE - concept 06 "Canvas": a calm desktop for hux. Conversation docks left, everything hux shows opens as a window.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Moon, Search, ShieldCheck, Sun, X } from "lucide-react";
import { conversation, home, household, memories, now, routines as fxRoutines, type Card } from "../../fixtures";
import { Conversation } from "./chat";
import { CANVAS_PAD, Dock, QuickAsk, ScreenMap, WinFrame } from "./chrome";
import {
  cx, HuxCtx, initialSettingVals, LAUNCHERS, META, type Approval, type Hux, type HomeThing, type Msg, type Routine, type Win, type WinKind,
} from "./model";
import { Wordmark } from "./ui";
import "./styles.css";

export const name = "Canvas";

const TIMER_MS = 25 * 60 * 1000;
const DESIGN = { w: 1060, h: 840 };

function useMedia(q: string) {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return m;
}

function initialLayout(W: number, H: number): Win[] {
  const L = CANVAS_PAD.left;
  const fitH = (h: number) => Math.min(h, H - CANVAS_PAD.top - 16);
  const span = W - L - 16;
  const recipe = { x: L + 8, y: CANVAS_PAD.top + 8 };
  const email = { x: Math.round(L + span * 0.36), y: CANVAS_PAD.top + 32 };
  const weather = { x: W - META.weather.w - 20, y: CANVAS_PAD.top + 8 };
  const shopH = fitH(META.shopping.h);
  const shopping = { x: Math.round(W - META.shopping.w - 56), y: Math.max(CANVAS_PAD.top + 330, H - shopH - 150) };
  const mk = (id: WinKind, p: { x: number; y: number }, z: number): Win => ({ id, ...p, w: META[id].w, h: fitH(META[id].h), z, min: false, max: false });
  return [mk("recipe", recipe, 1), mk("shopping", shopping, 2), mk("email", email, 3), mk("weather", weather, 4)];
}

const at = (n: number) => new Date(now.getTime() + n * 60000).toISOString();

export default function Variant() {
  const [dark, setDark] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [expert, setExpert] = useState(false);
  const isDesk = useMedia("(min-width: 1024px)");

  // ---- canvas + windows
  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const sizeRef = useRef(DESIGN);
  const touched = useRef(false);
  const zRef = useRef(10);
  const [wins, setWins] = useState<Win[]>(() => initialLayout(DESIGN.w, DESIGN.h));
  const [mobileView, setMobileView] = useState<"chat" | "windows">("chat");

  const clamp = useCallback((w: Win): Win => {
    const { w: W, h: H } = sizeRef.current;
    const ww = Math.max(240, Math.min(w.w, W - CANVAS_PAD.left - CANVAS_PAD.right));
    const hh = Math.max(160, Math.min(w.h, H - CANVAS_PAD.top - CANVAS_PAD.bottom));
    return {
      ...w, w: ww, h: hh,
      x: Math.round(Math.min(Math.max(w.x, 140 - ww), W - 140)),
      y: Math.round(Math.min(Math.max(w.y, CANVAS_PAD.top - 8), H - 48)),
    };
  }, []);

  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const s = { w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) };
      sizeRef.current = s;
      setSize(s);
      if (!touched.current) setWins((ws) => {
        const fresh = initialLayout(s.w, s.h);
        return ws.map((w) => fresh.find((f) => f.id === w.id) ? { ...fresh.find((f) => f.id === w.id)!, z: w.z, min: w.min, max: w.max } : clamp(w));
      });
      else setWins((ws) => ws.map(clamp));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isDesk, clamp]);

  const top = wins.filter((w) => !w.min).sort((a, b) => b.z - a.z)[0];
  const focused = top?.id ?? null;

  const carouselRef = useRef<HTMLDivElement>(null);
  const open = useCallback((k: WinKind) => {
    const z = ++zRef.current;
    setWins((ws) => {
      const ex = ws.find((w) => w.id === k);
      if (ex) return ws.map((w) => (w.id === k ? { ...w, min: false, z } : w));
      const { w: W, h: H } = sizeRef.current;
      const n = ws.filter((w) => !w.min).length % 5;
      const m = META[k];
      const x = Math.round(CANVAS_PAD.left + (W - CANVAS_PAD.left - m.w) / 2 + (n - 2) * 28);
      const y = CANVAS_PAD.top + 16 + n * 22;
      return [...ws, clamp({ id: k, x, y, w: m.w, h: Math.min(m.h, H - y - 16), z, min: false, max: false })];
    });
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      setMobileView("windows");
      requestAnimationFrame(() => carouselRef.current?.scrollTo({ left: 0, behavior: "smooth" }));
    }
  }, [clamp]);

  const focus = useCallback((k: WinKind) => {
    const z = ++zRef.current;
    setWins((ws) => ws.map((w) => (w.id === k ? { ...w, z, min: false } : w)));
  }, []);
  const close = (k: WinKind) => setWins((ws) => ws.filter((w) => w.id !== k));
  const minimise = (k: WinKind) => setWins((ws) => ws.map((w) => (w.id === k ? { ...w, min: true } : w)));
  const toggleMax = (k: WinKind) => { touched.current = true; setWins((ws) => ws.map((w) => (w.id === k ? { ...w, max: !w.max } : w))); };
  const move = (k: WinKind, x: number, y: number) => { touched.current = true; setWins((ws) => ws.map((w) => (w.id === k ? clamp({ ...w, x, y }) : w))); };
  const resize = (k: WinKind, ww: number, hh: number) => { touched.current = true; setWins((ws) => ws.map((w) => (w.id === k ? clamp({ ...w, w: ww, h: hh }) : w))); };
  const tidy = () => {
    touched.current = true;
    setWins((ws) => {
      const { w: W, h: H } = sizeRef.current;
      const gap = 14, left = CANVAS_PAD.left, avail = W - left - CANVAS_PAD.right;
      const vis = ws.filter((w) => !w.min).sort((a, b) => a.z - b.z);
      const cols = Math.max(1, Math.min(vis.length, Math.floor((avail + gap) / (300 + gap))));
      const colW = Math.floor((avail - gap * (cols - 1)) / cols);
      const heights = Array<number>(cols).fill(CANVAS_PAD.top);
      const placed = new Map<WinKind, Win>();
      vis.forEach((w) => {
        const c = heights.indexOf(Math.min(...heights));
        const hh = Math.min(w.h, H - CANVAS_PAD.top - CANVAS_PAD.bottom);
        placed.set(w.id, { ...w, max: false, x: left + c * (colW + gap), y: Math.min(heights[c], H - 120), w: colW, h: hh });
        heights[c] += hh + gap;
      });
      return ws.map((w) => placed.get(w.id) ?? w);
    });
  };
  const screenOf = (k: WinKind) => {
    const w = wins.find((x) => x.id === k);
    if (!w || !sizeRef.current.w) return 1;
    return Math.min(3, Math.max(1, Math.floor(((w.x + w.w / 2) / sizeRef.current.w) * 3) + 1));
  };

  // ---- toast
  const [toastMsg, setToastMsg] = useState<{ text: string; undo?: () => void; id: number } | null>(null);
  const toast = useCallback((text: string, undo?: () => void) => setToastMsg({ text, undo, id: Date.now() }), []);
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // ---- data
  const [approval, setApproval] = useState<Approval>("pending");
  const shoppingCard = conversation.find((m) => m.card?.type === "shoppingList")!.card as Extract<Card, { type: "shoppingList" }>;
  const [shopping, setShopping] = useState(shoppingCard.items);
  const [routines, setRoutines] = useState<Routine[]>(fxRoutines);
  const [homeState, setHomeState] = useState<Record<string, HomeThing>>(() =>
    Object.fromEntries(home.map((h) => [h.id, { on: /^On|Charging/.test(h.state), state: h.state }])),
  );
  const [mems, setMems] = useState(memories);
  const [timer, setTimer] = useState<{ end: number | null; left: number }>({ end: null, left: TIMER_MS });
  const [settingsFocus, setSettingsFocus] = useState<string | null>(null);
  const [settingVals, setSettingVals] = useState(initialSettingVals);

  const setHome = (id: string, on: boolean) =>
    setHomeState((s) => ({ ...s, [id]: { on, state: on ? (id === "h1" ? "On · 70%" : "On") : "Off" } }));

  // ---- conversation
  const [messages, setMessages] = useState<Msg[]>(conversation);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [listening, setListening] = useState(false);
  const counter = useRef(1);

  const startTimer = () => setTimer((t) => ({ end: Date.now() + t.left, left: t.left }));

  const respond = (t: string): { text: string; opens?: WinKind; run?: () => void } => {
    const s = t.toLowerCase();
    if (/timer/.test(s)) return { text: "Timer running: 25 minutes. I'll call you on the kitchen tablet when it's done.", opens: "timer", run: () => { if (!timer.end) startTimer(); } };
    if (/light/.test(s)) return { text: "The office lights are off. The kitchen lights are still on.", opens: "home", run: () => setHome("h1", false) };
    if (/step|read me|recipe|cook/.test(s)) return { text: "Step 1 of 5: heat the oven grill. Slice the courgette thinly and soften it in an ovenproof pan for 4 minutes. Say \"next\" when you're ready.", opens: "recipe" };
    if (/tomorrow|plan|calendar|remind|week|on\b/.test(s)) return { text: "Tomorrow Mia has swimming at 9:00, and Sam gets a reminder for her bag at 8:15. Sunday is lunch with Sam's parents at 12:30.", opens: "plans" };
    if (/quiet|notif|setting|night|23/.test(s)) return { text: "Done. Quiet hours now run from 23:00 to 7:00.", opens: "settings", run: () => { setSettingVals((v) => ({ ...v, "Quiet hours": "23:00 to 7:00" })); setSettingsFocus("notifications"); } };
    if (/weather|rain|bike/.test(s)) return { text: "Tomorrow stays dry until about 15:00. Rain is likeliest around 17:00.", opens: "weather" };
    if (/shop|milk|buy|list/.test(s)) return { text: "Your list has three things left: milk, fresh basil and coffee beans.", opens: "shopping" };
    if (/remember|forget|memory/.test(s)) return { text: "Here's everything I remember about the household. You can change or remove any of it.", opens: "memory" };
    if (/email|todd/.test(s)) return { text: "The email to Todd is ready. It goes out Monday at 7:30 once you give it the OK.", opens: "email" };
    return { text: "Okay. I'll work on that and let you know here when it's done." };
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const n = counter.current++;
    const device = isDesk ? "desk" : "phone";
    setMessages((m) => [...m, { id: `u${n}`, from: "member", member: household.currentMember, at: at(n), device, text }]);
    setTyping(true);
    if (!isDesk) setMobileView("chat");
    setTimeout(() => {
      const r = respond(text);
      setTyping(false);
      setMessages((m) => [...m, { id: `a${n}`, from: "assistant", at: at(n), device, text: r.text, opens: r.opens }]);
      r.run?.();
      if (r.opens && isDesk) open(r.opens);
    }, 900);
  };

  const askAbout = (text: string) => {
    setDraft(text);
    setMobileView("chat");
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) { el.focus(); el.setSelectionRange(text.length, text.length); }
    });
  };

  const micTimer = useRef<number | undefined>(undefined);
  const toggleMic = () => {
    if (listening) { setListening(false); clearTimeout(micTimer.current); return; }
    setListening(true);
    micTimer.current = window.setTimeout(() => { setListening(false); send("Turn off the office lights"); }, 2600);
  };

  // ---- palette
  const [palette, setPalette] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const closePalette = useCallback(() => setPalette(false), []);

  const ctx: Hux = {
    expert, isDesk, wins, focused, open, focus, close, minimise, toggleMax, move, resize, tidy, screenOf,
    sendTo: (k, device) => toast(`${META[k].title} is now on the ${device.replace("Alex's phone", "phone").toLowerCase()}.`),
    messages, typing, send, draft, setDraft, askAbout, inputRef, listening, toggleMic,
    approval,
    setApproval: (a) => {
      setApproval(a);
      if (a === "approved") toast("Approved. The email goes out Monday at 7:30.", () => setApproval("pending"));
    },
    shopping,
    toggleItem: (i) => setShopping((s) => s.map((it, j) => (j === i ? { ...it, done: !it.done } : it))),
    addItem: (n) => setShopping((s) => [...s, { name: n, done: false }]),
    routines,
    toggleRoutine: (id) => setRoutines((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))),
    homeState,
    toggleHome: (id) => setHome(id, !homeState[id].on),
    mems,
    editMem: (id, text) => text.trim() && setMems((ms) => ms.map((m) => (m.id === id ? { ...m, text: text.trim() } : m))),
    removeMem: (id) => {
      const prev = mems;
      const m = mems.find((x) => x.id === id);
      setMems((ms) => ms.filter((x) => x.id !== id));
      toast(`Forgotten: "${m?.text}"`, () => setMems(prev));
    },
    timer,
    startTimer,
    pauseTimer: () => setTimer((t) => ({ end: null, left: t.end ? Math.max(0, t.end - Date.now()) : t.left })),
    resetTimer: () => setTimer({ end: null, left: TIMER_MS }),
    settingsFocus, setSettingsFocus,
    settingVals,
    toggleSetting: (n) => setSettingVals((v) => ({ ...v, [n]: !v[n] })),
    toast,
    openPalette: () => setPalette(true),
  };

  // ---- pieces
  const pending = approval !== "approved";
  const ApprovalPill = pending ? (
    <button onClick={() => open("email")}
      className="v6-pulse flex h-8 items-center whitespace-nowrap gap-1.5 rounded-full bg-(--amber-soft) px-3 text-[12px] font-medium text-(--amber)">
      <ShieldCheck size={14} /> <span className="hidden sm:inline">1 waiting for you</span><span className="sm:hidden">1</span>
    </button>
  ) : null;
  const ModeToggle = (
    <div role="group" aria-label="Detail level" className="flex h-8 items-center rounded-full bg-(--sunk) p-0.5 text-[12px] font-medium">
      {(["Simple", "Expert"] as const).map((l) => {
        const on = (l === "Expert") === expert;
        return (
          <button key={l} onClick={() => setExpert(l === "Expert")} aria-pressed={on}
            className={cx("h-7 rounded-full px-2.5 transition-colors", on ? "bg-(--win) text-(--ink) shadow-[0_0_0_1px_var(--line-2)]" : "text-(--ink-3) hover:text-(--ink)")}>
            {l}
          </button>
        );
      })}
    </div>
  );
  const ThemeBtn = (
    <button onClick={() => setDark((d) => !d)} aria-label={dark ? "Light mode" : "Dark mode"} title={dark ? "Light mode" : "Dark mode"}
      className="grid size-8 place-items-center rounded-full text-(--ink-2) hover:bg-(--hover) hover:text-(--ink)">
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
  const kbd = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";

  const visible = useMemo(() => wins.filter((w) => !w.min), [wins]);
  const stack = useMemo(() => [...visible].sort((a, b) => b.z - a.z), [visible]);
  const [slide, setSlide] = useState(0);

  const Toast = toastMsg && (
    <div key={toastMsg.id} className="v6-drop v6-float pointer-events-auto flex items-center gap-3 rounded-[12px] py-2 pr-2 pl-3.5 text-[13px]">
      <span>{toastMsg.text}</span>
      {toastMsg.undo && <button onClick={() => { toastMsg.undo!(); setToastMsg(null); }} className="rounded-[7px] px-2 py-1 font-medium text-(--accent) hover:bg-(--accent-soft)">Undo</button>}
      <button onClick={() => setToastMsg(null)} aria-label="Dismiss" className="grid size-6 place-items-center rounded-[6px] text-(--ink-3) hover:bg-(--hover)"><X size={13} /></button>
    </div>
  );

  return (
    <HuxCtx.Provider value={ctx}>
      <div className={cx("v06 h-full overflow-hidden", dark && "dark")}>
        {isDesk ? (
          <div className="flex h-full">
            {/* Conversation dock */}
            <aside className="relative z-[1000] flex h-full w-[380px] shrink-0 flex-col border-r border-(--line-2) bg-(--panel) xl:w-[400px]">
              <header className="flex h-14 shrink-0 items-center gap-3 border-b border-(--line) px-4">
                <Wordmark />
                <span className="text-[12px] text-(--ink-3)">Home</span>
                <div className="ml-auto flex -space-x-1.5">
                  {household.members.map((m) => (
                    <span key={m.id} title={m.name + (m.id === household.currentMember ? " (you)" : "")}
                      className={cx("grid size-6 place-items-center rounded-full text-[10.5px] font-semibold text-white ring-2 ring-(--panel)", m.id !== household.currentMember && "opacity-70")}
                      style={{ background: m.color }}>{m.initials}</span>
                  ))}
                </div>
              </header>
              <div className="min-h-0 flex-1"><Conversation /></div>
            </aside>

            {/* Canvas */}
            <main ref={canvasRef} className="v6-canvas relative min-w-0 flex-1 overflow-hidden">
              {expert && size.w > 0 && [1, 2].map((i) => (
                <div key={i} className="pointer-events-none absolute top-0 bottom-0 border-l border-dashed border-(--line-2)" style={{ left: (size.w / 3) * i }} />
              ))}
              {expert && size.w > 0 && [0, 1, 2].map((i) => (
                <div key={i} className="v6-mono pointer-events-none absolute bottom-3 text-[10px] text-(--ink-3)" style={{ left: (size.w / 3) * i + (i === 0 ? CANVAS_PAD.left : 12) }}>screen {i + 1}</div>
              ))}

              <div className="absolute inset-x-0 top-0 z-[950] flex h-14 items-center gap-3 px-3">
                <div className="flex-1 pl-1 text-[12px] text-(--ink-3)">
                  <span className="text-(--ink-2)">Fri 9 Oct</span> · 18:40 · Desk PC
                </div>
                <button onClick={() => setPalette(true)}
                  className="v6-float flex h-9 w-[min(420px,40vw)] items-center gap-2.5 rounded-[11px] px-3 text-left text-[13px] text-(--ink-3) transition-colors hover:text-(--ink-2)">
                  <Search size={15} />
                  <span className="flex-1">Ask hux, or open anything</span>
                  <kbd className="v6-mono rounded-[5px] border border-(--line-2) px-1.5 text-[11px]">{kbd}</kbd>
                </button>
                <div className="flex flex-1 items-center justify-end gap-2">
                  {ApprovalPill}
                  {ModeToggle}
                  {ThemeBtn}
                </div>
              </div>

              {visible.length === 0 && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-[14px] text-(--ink-2)">Nothing open</div>
                    <button onClick={() => setPalette(true)} className="mt-1 text-[12px] text-(--ink-3) hover:text-(--ink)">{kbd} to ask or open anything</button>
                  </div>
                </div>
              )}

              {visible.map((w) => <WinFrame key={w.id} win={w} mode="canvas" />)}

              <Dock />
              <ScreenMap size={size} />
              <div className="pointer-events-none absolute inset-x-0 top-16 z-[1500] flex justify-center">{Toast}</div>
            </main>
          </div>
        ) : (
          /* ---------------- phone / tablet ---------------- */
          <div className="flex h-full flex-col bg-(--panel)">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-(--line) px-4">
              <Wordmark />
              <div className="ml-auto flex items-center gap-1">
                {ApprovalPill}
                <button onClick={() => setPalette(true)} aria-label="Ask or open anything" className="grid size-8 place-items-center rounded-full text-(--ink-2) hover:bg-(--hover)"><Search size={16} /></button>
                {ThemeBtn}
              </div>
            </header>
            <div className="flex shrink-0 items-center gap-2 px-4 py-2">
              <div className="flex h-8 flex-1 rounded-full bg-(--sunk) p-0.5 text-[13px] font-medium">
                {(["chat", "windows"] as const).map((v) => (
                  <button key={v} onClick={() => setMobileView(v)}
                    className={cx("flex-1 rounded-full transition-colors", mobileView === v ? "bg-(--win) text-(--ink) shadow-[0_0_0_1px_var(--line-2)]" : "text-(--ink-3)")}>
                    {v === "chat" ? "Conversation" : <>Open <span className="text-(--ink-3)">{visible.length}</span></>}
                  </button>
                ))}
              </div>
              {ModeToggle}
            </div>

            {mobileView === "chat" ? (
              <div className="min-h-0 flex-1 pb-12"><Conversation /></div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col pb-14">
                <div className="v6-noscroll flex shrink-0 gap-1.5 overflow-x-auto px-4 pb-3">
                  {[...LAUNCHERS, ...wins.filter((w) => w.min && !LAUNCHERS.includes(w.id)).map((w) => w.id)].map((k) => {
                    const I = META[k].icon;
                    const w = wins.find((x) => x.id === k);
                    return (
                      <button key={k} onClick={() => open(k)}
                        className={cx("flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] whitespace-nowrap",
                          w && !w.min ? "border-(--accent) text-(--accent)" : "border-(--line-2) text-(--ink-2)")}>
                        <I size={13} /> {META[k].short}
                        {w?.min && <span className="size-1.5 rounded-full bg-(--ink-3)" />}
                      </button>
                    );
                  })}
                </div>
                {stack.length === 0 ? (
                  <div className="grid flex-1 place-items-center text-[14px] text-(--ink-2)">Nothing open</div>
                ) : (
                  <>
                    <div ref={carouselRef}
                      onScroll={(e) => { const el = e.currentTarget; setSlide(Math.round(el.scrollLeft / el.clientWidth)); }}
                      className="v6-snap v6-noscroll flex min-h-0 flex-1 overflow-x-auto">
                      {stack.map((w) => (
                        <div key={w.id} className="h-full w-full shrink-0 px-4"><WinFrame win={w} mode="card" /></div>
                      ))}
                    </div>
                    <div className="flex shrink-0 justify-center gap-1.5 pt-3">
                      {stack.map((w, i) => (
                        <button key={w.id} aria-label={META[w.id].title}
                          onClick={() => carouselRef.current?.scrollTo({ left: i * carouselRef.current.clientWidth, behavior: "smooth" })}
                          className={cx("h-1.5 rounded-full transition-all", i === slide ? "w-5 bg-(--ink)" : "w-1.5 bg-(--line-2)")} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="pointer-events-none fixed inset-x-0 top-16 z-[1500] flex justify-center px-4">{Toast}</div>
          </div>
        )}
        {palette && <QuickAsk onClose={closePalette} />}
      </div>
    </HuxCtx.Provider>
  );
}
