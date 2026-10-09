// PROTOTYPE - concept 03 "Layers". Two depths: a calm background of kept widgets along the edges,
// and one focus slot in front. The input sits between them. Keep sends focus back; bring forward pulls it in front.
import { useEffect, useLayoutEffect, useReducer, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  ArrowUp, CalendarClock, ChevronDown, GripHorizontal, History, Layers, Lock, Maximize2, Mic, Minus, Moon, Plus,
  Send, Settings as SettingsIcon, Sun, Trash2, X,
} from "lucide-react";
import { conversation, now } from "../../fixtures";
import {
  ZONES, ZONE_WORD, SURFACES, TITLE, canKeep, emptiestZone, initialState, interpret, isEdited, isPrivate, reduce, surfaceName, awayAt,
  type Action, type State, type SurfaceId, type Widget, type Zone,
} from "./model";
import { WidgetBody, PrivateMark, emailDraft, mmss, timerLeft, type Ctx } from "./widgets";
import "./styles.css";

export const name = "Layers";

const SCRIPT = [
  "What could I cook tonight?",
  "Show the frittata recipe on the right and keep it there",
  "Start a 25 minute timer next to it",
  "Move the timer to the kitchen tablet",
  "Bring the timer back from the kitchen",
  "Show me the email to Todd",
  "Show the email on the kitchen tablet",
  "Put my calendar for next week along the bottom",
  "Make the weather smaller",
  "Remove the shopping list",
  "Clear everything except the timer",
  "Save this as my cooking screen",
  "Show my Friday evening screen",
  "Show my cooking screen",
];

type Target = Zone | "focus" | { surface: SurfaceId };
type Drag = { id: string; x: number; y: number; target: Target | null };

function useMedia(q: string) {
  const [m, setM] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const mq = matchMedia(q);
    const f = () => setM(mq.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [q]);
  return m;
}

function withTransition(fn: () => void) {
  const d = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!d.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return fn();
  d.startViewTransition(() => flushSync(fn));
}

const sameTarget = (a: Target | null, b: Target | null) => JSON.stringify(a) === JSON.stringify(b);

