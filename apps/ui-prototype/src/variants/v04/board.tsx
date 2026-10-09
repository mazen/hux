// PROTOTYPE concept 04: the household board (home screen).
import { useState, type ReactNode } from "react";
import { Car, Check, ChefHat, Clock, CloudSun, Lightbulb, MapPin, Mail, Plus, ShoppingBasket, Timer, X } from "lucide-react";
import { conversation, household, type Card, type MemberId } from "../../fixtures";
import { ApprovalActions, Box, needText, timerLeft, useTick } from "./conversation";
import { TIMER_MINUTES, isOn, reminderList, useHux, type PinKey } from "./state";
import { Avatar, Btn, Label, Magnet, cx } from "./ui";

const card = <T extends Card["type"]>(t: T) => conversation.find((m) => m.card?.type === t)!.card as Extract<Card, { type: T }>;
const recipe = card("recipe");
const email = card("emailDraft");
const approvalCard = card("approval");
const weather = card("weather");
const researchThread = conversation.find((m) => m.thread)!.thread!;
const updatedBody = email.body.replace("next week", "over coffee on Tuesday");

const pinMeta: Record<PinKey, { at: string; device: string }> = {
  recipe: { at: "18:05", device: "Kitchen tablet" },
  shopping: { at: "18:06", device: "Kitchen tablet" },
  research: { at: "18:20", device: "Desk PC" },
  approval: { at: "18:31", device: "Desk PC" },
  weather: { at: "18:38", device: "Desk PC" },
  timer: { at: "just now", device: "Kitchen tablet" },
};

const presence: Record<MemberId, { home: boolean; line: string; source: string }> = {
  alex: { home: true, line: "Home, in the office", source: "Desk PC is in use" },
  sam: { home: false, line: "Out, usually back around 19:30", source: "Sam's phone left home at 17:20" },
  mia: { home: true, line: "Home", source: "Kitchen tablet heard her at 18:12" },
};

const tilts = ["v4-tilt-l", "v4-tilt-r", "v4-tilt-s"];

