// PROTOTYPE - widget bodies. One family: same type scale, same row rhythm, no decoration of their own.
import { Check, Pause, Play, RotateCcw, Plus } from "lucide-react";
import { calendar, conversation, reminders, routines, settingsGroups, household } from "../../fixtures";
import type { Kind } from "./tree";

const recipe = conversation.find((m) => m.card?.type === "recipe")!.card as Extract<NonNullable<(typeof conversation)[number]["card"]>, { type: "recipe" }>;
const shopping = conversation.find((m) => m.card?.type === "shoppingList")!.card as Extract<NonNullable<(typeof conversation)[number]["card"]>, { type: "shoppingList" }>;
const email = conversation.find((m) => m.card?.type === "emailDraft")!.card as Extract<NonNullable<(typeof conversation)[number]["card"]>, { type: "emailDraft" }>;
const weather = conversation.find((m) => m.card?.type === "weather")!.card as Extract<NonNullable<(typeof conversation)[number]["card"]>, { type: "weather" }>;
export const approval = conversation.find((m) => m.card?.type === "approval")!.card as Extract<NonNullable<(typeof conversation)[number]["card"]>, { type: "approval" }>;
export { recipe as recipeCard, shopping as shoppingCard, email as emailCard };

export const titles: Record<Kind, string> = {
  weather: "Weather", today: "Calendar", shopping: "Shopping list", recipe: recipe.title, timer: "Timer",
  email: "Email to Todd", week: "Next week", schedule: "Schedule", settings: "Settings", ideas: "Dinner ideas", history: "Conversation",
};

export type Timer = { total: number; left: number; running: boolean };
export type Shared = {
  timer: Timer; setTimer: (f: (t: Timer) => Timer) => void;
  shop: { name: string; done: boolean }[]; toggleShop: (i: number) => void;
  step: number; setStep: (i: number) => void;
  mail: { subject: string; body: string; approved: boolean }; setMail: (m: Partial<Shared["mail"]>) => void;
  routinesOn: Record<string, boolean>; toggleRoutine: (id: string) => void;
  expert: boolean;
  history: { who: string; text: string; at: string }[];
  ask: (text: string) => void;
  prefill: (text: string) => void;
};

export type Size = { w: number; h: number };

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", timeZone: "Europe/Berlin" });
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function Body({ kind, size, compact, s }: { kind: Kind; size: Size; compact?: boolean; s: Shared }) {
  const small = compact || size.h < 150 || size.w < 220;
  switch (kind) {
    case "weather": return <Weather small={small} wide={size.w > 420} />;
    case "today": return <Today />;
    case "shopping": return <Shopping s={s} />;
    case "recipe": return <Recipe s={s} wide={size.w > 560} />;
    case "timer": return <TimerView s={s} small={small} />;
    case "email": return <Email s={s} />;
    case "week": return <Week wide={size.w > 640} />;
    case "schedule": return <Schedule s={s} wide={size.w > 760} />;
    case "settings": return <Settings s={s} wide={size.w > 700} />;
    case "ideas": return <Ideas s={s} wide={size.w > 620} />;
    case "history": return <History s={s} />;
  }
}

