// PROTOTYPE - concept 02 "Hearth": inline cards hux shows alongside its answers.
import { useState } from "react";
import { Check, ChefHat, ChevronDown, Clock, CloudRain, Mail, Send, ShoppingBasket, Smartphone, Sun, Users, Wallet } from "lucide-react";
import type { Card, Message } from "../../fixtures";

export type ApprovalStatus = "pending" | "approved" | "declined";

type CardProps = {
  card: Card;
  expert: boolean;
  compact?: boolean;
  approval: ApprovalStatus;
  onApproval: (s: ApprovalStatus) => void;
  onAsk: (text: string) => void;
};

export function CardView(p: CardProps) {
  const c = p.card;
  switch (c.type) {
    case "recipe":
      return <RecipeCard card={c} compact={p.compact} onAsk={p.onAsk} />;
    case "shoppingList":
      return <ShoppingCard card={c} expert={p.expert} />;
    case "emailDraft":
      return <EmailCard card={c} compact={p.compact} approval={p.approval} />;
    case "weather":
      return <WeatherCard card={c} />;
    case "approval":
      return <ApprovalCard card={c} status={p.approval} onApproval={p.onApproval} expert={p.expert} />;
    case "portfolio":
      return <PortfolioCard card={c} />;
  }
}

function Shell({ icon, eyebrow, children, tone }: { icon: React.ReactNode; eyebrow: string; children: React.ReactNode; tone?: "warm" }) {
  return (
    <section
      className={`v02-card v02-rise-in w-full overflow-hidden rounded-[28px] text-left ${tone === "warm" ? "ring-1 ring-[color-mix(in_srgb,var(--ember)_35%,transparent)]" : ""}`}
    >
      <header className="flex items-center gap-2 px-5 pt-4 text-[12px] font-semibold tracking-[0.08em] text-[var(--ink-3)] uppercase">
        <span className="text-[var(--accent-ink)]">{icon}</span>
        {eyebrow}
      </header>
      {children}
    </section>
  );
}

function RecipeCard({ card, compact, onAsk }: { card: Extract<Card, { type: "recipe" }>; compact?: boolean; onAsk: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Shell icon={<ChefHat size={15} />} eyebrow="Recipe">
      <div className="px-5 pt-1 pb-5">
        <h3 className="font-display text-2xl text-[var(--ink)]">{card.title}</h3>
        <p className="mt-1 flex items-center gap-4 text-sm text-[var(--ink-2)]">
          <span className="flex items-center gap-1.5"><Clock size={14} /> {card.time}</span>
          <span className="flex items-center gap-1.5"><Users size={14} /> Serves {card.serves}</span>
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[var(--surface-sunk)] p-4">
            <p className="text-sm font-semibold text-[var(--ink-2)]">You have</p>
            <ul className="mt-2 space-y-1 text-[15px]">
              {card.have.map((h) => (
                <li key={h} className="flex items-center gap-2"><Check size={14} className="text-[var(--ok)]" /> {h}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[var(--surface-sunk)] p-4">
            <p className="text-sm font-semibold text-[var(--ink-2)]">Still needed</p>
            <ul className="mt-2 space-y-1 text-[15px]">
              {card.need.map((h) => (
                <li key={h} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[var(--ember)]" /> {h}</li>
              ))}
            </ul>
          </div>
        </div>
        {!compact && (
          <>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-ink)]"
              aria-expanded={open}
            >
              {open ? "Hide the steps" : `Show the ${card.steps.length} steps`}
              <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <ol className="mt-3 space-y-3">
                {card.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                    <span className="font-display mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--surface-sunk)] text-sm text-[var(--accent-ink)]">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            )}
            <button
              type="button"
              onClick={() => onAsk("Read me the recipe step by step")}
              className="mt-4 w-full rounded-full bg-[var(--ember)] px-4 py-2.5 text-[15px] font-semibold text-[var(--on-accent)] sm:w-auto"
            >
              Cook with me, step by step
            </button>
          </>
        )}
      </div>
    </Shell>
  );
}

