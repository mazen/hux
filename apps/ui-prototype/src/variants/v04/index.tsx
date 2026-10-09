// PROTOTYPE - concept 04 "Scenes": a Surface always shows one named scene; asking edits it, every edit leaves an undoable trace.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp, CalendarDays, Check, CornerDownLeft, Ellipsis, GripVertical, Lock, MessageSquare, Mic, Monitor, Moon, Pin, Settings,
  Smartphone, Speaker, Sun, Tablet, Undo2, X,
} from "lucide-react";
import { conversation, helpers, now } from "../../fixtures";
import {
  AREAS, DEMO, SIZES, activeScene, areaName, areaWords, bringBack, editActive, initialWorld, interpret, isPrivate, kindHelper, kindTitle,
  moveAway, placeAway, surfaces, type Area, type Outcome, type SurfaceId, type Widget, type World,
} from "./model";
import { email, fmt, timerLeft, widgetTitle, WidgetBody, type Ctx, type TimerState } from "./widgets";
import { Schedule, SettingsList, Sheet } from "./panels";
import "./styles.css";

export const name = "Scenes";

type Trace = { key: number; text: string; expert?: string; scene: string; hue: string; at: string; undone?: boolean };
type Line = { who: "you" | "hux"; text: string; at: string };

const colW = { s: "15rem", m: "20rem", l: "27rem" } as const;
const mainW = { s: "max-w-[22rem]", m: "max-w-[36rem]", l: "max-w-[52rem]" } as const;
const bottomW = { s: "md:w-[16rem]", m: "md:w-[26rem]", l: "md:flex-1" } as const;
const surfaceIcon = { kitchen: Tablet, phone: Smartphone, speaker: Speaker } as const;

const earlier: Line[] = conversation.map((m) => ({
  who: m.from === "member" ? "you" : "hux",
  text: m.text,
  at: new Date(m.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }),
}));