export function Board() {
  const s = useHux();
  const order: PinKey[] = [...s.pins].sort((a, b) => rank(a, s.approval === "pending") - rank(b, s.approval === "pending"));
  const lightsOn = s.homeThings.filter((h) => h.kind === "light" && isOn(h.state)).length;
  const car = s.homeThings.find((h) => h.kind === "car");
  const lottery = s.routines.find((r) => r.id === "j2");

  return (
    <div className="v4-board v4-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[1180px] px-4 pb-36 pt-6 sm:px-6 lg:px-10 lg:pb-24 lg:pt-9">
        <header className="mb-7 lg:mb-9">
          <Label>Friday 9 October · 18:40</Label>
          <h1 className="v4-serif mt-1.5 text-[30px] font-medium leading-tight sm:text-[38px]">Good evening, Alex.</h1>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-[var(--ink-2)] sm:text-base">
            {s.approval === "pending" ? "One thing is waiting for you: the email to Todd. " : "Nothing is waiting for you. "}
            {lottery?.enabled ? "At 22:00 hux checks the lottery tickets, and quiet hours start at 22:30." : "Quiet hours start at 22:30."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip onClick={() => s.openHouse("home")}>
              <Lightbulb size={15} className={lightsOn ? "text-[var(--honey)]" : ""} />
              {lightsOn === 0 ? "All lights off" : `${lightsOn} ${lightsOn === 1 ? "light" : "lights"} on`}
            </Chip>
            {car && (
              <Chip onClick={() => s.openHouse("home")}>
                <Car size={15} /> Car {car.state.toLowerCase()}
              </Chip>
            )}
            <Chip onClick={() => s.openHouse("activity")}>
              <Clock size={15} /> What hux did today
            </Chip>
          </div>
        </header>

        <section aria-label="Who's home">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="v4-serif text-xl font-medium">Who's home</h2>
            <span className="text-xs text-[var(--ink-3)]">{household.members.filter((m) => presence[m.id].home).length} of 3 at home</span>
          </div>
          <div className="v4-noscroll -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-2 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0">
            {household.members.map((m, i) => (
              <PersonNote key={m.id} id={m.id} tilt={tilts[i]} />
            ))}
          </div>
        </section>

        <section aria-label="Pinned" className="mt-8 lg:mt-10">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="v4-serif text-xl font-medium">On the board</h2>
            <span className="text-right text-xs text-[var(--ink-3)]">{order.length} pinned</span>
          </div>
          {order.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line-strong)] px-6 py-12 text-center text-[var(--ink-2)]">
              The board is clear. Ask hux for something, and it will appear here.
            </div>
          ) : (
            <div className="columns-1 gap-6 md:columns-2 2xl:columns-3">
              {order.map((k, i) => (
                <PinCard key={k} k={k} tilt={k === "approval" ? "" : tilts[(i + 1) % 3]}>
                  {k === "approval" && <ApprovalPin />}
                  {k === "timer" && <TimerPin />}
                  {k === "shopping" && <ShoppingPin />}
                  {k === "recipe" && <RecipePin />}
                  {k === "research" && <ResearchPin />}
                  {k === "weather" && <WeatherPin />}
                </PinCard>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function rank(k: PinKey, pending: boolean) {
  const r: Record<PinKey, number> = { approval: pending ? 0 : 9, timer: 1, shopping: 2, recipe: 3, research: 4, weather: 5 };
  return r[k];
}

function Chip({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-2)] shadow-sm transition hover:text-[var(--ink)]"
    >
      {children}
    </button>
  );
}

function PersonNote({ id, tilt }: { id: MemberId; tilt: string }) {
  const s = useHux();
  const m = household.members.find((x) => x.id === id)!;
  const p = presence[id];
  const mine = reminderList.filter((r) => r.for === id);
  return (
    <article
      className={cx("v4-paper v4-lift relative w-[82%] flex-none snap-center px-4 pb-3 pt-5 md:w-auto", tilt)}
      style={{ background: `color-mix(in oklab, ${m.color} 9%, var(--paper))` }}
    >
      <Magnet color={m.color} className="absolute -top-[7px] left-1/2 -translate-x-1/2" />
      <div className="flex items-center gap-3">
        <span className="relative">
          <Avatar id={id} size={36} />
          <span
            className={cx("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--paper)]", p.home ? "bg-[#5aa469]" : "bg-[var(--ink-3)]")}
            title={p.home ? "Home" : "Out"}
          />
        </span>
        <div className="min-w-0">
          <div className="v4-serif text-lg font-semibold leading-tight">{m.name}</div>
          <div className="truncate text-xs text-[var(--ink-2)]">{p.line}</div>
        </div>
      </div>
      {s.expert && <div className="mt-2 text-[11px] text-[var(--ink-3)]">Seen by: {p.source}</div>}
      <ul className="mt-3 space-y-0.5">
        {mine.length === 0 && <li className="py-1 text-sm text-[var(--ink-3)]">Nothing to remember.</li>}
        {mine.map((r) => {
          const done = s.remindersDone.includes(r.id);
          return (
            <li key={r.id}>
              <button className="flex w-full items-start gap-2.5 rounded-md py-1.5 text-left" onClick={() => s.toggleReminder(r.id)}>
                <span className="mt-0.5">
                  <Box done={done} />
                </span>
                <span className="min-w-0">
                  <span className={cx("block text-[14px] font-medium leading-snug", done && "text-[var(--ink-3)] line-through")}>{r.title}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-[var(--ink-3)]">
                    {r.whenKind === "place" ? <MapPin size={11} /> : <Clock size={11} />} {r.when}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        onClick={() => s.askHux(`Remind ${id === "alex" ? "me" : m.name} to `)}
        className="mt-1 flex items-center gap-1 rounded-md py-1 text-xs font-semibold text-[var(--ink-2)] hover:text-[var(--ink)]"
      >
        <Plus size={13} /> {id === "alex" ? "Add a reminder" : `Add one for ${m.name}`}
      </button>
    </article>
  );
}

function PinCard({ k, tilt, children }: { k: PinKey; tilt: string; children: ReactNode }) {
  const s = useHux();
  const meta = pinMeta[k];
  const urgent = k === "approval" && s.approval === "pending";
  return (
    <article
      id={`v4-pin-${k}`}
      className={cx(
        "v4-paper v4-lift group relative mb-6 inline-block w-full break-inside-avoid",
        tilt,
        s.freshPin === k && "v4-drop",
        s.flash === k && "v4-flash",
        urgent && "!border-[var(--honey)]",
      )}
    >
      <Magnet color={urgent ? "var(--honey)" : "var(--alex)"} className="absolute -top-[7px] left-6 z-10" />
      {!urgent && (
        <button
          onClick={() => s.togglePin(k)}
          title="Take it off the board"
          aria-label="Take it off the board"
          className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full text-[var(--ink-3)] opacity-60 transition hover:bg-[var(--paper-2)] hover:text-[var(--ink)] group-hover:opacity-100"
        >
          <X size={15} />
        </button>
      )}
      {children}
      <div className="flex items-center justify-between gap-2 border-t border-[var(--line)] px-4 py-2 text-[11px] text-[var(--ink-3)]">
        <span>
          Pinned for Alex {meta.at === "just now" ? "just now" : `at ${meta.at}`}
          {s.expert && ` · ${meta.device}`}
        </span>
        <button className="font-semibold text-[var(--ink-2)] hover:text-[var(--ink)]" onClick={() => s.askHux(followUp[k])}>
          Ask about this
        </button>
      </div>
    </article>
  );
}

const followUp: Record<PinKey, string> = {
  approval: "About the email to Todd: ",
  timer: "About the timer: ",
  shopping: "Add to the shopping list: ",
  recipe: "About the frittata: ",
  research: "About the home batteries: ",
  weather: "About the weather tomorrow: ",
};

function PinTitle({ icon, eyebrow, title }: { icon: ReactNode; eyebrow: string; title: string }) {
  return (
    <div className="pr-8">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-3)]">
        {icon} {eyebrow}
      </div>
      <h3 className="v4-serif mt-1 text-[21px] font-semibold leading-tight">{title}</h3>
    </div>
  );
}

function ApprovalPin() {
  const s = useHux();
  const [open, setOpen] = useState(false);
  const pending = s.approval === "pending";
  return (
    <div>
      {pending && (
        <div className="flex items-center gap-2 rounded-t-[9px] bg-[var(--honey-soft)] px-4 py-2 pl-12 text-xs font-semibold text-[var(--honey-ink)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--honey)]" /> Waiting for you
        </div>
      )}
      <div className={cx("px-4 pb-4", pending ? "pt-3" : "pt-5")}>
        <PinTitle
          icon={<Mail size={13} />}
          eyebrow={pending ? "Needs your okay once" : s.approval === "approved" ? "Scheduled" : "On hold"}
          title={pending ? "Send the email to Todd on Monday?" : "Email to Todd"}
        />
        <p className="mt-2 text-sm text-[var(--ink-2)]">
          {approvalCard.detail}. {approvalCard.when}.
        </p>
        <button className="mt-2 text-xs font-semibold underline underline-offset-2" onClick={() => setOpen(!open)}>
          {open ? "Hide the email" : "Read it first"}
        </button>
        {open && (
          <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--paper-2)] p-3.5 text-sm">
            <div className="text-xs text-[var(--ink-3)]">To {email.to}</div>
            <div className="font-semibold">{email.subject}</div>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-[var(--ink-2)]">{updatedBody}</p>
          </div>
        )}
        <div className="mt-4">
          <ApprovalActions />
        </div>
        {s.expert && <div className="mt-3 text-[11px] text-[var(--ink-3)]">Writer helper · sending email always asks first · rule: ask once per exact message</div>}
      </div>
    </div>
  );
}

function TimerPin() {
  const s = useHux();
  const now = useTick(!!s.timerEndsAt);
  if (!s.timerEndsAt) return null;
  const { left, label } = timerLeft(s.timerEndsAt, now);
  const pct = 1 - left / (TIMER_MINUTES * 60_000);
  return (
    <div className="px-4 pb-4 pt-5">
      <PinTitle icon={<Timer size={13} />} eyebrow="Kitchen tablet" title="Frittata timer" />
      <div className="mt-3 flex items-end justify-between gap-4">
        <div className="font-mono text-[44px] font-semibold leading-none tabular-nums">{left === 0 ? "Done" : label}</div>
        <Btn kind="quiet" onClick={s.stopTimer}>
          Stop
        </Btn>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--paper-2)]">
        <div className="h-full rounded-full bg-[var(--honey)] transition-[width] duration-1000" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

function ShoppingPin() {
  const s = useHux();
  const [text, setText] = useState("");
  const open = s.shopping.filter((i) => !i.done).length;
  return (
    <div className="px-4 pb-3 pt-5">
      <PinTitle icon={<ShoppingBasket size={13} />} eyebrow="On Alex's phone" title="Shopping list" />
      <ul className="v4-lined mt-2">
        {s.shopping.map((i) => (
          <li key={i.name}>
            <button className="flex w-full items-center gap-3 py-2 text-left text-[15px]" onClick={() => s.toggleItem(i.name)}>
              <Box done={i.done} />
              <span className={cx(i.done && "text-[var(--ink-3)] line-through")}>{i.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-1 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          s.addItem(text);
          setText("");
        }}
      >
        <Plus size={16} className="text-[var(--ink-3)]" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add something"
          aria-label="Add to the shopping list"
          className="flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-[var(--ink-3)]"
        />
      </form>
      <p className="mt-1 text-xs text-[var(--ink-3)]">
        {open === 0 ? "All done." : `${open} to get. hux reminds Alex at the supermarket.`}
      </p>
    </div>
  );
}

function RecipePin() {
  const s = useHux();
  const [steps, setSteps] = useState(false);
  const onList = (n: string) => s.shopping.some((i) => n.toLowerCase().startsWith(i.name.toLowerCase()));
  return (
    <div className="px-4 pb-4 pt-5">
      <PinTitle icon={<ChefHat size={13} />} eyebrow={`${recipe.time} · serves ${recipe.serves}`} title={recipe.title} />
      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <Label className="mb-1.5">In the fridge</Label>
          <ul className="space-y-1 text-[var(--ink-2)]">
            {recipe.have.map((h) => (
              <li key={h} className="flex items-center gap-1.5">
                <Check size={13} className="text-[var(--mia)]" strokeWidth={3} /> {h}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Label className="mb-1.5">Still needed</Label>
          <ul className="space-y-1.5">
            {recipe.need.map((n) => (
              <li key={n}>
                <div className="font-medium">{n}</div>
                {onList(n) && <div className="text-[11px] text-[var(--ink-3)]">On the shopping list</div>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button className="mt-4 text-xs font-semibold underline underline-offset-2" onClick={() => setSteps(!steps)}>
        {steps ? "Hide the steps" : `Show the ${recipe.steps.length} steps`}
      </button>
      {steps && (
        <ol className="mt-3 space-y-2.5 text-sm leading-relaxed">
          {recipe.steps.map((st, i) => (
            <li key={st} className="flex gap-3">
              <span className="v4-serif grid h-6 w-6 flex-none place-items-center rounded-full bg-[var(--paper-2)] text-xs font-semibold">{i + 1}</span>
              <span className="text-[var(--ink-2)]">{st}</span>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Btn kind="primary" onClick={() => s.send("Read me the recipe step by step")}>
          Cook with hux
        </Btn>
        <Btn kind="quiet" onClick={() => s.send("Start the frittata timer")}>
          <Timer size={15} /> {TIMER_MINUTES} min timer
        </Btn>
      </div>
      <p className="mt-3 text-xs text-[var(--ink-3)]">Still need {needText(recipe.need)}.</p>
    </div>
  );
}

function ResearchPin() {
  const s = useHux();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="v4-airmail h-1.5 rounded-t-[9px]" />
      <div className="px-4 pb-4 pt-4">
        <PinTitle icon={<Mail size={13} />} eyebrow={`Draft to ${email.to}`} title={email.subject} />
        <ul className="mt-3 space-y-1 text-sm text-[var(--ink-2)]">
          {researchThread.steps.map((st) => (
            <li key={st} className="flex items-center gap-2">
              <Check size={13} className="text-[var(--mia)]" strokeWidth={3} /> {st}
            </li>
          ))}
        </ul>
        {s.expert && <div className="mt-2 text-[11px] text-[var(--ink-3)]">Researcher on the cloud (public info only), Writer on this network · 15:10 to 15:24</div>}
        <button className="mt-3 text-xs font-semibold underline underline-offset-2" onClick={() => setOpen(!open)}>
          {open ? "Hide the email" : "Read the email"}
        </button>
        {open && <p className="mt-2 whitespace-pre-line rounded-lg bg-[var(--paper-2)] p-3.5 text-sm leading-relaxed text-[var(--ink-2)]">{updatedBody}</p>}
      </div>
    </div>
  );
}

function WeatherPin() {
  const max = Math.max(...weather.hourly.map((h) => h.temp));
  const min = Math.min(...weather.hourly.map((h) => h.temp));
  return (
    <div className="px-4 pb-4 pt-5">
      <PinTitle icon={<CloudSun size={13} />} eyebrow="Saturday 10 October" title={`Tomorrow in ${weather.place}`} />
      <div className="mt-3 flex items-end gap-4">
        <div className="v4-serif text-[52px] font-medium leading-none">{weather.temp}°</div>
        <div className="pb-1 text-sm text-[var(--ink-2)]">
          {weather.now}
          <br />
          High {weather.high}°, low {weather.low}°
        </div>
      </div>
      <div className="mt-4 grid grid-cols-5 items-end gap-2">
        {weather.hourly.map((h) => (
          <div key={h.time} className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold">{h.temp}°</span>
            <div className="flex h-14 w-full items-end justify-center rounded-md bg-[var(--paper-2)]">
              <div
                className="w-full rounded-md"
                style={{
                  height: `${30 + ((h.temp - min) / Math.max(1, max - min)) * 70}%`,
                  background: h.rain >= 50 ? "color-mix(in oklab, var(--sam) 55%, transparent)" : h.rain > 0 ? "color-mix(in oklab, var(--sam) 25%, transparent)" : "color-mix(in oklab, var(--honey) 45%, transparent)",
                }}
              />
            </div>
            <span className="text-[11px] text-[var(--ink-3)]">{h.time}:00</span>
            <span className={cx("text-[10px]", h.rain >= 50 ? "font-semibold text-[var(--sam)]" : "text-[var(--ink-3)]")}>{h.rain ? `${h.rain}% rain` : "dry"}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-[var(--ink-2)]">Dry until mid-afternoon, then light rain. Good morning for a bike ride.</p>
    </div>
  );
}

