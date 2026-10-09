// PROTOTYPE - widget bodies for concept 03 "Layers". Each renders at two depths: quiet background, crisp focus.
import { useState } from "react";
import { Check, ChevronRight, Lock, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { calendar, conversation, reminders, routines, settingsGroups, household, type Card } from "../../fixtures";
import type { Action, State, Widget } from "./model";

export type Depth = "bg" | "focus";
export type Ctx = {
  s: State;
  nowMs: number;
  expert: boolean;
  dispatch: (a: Action) => void;
  ask: (text: string) => void;
  prefill: (text: string) => void;
};

const recipe = conversation.find((m) => m.card?.type === "recipe")!.card as Extract<Card, { type: "recipe" }>;
const shopping = conversation.find((m) => m.card?.type === "shoppingList")!.card as Extract<Card, { type: "shoppingList" }>;
const weather = conversation.find((m) => m.card?.type === "weather")!.card as Extract<Card, { type: "weather" }>;
const approval = conversation.find((m) => m.card?.type === "approval")!.card as Extract<Card, { type: "approval" }>;
export const emailDraft = conversation.find((m) => m.card?.type === "emailDraft")!.card as Extract<Card, { type: "emailDraft" }>;

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", timeZone: "Europe/Berlin" });
const memberName = (id: string) => household.members.find((m) => m.id === id)?.name ?? id;

export function timerLeft(w: Widget, nowMs: number) {
  const t = w.timer!;
  return t.endsAt ? Math.min(t.minutes * 60_000, Math.max(0, t.endsAt - nowMs)) : t.left;
}
export const mmss = (ms: number) => {
  const sec = Math.ceil(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};

export function WidgetBody({ w, depth, ctx }: { w: Widget; depth: Depth; ctx: Ctx }) {
  switch (w.kind) {
    case "weather": return <Weather w={w} depth={depth} />;
    case "today": return <Today w={w} depth={depth} />;
    case "shopping": return <Shopping w={w} depth={depth} ctx={ctx} />;
    case "ideas": return <Ideas ctx={ctx} />;
    case "recipe": return <Recipe w={w} depth={depth} ctx={ctx} />;
    case "timer": return <Timer w={w} depth={depth} ctx={ctx} />;
    case "email": return <Email ctx={ctx} />;
    case "week": return <Week w={w} depth={depth} />;
    case "schedule": return <Schedule ctx={ctx} />;
    case "settings": return <Settings ctx={ctx} />;
  }
}

export function PrivateMark() {
  return (
    <span className="v03-private" title="Private to Alex">
      <Lock size={11} strokeWidth={2.2} /> Only Alex
    </span>
  );
}

function Weather({ w, depth }: { w: Widget; depth: Depth }) {
  const big = depth === "focus" || w.size === "l";
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className={big ? "text-5xl font-light tabular-nums" : w.size === "s" ? "text-2xl font-light tabular-nums" : "text-3xl font-light tabular-nums"}>{weather.temp}°</span>
        <span className="v03-muted text-sm">{weather.now} · {weather.place}</span>
      </div>
      {w.size !== "s" || depth === "focus" ? (
        <>
          <p className="mt-2 text-sm">Tomorrow {weather.high}° / {weather.low}°. Dry until mid-afternoon, light rain from 17:00.</p>
          <div className={`mt-3 grid grid-cols-5 gap-1 ${big ? "h-24" : "h-14"}`}>
            {weather.hourly.map((h) => (
              <div key={h.time} className="flex flex-col items-center justify-end gap-1">
                <div className="v03-rain w-full rounded-sm" style={{ height: `${Math.max(4, h.rain)}%` }} title={`${h.rain}% rain`} />
                <span className="v03-muted text-center text-[11px] leading-tight tabular-nums">{h.time}:00<br />{h.temp}°</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Today({ w, depth }: { w: Widget; depth: Depth }) {
  const tomorrow = calendar.filter((c) => c.start.startsWith("2026-10-10"));
  const bag = reminders.find((r) => r.id === "r3")!;
  const lottery = routines.find((r) => r.id === "j2")!;
  return (
    <div className={depth === "focus" ? "space-y-4 text-base" : "space-y-2 text-sm"}>
      <div>
        <div className="v03-label">Fri 9 Oct</div>
        <Row time="22:00" text={lottery.title} />
      </div>
      {w.size !== "s" || depth === "focus" ? (
        <div>
          <div className="v03-label">Tomorrow</div>
          <Row time="8:15" text={`${bag.title} · ${memberName(bag.for)}`} />
          {tomorrow.map((c) => <Row key={c.id} time={fmtTime(c.start)} text={c.title} />)}
        </div>
      ) : null}
    </div>
  );
}

function Row({ time, text }: { time: string; text: string }) {
  return (
    <div className="flex gap-3 py-0.5">
      <span className="v03-muted w-11 shrink-0 tabular-nums">{time}</span>
      <span className="min-w-0">{text}</span>
    </div>
  );
}

function Shopping({ w, depth, ctx }: { w: Widget; depth: Depth; ctx: Ctx }) {
  const done = new Set(w.done ?? []);
  const items = shopping.items;
  const shown = depth === "bg" && w.size === "s" ? items.filter((i) => !done.has(i.name)) : items;
  return (
    <div>
      <ul className={depth === "focus" ? "space-y-2 text-base" : "space-y-1 text-sm"}>
        {shown.map((i) => {
          const isDone = done.has(i.name);
          const toggle = () => {
            const next = new Set(done);
            if (isDone) next.delete(i.name); else next.add(i.name);
            ctx.dispatch({ t: "patch", id: w.id, patch: { done: [...next] } });
          };
          return (
            <li key={i.name} className="flex items-center gap-2">
              {depth === "focus" ? (
                <button onClick={toggle} className={`v03-check ${isDone ? "is-on" : ""}`} aria-label={`${isDone ? "Untick" : "Tick"} ${i.name}`}>
                  {isDone ? <Check size={12} strokeWidth={3} /> : null}
                </button>
              ) : (
                <span className={`v03-dot ${isDone ? "opacity-30" : ""}`} />
              )}
              <span className={isDone ? "v03-muted line-through" : ""}>{i.name}</span>
            </li>
          );
        })}
      </ul>
      {depth === "focus" ? <p className="v03-muted mt-3 text-sm">Also on {shopping.sentTo}. Reminds you at the supermarket.</p> : null}
    </div>
  );
}

const IDEAS = [
  { name: "Vegetable frittata", time: "25 min", note: "You have almost everything", cmd: "Show the frittata recipe" },
  { name: "Lemon garlic pasta", time: "15 min", note: "Needs a lemon", cmd: "" },
  { name: "Chickpea curry", time: "30 min", note: "Needs coconut milk", cmd: "" },
];

function Ideas({ ctx }: { ctx: Ctx }) {
  return (
    <ul className="divide-y v03-divide">
      {IDEAS.map((i, n) => (
        <li key={i.name}>
          <button
            className="flex w-full items-center gap-4 py-3 text-left disabled:cursor-default"
            disabled={!i.cmd}
            onClick={() => i.cmd && ctx.ask(i.cmd)}
          >
            <span className="v03-muted w-5 text-sm tabular-nums">{n + 1}</span>
            <span className="flex-1">
              <span className="block text-lg">{i.name}</span>
              <span className="v03-muted text-sm">{i.time} · {i.note}</span>
            </span>
            {i.cmd ? <ChevronRight size={18} className="v03-muted" /> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Recipe({ w, depth, ctx }: { w: Widget; depth: Depth; ctx: Ctx }) {
  const step = w.step ?? 0;
  if (depth === "bg") {
    if (w.size === "s") return <p className="text-sm">{recipe.time} · step {step + 1} of {recipe.steps.length}</p>;
    return (
      <ol className="space-y-1.5 text-sm">
        {recipe.steps.map((st, i) => (
          <li key={i} className={`flex gap-2 ${i === step ? "v03-current" : i < step ? "opacity-40" : ""}`}>
            <span className="w-4 shrink-0 tabular-nums">{i + 1}</span>
            <span className={w.size === "m" && i !== step ? "line-clamp-1" : ""}>{st}</span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_14rem]">
      <ol className="space-y-1">
        {recipe.steps.map((st, i) => (
          <li key={i}>
            <button
              onClick={() => ctx.dispatch({ t: "patch", id: w.id, patch: { step: i } })}
              className={`v03-step flex w-full gap-3 rounded-lg px-3 py-2 text-left ${i === step ? "is-on" : i < step ? "opacity-45" : ""}`}
            >
              <span className="v03-muted w-5 shrink-0 tabular-nums">{i + 1}</span>
              <span className="text-[17px] leading-snug">{st}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="space-y-4 text-sm">
        <div className="v03-muted">{recipe.time} · serves {recipe.serves}</div>
        <div>
          <div className="v03-label">You have</div>
          <ul className="mt-1 space-y-0.5">{recipe.have.map((h) => <li key={h}>{h}</li>)}</ul>
        </div>
        <div>
          <div className="v03-label">Still need</div>
          <ul className="mt-1 space-y-0.5">{recipe.need.map((h) => <li key={h}>{h}</li>)}</ul>
          <p className="v03-muted mt-1">On your shopping list.</p>
        </div>
      </div>
    </div>
  );
}

function Timer({ w, depth, ctx }: { w: Widget; depth: Depth; ctx: Ctx }) {
  const t = w.timer!;
  const left = timerLeft(w, ctx.nowMs);
  const done = left <= 0;
  const frac = 1 - left / (t.minutes * 60_000);
  const running = !!t.endsAt && !done;
  const size = depth === "focus" ? "text-8xl" : w.size === "s" ? "text-3xl" : w.size === "m" ? "text-5xl" : "text-6xl";
  return (
    <div>
      <div className={`${size} font-light tabular-nums tracking-tight ${done ? "v03-accent" : ""}`}>{done ? "Done" : mmss(left)}</div>
      <div className="v03-track mt-3 h-1 overflow-hidden rounded-full">
        <div className="v03-fill h-full rounded-full" style={{ width: `${Math.min(100, frac * 100)}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="v03-muted">{t.minutes} min · frittata</span>
        {depth === "focus" ? (
          <span className="flex gap-1">
            <button
              className="v03-btn"
              onClick={() =>
                ctx.dispatch({
                  t: "patch", id: w.id,
                  patch: { timer: running ? { ...t, endsAt: null, left } : { ...t, endsAt: Date.now() + left } },
                })
              }
            >
              {running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
            </button>
            <button className="v03-btn" onClick={() => ctx.dispatch({ t: "patch", id: w.id, patch: { timer: { ...t, endsAt: Date.now() + t.minutes * 60_000, left: t.minutes * 60_000 } } })}>
              <RotateCcw size={14} /> Restart
            </button>
          </span>
        ) : !running && !done ? <span className="v03-muted">Paused</span> : null}
      </div>
    </div>
  );
}

function Email({ ctx }: { ctx: Ctx }) {
  const { s } = ctx;
  const words = s.emailBody.trim().split(/\s+/).length;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[4.5rem_1fr] gap-y-1 text-sm">
        <span className="v03-muted">To</span><span>{emailDraft.to}</span>
        <span className="v03-muted">Subject</span><span>{emailDraft.subject}</span>
        <span className="v03-muted">Sends</span><span>{approval.when}</span>
      </div>
      <textarea
        className="v03-field h-64 w-full resize-none rounded-xl p-4 text-[16px] leading-relaxed"
        value={s.emailBody}
        onChange={(e) => ctx.dispatch({ t: "email", body: e.target.value })}
        aria-label="Email text"
      />
      <div className="flex flex-wrap items-center gap-3">
        {s.approved ? (
          <span className="v03-muted text-sm">Approved. Goes out {approval.when}.</span>
        ) : (
          <button className="v03-primary" onClick={() => ctx.ask("Approve the email")}>
            <Check size={16} /> Approve
          </button>
        )}
        <span className="v03-muted text-sm">{words} words · no attachments</span>
        {ctx.expert ? <span className="v03-meta">Writer · asks before sending · draft 15:10</span> : null}
      </div>
    </div>
  );
}

function Week({ w, depth }: { w: Widget; depth: Depth }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 9, 12 + i, 10));
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" }) };
  });
  const items = [
    ...calendar.map((c) => ({ day: c.start.slice(0, 10), time: fmtTime(c.start), text: c.title })),
    { day: "2026-10-12", time: "7:30", text: "Email to Todd goes out" },
    { day: "2026-10-12", time: "17:00", text: "Library books (Mia)" },
    { day: "2026-10-16", time: "9:00", text: "Follow up with Todd" },
  ].sort((a, b) => a.time.padStart(5, "0").localeCompare(b.time.padStart(5, "0")));
  const compact = depth === "bg" && w.size !== "l";
  return (
    <div className={`grid grid-cols-7 gap-2 ${depth === "focus" ? "text-sm" : "text-xs"}`}>
      {days.map((d) => {
        const its = items.filter((i) => i.day === d.key);
        return (
          <div key={d.key} className="min-w-0">
            <div className="v03-label mb-1">{d.label}</div>
            <div className="space-y-1">
              {its.slice(0, compact ? 2 : 9).map((i) => (
                <div key={i.text} className="v03-event rounded-md px-1.5 py-1">
                  <div className="v03-muted tabular-nums">{i.time}</div>
                  <div className={compact ? "truncate" : ""}>{i.text}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
void fmtDay;

// ---------------------------------------------------------------------------------------------
// The two predesigned screens. They only ever live in the focus layer.

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`v03-toggle ${on ? "is-on" : ""}`}>
      <span />
    </button>
  );
}

function Schedule({ ctx }: { ctx: Ctx }) {
  const { s, expert } = ctx;
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <h3 className="v03-h">Reminders</h3>
        <ul className="divide-y v03-divide">
          {reminders.map((r) => (
            <li key={r.id} className="py-2.5">
              <div>{r.title}</div>
              <div className="v03-muted text-sm">{r.when} · {memberName(r.for)}</div>
            </li>
          ))}
        </ul>
        <h3 className="v03-h mt-6">Calendar</h3>
        <ul className="divide-y v03-divide">
          {calendar.map((c) => (
            <li key={c.id} className="flex gap-3 py-2.5">
              <span className="v03-muted w-20 shrink-0 text-sm tabular-nums">{fmtDay(c.start)} {fmtTime(c.start)}</span>
              <span>{c.title}{expert ? <span className="v03-meta ml-2">{c.calendar}</span> : null}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="v03-h">Routines</h3>
        <ul className="divide-y v03-divide">
          {routines.map((r) => {
            const on = r.id === "j4" && s.approved ? true : s.routinesOn[r.id] ?? r.enabled;
            return (
              <li key={r.id} className="flex items-start gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div>{r.title}</div>
                  <div className="v03-muted text-sm">{r.when} · {r.where}</div>
                  {r.id === "j4" ? <div className="text-sm v03-accent">{s.approved ? "Approved" : "Waiting for your OK"}</div> : null}
                  {expert ? <div className="v03-meta mt-0.5">last {r.lastRun} · next {on ? r.nextRun : "paused"}</div> : null}
                </div>
                <Toggle on={on} label={r.title} onChange={(v) => ctx.dispatch({ t: "routine", id: r.id, on: v })} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Settings({ ctx }: { ctx: Ctx }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="divide-y v03-divide">
      {settingsGroups.map((g) => {
        const isOpen = open === g.id;
        return (
          <li key={g.id}>
            <button className="flex w-full items-center gap-3 py-3 text-left" onClick={() => setOpen(isOpen ? null : g.id)} aria-expanded={isOpen}>
              <span className="flex-1">{g.title}</span>
              <span className="v03-muted text-sm">{g.summary}</span>
              <ChevronRight size={16} className={`v03-muted transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </button>
            {isOpen ? (
              <div className="pb-4 pl-1">
                <ul className="space-y-1.5 text-sm">
                  {g.simple.map((i) => <li key={i}>{i}</li>)}
                </ul>
                {ctx.expert ? (
                  <>
                    <div className="v03-label mt-3">Expert</div>
                    <ul className="mt-1 space-y-1.5 text-sm">{g.expert.map((i) => <li key={i}>{i}</li>)}</ul>
                  </>
                ) : null}
                <button className="v03-btn mt-3" onClick={() => ctx.prefill(`Change ${g.title.toLowerCase()}: `)}>
                  <Sparkles size={14} /> Ask hux to change this
                </button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