export default function Variant() {
  const [dark, setDark] = useState(() => typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches);
  const [expert, setExpert] = useState(false);
  const [world, setWorld] = useState<World>(initialWorld);
  const [past, setPast] = useState<{ world: World; text: string }[]>([]);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [traceDim, setTraceDim] = useState(false);
  const [reply, setReply] = useState("");
  const [log, setLog] = useState<Line[]>(earlier);
  const [panel, setPanel] = useState<"schedule" | "settings" | null>(null);
  const [timers, setTimers] = useState<Record<string, TimerState>>({});
  const [emailBody, setEmailBody] = useState(email.body.replace("next week", "over coffee on Tuesday"));
  const [approved, setApproved] = useState(false);
  const [shopping, setShopping] = useState(() => (conversation.find((m) => m.card?.type === "shoppingList")!.card as { items: { name: string; done: boolean }[] }).items);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overArea, setOverArea] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [sceneMenu, setSceneMenu] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [confirm, setConfirm] = useState<{ widget: Widget; to: SurfaceId } | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const started = useRef(Date.now());
  const seq = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!trace) return;
    setTraceDim(false);
    const t = setTimeout(() => setTraceDim(true), 9000);
    return () => clearTimeout(t);
  }, [trace]);

  const clock = () => new Date(now.getTime() + (Date.now() - started.current)).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
  const newId = (k: string) => `${k}-${++seq.current}`;
  const scene = activeScene(world);

  const commit = (next: World, text: string, exp?: string) => {
    setPast((p) => [...p.slice(-30), { world, text }]);
    setReply("");
    setWorld(next);
    const sc = activeScene(next);
    setTrace({ key: Date.now(), text, expert: exp, scene: sc.name, hue: sc.hue, at: clock() });
  };
  const say = (text: string) => {
    setReply(text);
    if (text) setLog((l) => [...l, { who: "hux", text, at: clock() }]);
  };
  const undo = () => {
    const last = past[past.length - 1];
    if (!last) return say("Nothing to undo.");
    setPast((p) => p.slice(0, -1));
    setWorld(last.world);
    const sc = activeScene(last.world);
    setTrace({ key: Date.now(), text: `Undone: ${last.text}`, scene: sc.name, hue: sc.hue, at: clock(), undone: true });
    say("Undone.");
  };
  const startTimer = (id: string, minutes: number) => {
    const total = minutes * 60000;
    setTimers((t) => ({ ...t, [id]: { total, endAt: Date.now() + total, left: total } }));
  };

  const apply = (o: Outcome) => {
    if (o.undo) return undo();
    if (o.world) {
      if (o.trace) commit(o.world, o.trace, o.traceExpert);
      else setWorld(o.world);
    }
    if (o.timer) startTimer(o.timer.id, o.timer.minutes);
    if (o.open) setPanel(o.open);
    if (o.approve) setApproved(true);
    if (o.confirm) setConfirm(o.confirm);
    say(o.reply);
  };

  const run = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setLog((l) => [...l, { who: "you", text, at: clock() }]);
    const o = interpret(text, world, clock(), newId, approved);
    const d = DEMO.find((x) => x.toLowerCase() === text.toLowerCase());
    if (d && o.ok !== false) setDone((s) => new Set(s).add(d));
    apply(o);
    setInput("");
    setMenu(null);
  };

  // Direct manipulation
  const moveTo = (id: string, area: Area) => {
    const w = [...scene.widgets, ...world.passing].find((x) => x.id === id);
    if (!w) {
      const r = bringBack(world, id, clock());
      if (r) commit(r.world, r.trace);
      return;
    }
    if (w.area === area && !w.passing) return;
    if (w.passing) {
      const text = `${kindTitle[w.kind]} kept ${areaWords[area]}`;
      return commit(editActive(world, [...scene.widgets, { ...w, area, passing: false }], text, clock(), world.passing.filter((x) => x.id !== id)), text, `${id}: passing → ${area}`);
    }
    const text = `${kindTitle[w.kind]} moved ${areaWords[area]}`;
    commit(editActive(world, scene.widgets.map((x) => (x.id === id ? { ...x, area } : x)), text, clock()), text, `${id}: ${w.area} → ${area}`);
  };
  const resize = (id: string, dir: -1 | 1) => {
    const w = [...scene.widgets, ...world.passing].find((x) => x.id === id)!;
    const i = SIZES.indexOf(w.size) + dir;
    if (i < 0 || i > 2) return;
    const size = SIZES[i];
    if (w.passing) return setWorld({ ...world, passing: world.passing.map((x) => (x.id === id ? { ...x, size } : x)) });
    const text = `${kindTitle[w.kind]} made ${dir < 0 ? "smaller" : "bigger"}`;
    commit(editActive(world, scene.widgets.map((x) => (x.id === id ? { ...x, size } : x)), text, clock()), text, `${id}: size ${w.size} → ${size}`);
  };
  const keep = (id: string) => {
    const w = world.passing.find((x) => x.id === id)!;
    const text = `${kindTitle[w.kind]} kept ${areaWords[w.area]}`;
    commit(editActive(world, [...scene.widgets, { ...w, passing: false }], text, clock(), world.passing.filter((x) => x.id !== id)), text);
  };
  const unkeep = (id: string) => {
    const w = scene.widgets.find((x) => x.id === id)!;
    const text = `${kindTitle[w.kind]} taken out of ${scene.name}`;
    commit(editActive(world, scene.widgets.filter((x) => x.id !== id), text, clock(), [...world.passing, { ...w, passing: true }]), text);
  };
  const close = (id: string) => {
    const p = world.passing.find((x) => x.id === id);
    if (p) return setWorld({ ...world, passing: world.passing.filter((x) => x.id !== id) });
    const w = scene.widgets.find((x) => x.id === id)!;
    const text = `${kindTitle[w.kind]} removed`;
    commit(editActive(world, scene.widgets.filter((x) => x.id !== id), text, clock()), text);
  };
  const sendTo = (id: string, to: SurfaceId) => {
    const r = moveAway(world, id, to, clock());
    if (r.world && r.trace) commit(r.world, r.trace);
    if (r.confirm) setConfirm(r.confirm);
    say(r.reply);
    setMenu(null);
  };
  const back = (id: string) => {
    const r = bringBack(world, id, clock());
    if (r) {
      commit(r.world, r.trace);
      say("");
    }
  };
  const confirmOnPhone = (yes: boolean) => {
    if (!confirm) return;
    if (yes) {
      const r = placeAway(world, confirm.widget, confirm.to, clock());
      commit(r.world, r.trace);
      say(`Confirmed on your phone. ${kindTitle[confirm.widget.kind]} is on ${surfaces.find((s) => s.id === confirm.to)!.short} now.`);
    } else say("It stays here.");
    setConfirm(null);
  };
  const switchTo = (id: string) => {
    if (id === world.active) return setSceneMenu((v) => !v);
    const sc = world.scenes.find((s) => s.id === id)!;
    commit({ ...world, active: id }, `Switched to ${sc.name}`);
    setSceneMenu(false);
  };

  const ctx: Ctx = {
    nowMs, timers,
    toggleTimer: (id) => setTimers((t) => {
      const s = t[id];
      if (!s) return t;
      return { ...t, [id]: s.endAt ? { ...s, endAt: null, left: Math.max(0, s.endAt - Date.now()) } : { ...s, endAt: Date.now() + s.left } };
    }),
    resetTimer: (id) => setTimers((t) => (t[id] ? { ...t, [id]: { ...t[id], endAt: Date.now() + t[id].total, left: t[id].total } } : t)),
    emailBody, setEmailBody, approved,
    approve: () => { setApproved(true); say("Approved. It goes out Monday at 7:30."); },
    shopping, toggleItem: (i) => setShopping((s) => s.map((x, j) => (j === i ? { ...x, done: !x.done } : x))),
    run,
  };

  // What's where
  const visible = [...world.passing, ...scene.widgets];
  const inArea = (a: Area) => [...world.passing.filter((x) => x.area === a), ...scene.widgets.filter((x) => x.area === a)];
  const dragging = !!dragId;
  const has = (a: Area) => dragging || inArea(a).length > 0;
  const widest = (a: Area) => {
    const ws = inArea(a);
    if (!ws.length) return "12rem";
    return colW[ws.some((x) => x.size === "l") ? "l" : ws.some((x) => x.size === "m") ? "m" : "s"];
  };
  const cols: string[] = [];
  const row: string[] = [];
  if (has("left")) { cols.push(widest("left")); row.push("left"); }
  cols.push("minmax(0,1fr)"); row.push("main");
  if (has("right")) { cols.push(widest("right")); row.push("right"); }
  const areasCss = `"${row.join(" ")}"${has("bottom") ? ` "${row.map(() => "bottom").join(" ")}"` : ""}`;
  const shown = AREAS.filter((a) => a === "main" || has(a));

  // Suggestions: next demo steps, plus what makes sense right now
  const chips = useMemo(() => {
    const next = DEMO.filter((d) => !done.has(d)).slice(0, 3);
    const extra: string[] = [];
    const cooking = world.scenes.find((s) => s.id === "cooking");
    if (cooking && !cooking.rule) extra.push("Show it when someone is in the kitchen after 18:00");
    if (visible.some((x) => x.kind === "recipe") && !done.has("Move the recipe to the kitchen tablet")) extra.push("Move the recipe to the kitchen tablet");
    if (!cooking && done.size === 0) extra.push("Set up a cooking screen");
    extra.push("Show my schedule", "Open settings");
    return [...next, ...extra.filter((e) => !next.includes(e))].slice(0, 6);
  }, [done, world, visible]);

  const surfaceLabel = expert ? "Desk PC · left screen" : "Desk PC";
  const chief = helpers.find((h) => h.id === "chief")!;
  const empty = visible.length === 0;

  return (
    <div className={`v04 ${dark ? "dark" : ""} relative flex h-full flex-col overflow-hidden`} style={{ ["--hue" as string]: scene.hue }}>
      {/* Top bar: wordmark, scene strip, quiet surface identity, the two fixed screens, modes */}
      <header className="relative z-20 flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 md:h-12 md:flex-nowrap md:px-5 md:py-0">
        <span className="mr-auto text-[17px] font-semibold tracking-tight md:mr-1">hux</span>
        <nav aria-label="Scenes" className="no-scrollbar -mx-3 order-last flex w-[calc(100%+24px)] min-w-0 items-center gap-1 overflow-x-auto px-3 md:order-none md:mx-0 md:w-auto md:flex-1 md:px-0">
          {world.scenes.map((s) => {
            const on = s.id === world.active;
            return (
              <button
                key={s.id}
                onClick={() => switchTo(s.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors ${on ? "bg-[var(--card)] font-medium shadow-sm ring-1 ring-[var(--line)]" : "text-[var(--mute)] hover:text-[var(--ink)]"}`}
              >
                <span className="size-2 rounded-full" style={{ background: s.hue }} />
                {s.name}
                {expert && s.rule && <span className="mono text-[10px] text-[var(--faint)]">{s.rule.expert.split(" · ")[0]}</span>}
              </button>
            );
          })}
        </nav>
        <span className="hidden items-center gap-1.5 text-xs text-[var(--faint)] md:flex" title="This screen">
          <Monitor size={13} /> {surfaceLabel}
          {expert && <span className="mono">· {chief.name} · {chief.model}</span>}
        </span>
        <IconBtn label="Schedule" onClick={() => setPanel("schedule")}><CalendarDays size={17} /></IconBtn>
        <IconBtn label="Settings" onClick={() => setPanel("settings")}><Settings size={17} /></IconBtn>
        <button onClick={() => setExpert(!expert)} className="rounded-full px-2 py-1 text-xs text-[var(--mute)] ring-1 ring-[var(--line)] hover:text-[var(--ink)]">{expert ? "Expert" : "Simple"}</button>
        <IconBtn label={dark ? "Light mode" : "Dark mode"} onClick={() => setDark(!dark)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</IconBtn>

        {sceneMenu && (
          <>
            <button aria-label="Close" className="fixed inset-0 z-10 cursor-default" onClick={() => setSceneMenu(false)} />
            <div className="absolute left-3 top-full z-20 mt-1 w-80 max-w-[calc(100vw-24px)] rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-xl md:left-14">
              <p className="flex items-center gap-2 font-medium"><span className="size-2 rounded-full" style={{ background: scene.hue }} />{scene.name}</p>
              <p className="mt-1 text-sm text-[var(--mute)]">{scene.rule ? `Comes on by itself: ${scene.rule.simple}` : "Comes on when you ask for it"}</p>
              {expert && scene.rule && <p className="mono mt-1 text-[11px] text-[var(--faint)]">rule: {scene.rule.expert}</p>}
              <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--faint)]">Changes today</p>
              {scene.changes.length === 0 ? <p className="mt-1 text-sm text-[var(--mute)]">None</p> : (
                <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto">
                  {[...scene.changes].reverse().map((c, i) => (
                    <li key={i} className="flex gap-3 text-sm"><span className="mono w-10 shrink-0 text-xs leading-5 text-[var(--faint)]">{c.at}</span>{c.text}</li>
                  ))}
                </ul>
              )}
              {past.length > 0 && <button onClick={() => { undo(); setSceneMenu(false); }} className="mt-3 flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1.5 text-sm hover:bg-[var(--soft)]"><Undo2 size={14} /> Undo last change</button>}
            </div>
          </>
        )}
      </header>

      {/* The Surface: the scene laid out on named areas */}
      <main
        key={scene.id}
        className="scene-in sg min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-1 md:overflow-hidden md:px-5"
        style={{ ["--cols" as string]: cols.join(" "), ["--areas" as string]: areasCss, ["--rows" as string]: has("bottom") ? "minmax(0,1fr) auto" : "minmax(0,1fr)" }}
      >
        {shown.map((a) => {
          const items = inArea(a);
          const hot = dragging && overArea === a;
          return (
            <section
              key={a}
              data-area={a}
              style={{ gridArea: a }}
              onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverArea(a); } }}
              onDragLeave={() => setOverArea((o) => (o === a ? null : o))}
              onDrop={(e) => { e.preventDefault(); if (dragId) moveTo(dragId, a); setDragId(null); setOverArea(null); }}
              className={`relative shrink-0 rounded-2xl transition-colors md:min-h-0 md:overflow-y-auto ${dragging ? "min-h-24 outline-1 outline-dashed outline-[var(--faint)]" : ""} ${hot ? "bg-[color-mix(in_oklab,var(--hue)_12%,transparent)] outline-[var(--hue)]" : ""} ${expert && !dragging ? "outline-1 outline-dotted outline-[var(--line)]" : ""}`}
            >
              {(dragging || expert) && <span className="mono pointer-events-none absolute bottom-1 right-2 z-10 text-[10px] uppercase tracking-wider text-[var(--faint)]">{areaName[a]}</span>}
              <div className={a === "bottom" ? "flex flex-col gap-3 md:flex-row md:items-start" : a === "main" ? "flex flex-col items-center gap-3 md:pt-2" : "flex flex-col gap-3"}>
                {items.map((w) => (
                  <Frame
                    key={w.id}
                    w={w}
                    area={a}
                    ctx={ctx}
                    expert={expert}
                    sceneName={scene.name}
                    menuOpen={menu === w.id}
                    setMenu={(o) => setMenu(o ? w.id : null)}
                    onDragStart={() => setDragId(w.id)}
                    onDragEnd={() => { setDragId(null); setOverArea(null); }}
                    onMove={(ar) => { moveTo(w.id, ar); setMenu(null); }}
                    onResize={(d) => { resize(w.id, d); }}
                    onKeep={() => keep(w.id)}
                    onUnkeep={() => { unkeep(w.id); setMenu(null); }}
                    onClose={() => close(w.id)}
                    onSend={(s) => sendTo(w.id, s)}
                    waiting={confirm?.widget.id === w.id}
                  />
                ))}
              </div>
              {a === "main" && empty && !dragging && (
                <p className="pointer-events-none mt-[18vh] text-center text-sm text-[var(--faint)]">{scene.name} is empty</p>
              )}
            </section>
          );
        })}
      </main>

      {/* Dock: trace, short reply, suggestions, input. Other Surfaces sit to the right (above on phones). */}
      <footer className="relative z-10 shrink-0 px-3 pb-[64px] pt-1 md:grid md:grid-cols-[1fr_minmax(0,44rem)_1fr] md:gap-4 md:px-5">
        <div className="hidden md:block" />
        <div className="space-y-2">
          <div className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-1">
            {trace && (
              <div key={trace.key} className={`trace-in flex items-center gap-2 rounded-full bg-[var(--card)] py-1 pl-3 pr-1 text-xs ring-1 ring-[var(--line)] transition-opacity duration-700 ${traceDim ? "opacity-60" : ""}`}>
                <span className="size-1.5 rounded-full" style={{ background: trace.hue }} />
                <span className="hidden text-[var(--mute)] sm:inline">{trace.undone || /^Switched|saved|created|now comes on/.test(trace.text) ? "" : `${trace.scene} changed · `}</span>
                <span>{trace.text}</span>
                {expert && <span className="mono text-[10px] text-[var(--faint)]">{trace.at}{trace.expert ? ` · ${trace.expert}` : ""}</span>}
                {!trace.undone && past.length > 0 && (
                  <button onClick={undo} className="flex items-center gap-1 rounded-full px-2 py-0.5 font-medium hover:bg-[var(--soft)]"><Undo2 size={12} /> Undo</button>
                )}
              </div>
            )}
            {reply && <p className="text-sm text-[var(--mute)]"><span className="font-medium text-[var(--ink)]">hux</span> {reply}</p>}
          </div>

          <div className="md:hidden">
            <SurfacesRail world={world} ctx={ctx} expert={expert} dragId={dragId} onDrop={(s) => { if (dragId) sendTo(dragId, s); setDragId(null); }} onBack={back} confirm={confirm} onConfirm={confirmOnPhone} />
          </div>

          <div className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:px-0">
            {!approved && !visible.some((x) => x.kind === "email") && (
              <button onClick={() => run("Show me the email to Todd")} className="flex shrink-0 items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,#D9A441_18%,var(--card))] px-3 py-1 text-xs ring-1 ring-[color-mix(in_oklab,#D9A441_45%,transparent)]">
                <span className="size-1.5 rounded-full bg-[#D9A441]" /> Email to Todd needs your OK
              </button>
            )}
            {chips.map((c, i) => (
              <button key={c} onClick={() => run(c)} className={`shrink-0 rounded-full px-3 py-1 text-xs ring-1 ring-[var(--line)] hover:bg-[var(--card)] ${i === 0 ? "bg-[var(--card)] text-[var(--ink)]" : "text-[var(--mute)]"}`}>{c}</button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); run(input); }}
            className="relative flex items-center gap-1 rounded-2xl bg-[var(--card)] p-1.5 shadow-sm ring-1 ring-[var(--line)] focus-within:ring-[var(--hue)]"
          >
            <button type="button" aria-label="Speak" onClick={() => {
              setListening(true);
              setTimeout(() => { setListening(false); run(chips[0]); }, 1400);
            }} className={`grid size-9 shrink-0 place-items-center rounded-xl ${listening ? "listening bg-[var(--hue)] text-white" : "text-[var(--mute)] hover:bg-[var(--soft)]"}`}><Mic size={18} /></button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Listening…" : `Ask hux, or change ${scene.name}`}
              className="min-w-0 flex-1 bg-transparent px-1 text-[15px] outline-none placeholder:text-[var(--faint)]"
            />
            <button type="button" aria-label="Conversation" onClick={() => setHistoryOpen(!historyOpen)} className="grid size-9 shrink-0 place-items-center rounded-xl text-[var(--mute)] hover:bg-[var(--soft)]"><MessageSquare size={17} /></button>
            <button type="submit" aria-label="Send" disabled={!input.trim()} className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--ink)] text-[var(--bg)] disabled:opacity-30"><ArrowUp size={18} /></button>

            {historyOpen && (
              <div className="absolute inset-x-0 bottom-full mb-2 max-h-[50vh] overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-xl">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">Conversation</p>
                  <button type="button" aria-label="Close" onClick={() => setHistoryOpen(false)}><X size={16} /></button>
                </div>
                <ul className="space-y-2">
                  {log.map((l, i) => (
                    <li key={i} className="flex gap-3 text-sm"><span className="mono w-10 shrink-0 text-xs leading-5 text-[var(--faint)]">{l.at}</span><span className={l.who === "you" ? "" : "text-[var(--mute)]"}><b className="font-medium">{l.who === "you" ? "Alex" : "hux"}</b> {l.text}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </div>
        <div className="hidden items-end justify-end md:flex">
          <SurfacesRail world={world} ctx={ctx} expert={expert} dragId={dragId} onDrop={(s) => { if (dragId) sendTo(dragId, s); setDragId(null); }} onBack={back} confirm={confirm} onConfirm={confirmOnPhone} />
        </div>
      </footer>

      {menu && <button aria-label="Close menu" className="fixed inset-0 z-[5] cursor-default" onClick={() => setMenu(null)} />}

      {panel === "schedule" && <Sheet title="Schedule" onClose={() => setPanel(null)}><Schedule expert={expert} /></Sheet>}
      {panel === "settings" && (
        <Sheet title="Settings" onClose={() => setPanel(null)}>
          <SettingsList expert={expert} ask={(t) => { setPanel(null); setInput(t); setTimeout(() => inputRef.current?.focus(), 0); }} />
        </Sheet>
      )}
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button aria-label={label} title={label} onClick={onClick} className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--mute)] hover:bg-[var(--soft)] hover:text-[var(--ink)]">{children}</button>;
}

type FrameProps = {
  w: Widget; area: Area; ctx: Ctx; expert: boolean; sceneName: string; menuOpen: boolean; waiting: boolean;
  setMenu: (o: boolean) => void; onDragStart: () => void; onDragEnd: () => void; onMove: (a: Area) => void; onResize: (d: -1 | 1) => void;
  onKeep: () => void; onUnkeep: () => void; onClose: () => void; onSend: (s: SurfaceId) => void;
};

function Frame(p: FrameProps) {
  const { w, area, expert } = p;
  const width = area === "main" ? `w-full ${mainW[w.size]}` : area === "bottom" ? `w-full ${bottomW[w.size]}` : "w-full";
  const helper = helpers.find((h) => h.name === kindHelper[w.kind])!;
  return (
    <article
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", w.id); p.onDragStart(); }}
      onDragEnd={p.onDragEnd}
      className={`w-in group relative shrink-0 rounded-2xl bg-[var(--card)] ${width} ${w.passing ? "border border-dashed border-[var(--faint)]" : "border border-[var(--line)] shadow-[0_1px_2px_rgba(0,0,0,.04)]"} ${p.menuOpen ? "z-30" : ""}`}
    >
      <header className="flex h-10 items-center gap-1.5 pl-2 pr-1.5">
        <GripVertical size={14} className="hidden shrink-0 cursor-grab text-[var(--faint)] opacity-0 transition-opacity group-hover:opacity-100 md:block" />
        <h3 className="min-w-0 truncate text-sm font-medium">{widgetTitle(w)}</h3>
        {isPrivate(w.kind) && <Lock size={12} className="shrink-0 text-[var(--faint)]" aria-label="Only Alex" />}
        {w.passing && <span className="shrink-0 text-xs text-[var(--faint)]">Just for now</span>}
        {p.waiting && <span className="shrink-0 text-xs text-[var(--mute)]">Waiting for your phone</span>}
        <span className="flex-1" />
        {w.passing && (
          <button onClick={p.onKeep} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-[var(--mute)] hover:bg-[var(--soft)] hover:text-[var(--ink)]"><Pin size={12} /> Keep</button>
        )}
        <div className="relative">
          <button aria-label="More" onClick={() => p.setMenu(!p.menuOpen)} className="grid size-7 place-items-center rounded-full text-[var(--mute)] hover:bg-[var(--soft)]"><Ellipsis size={16} /></button>
          {p.menuOpen && (
            <div className="absolute right-0 top-8 z-40 w-56 rounded-xl border border-[var(--line)] bg-[var(--card)] p-1.5 text-sm shadow-xl">
              <MenuLabel>Place in {p.sceneName}</MenuLabel>
              <div className="grid grid-cols-4 gap-1 px-1 pb-1">
                {AREAS.map((a) => (
                  <button key={a} onClick={() => p.onMove(a)} className={`rounded-md py-1 text-xs ${a === area && !w.passing ? "bg-[var(--ink)] text-[var(--bg)]" : "ring-1 ring-[var(--line)] hover:bg-[var(--soft)]"}`}>{areaName[a]}</button>
                ))}
              </div>
              <MenuLabel>Size</MenuLabel>
              <div className="grid grid-cols-2 gap-1 px-1 pb-1">
                <button disabled={w.size === "s"} onClick={() => p.onResize(-1)} className="rounded-md py-1 text-xs ring-1 ring-[var(--line)] hover:bg-[var(--soft)] disabled:opacity-40">Smaller</button>
                <button disabled={w.size === "l"} onClick={() => p.onResize(1)} className="rounded-md py-1 text-xs ring-1 ring-[var(--line)] hover:bg-[var(--soft)] disabled:opacity-40">Bigger</button>
              </div>
              <MenuLabel>Move to another screen</MenuLabel>
              {surfaces.map((s) => {
                const Icon = surfaceIcon[s.id];
                const ok = s.screen || w.kind === "timer";
                return (
                  <button key={s.id} disabled={!ok} onClick={() => p.onSend(s.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[var(--soft)] disabled:opacity-40">
                    <Icon size={14} className="text-[var(--mute)]" /> {s.name}
                    {isPrivate(w.kind) && s.shared && ok && <Lock size={11} className="ml-auto text-[var(--faint)]" />}
                  </button>
                );
              })}
              <div className="my-1 border-t border-[var(--line)]" />
              {w.passing ? (
                <button onClick={p.onKeep} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[var(--soft)]"><Pin size={14} /> Keep in {p.sceneName}</button>
              ) : (
                <button onClick={p.onUnkeep} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[var(--soft)]"><Pin size={14} /> Take out of {p.sceneName}</button>
              )}
            </div>
          )}
        </div>
        <button aria-label={w.passing ? "Dismiss" : "Remove"} onClick={p.onClose} className="grid size-7 place-items-center rounded-full text-[var(--mute)] hover:bg-[var(--soft)]"><X size={15} /></button>
      </header>
      <div className={`relative px-4 ${expert ? "pb-2" : "pb-4"}`}><WidgetBody w={w} ctx={p.ctx} /></div>
      {expert && (
        <footer className="mono border-t border-[var(--line)] px-4 py-1.5 text-[10px] text-[var(--faint)]">
          {w.id} · {w.passing ? "passing" : `area ${area}`} · size {w.size} · {helper.name} · {helper.model} · {w.at}
        </footer>
      )}
    </article>
  );
}

function MenuLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--faint)]">{children}</p>;
}

/** The household's other Surfaces, small and live. Drop a widget on one to move it there; bring it back from here. */
function SurfacesRail(p: {
  world: World; ctx: Ctx; expert: boolean; dragId: string | null; onDrop: (s: SurfaceId) => void; onBack: (id: string) => void;
  confirm: { widget: Widget; to: SurfaceId } | null; onConfirm: (yes: boolean) => void;
}) {
  const [over, setOver] = useState<SurfaceId | null>(null);
  return (
    <div className="flex w-full gap-2 md:w-auto md:max-w-full md:flex-wrap md:justify-end">
      {surfaces.map((s) => {
        const Icon = surfaceIcon[s.id];
        const items = p.world.away[s.id];
        const asking = s.id === "phone" && p.confirm;
        const hot = p.dragId && over === s.id;
        return (
          <div
            key={s.id}
            onDragOver={(e) => { if (p.dragId) { e.preventDefault(); setOver(s.id); } }}
            onDragLeave={() => setOver((o) => (o === s.id ? null : o))}
            onDrop={(e) => { e.preventDefault(); setOver(null); p.onDrop(s.id); }}
            className={`min-w-0 flex-1 rounded-xl px-2.5 py-2 text-xs transition-all md:w-36 md:flex-none ${p.dragId ? "outline-1 outline-dashed outline-[var(--faint)]" : ""} ${hot ? "scale-[1.03] bg-[color-mix(in_oklab,var(--hue)_14%,var(--card))] outline-[var(--hue)]" : "bg-[color-mix(in_oklab,var(--card)_60%,transparent)] ring-1 ring-[var(--line)]"}`}
          >
            <p className="flex items-center gap-1.5 font-medium"><Icon size={13} className="shrink-0 text-[var(--mute)]" /><span className="truncate">{s.name}</span></p>
            {asking ? (
              <div className="mt-1 space-y-1">
                <p className="text-[var(--mute)]">Show the email on the kitchen tablet?</p>
                <div className="flex gap-1">
                  <button onClick={() => p.onConfirm(true)} className="flex items-center gap-1 rounded-full bg-[var(--ink)] px-2 py-0.5 text-[var(--bg)]"><Check size={11} /> Confirm</button>
                  <button onClick={() => p.onConfirm(false)} className="rounded-full px-2 py-0.5 ring-1 ring-[var(--line)]">No</button>
                </div>
              </div>
            ) : items.length === 0 ? (
              <p className={`mt-0.5 truncate text-[var(--faint)] ${p.dragId ? "" : "hidden md:block"}`}>{p.dragId ? (s.screen ? "Drop to move here" : "Timers only") : s.showing}</p>
            ) : (
              <ul className="mt-1 space-y-0.5">
                {items.map((w) => (
                  <li key={w.id} className="flex items-center gap-1">
                    {isPrivate(w.kind) && <Lock size={10} className="shrink-0 text-[var(--faint)]" />}
                    <span className="truncate">{w.kind === "timer" ? "Timer" : kindTitle[w.kind]}</span>
                    {w.kind === "timer" && <span className="text-[var(--mute)]"><TimerMini w={w} ctx={p.ctx} /></span>}
                    <button aria-label={`Bring the ${kindTitle[w.kind].toLowerCase()} back`} title="Bring back here" onClick={() => p.onBack(w.id)} className="ml-auto grid size-5 shrink-0 place-items-center rounded-full text-[var(--mute)] hover:bg-[var(--soft)] hover:text-[var(--ink)]"><CornerDownLeft size={11} /></button>
                  </li>
                ))}
              </ul>
            )}
            {p.expert && <p className="mono mt-1 truncate text-[9px] text-[var(--faint)]">{s.expert}</p>}
          </div>
        );
      })}
    </div>
  );
}

function TimerMini({ w, ctx }: { w: Widget; ctx: Ctx }) {
  const left = timerLeft(ctx.timers[w.id], ctx.nowMs);
  return <span className="mono tabular-nums">{left === 0 ? "done" : fmt(left)}</span>;
}