function ShoppingCard({ card, expert }: { card: Extract<Card, { type: "shoppingList" }>; expert: boolean }) {
  const [items, setItems] = useState(card.items);
  const left = items.filter((i) => !i.done).length;
  return (
    <Shell icon={<ShoppingBasket size={15} />} eyebrow={card.title}>
      <div className="px-5 pt-1 pb-5">
        <p className="font-display text-xl">{left} things to get</p>
        <ul className="mt-3 divide-y divide-[var(--line)]">
          {items.map((it, i) => (
            <li key={it.name}>
              <label className="flex cursor-pointer items-center gap-3 py-2.5 text-[15px]">
                <input
                  type="checkbox"
                  checked={it.done}
                  onChange={() => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
                  className="peer sr-only"
                />
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full border transition peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ember)] ${it.done ? "border-transparent bg-[var(--ok)] text-[var(--on-accent)]" : "border-[var(--line)] bg-[var(--surface-sunk)]"}`}
                >
                  {it.done && <Check size={14} />}
                </span>
                <span className={it.done ? "text-[var(--ink-3)] line-through" : ""}>{it.name}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--ink-2)]">
          <Smartphone size={14} /> On {card.sentTo}
          {expert && <span className="text-[var(--ink-3)]"> · synced 18:06 · reminder by location</span>}
        </p>
      </div>
    </Shell>
  );
}

function EmailCard({ card, compact, approval }: { card: Extract<Card, { type: "emailDraft" }>; compact?: boolean; approval: ApprovalStatus }) {
  const [open, setOpen] = useState(!compact);
  const body = card.body.replace("next week", "over coffee on Tuesday");
  const status = approval === "approved" ? "Goes out Mon 7:30" : card.status;
  return (
    <Shell icon={<Mail size={15} />} eyebrow="Email draft">
      <div className="px-5 pt-1 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl leading-snug">{card.subject}</h3>
            <p className="mt-0.5 text-sm text-[var(--ink-2)]">To {card.to}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--surface-sunk)] px-3 py-1 text-[13px] font-medium text-[var(--ink-2)]">{status}</span>
        </div>
        {open ? (
          <p className="mt-4 rounded-2xl bg-[var(--surface-sunk)] p-4 text-[15px] leading-relaxed whitespace-pre-line">{body}</p>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="mt-3 text-sm font-semibold text-[var(--accent-ink)]">
            Read the email
          </button>
        )}
      </div>
    </Shell>
  );
}

function WeatherCard({ card }: { card: Extract<Card, { type: "weather" }> }) {
  const max = Math.max(...card.hourly.map((h) => h.temp));
  return (
    <Shell icon={<Sun size={15} />} eyebrow={`${card.place} · Tomorrow`}>
      <div className="px-5 pt-1 pb-5">
        <div className="flex items-end gap-4">
          <span className="font-display text-6xl leading-none font-light">{card.high}°</span>
          <div className="pb-1 text-[15px] text-[var(--ink-2)]">
            <p>{card.now}</p>
            <p>Low {card.low}°, high {card.high}°</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2" role="list" aria-label="Through the day">
          {card.hourly.map((h) => (
            <div key={h.time} role="listitem" className="flex flex-col items-center gap-1.5 rounded-2xl bg-[var(--surface-sunk)] px-1 py-3">
              <span className="text-[13px] text-[var(--ink-3)]">{h.time}:00</span>
              <span className="font-display text-lg">{h.temp}°</span>
              <div className="flex h-8 w-2 items-end overflow-hidden rounded-full bg-[var(--line)]" aria-hidden="true">
                <div className="w-full rounded-full" style={{ height: `${Math.max(h.temp / max, 0.15) * 100}%`, background: "var(--amber)" }} />
              </div>
              <span className={`flex items-center gap-0.5 text-[12px] ${h.rain >= 40 ? "font-semibold text-[var(--rain)]" : "text-[var(--ink-3)]"}`}>
                {h.rain > 0 && <CloudRain size={11} />}
                {h.rain}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function ApprovalCard({
  card,
  status,
  onApproval,
  expert,
}: {
  card: Extract<Card, { type: "approval" }>;
  status: ApprovalStatus;
  onApproval: (s: ApprovalStatus) => void;
  expert: boolean;
}) {
  return (
    <Shell icon={<Send size={15} />} eyebrow={status === "pending" ? "Needs your OK" : "Your OK"} tone={status === "pending" ? "warm" : undefined}>
      <div className="px-5 pt-1 pb-5">
        <h3 className="font-display text-xl">{card.action}</h3>
        <p className="mt-1 text-[15px] text-[var(--ink-2)]">{card.detail}</p>
        <p className="mt-1 text-[15px] text-[var(--ink-2)]">{card.when}</p>
        {expert && <p className="mt-2 text-[13px] text-[var(--ink-3)]">Tier: send on your behalf · asked by Writer · exact text locked once confirmed</p>}
        {status === "pending" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => onApproval("approved")} className="rounded-full bg-[var(--ember)] px-5 py-2.5 text-[15px] font-semibold text-[var(--on-accent)]">
              Yes, send it Monday
            </button>
            <button type="button" onClick={() => onApproval("declined")} className="rounded-full border border-[var(--line)] px-5 py-2.5 text-[15px] font-semibold text-[var(--ink-2)]">
              Not yet
            </button>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface-sunk)] px-4 py-3 text-[15px]">
            <span className="flex items-center gap-2">
              {status === "approved" ? <><Check size={16} className="text-[var(--ok)]" /> Confirmed. It goes out Monday at 7:30.</> : "Held back. Nothing will be sent."}
            </span>
            <button type="button" onClick={() => onApproval("pending")} className="shrink-0 text-sm font-semibold text-[var(--accent-ink)]">
              Undo
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}

export function PortfolioCard({ card }: { card: Extract<Card, { type: "portfolio" }> }) {
  return (
    <Shell icon={<Wallet size={15} />} eyebrow={`Portfolio · ${card.date}`}>
      <div className="px-5 pt-1 pb-5">
        <p className="font-display text-3xl">{card.total}</p>
        <p className="text-[15px] text-[var(--ok)]">{card.change} ({card.changePct}) today</p>
        <ul className="mt-3 divide-y divide-[var(--line)] text-[15px]">
          {card.lines.map((l) => (
            <li key={l.name} className="flex justify-between gap-3 py-2">
              <span>{l.name}</span>
              <span className="text-[var(--ink-2)]">{l.value} <span className="ml-1 text-[var(--ink-3)]">{l.change}</span></span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-[var(--ink-2)]">{card.note}</p>
      </div>
    </Shell>
  );
}

export function ThreadView({ thread, expert }: { thread: NonNullable<Message["thread"]>; expert: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="v02-rise-in w-full rounded-[22px] border border-dashed border-[var(--line)] px-4 py-3 text-left">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3" aria-expanded={open}>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--surface-sunk)] text-[var(--ok)]">
          <Check size={15} />
        </span>
        <span className="flex-1 text-left">
          <span className="block text-[15px] font-semibold">{thread.title}</span>
          <span className="block text-sm text-[var(--ink-2)]">Finished this afternoon · {thread.steps.length} steps</span>
        </span>
        <ChevronDown size={16} className={`text-[var(--ink-3)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ol className="mt-3 space-y-2 border-l border-[var(--line)] pl-5 text-[15px] text-[var(--ink-2)]">
          {thread.steps.map((s, i) => (
            <li key={s} className="relative">
              <span className="absolute top-2 -left-[23px] h-1.5 w-1.5 rounded-full bg-[var(--amber)]" />
              {s}
              {expert && <span className="ml-2 text-[13px] text-[var(--ink-3)]">{i < 3 ? "Researcher · cloud model" : "Writer · local model"}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
