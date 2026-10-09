// PROTOTYPE concept 05 "River": inline cards hux shows in the conversation.
import { useState, type ReactNode } from "react";
import { Check, ChefHat, ChevronDown, CloudRain, CloudSun, Mail, ShoppingBasket, Smartphone, TrendingUp, Undo2 } from "lucide-react";
import type { Card, Message } from "../../fixtures";
import { updatedEmailBody } from "./data";
import { Button } from "./ui";

export type ApprovalState = "pending" | "approved" | "declined";

function Shell({ icon, title, sub, children, accent }: { icon: ReactNode; title: string; sub?: ReactNode; children: ReactNode; accent?: string }) {
  return (
    <div
      className="mt-3 max-w-[540px] overflow-hidden rounded-[18px] border bg-[var(--surface)] shadow-[var(--shadow)]"
      style={{ borderColor: accent ?? "var(--line)" }}
    >
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--ink-2)]">{icon}</span>
        <div className="min-w-0">
          <div className="text-[15px] leading-snug font-semibold tracking-[-0.01em]">{title}</div>
          {sub && <div className="text-[13px] text-[var(--muted)]">{sub}</div>}
        </div>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

function Recipe({ card, onSend }: { card: Extract<Card, { type: "recipe" }>; onSend: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Shell icon={<ChefHat size={17} />} title={card.title} sub={`${card.time} · serves ${card.serves}`}>
      <div className="grid gap-4 text-[13.5px] sm:grid-cols-2">
        <div>
          <div className="mb-1.5 text-[12px] font-medium text-[var(--muted)]">You have</div>
          <ul className="space-y-1">
            {card.have.map((h) => (
              <li key={h} className="flex items-center gap-2"><Check size={13} className="text-[var(--rout)]" />{h}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1.5 text-[12px] font-medium text-[var(--muted)]">You need</div>
          <ul className="space-y-1">
            {card.need.map((h) => (
              <li key={h} className="flex items-center gap-2"><span className="size-[13px] rounded-full border-[1.5px] border-[var(--rem)]" />{h}</li>
            ))}
          </ul>
          <div className="mt-2 text-[12px] text-[var(--muted)]">On your shopping list</div>
        </div>
      </div>
      {open && (
        <ol className="mt-4 space-y-2.5 border-t border-[var(--line)] pt-4 text-[13.5px] leading-relaxed">
          {card.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="mono mt-px w-4 shrink-0 text-[12px] text-[var(--muted)]">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button tone="solid" onClick={() => onSend("Start the frittata timer")}>Start cooking</Button>
        <Button onClick={() => setOpen(!open)}>
          {open ? "Hide steps" : `Show the ${card.steps.length} steps`}
          <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
        </Button>
      </div>
    </Shell>
  );
}

function Shopping({ card }: { card: Extract<Card, { type: "shoppingList" }> }) {
  const [items, setItems] = useState(card.items);
  return (
    <Shell icon={<ShoppingBasket size={17} />} title={card.title} sub={`${items.filter((i) => !i.done).length} to buy`}>
      <ul className="divide-y divide-[var(--line)]">
        {items.map((it, i) => (
          <li key={it.name}>
            <button
              className="flex w-full items-center gap-3 py-2 text-left text-[14px]"
              onClick={() => setItems(items.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
            >
              <span className={`grid size-[18px] place-items-center rounded-md border-[1.5px] transition ${it.done ? "border-[var(--rout)] bg-[var(--rout)] text-white" : "border-[var(--line-strong)]"}`}>
                {it.done && <Check size={12} strokeWidth={3} />}
              </span>
              <span className={it.done ? "text-[var(--muted)] line-through" : ""}>{it.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[var(--muted)]">
        <Smartphone size={13} /> On {card.sentTo}
      </div>
    </Shell>
  );
}

function Email({ card }: { card: Extract<Card, { type: "emailDraft" }> }) {
  const [open, setOpen] = useState(false);
  return (
    <Shell icon={<Mail size={17} />} title={card.subject} sub={<>To {card.to} · {card.status}</>}>
      <div className={`relative text-[14px] leading-relaxed whitespace-pre-line text-[var(--ink-2)] ${open ? "" : "max-h-[96px] overflow-hidden"}`}>
        {card.body}
        {!open && <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--surface)]" />}
      </div>
      <button onClick={() => setOpen(!open)} className="mt-2 text-[13px] font-medium text-[var(--talk)]">
        {open ? "Show less" : "Read the whole email"}
      </button>
    </Shell>
  );
}

function Approval({ card, body, state, onApprove, onDecline, onUndo, onChange }: {
  card: Extract<Card, { type: "approval" }>; body: string; state: ApprovalState;
  onApprove: () => void; onDecline: () => void; onUndo: () => void; onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (state !== "pending") {
    return (
      <div className="mt-3 flex max-w-[540px] items-center gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[14px]">
        <span className={`grid size-7 place-items-center rounded-full ${state === "approved" ? "bg-[var(--rout)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)]"}`}>
          <Check size={14} strokeWidth={3} />
        </span>
        <span className="flex-1">
          {state === "approved" ? <>Approved. It goes out <b className="font-semibold">{card.when}</b>.</> : <>Not sending. The draft stays in your email.</>}
        </span>
        <button onClick={onUndo} className="flex items-center gap-1 text-[13px] text-[var(--muted)] hover:text-[var(--ink)]"><Undo2 size={13} />Undo</button>
      </div>
    );
  }
  return (
    <div id="v05-approval" className="mt-3 max-w-[540px] rounded-[18px] border-[1.5px] border-[var(--now)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
      <div className="text-[11.5px] font-medium tracking-wide text-[var(--now)] uppercase">Needs your OK</div>
      <div className="mt-1 text-[16px] font-semibold tracking-[-0.01em]">{card.action}</div>
      <div className="mt-0.5 text-[13.5px] text-[var(--ink-2)]">{card.detail}</div>
      <div className="mt-0.5 text-[13.5px] text-[var(--ink-2)]">Goes out {card.when}</div>
      <button onClick={() => setOpen(!open)} className="mt-3 flex items-center gap-1 text-[13px] font-medium text-[var(--talk)]">
        {open ? "Hide the email" : "Read the exact email"} <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-2 rounded-xl bg-[var(--surface-2)] p-3 text-[13.5px] leading-relaxed whitespace-pre-line text-[var(--ink-2)]">{body}</div>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button tone="now" onClick={onApprove}><Check size={15} />Send on Monday</Button>
        <Button onClick={onChange}>Change something</Button>
        <Button tone="ghost" onClick={onDecline}>Don't send</Button>
      </div>
    </div>
  );
}

function Weather({ card }: { card: Extract<Card, { type: "weather" }> }) {
  return (
    <Shell icon={<CloudSun size={17} />} title={`${card.place} tomorrow`} sub={`${card.now} now, ${card.temp}°`}>
      <div className="mb-3 flex items-baseline gap-3">
        <span className="text-[34px] leading-none font-light tracking-[-0.04em]">{card.high}°</span>
        <span className="text-[13px] text-[var(--muted)]">low {card.low}°</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {card.hourly.map((h) => (
          <div key={h.time} className="flex flex-col items-center gap-1.5 rounded-xl bg-[var(--surface-2)] px-1 py-2.5">
            <span className="mono text-[11px] text-[var(--muted)]">{h.time}:00</span>
            <span className="text-[14px] font-medium">{h.temp}°</span>
            <span className="relative h-8 w-1.5 overflow-hidden rounded-full bg-[var(--line)]">
              <span className="absolute inset-x-0 bottom-0 rounded-full bg-[var(--talk)]" style={{ height: `${Math.max(h.rain, 4)}%`, opacity: h.rain ? 1 : 0.25 }} />
            </span>
            <span className="flex items-center gap-0.5 text-[11px] text-[var(--muted)]">{h.rain > 0 && <CloudRain size={10} />}{h.rain}%</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function Portfolio({ card }: { card: Extract<Card, { type: "portfolio" }> }) {
  return (
    <Shell icon={<TrendingUp size={17} />} title="Your portfolio" sub={card.date}>
      <div className="flex items-baseline gap-3">
        <span className="text-[26px] font-light tracking-[-0.03em]">{card.total}</span>
        <span className="text-[13.5px] font-medium text-[var(--rout)]">{card.change} ({card.changePct})</span>
      </div>
      <ul className="mt-3 divide-y divide-[var(--line)] text-[13.5px]">
        {card.lines.map((l) => (
          <li key={l.name} className="flex justify-between py-1.5">
            <span className="text-[var(--ink-2)]">{l.name}</span>
            <span className="mono text-[12.5px]">{l.value} <span className="text-[var(--muted)]">{l.change}</span></span>
          </li>
        ))}
      </ul>
      <div className="mt-2 text-[12.5px] text-[var(--muted)]">{card.note}</div>
    </Shell>
  );
}

export function Thread({ thread, expert }: { thread: NonNullable<Message["thread"]>; expert: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 max-w-[540px]">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] py-1.5 pr-3 pl-2 text-[13px]">
        <span className="grid size-5 place-items-center rounded-full bg-[var(--rout)] text-white"><Check size={11} strokeWidth={3} /></span>
        <span className="font-medium">{thread.title}</span>
        <span className="text-[var(--muted)]">· {thread.steps.length} steps</span>
        <ChevronDown size={14} className={`text-[var(--muted)] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ol className="mt-2 ml-[18px] space-y-1.5 border-l border-[var(--line)] pl-4 text-[13.5px] text-[var(--ink-2)]">
          {thread.steps.map((s, i) => (
            <li key={s}>
              {s}
              {expert && <span className="mono ml-2 text-[11px] text-[var(--muted)]">{i < 2 ? "Researcher · cloud, public info only" : i === 2 ? "Researcher" : "Writer · on this network"}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function CardView(props: {
  card: Card; onSend: (s: string) => void; approval: ApprovalState; emailBody: string;
  onApprove: () => void; onDecline: () => void; onUndo: () => void; onChangeEmail: () => void;
}) {
  const { card } = props;
  switch (card.type) {
    case "recipe": return <Recipe card={card} onSend={props.onSend} />;
    case "shoppingList": return <Shopping card={card} />;
    case "emailDraft": return <Email card={card} />;
    case "weather": return <Weather card={card} />;
    case "portfolio": return <Portfolio card={card} />;
    case "approval":
      return <Approval card={card} body={updatedEmailBody(props.emailBody)} state={props.approval} onApprove={props.onApprove} onDecline={props.onDecline} onUndo={props.onUndo} onChange={props.onChangeEmail} />;
  }
}