function Weather({ small, wide }: { small: boolean; wide: boolean }) {
  if (small)
    return (
      <div className="flex items-baseline gap-2">
        <span className="v02-num text-xl leading-none">{weather.temp}°</span>
        <span className="v02-mute text-sm">{weather.now}</span>
      </div>
    );
  return (
    <div className={wide ? "flex items-end justify-between gap-6" : "space-y-3"}>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="v02-num text-4xl">{weather.temp}°</span>
          <span className="v02-mute text-sm">{weather.now} · {weather.place}</span>
        </div>
        <div className="v02-mute mt-1 text-sm">Tomorrow {weather.low}° to {weather.high}°, rain from 17:00</div>
      </div>
      <div className="flex gap-3">
        {weather.hourly.map((h) => (
          <div key={h.time} className="text-center">
            <div className="v02-mute text-xs">{h.time}:00</div>
            <div className="v02-num text-sm">{h.temp}°</div>
            <div className={`text-xs ${h.rain >= 40 ? "v02-accent" : "v02-mute"}`}>{h.rain}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Today() {
  const upcoming = calendar.filter((c) => c.start < "2026-10-12");
  return (
    <ul className="v02-rows">
      <li><span className="v02-mute w-16 shrink-0">Today</span><span>Nothing planned</span></li>
      {upcoming.map((c) => (
        <li key={c.id}>
          <span className="v02-mute w-16 shrink-0">{fmtDay(c.start)}</span>
          <span className="v02-num w-12 shrink-0">{fmtTime(c.start)}</span>
          <span className="min-w-0 truncate">{c.title}</span>
        </li>
      ))}
    </ul>
  );
}

function Shopping({ s }: { s: Shared }) {
  return (
    <div>
      <ul className="v02-rows">
        {s.shop.map((it, i) => (
          <li key={it.name}>
            <button className={`v02-check ${it.done ? "on" : ""}`} onClick={() => s.toggleShop(i)} aria-label={`${it.done ? "Untick" : "Tick"} ${it.name}`}>
              {it.done && <Check size={12} />}
            </button>
            <span className={it.done ? "v02-mute line-through" : ""}>{it.name}</span>
          </li>
        ))}
      </ul>
      <div className="v02-mute mt-2 text-xs">Also on {shopping.sentTo}</div>
    </div>
  );
}

function Recipe({ s, wide }: { s: Shared; wide: boolean }) {
  return (
    <div className={wide ? "grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6" : "space-y-4"}>
      <div className="space-y-3">
        <div className="v02-mute text-sm">{recipe.time} · serves {recipe.serves}</div>
        <div>
          <div className="v02-label">You have</div>
          <ul className="text-sm leading-6">{recipe.have.map((h) => <li key={h}>{h}</li>)}</ul>
        </div>
        <div>
          <div className="v02-label">Still needed</div>
          <ul className="text-sm leading-6">{recipe.need.map((h) => <li key={h}>{h} <span className="v02-mute">· on the list</span></li>)}</ul>
        </div>
      </div>
      <ol className="space-y-2">
        {recipe.steps.map((st, i) => (
          <li key={i}>
            <button onClick={() => s.setStep(i)} className={`v02-step ${i === s.step ? "now" : i < s.step ? "done" : ""}`}>
              <span className="v02-num w-5 shrink-0">{i + 1}</span>
              <span>{st}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TimerView({ s, small }: { s: Shared; small: boolean }) {
  const t = s.timer;
  const done = t.left === 0;
  const controls = (
    <div className="flex gap-1.5">
      <button className="v02-btn" onClick={() => s.setTimer((x) => ({ ...x, running: !x.running && x.left > 0 }))} aria-label={t.running ? "Pause" : "Resume"}>
        {t.running ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button className="v02-btn" onClick={() => s.setTimer((x) => ({ ...x, left: x.left + 300, total: x.total + 300, running: true }))} aria-label="Add 5 minutes">
        <Plus size={14} />5
      </button>
      <button className="v02-btn" onClick={() => s.setTimer((x) => ({ ...x, left: x.total, running: false }))} aria-label="Reset">
        <RotateCcw size={14} />
      </button>
    </div>
  );
  return (
    <div className={`flex h-full ${small ? "items-center justify-between gap-3" : "flex-col justify-center gap-3"}`}>
      <div>
        <div className={`v02-num ${small ? "text-3xl" : "text-6xl"} ${done ? "v02-accent" : ""}`}>{done ? "Done" : mmss(t.left)}</div>
        {!small && <div className="v02-mute text-sm">Frittata · {t.running ? `ends ${endsAt(t.left)}` : done ? "the frittata is ready" : "paused"}</div>}
      </div>
      <div className={`v02-bar ${small ? "!flex-1" : "w-full"}`}><i style={{ width: `${(1 - t.left / t.total) * 100}%` }} /></div>
      {controls}
    </div>
  );
}

export function endsAt(left: number) {
  const d = new Date(Date.now() + left * 1000);
  // Shift the real clock onto the fixture's 18:40.
  const base = new Date("2026-10-09T18:40:00+02:00").getTime() + (d.getTime() - startedReal);
  return new Date(base).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
}
const startedReal = Date.now();
export function clock() {
  return new Date(new Date("2026-10-09T18:40:00+02:00").getTime() + (Date.now() - startedReal))
    .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
}

function Email({ s }: { s: Shared }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="v02-rows">
        <li className="list-none"><span className="v02-mute w-16 shrink-0">To</span><span>{email.to}</span></li>
        <li className="list-none">
          <span className="v02-mute w-16 shrink-0">Subject</span>
          <input className="v02-field" value={s.mail.subject} onChange={(e) => s.setMail({ subject: e.target.value })} />
        </li>
      </div>
      <textarea className="v02-field min-h-32 flex-1 resize-none leading-6" value={s.mail.body} onChange={(e) => s.setMail({ body: e.target.value })} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="v02-mute text-sm">
          {s.mail.approved ? `Approved · goes out ${approval.when}` : `Goes out ${approval.when} once you approve`}
          {s.expert && " · Writer · on this network"}
        </span>
        {!s.mail.approved && <button className="v02-btn primary" onClick={() => s.setMail({ approved: true })}>Approve</button>}
      </div>
    </div>
  );
}

function Week({ wide }: { wide: boolean }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`2026-10-${12 + i}T12:00:00+02:00`);
    const key = `2026-10-${12 + i}`;
    return { d, key, items: calendar.filter((c) => c.start.startsWith(key)) };
  });
  if (!wide)
    return (
      <ul className="v02-rows">
        {days.filter((d) => d.items.length).flatMap((d) =>
          d.items.map((c) => (
            <li key={c.id}>
              <span className="v02-mute w-16 shrink-0">{fmtDay(c.start)}</span>
              <span className="v02-num w-12 shrink-0">{fmtTime(c.start)}</span>
              <span className="truncate">{c.title}</span>
            </li>
          )))}
      </ul>
    );
  return (
    <div className="grid h-full grid-cols-7 gap-px overflow-hidden rounded-md bg-[var(--line)]">
      {days.map(({ d, key, items }) => (
        <div key={key} className="min-w-0 bg-[var(--tile)] p-2">
          <div className="v02-mute text-xs">{d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}</div>
          {items.map((c) => (
            <div key={c.id} className="v02-event mt-1.5">
              <div className="v02-num text-xs">{fmtTime(c.start)}</div>
              <div className="text-sm leading-snug">{c.title}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const memberName = (id: string) => household.members.find((m) => m.id === id)?.name ?? "";

function Schedule({ s, wide }: { s: Shared; wide: boolean }) {
  return (
    <div className={wide ? "grid grid-cols-3 gap-6" : "space-y-5"}>
      <section>
        <div className="v02-label">Reminders</div>
        <ul className="v02-rows">
          {reminders.map((r) => (
            <li key={r.id} className="!items-start">
              <div className="min-w-0">
                <div>{r.title}</div>
                <div className="v02-mute text-xs">{r.when} · {memberName(r.for)}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <div className="v02-label">Calendar</div>
        <ul className="v02-rows">
          {calendar.map((c) => (
            <li key={c.id}>
              <span className="v02-mute w-14 shrink-0">{fmtDay(c.start)}</span>
              <span className="v02-num w-11 shrink-0">{fmtTime(c.start)}</span>
              <span className="truncate">{c.title}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <div className="v02-label">Routines</div>
        <ul className="v02-rows">
          {routines.map((r) => (
            <li key={r.id} className="!items-start justify-between">
              <div className="min-w-0">
                <div>{r.title}</div>
                <div className="v02-mute text-xs">{r.when}{s.expert && ` · last ${r.lastRun}`}</div>
              </div>
              <button role="switch" aria-checked={s.routinesOn[r.id]} aria-label={r.title} className={`v02-switch ${s.routinesOn[r.id] ? "on" : ""}`} onClick={() => s.toggleRoutine(r.id)}><i /></button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Settings({ s, wide }: { s: Shared; wide: boolean }) {
  return (
    <div className={wide ? "grid grid-cols-2 gap-x-6" : ""}>
      {settingsGroups.map((g) => (
        <details key={g.id} className="v02-group">
          <summary>
            <span>{g.title}</span>
            <span className="v02-mute truncate text-sm">{g.summary}</span>
          </summary>
          <ul className="pb-3 text-sm leading-7">
            {g.simple.map((x) => <li key={x}>{x}</li>)}
            {s.expert && g.expert.map((x) => <li key={x} className="v02-mute">{x}</li>)}
          </ul>
          <button className="v02-link mb-3 text-sm" onClick={() => s.prefill(`Change ${g.title.toLowerCase()}: `)}>Ask hux to change this</button>
        </details>
      ))}
    </div>
  );
}

const ideas = [
  { title: "Spinach and feta frittata", time: "25 min", fit: "You have everything except milk and basil", ask: "Show the frittata recipe on the right and keep it there" },
  { title: "Lemon garlic pasta", time: "20 min", fit: "Needs a lemon", ask: "" },
  { title: "Chickpea curry", time: "35 min", fit: "Needs coconut milk", ask: "" },
];
function Ideas({ s, wide }: { s: Shared; wide: boolean }) {
  return (
    <div className={wide ? "grid grid-cols-3 gap-3" : "space-y-2"}>
      {ideas.map((i) => (
        <button key={i.title} className="v02-idea" onClick={() => i.ask && s.ask(i.ask)} disabled={!i.ask}>
          <div className="font-medium">{i.title}</div>
          <div className="v02-mute text-sm">{i.time} · {i.fit}</div>
        </button>
      ))}
    </div>
  );
}

function History({ s }: { s: Shared }) {
  return (
    <ul className="space-y-2 text-sm">
      {s.history.map((h, i) => (
        <li key={i} className="flex gap-3">
          <span className="v02-mute v02-num w-11 shrink-0">{h.at}</span>
          <span className={h.who === "hux" ? "" : "v02-mute"}>{h.who === "hux" ? "" : `${h.who}: `}{h.text}</span>
        </li>
      ))}
    </ul>
  );
}
