// PROTOTYPE - concept 08 inline cards. Each card type owns one colour block.
import { useState } from "react";
import {
  Check, ChevronDown, Clock, CloudRain, CloudSun, Mail, Send, ShoppingBasket, Smartphone, Timer, Users, Utensils, Undo2, Pause, ShieldCheck, Search,
} from "lucide-react";
import type { Card, Message } from "../../fixtures";
import { useStore } from "./store";
import { Btn, ExpertTag, Tag, cx } from "./ui";

function CardShell({ tone, icon, label, children, className }: { tone: string; icon: React.ReactNode; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("bx sh on-block overflow-hidden rounded-2xl", `bg-${tone}`, className)}>
      <div className="flex items-center gap-2 border-b-[3px] border-line px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em]">
        {icon}
        {label}
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}

function CheckBox({ on }: { on: boolean }) {
  return (
    <span className={cx("grid size-7 shrink-0 place-items-center rounded-lg border-[2.5px] border-[#161310]", on ? "bg-[#161310] text-[#fff4e2]" : "bg-[#fffbf4]")}>
      {on && <Check size={18} strokeWidth={3.5} />}
    </span>
  );
}

function RecipeCard({ card }: { card: Extract<Card, { type: "recipe" }> }) {
  const { send } = useStore();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const steps = open ? card.steps : card.steps.slice(0, 2);
  return (
    <CardShell tone="sun" icon={<Utensils size={15} strokeWidth={2.75} />} label="Recipe">
      <h3 className="font-display text-2xl font-extrabold leading-tight md:text-3xl">{card.title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        <Tag tone="paper" className="!border-[#161310] !bg-[#fffbf4] !text-[#161310]"><Clock size={13} strokeWidth={2.75} /> {card.time}</Tag>
        <Tag tone="paper" className="!border-[#161310] !bg-[#fffbf4] !text-[#161310]"><Users size={13} strokeWidth={2.75} /> Serves {card.serves}</Tag>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border-[2.5px] border-[#161310] bg-[#fffbf4] p-3 text-[#161310]">
          <div className="text-xs font-extrabold uppercase tracking-wider">You have</div>
          <ul className="mt-1.5 space-y-1 text-[15px]">
            {card.have.map((h) => (
              <li key={h} className="flex items-center gap-2"><Check size={16} strokeWidth={3} className="text-[#1f8a63]" />{h}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border-[2.5px] border-[#161310] bg-[#161310] p-3 text-[#fff4e2]">
          <div className="text-xs font-extrabold uppercase tracking-wider">You need</div>
          <ul className="mt-1.5 space-y-1 text-[15px]">
            {card.need.map((h) => (
              <li key={h} className="flex items-center gap-2"><ShoppingBasket size={16} strokeWidth={2.5} />{h}</li>
            ))}
          </ul>
          <div className="mt-2 text-xs opacity-75">On your shopping list</div>
        </div>
      </div>
      <ol className="mt-4 space-y-2">
        {steps.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
              className="flex w-full items-start gap-3 rounded-xl px-1 py-1 text-left text-[15px] leading-snug hover:bg-black/5"
            >
              <span className={cx("grid size-7 shrink-0 place-items-center rounded-full border-[2.5px] border-[#161310] font-display text-sm font-extrabold", done[i] ? "bg-[#161310] text-[#ffc83d]" : "bg-[#fffbf4]")}>
                {done[i] ? <Check size={15} strokeWidth={3.5} /> : i + 1}
              </span>
              <span className={cx("pt-0.5", done[i] && "line-through opacity-60")}>{s}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <Btn tone="ink" icon={<Timer size={18} strokeWidth={2.5} />} onClick={() => send("Start the frittata timer")}>Start {card.time} timer</Btn>
        <Btn tone="surface" icon={<ChevronDown size={18} strokeWidth={2.75} className={cx("transition-transform", open && "rotate-180")} />} onClick={() => setOpen(!open)}>
          {open ? "Fewer steps" : `All ${card.steps.length} steps`}
        </Btn>
      </div>
    </CardShell>
  );
}

function ShoppingCard({ card }: { card: Extract<Card, { type: "shoppingList" }> }) {
  const [items, setItems] = useState(card.items);
  const left = items.filter((i) => !i.done).length;
  return (
    <CardShell tone="mint" icon={<ShoppingBasket size={15} strokeWidth={2.75} />} label={card.title}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl font-extrabold">{left} to buy</h3>
        <span className="flex items-center gap-1.5 text-sm font-semibold on-block-muted"><Smartphone size={15} strokeWidth={2.5} /> On {card.sentTo}</span>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((it, i) => (
          <li key={it.name}>
            <button
              type="button"
              onClick={() => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl border-[2.5px] border-[#161310] bg-[#fffbf4] px-3 text-left font-semibold text-[#161310]"
            >
              <CheckBox on={it.done} />
              <span className={cx(it.done && "line-through opacity-50")}>{it.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function EmailCard({ card }: { card: Extract<Card, { type: "emailDraft" }> }) {
  const [open, setOpen] = useState(false);
  const paras = card.body.split("\n\n");
  return (
    <CardShell tone="lilac" icon={<Mail size={15} strokeWidth={2.75} />} label={`Email · ${card.status}`}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[15px]">
        <dt className="font-bold on-block-muted">To</dt>
        <dd className="font-semibold">{card.to}</dd>
        <dt className="font-bold on-block-muted">Subject</dt>
        <dd className="font-display text-lg font-extrabold leading-snug">{card.subject}</dd>
      </dl>
      <div className="mt-3 rounded-xl border-[2.5px] border-[#161310] bg-[#fffbf4] p-4 text-[15px] leading-relaxed text-[#161310]">
        {(open ? paras : paras.slice(0, 2)).map((p, i) => (
          <p key={i} className="whitespace-pre-line [&+p]:mt-3">{p}</p>
        ))}
        {!open && <div className="mt-2 text-sm font-semibold opacity-60">…</div>}
      </div>
      <div className="mt-3">
        <Btn tone="surface" size="sm" onClick={() => setOpen(!open)} icon={<ChevronDown size={16} strokeWidth={2.75} className={cx("transition-transform", open && "rotate-180")} />}>
          {open ? "Show less" : "Read the whole email"}
        </Btn>
      </div>
    </CardShell>
  );
}

export function ApprovalCard({ card, compact }: { card: Extract<Card, { type: "approval" }>; compact?: boolean }) {
  const { approval, setApproval, expert } = useStore();
  if (approval === "approved")
    return (
      <div className="bx sh-sm on-block flex flex-wrap items-center gap-3 rounded-2xl bg-mint p-4">
        <span className="grid size-10 place-items-center rounded-full border-[2.5px] border-[#161310] bg-[#fffbf4]"><Check size={22} strokeWidth={3.5} /></span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-extrabold leading-tight">Confirmed</div>
          <div className="text-[15px]">{card.action}. It goes out {card.when}.</div>
        </div>
        <Btn size="sm" tone="surface" icon={<Undo2 size={16} strokeWidth={2.75} />} onClick={() => setApproval("pending")}>Undo</Btn>
      </div>
    );
  if (approval === "held")
    return (
      <div className="bx sh-sm flex flex-wrap items-center gap-3 rounded-2xl bg-sunk p-4">
        <span className="grid size-10 place-items-center rounded-full border-[2.5px] border-line bg-surface"><Pause size={20} strokeWidth={3} /></span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-extrabold leading-tight">On hold</div>
          <div className="text-[15px] text-muted">The email to Todd won't go out until you say so.</div>
        </div>
        <Btn size="sm" tone="surface" onClick={() => setApproval("pending")}>Decide again</Btn>
      </div>
    );
  return (
    <div className={cx("bx sh on-block rounded-2xl bg-coral", compact ? "p-4" : "p-4 md:p-5")}>
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em]">
        <ShieldCheck size={15} strokeWidth={2.75} /> Needs your OK
      </div>
      <div className={cx("mt-2 font-display font-extrabold leading-tight", compact ? "text-xl" : "text-2xl md:text-3xl")}>{card.action}</div>
      <div className="mt-1 text-[15px]">{card.detail}</div>
      <div className="mt-1 flex items-center gap-1.5 text-[15px] font-bold"><Clock size={15} strokeWidth={2.75} /> {card.when}</div>
      {expert && !compact && (
        <div className="mt-2 flex flex-wrap gap-1.5 text-[#161310]">
          <ExpertTag>helper: Writer</ExpertTag>
          <ExpertTag>tier: send · asks once per exact email</ExpertTag>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Btn tone="ink" size={compact ? "md" : "lg"} icon={<Send size={18} strokeWidth={2.5} />} onClick={() => setApproval("approved")}>Yes, send it</Btn>
        <Btn tone="surface" size={compact ? "md" : "lg"} onClick={() => setApproval("held")}>Not yet</Btn>
      </div>
    </div>
  );
}

function WeatherCard({ card }: { card: Extract<Card, { type: "weather" }> }) {
  const max = Math.max(...card.hourly.map((h) => h.temp));
  const min = Math.min(...card.hourly.map((h) => h.temp)) - 3;
  return (
    <CardShell tone="sky" icon={<CloudSun size={15} strokeWidth={2.75} />} label={`${card.place} · tomorrow`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-end gap-3">
          <div className="font-display text-7xl font-extrabold leading-[0.8]">{card.temp}°</div>
          <div className="pb-1">
            <div className="font-display text-xl font-extrabold leading-tight">{card.now}</div>
            <div className="text-[15px] font-semibold on-block-muted">High {card.high}° · Low {card.low}°</div>
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-5 gap-2" role="list" aria-label="Hourly forecast">
        {card.hourly.map((h) => {
          const height = 28 + ((h.temp - min) / (max - min)) * 56;
          const wet = h.rain >= 30;
          return (
            <div key={h.time} role="listitem" className="flex flex-col items-center gap-1.5">
              <div className="flex h-[92px] w-full items-end">
                <div
                  className={cx("w-full rounded-t-lg border-[2.5px] border-[#161310] px-1 pt-1 text-center font-display text-base font-extrabold", wet ? "bg-[#161310] text-[#7cc0ff]" : "bg-[#fffbf4] text-[#161310]")}
                  style={{ height }}
                >
                  {h.temp}°
                </div>
              </div>
              <div className="text-sm font-bold">{h.time}:00</div>
              <div className={cx("flex items-center gap-0.5 text-xs font-bold", h.rain === 0 && "opacity-50")}>
                <CloudRain size={12} strokeWidth={2.75} /> {h.rain}%
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

export function ThreadBlock({ thread, expert }: { thread: NonNullable<Message["thread"]>; expert: boolean }) {
  const [open, setOpen] = useState(expert);
  const isOpen = open || expert;
  return (
    <div className="bx rounded-2xl bg-surface">
      <button type="button" onClick={() => setOpen(!open)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left">
        <span className="grid size-9 place-items-center rounded-lg border-[2.5px] border-line bg-sunk"><Search size={17} strokeWidth={2.75} /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-extrabold leading-tight">{thread.title}</span>
          <span className="block text-sm text-muted">{thread.steps.length} steps · {thread.status === "done" ? "finished this afternoon" : "working on it"}</span>
        </span>
        <Tag tone={thread.status === "done" ? "mint" : "sun"}>{thread.status === "done" ? "Done" : "Running"}</Tag>
        {!expert && <ChevronDown size={20} strokeWidth={2.75} className={cx("transition-transform", isOpen && "rotate-180")} />}
      </button>
      {isOpen && (
        <ol className="rule-dash mx-4 mb-3 space-y-1.5 pt-3">
          {thread.steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2.5 text-[15px]">
              <span className="grid size-6 place-items-center rounded-md bg-ink"><Check size={14} strokeWidth={3.5} /></span>
              <span className="flex-1">{s}</span>
              {expert && <ExpertTag>{i < 3 ? "Researcher" : "Writer"}</ExpertTag>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function CardView({ card }: { card: Card }) {
  switch (card.type) {
    case "recipe": return <RecipeCard card={card} />;
    case "shoppingList": return <ShoppingCard card={card} />;
    case "emailDraft": return <EmailCard card={card} />;
    case "approval": return <ApprovalCard card={card} />;
    case "weather": return <WeatherCard card={card} />;
    default: return null;
  }
}
