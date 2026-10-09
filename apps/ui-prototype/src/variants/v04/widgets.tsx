// PROTOTYPE - concept 04 "Scenes": widget bodies. One family: same frame, same type scale, size s/m/l.
import { useState } from "react";
import { Check, Lock, Pause, Play, RotateCcw } from "lucide-react";
import { calendar, conversation, portfolioBriefing, type Card } from "../../fixtures";
import type { Size, Widget } from "./model";

type Recipe = Extract<Card, { type: "recipe" }>;
type Weather = Extract<Card, { type: "weather" }>;
type Email = Extract<Card, { type: "emailDraft" }>;
type Portfolio = Extract<Card, { type: "portfolio" }>;
const card = <T extends Card["type"]>(type: T) => conversation.find((m) => m.card?.type === type)!.card as Extract<Card, { type: T }>;
export const recipe: Recipe = card("recipe");
export const weather: Weather = card("weather");
export const email: Email = card("emailDraft");
const money = portfolioBriefing as Portfolio;

export type TimerState = { total: number; endAt: number | null; left: number };
export const timerLeft = (s: TimerState | undefined, nowMs: number) => (!s ? 0 : s.endAt ? Math.max(0, s.endAt - nowMs) : s.left);
export const fmt = (ms: number) => {
  const sec = Math.ceil(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};

export type Ctx = {
  nowMs: number;
  timers: Record<string, TimerState>;
  toggleTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  emailBody: string;
  setEmailBody: (s: string) => void;
  approved: boolean;
  approve: () => void;
  shopping: { name: string; done: boolean }[];
  toggleItem: (i: number) => void;
  run: (cmd: string) => void;
};

export function widgetTitle(w: Widget): string {
  switch (w.kind) {
    case "recipe": return recipe.title;
    case "timer": return `Timer · ${w.minutes ?? 10} min`;
    case "email": return "Email to Todd";
    case "today": return "Today and the weekend";
    case "week": return "Next week · 12 to 18 Oct";
    case "weather": return weather.place;
    case "shopping": return "Shopping list";
    case "money": return "Portfolio";
    case "ideas": return "Quick dinners";
  }
}

const muted = "text-[var(--mute)]";
const label = "text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--faint)]";

export function WidgetBody({ w, ctx }: { w: Widget; ctx: Ctx }) {
  const s = w.size;
  switch (w.kind) {
    case "ideas": return <Ideas ctx={ctx} />;
    case "recipe": return <RecipeBody size={s} />;
    case "timer": return <TimerBody w={w} ctx={ctx} />;
    case "email": return <EmailBody size={s} ctx={ctx} />;
    case "today": return <Today size={s} />;
    case "week": return <Week />;
    case "weather": return <WeatherBody size={s} />;
    case "shopping": return <Shopping size={s} ctx={ctx} />;
    case "money": return <Money size={s} />;
  }
}

function Ideas({ ctx }: { ctx: Ctx }) {
  const rows = [
    { name: "Vegetable frittata", note: "Fits what's in your fridge", cmd: "Show the frittata recipe on the right and keep it there" },
    { name: "Lemon garlic pasta", note: "" },
    { name: "Chickpea curry", note: "" },
  ];
  return (
    <ul className="divide-y divide-[var(--line)]">
      {rows.map((r) => (
        <li key={r.name}>
          <button disabled={!r.cmd} onClick={() => r.cmd && ctx.run(r.cmd)} className="flex w-full items-baseline justify-between gap-3 py-2 text-left enabled:hover:text-[var(--hue)]">
            <span className="font-medium">{r.name}</span>
            {r.note && <span className={`text-xs ${muted}`}>{r.note}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

function RecipeBody({ size }: { size: Size }) {
  const [step, setStep] = useState(0);
  const meta = <p className={`text-sm ${muted}`}>{recipe.time} · serves {recipe.serves} · you need {recipe.need.map((n) => n.toLowerCase()).join(" and ")}</p>;
  if (size === "s") return <div className="space-y-1">{meta}<p className="text-sm">Step {step + 1} of {recipe.steps.length}: {recipe.steps[step]}</p><StepNav step={step} setStep={setStep} /></div>;
  return (
    <div className={size === "l" ? "grid gap-5 sm:grid-cols-[1fr_1.6fr]" : "space-y-3"}>
      <div className="space-y-2">
        {meta}
        <div>
          <p className={label}>You have</p>
          <p className="text-sm">{recipe.have.join(", ")}</p>
        </div>
      </div>
      <ol className="space-y-1.5">
        {recipe.steps.map((st, i) => (
          <li key={i}>
            <button onClick={() => setStep(i)} className={`flex w-full gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm ${i === step ? "bg-[var(--soft)] text-[var(--ink)]" : muted}`}>
              <span className="mono w-4 shrink-0 text-xs leading-5">{i + 1}</span>
              <span>{st}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepNav({ step, setStep }: { step: number; setStep: (n: number) => void }) {
  return (
    <div className="flex gap-2 pt-1 text-xs">
      <button className="rounded-full border border-[var(--line)] px-2.5 py-1 disabled:opacity-40" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
      <button className="rounded-full border border-[var(--line)] px-2.5 py-1 disabled:opacity-40" disabled={step === recipe.steps.length - 1} onClick={() => setStep(step + 1)}>Next step</button>
    </div>
  );
}

export function TimerBody({ w, ctx, compact }: { w: Widget; ctx: Ctx; compact?: boolean }) {
  const st = ctx.timers[w.id];
  const left = timerLeft(st, ctx.nowMs);
  const running = !!st?.endAt && left > 0;
  const pct = st ? 1 - left / st.total : 0;
  if (compact) return <span className="mono tabular-nums">{left === 0 ? "Done" : fmt(left)}</span>;
  return (
    <div className="flex items-center gap-4">
      <div className={`mono tabular-nums tracking-tight ${w.size === "s" ? "text-3xl" : w.size === "m" ? "text-5xl" : "text-7xl"} ${left === 0 ? "text-[var(--hue)]" : ""}`}>{left === 0 ? "Done" : fmt(left)}</div>
      <div className="ml-auto flex gap-1.5">
        <button aria-label={running ? "Pause" : "Resume"} onClick={() => ctx.toggleTimer(w.id)} className="grid size-9 place-items-center rounded-full border border-[var(--line)] hover:bg-[var(--soft)]">{running ? <Pause size={16} /> : <Play size={16} />}</button>
        <button aria-label="Start over" onClick={() => ctx.resetTimer(w.id)} className="grid size-9 place-items-center rounded-full border border-[var(--line)] hover:bg-[var(--soft)]"><RotateCcw size={16} /></button>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--line)]"><div className="h-full bg-[var(--hue)] transition-[width] duration-1000 ease-linear" style={{ width: `${pct * 100}%` }} /></div>
    </div>
  );
}

function EmailBody({ size, ctx }: { size: Size; ctx: Ctx }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[4.5rem_1fr] gap-y-1 text-sm">
        <span className={muted}>To</span><span>{email.to}</span>
        <span className={muted}>Subject</span><span>{email.subject}</span>
        <span className={muted}>Sends</span><span>Mon 12 Oct, 7:30</span>
      </div>
      <textarea
        value={ctx.emailBody}
        onChange={(e) => ctx.setEmailBody(e.target.value)}
        rows={size === "l" ? 11 : size === "m" ? 8 : 4}
        className="w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--card2)] p-3 text-sm leading-relaxed outline-none focus:border-[var(--hue)]"
      />
      <div className="flex items-center gap-3">
        <span className={`flex items-center gap-1 text-xs ${muted}`}><Lock size={12} /> Only Alex</span>
        {ctx.approved ? (
          <span className="ml-auto flex items-center gap-1.5 text-sm text-[var(--hue)]"><Check size={16} /> Approved for Monday 7:30</span>
        ) : (
          <button onClick={ctx.approve} className="ml-auto rounded-full bg-[var(--ink)] px-4 py-1.5 text-sm font-medium text-[var(--bg)]">Approve</button>
        )}
      </div>
    </div>
  );
}

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", timeZone: "Europe/Berlin" });

function Today({ size }: { size: Size }) {
  const weekend = calendar.filter((c) => c.start < "2026-10-12");
  return (
    <div className="space-y-2 text-sm">
      <p>Nothing else tonight.</p>
      {size !== "s" && <p className={label}>Weekend</p>}
      <ul className="space-y-1">
        {weekend.slice(0, size === "s" ? 1 : 3).map((c) => (
          <li key={c.id} className="flex gap-3"><span className={`mono w-20 shrink-0 text-xs leading-5 ${muted}`}>{fmtDay(c.start)} {fmtTime(c.start)}</span><span>{c.title}</span></li>
        ))}
      </ul>
    </div>
  );
}

function Week() {
  const days = ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {days.map((d) => {
        const evs = calendar.filter((c) => c.start.startsWith(d));
        const date = new Date(`${d}T12:00:00+02:00`);
        return (
          <div key={d} className="min-h-16 rounded-lg bg-[var(--card2)] p-2">
            <p className={`text-xs ${muted}`}>{date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}</p>
            {evs.map((c) => (
              <p key={c.id} className="mt-1 text-sm leading-snug"><span className={`mono text-xs ${muted}`}>{fmtTime(c.start)}</span> {c.title}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function WeatherBody({ size }: { size: Size }) {
  if (size === "s") return <p className="text-sm"><span className="text-lg font-medium">{weather.temp}°</span> <span className={muted}>{weather.now}</span></p>;
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-medium tracking-tight">{weather.temp}°</span>
        <span className={`text-sm ${muted}`}>{weather.now} · {weather.high}° / {weather.low}°</span>
      </div>
      <p className="text-sm">Tomorrow: dry until mid-afternoon, then light rain.</p>
      {size === "l" && (
        <div className="grid grid-cols-5 gap-1 text-center text-xs">
          {weather.hourly.map((h) => (
            <div key={h.time} className="rounded-lg bg-[var(--card2)] py-2">
              <p className={muted}>{h.time}:00</p>
              <p className="text-sm font-medium">{h.temp}°</p>
              <p className={muted}>{h.rain}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Shopping({ size, ctx }: { size: Size; ctx: Ctx }) {
  const items = size === "s" ? ctx.shopping.filter((i) => !i.done) : ctx.shopping;
  return (
    <div className="space-y-1.5">
      <ul className="space-y-1">
        {items.map((it) => {
          const i = ctx.shopping.indexOf(it);
          return (
            <li key={it.name}>
              <button onClick={() => ctx.toggleItem(i)} className="flex items-center gap-2.5 text-sm">
                <span className={`grid size-4 place-items-center rounded border ${it.done ? "border-[var(--hue)] bg-[var(--hue)] text-white" : "border-[var(--faint)]"}`}>{it.done && <Check size={11} />}</span>
                <span className={it.done ? `line-through ${muted}` : ""}>{it.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {size !== "s" && <p className={`text-xs ${muted}`}>Also on Alex's phone</p>}
    </div>
  );
}

function Money({ size }: { size: Size }) {
  return (
    <div className="space-y-2 text-sm">
      <p><span className="text-2xl font-medium">{money.total}</span> <span className={muted}>{money.change} today</span></p>
      {size !== "s" && money.lines.map((l) => (
        <p key={l.name} className="flex justify-between"><span>{l.name}</span><span className={muted}>{l.value}</span></p>
      ))}
      <p className={`flex items-center gap-1 text-xs ${muted}`}><Lock size={12} /> Only Alex</p>
    </div>
  );
}