export default function Variant() {
  const [s, dispatch] = useReducer(reduce, emailDraft.body, initialState);
  const sRef = useRef<State>(s);
  sRef.current = s;
  const [dark, setDark] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  const [expert, setExpert] = useState(false);
  const phone = useMedia("(max-width: 640px)");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const t0 = useRef(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const huxNow = new Date(now.getTime() + (nowMs - t0.current));
  const clock = huxNow.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });

  const [text, setText] = useState("");
  const [ran, setRan] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [menu, setMenu] = useState<null | "layouts" | "keep" | "send" | SurfaceId>(null);
  const [saveName, setSaveName] = useState("");
  const [drag, setDrag] = useState<Drag | null>(null);
  const [replyFresh, setReplyFresh] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const lowerRef = useRef<HTMLDivElement>(null);
  const [lowerH, setLowerH] = useState(160);

  useLayoutEffect(() => {
    const el = lowerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setLowerH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [phone]);

  const act = (a: Action | Action[]) => withTransition(() => (Array.isArray(a) ? a : [a]).forEach(dispatch));

  const run = (raw: string) => {
    const said = raw.trim();
    if (!said) return;
    const plan = interpret(said, sRef.current, clock);
    if (plan.ui === "dark") setDark(true);
    if (plan.ui === "light") setDark(false);
    if (plan.ui === "expert") setExpert(true);
    if (plan.ui === "simple") setExpert(false);
    if (plan.now.length) act(plan.now);
    dispatch({ t: "log", ex: { id: crypto.randomUUID(), you: said, hux: plan.reply, at: clock, helper: plan.helper ?? "Chief" } });
    if (plan.later) setTimeout(() => act(plan.later!), 1000);
    setRan((r) => [...r, said.toLowerCase()]);
    setText("");
    setMenu(null);
    setReplyFresh(true);
  };

  useEffect(() => {
    if (!replyFresh) return;
    const t = setTimeout(() => setReplyFresh(false), 9000);
    return () => clearTimeout(t);
  }, [replyFresh, s.log.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menu || historyOpen) { setMenu(null); setHistoryOpen(false); return; }
      if (sRef.current.focus) act({ t: "dismiss" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const voice = () => {
    if (listening) return;
    setListening(true);
    setTimeout(() => {
      setListening(false);
      run(chips[0] ?? "Show my schedule");
    }, 1500);
  };

  // ------------------------------------------------------------ drag: edges keep, centre brings forward, tiles send away
  const targetAt = (x: number, y: number): Target | null => {
    const hit = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-surface]");
    if (hit) return { surface: hit.dataset.surface as SurfaceId };
    const r = surfaceRef.current!.getBoundingClientRect();
    const fx = (x - r.left) / r.width, fy = (y - r.top) / r.height;
    if (fy < 0.06) return null;
    if (fx < 0.24) return "left";
    if (fx > 0.76) return "right";
    if (fy < 0.22) return "top";
    if (fy > 0.7) return "bottom";
    return "focus";
  };

  const drop = (id: string, t: Target | null) => {
    const cur = sRef.current;
    if (!t) return;
    if (typeof t === "object") return run(`Send the ${id === "week" ? "next week calendar" : TITLE[cur.widgets[id].kind].toLowerCase()} to the ${surfaceName(t.surface).toLowerCase()}`);
    if (t === "focus") return cur.focus?.id === id ? undefined : act({ t: "pull", id });
    if (cur.focus?.id === id) return act({ t: "keep", zone: t, at: clock });
    act({ t: "move", id, zone: t, at: clock });
  };

  const startDrag = (e: React.PointerEvent, id: string, onTap?: () => void) => {
    if (e.button !== 0) return;
    const sx = e.clientX, sy = e.clientY;
    let moving = false;
    const move = (ev: PointerEvent) => {
      if (!moving && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) moving = true;
      if (moving) {
        ev.preventDefault();
        const target = targetAt(ev.clientX, ev.clientY);
        setDrag((d) => (d && sameTarget(d.target, target) ? { ...d, x: ev.clientX, y: ev.clientY } : { id, x: ev.clientX, y: ev.clientY, target }));
      }
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (moving) {
        const t = targetAt(ev.clientX, ev.clientY);
        setDrag(null);
        drop(id, t);
      } else onTap?.();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // ------------------------------------------------------------ chips
  const scriptLeft = SCRIPT.filter((c) => !ran.includes(c.toLowerCase()));
  const extras = ["Show my schedule", "Open settings"];
  const chips = [...scriptLeft.slice(0, 4), ...extras];

  const ctx: Ctx = {
    s, nowMs, expert,
    dispatch,
    ask: run,
    prefill: (t) => { setText(t); inputRef.current?.focus(); },
  };

  const focusW = s.focus ? s.widgets[s.focus.id] : null;
  const edited = isEdited(s);
  const last = s.log[s.log.length - 1];

  // ------------------------------------------------------------ pieces
  const bgWidget = (id: string, zone: Zone, index: number, count: number) => {
    const w = s.widgets[id];
    if (!w) return null;
    const isDragged = drag?.id === id;
    return (
      <div
        key={id}
        className={`v03-bgw size-${w.size} ${isDragged ? "is-dragged" : ""}`}
        style={{ viewTransitionName: `v03-${id}` } as CSSProperties}
        role="button"
        tabIndex={0}
        aria-label={`${TITLE[w.kind]}. Bring forward`}
        onPointerDown={(e) => (phone ? undefined : startDrag(e, id, () => act({ t: "pull", id })))}
        onClick={() => phone && act({ t: "pull", id })}
        onKeyDown={(e) => e.key === "Enter" && act({ t: "pull", id })}
      >
        <div className="v03-bgw-head">
          <span className="v03-bgw-title">{TITLE[w.kind]}</span>
          {isPrivate(w.kind) ? <Lock size={11} className="v03-muted" aria-label="Only Alex" /> : null}
          {!phone ? (
            <span className="v03-tools" onPointerDown={(e) => e.stopPropagation()}>
              <button aria-label="Smaller" disabled={w.size === "s"} onClick={(e) => { e.stopPropagation(); act({ t: "resize", id, dir: -1 }); }}><Minus size={13} /></button>
              <button aria-label="Larger" disabled={w.size === "l"} onClick={(e) => { e.stopPropagation(); act({ t: "resize", id, dir: 1 }); }}><Plus size={13} /></button>
              <button aria-label="Bring forward" onClick={(e) => { e.stopPropagation(); act({ t: "pull", id }); }}><Maximize2 size={13} /></button>
              <button aria-label="Remove" onClick={(e) => { e.stopPropagation(); act({ t: "remove", id }); }}><X size={13} /></button>
            </span>
          ) : null}
        </div>
        <WidgetBody w={w} depth="bg" ctx={ctx} />
        {expert ? (
          <div className="v03-meta mt-2">
            {zone} {index + 1}/{count} · {w.size.toUpperCase()} · kept {w.keptAt ?? "–"}
          </div>
        ) : null}
      </div>
    );
  };

  const ghost = (zone: Zone) =>
    s.focus?.from?.zone === zone && focusW ? (
      <div key="ghost" className={`v03-ghost size-${focusW.size}`} aria-hidden>
        {TITLE[focusW.kind]} is in front
      </div>
    ) : null;

  const zoneItems = (z: Zone) => {
    const ids = s.bg[z];
    const out: ReactNode[] = ids.map((id, i) => bgWidget(id, z, i, ids.length));
    const g = ghost(z);
    if (g) out.splice(Math.min(s.focus!.from!.index, out.length), 0, g);
    return out;
  };

  const surfaceLabel = expert ? "Desk PC · left screen" : "Desk PC";

  const chrome = (
    <div className="v03-chrome">
      <div className="flex min-w-0 items-center gap-3">
        <span className="v03-wordmark">hux</span>
        <span className="v03-muted hidden truncate text-sm sm:inline">{surfaceLabel}</span>
        <div className="relative">
          <button className="v03-layoutbtn" onClick={() => setMenu(menu === "layouts" ? null : "layouts")} aria-expanded={menu === "layouts"}>
            <Layers size={14} />
            <span className="truncate">{s.active}</span>
            {edited ? (phone ? <span className="v03-pending-dot opacity-60" aria-label="changed" /> : <span className="v03-muted">· changed</span>) : null}
            <ChevronDown size={13} />
          </button>
          {menu === "layouts" ? (
            <div className="v03-pop left-0 top-9 w-64">
              <div className="v03-label px-2 pb-1">Layouts</div>
              {s.layouts.map((l) => (
                <button key={l.name} className="v03-popitem" onClick={() => { act({ t: "load", name: l.name }); setMenu(null); }}>
                  <span className="flex-1">{l.name}</span>
                  <span className="v03-muted text-xs">{Object.keys(l.widgets).length} kept</span>
                </button>
              ))}
              <form
                className="mt-2 flex gap-1 border-t v03-divide pt-2"
                onSubmit={(e) => { e.preventDefault(); if (saveName.trim()) { run(`Save this as my ${saveName.trim()} screen`); setSaveName(""); } }}
              >
                <input className="v03-field min-w-0 flex-1 rounded-md px-2 py-1 text-sm" placeholder="Save as…" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
                <button className="v03-btn" type="submit">Save</button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!phone ? <>{elsewhere()}<span className="v03-sep" /></> : null}
        <span className="v03-muted mr-1 hidden text-sm tabular-nums md:inline">Fri 9 Oct · {clock}</span>
        <button className="v03-icon" aria-label="Schedule" title="Schedule" onClick={() => run("Show my schedule")}><CalendarClock size={16} /></button>
        <button className="v03-icon" aria-label="Settings" title="Settings" onClick={() => run("Open settings")}><SettingsIcon size={16} /></button>
        <button className="v03-icon" aria-label={dark ? "Light mode" : "Dark mode"} onClick={() => setDark(!dark)}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
        <button className={`v03-modebtn ${expert ? "is-on" : ""}`} onClick={() => setExpert(!expert)} aria-pressed={expert}>Expert</button>
      </div>
    </div>
  );

  function elsewhere() {
    return (
      <div className="flex items-center gap-1.5" aria-label="Other screens">
        {SURFACES.map((sf) => {
          const items = s.elsewhere[sf.id];
          const asking = sf.id === "phone" && s.confirm;
          const isTarget = drag && typeof drag.target === "object" && drag.target?.surface === sf.id;
          return (
            <div key={sf.id} className="relative">
              <button
                data-surface={sf.id}
                className={`v03-tile kind-${sf.id} ${items.length ? "has" : ""} ${isTarget ? "is-target" : ""} ${drag ? "is-armed" : ""} ${asking ? "is-asking" : ""}`}
                onClick={() => setMenu(menu === sf.id ? null : sf.id)}
                title={sf.name}
                aria-label={`${sf.name}${items.length ? `, showing ${items.map((a) => TITLE[s.widgets[a.id].kind]).join(", ")}` : ""}`}
              >
                <span className="v03-tile-screen">
                  {items.slice(0, 2).map((a) => {
                    const w = s.widgets[a.id];
                    return <span key={a.id} className="v03-tile-item" style={{ viewTransitionName: `v03-${a.id}` } as CSSProperties}>{w.kind === "timer" ? mmss(timerLeft(w, nowMs)) : TITLE[w.kind].split(" ")[0]}</span>;
                  })}
                </span>
                {!phone ? <span className="v03-tile-name">{sf.short}</span> : null}
              </button>
              {menu === sf.id ? (
                <div className="v03-pop right-0 top-12 w-72">
                  <div className="flex items-baseline justify-between px-2">
                    <span className="font-medium">{sf.name}</span>
                    <span className="v03-muted text-xs">{sf.shared ? "Shared" : "Only Alex"}{expert ? ` · ${sf.screen ? "screen" : "voice only"} · online` : ""}</span>
                  </div>
                  {asking && s.confirm ? (
                    <div className="v03-ask mx-1 mt-2 rounded-lg p-3 text-sm">
                      <div>Show “{TITLE[s.widgets[s.confirm.id].kind]}” on the {surfaceName(s.confirm.to).toLowerCase()}? Anyone in the kitchen can read it.</div>
                      <div className="mt-2 flex gap-2">
                        <button className="v03-primary small" onClick={() => { act({ t: "confirm", yes: true }); setMenu(null); dispatch({ t: "log", ex: { id: crypto.randomUUID(), you: "Confirmed on Alex's phone", hux: `The email is on the ${surfaceName(s.confirm!.to).toLowerCase()}.`, at: clock, helper: "Chief" } }); setReplyFresh(true); }}>Show it</button>
                        <button className="v03-btn" onClick={() => { act({ t: "confirm", yes: false }); setMenu(null); }}>Not there</button>
                      </div>
                    </div>
                  ) : null}
                  {items.length ? (
                    <ul className="mt-1">
                      {items.map((a) => {
                        const w = s.widgets[a.id];
                        return (
                          <li key={a.id} className="flex items-center gap-2 px-2 py-1.5">
                            <span className="flex-1">{TITLE[w.kind]}{w.kind === "timer" ? <span className="v03-muted tabular-nums"> · {mmss(timerLeft(w, nowMs))}</span> : null}</span>
                            <button className="v03-btn" onClick={() => { run(`Bring the ${TITLE[w.kind].toLowerCase()} back from the ${sf.short.toLowerCase()}`); }}>Bring back</button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : !asking ? (
                    <p className="v03-muted px-2 pt-1 text-sm">{sf.screen ? "Nothing sent here. Drag a widget onto it." : "No screen. It can ring the timer."}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  const pendingNote =
    !s.approved && s.focus?.id !== "email" && !s.confirm ? (
      <button className="v03-pending" onClick={() => run(awayAt(s, "email") ? "Bring the email back" : "Show me the email to Todd")}>
        <span className="v03-pending-dot" />
        <span>Email to Todd needs your OK</span>
        <span className="v03-muted">· sends Mon 7:30</span>
      </button>
    ) : null;

  const lower = (
    <div className="v03-lower" ref={lowerRef}>
      <div className="v03-inputzone">
        {pendingNote}
        {last ? (
          <div className={`v03-reply ${replyFresh ? "is-fresh" : ""}`} aria-live="polite">
            {!phone ? <span className="v03-muted">{last.you} — </span> : null}
            <span>{last.hux}</span>
            {expert ? <span className="v03-meta ml-2">{last.helper} · Desk PC · on this network · {last.at}</span> : null}
          </div>
        ) : null}
        <div className="v03-chips">
          {chips.map((c) => (
            <button key={c} className={`v03-chip ${c === scriptLeft[0] ? "is-next" : ""}`} onClick={() => run(c)}>{c}</button>
          ))}
        </div>
        <div className="relative">
          {historyOpen ? <HistoryPanel s={s} expert={expert} /> : null}
          <form className={`v03-input ${listening ? "is-listening" : ""}`} onSubmit={(e) => { e.preventDefault(); run(text); }}>
            <button type="button" className="v03-icon" aria-label="History" aria-expanded={historyOpen} onClick={() => setHistoryOpen(!historyOpen)}><History size={17} /></button>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={listening ? "Listening…" : "Ask hux, or say where to put something"}
              aria-label="Ask hux"
              className="min-w-0 flex-1 bg-transparent text-[16px] outline-none"
            />
            <button type="button" className={`v03-mic ${listening ? "is-on" : ""}`} aria-label="Speak" onClick={voice}>
              {listening ? <span className="v03-bars"><i /><i /><i /></span> : <Mic size={18} />}
            </button>
            <button type="submit" className="v03-send" aria-label="Send" disabled={!text.trim()}><ArrowUp size={17} /></button>
          </form>
        </div>
      </div>
      {!phone ? <div className="v03-zone v03-zone-row v03-zone-bottom">{zoneItems("bottom")}</div> : null}
      <div className={phone ? "h-[60px]" : "h-[60px]"} />
    </div>
  );

  // ------------------------------------------------------------ focus card
  const focusCard = focusW ? (
    <FocusCard
      w={focusW}
      from={s.focus!.from}
      expert={expert}
      ctx={ctx}
      menu={menu}
      setMenu={setMenu}
      onGrip={(e) => !phone && startDrag(e, focusW.id)}
      onKeep={(z) => { act({ t: "keep", zone: z, at: clock }); setMenu(null); }}
      onSend={(to) => { run(`Send the ${focusW.kind === "week" ? "next week calendar" : TITLE[focusW.kind].toLowerCase()} to the ${surfaceName(to).toLowerCase()}`); setMenu(null); }}
      onClose={() => act({ t: "dismiss" })}
      onRemove={() => act({ t: "remove", id: focusW.id })}
      bg={s.bg}
      dragging={drag?.id === focusW.id}
    />
  ) : null;

  const totalBg = ZONES.reduce((n, z) => n + s.bg[z].length, 0);

  return (
    <div className={`v03 ${dark ? "dark" : ""} ${phone ? "is-phone" : ""} h-full`}>
      <div ref={surfaceRef} className={`v03-surface ${s.focus ? "has-focus" : "is-calm"}`}>
        {chrome}
        {phone ? <div className="v03-phone-tiles"><span className="v03-muted text-sm">{surfaceLabel}</span>{elsewhere()}</div> : null}

        {/* Background layer */}
        {phone ? (
          <div className="v03-bg v03-stack" style={{ paddingBottom: lowerH + 8 }}>
            {ZONES.flatMap((z) => zoneItems(z))}
            {totalBg === 0 && !s.focus ? <p className="v03-muted px-1 pt-6 text-sm">Nothing kept on this screen.</p> : null}
          </div>
        ) : (
          <div className="v03-bg v03-grid">
            <div className="v03-zone v03-zone-col v03-zone-left">{zoneItems("left")}</div>
            <div className="flex min-w-0 flex-col">
              <div className="v03-zone v03-zone-row v03-zone-top">{zoneItems("top")}</div>
              <div className="flex-1" />
              {lower}
            </div>
            <div className="v03-zone v03-zone-col v03-zone-right">{zoneItems("right")}</div>
          </div>
        )}

        {/* Veil between the layers */}
        <div className="v03-veil" onClick={() => act({ t: "dismiss" })} aria-hidden />

        {phone ? <div className="v03-phone-lower">{lower}</div> : null}

        {/* Focus layer */}
        <div className="v03-stage" style={{ bottom: lowerH + 4 }}>
          {focusCard}
        </div>

        {/* Drag targets */}
        {drag ? (
          <div className="v03-targets" aria-hidden>
            {(["left", "right", "top", "bottom", "focus"] as const).map((z) => (
              <div key={z} className={`v03-target t-${z} ${drag.target === z ? "is-on" : ""}`}>
                <span>{z === "focus" ? "Bring forward" : `Keep ${ZONE_WORD[z]}`}</span>
              </div>
            ))}
          </div>
        ) : null}
        {drag ? (
          <div className="v03-dragghost" style={{ left: drag.x, top: drag.y }}>
            {TITLE[s.widgets[drag.id]?.kind ?? "weather"]}
            {typeof drag.target === "object" && drag.target ? <span className="v03-muted"> → {surfaceName(drag.target.surface)}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FocusCard(props: {
  w: Widget;
  from?: { zone: Zone; index: number };
  expert: boolean;
  ctx: Ctx;
  menu: string | null;
  setMenu: (m: null | "keep" | "send") => void;
  onGrip: (e: React.PointerEvent) => void;
  onKeep: (z: Zone) => void;
  onSend: (to: SurfaceId) => void;
  onClose: () => void;
  onRemove: () => void;
  bg: State["bg"];
  dragging: boolean;
}) {
  const { w, from, expert, ctx, menu, setMenu } = props;
  const keepable = canKeep(w.kind);
  const suggested = from?.zone ?? emptiestZone(props.bg);
  const width: Record<string, string> = {
    email: "48rem", recipe: "54rem", schedule: "58rem", settings: "44rem", timer: "30rem", ideas: "34rem", week: "60rem", weather: "30rem", today: "30rem", shopping: "28rem",
  };
  const state = from ? `From ${ZONE_WORD[from.zone].replace("along ", "").replace("on ", "")}` : keepable ? "Passing" : null;
  return (
    <section
      className={`v03-focus ${props.dragging ? "is-dragged" : ""}`}
      style={{ viewTransitionName: `v03-${w.id}`, maxWidth: width[w.kind] } as CSSProperties}
      aria-label={TITLE[w.kind]}
    >
      <header className="v03-focus-head">
        <div className="flex min-w-0 flex-1 items-center gap-2" onPointerDown={props.onGrip}>
          <GripHorizontal size={16} className="v03-grip shrink-0" aria-hidden />
          <h2 className="truncate text-xl font-medium tracking-tight">{TITLE[w.kind]}</h2>
          {isPrivate(w.kind) ? <PrivateMark /> : null}
          {state ? <span className="v03-tag">{state}</span> : null}
        </div>
        <div className="flex items-center gap-1">
          {keepable ? (
            <div className="relative">
              <button className="v03-btn" onClick={() => setMenu(menu === "keep" ? null : "keep")} aria-expanded={menu === "keep"}>
                {from ? "Put back" : "Keep"} <ChevronDown size={13} />
              </button>
              {menu === "keep" ? (
                <div className="v03-pop right-0 top-10 w-56">
                  <div className="v03-label px-1 pb-2">Keep it</div>
                  <div className="v03-mini">
                    {ZONES.map((z) => (
                      <button key={z} className={`m-${z} ${z === suggested ? "is-suggested" : ""}`} onClick={() => props.onKeep(z)} aria-label={`Keep ${ZONE_WORD[z]}`}>
                        <span>{z === from?.zone ? "Back here" : z.charAt(0).toUpperCase() + z.slice(1)}</span>
                      </button>
                    ))}
                    <span className="m-centre" />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {keepable ? (
            <div className="relative">
              <button className="v03-icon" aria-label="Send to another screen" title="Send to another screen" onClick={() => setMenu(menu === "send" ? null : "send")}><Send size={15} /></button>
              {menu === "send" ? (
                <div className="v03-pop right-0 top-10 w-60">
                  {SURFACES.map((sf) => (
                    <button key={sf.id} className="v03-popitem" onClick={() => props.onSend(sf.id)}>
                      <span className="flex-1">{sf.name}</span>
                      <span className="v03-muted text-xs">{sf.shared ? "Shared" : "Only Alex"}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {from ? <button className="v03-icon" aria-label="Remove from this screen" title="Remove from this screen" onClick={props.onRemove}><Trash2 size={15} /></button> : null}
          <button className="v03-icon" aria-label={from ? "Put back" : "Close"} title={from ? "Put back (Esc)" : "Close (Esc)"} onClick={props.onClose}><X size={17} /></button>
        </div>
      </header>
      <div className="v03-focus-body">
        <WidgetBody w={w} depth="focus" ctx={ctx} />
      </div>
      {expert ? (
        <footer className="v03-meta px-6 pb-4">
          focus · {from ? `from ${from.zone} ${from.index + 1}` : keepable ? "passing" : "screen"} · shown {w.bornAt}
          {w.keptAt ? ` · kept ${w.keptAt}` : ""} · Desk PC left screen
        </footer>
      ) : null}
    </section>
  );
}

function HistoryPanel({ s, expert }: { s: State; expert: boolean }) {
  const earlier = conversation.map((m) => ({
    id: m.id,
    who: m.from === "member" ? "Alex" : "hux",
    text: m.text,
    at: new Date(m.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }),
    device: m.device === "kitchen" ? "Kitchen tablet" : "Desk PC",
  }));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, []);
  return (
    <div ref={ref} className="v03-history">
      <div className="v03-label pb-2">Today</div>
      {earlier.map((m) => (
        <div key={m.id} className="py-1 text-sm">
          <span className={m.who === "hux" ? "" : "v03-muted"}>{m.who === "hux" ? "" : "You: "}{m.text}</span>
          {expert ? <span className="v03-meta ml-2">{m.at} · {m.device}</span> : null}
        </div>
      ))}
      {s.log.map((e) => (
        <div key={e.id} className="py-1 text-sm">
          <div className="v03-muted">You: {e.you}</div>
          <div>{e.hux}{expert ? <span className="v03-meta ml-2">{e.at} · {e.helper}</span> : null}</div>
        </div>
      ))}
    </div>
  );
}
