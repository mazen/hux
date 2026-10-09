// PROTOTYPE - concept 10 "Instrument": inline cards shown in the conversation.
import { useState } from "react";
import { Check, ChevronDown, Clock, CloudRain, Mail, ShoppingBasket, Smartphone, Timer, Users } from "lucide-react";
import type { Card, Message } from "../../fixtures";
import { threadSteps } from "./data";
import { Key, Label, Led, cx, useInstrument } from "./ui";

type CardOf<T extends Card["type"]> = Extract<Card, { type: T }>;

function CardShell({ kind, right, children, accent }: { kind: string; right?: React.ReactNode; children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className={cx("panel mt-3 w-full max-w-[560px] overflow-hidden", accent && "!border-[var(--signal-line)]")}
      style={accent ? { boxShadow: "0 0 0 3px var(--signal-soft), var(--lift)" } : undefined}
    >
      <div className="flex items-center gap-2 border-b hairline px-4 py-2">
        <Label className="flex-1">{kind}</Label>
        {right}
      </div>
      {children}
    </div>
  );
}

export function RecipeCard({ card, onTimer }: { card: CardOf<"recipe">; onTimer: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  return (
    <CardShell
      kind="Recipe"
      right={
        <span className="mono flex items-center gap-3 text-[11px] text-[var(--muted)]">
          <span className="flex items-center gap-1"><Clock size={12} /> {card.time}</span>
          <span className="flex items-center gap-1"><Users size={12} /> {card.serves}</span>
        </span>
      }
    >
      <div className="px-4 pt-3 pb-4">
        <h3 className="text-[19px] font-semibold tracking-[-0.02em]">{card.title}</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <Label>You have</Label>
            <ul className="mt-1.5 space-y-1 text-[14px] text-[var(--ink-2)]">
              {card.have.map((h) => (
                <li key={h} className="flex items-center gap-2"><Check size={13} className="text-[var(--muted)]" />{h}</li>
              ))}
            </ul>
          </div>
          <div>
            <Label>Still need</Label>
            <ul className="mt-1.5 space-y-1 text-[14px]">
              {card.need.map((n) => (
                <li key={n} className="flex items-center gap-2"><Led state="signal" />{n}</li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-[var(--muted)]">On your shopping list</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="focusable mt-4 flex w-full items-center justify-between border-t hairline pt-3 text-left text-[13px] font-medium"
          aria-expanded={open}
        >
          <span>{open ? "Steps" : `Show the ${card.steps.length} steps`}</span>
          <ChevronDown size={16} className={cx("transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <ol className="fade mt-2 space-y-1">
            {card.steps.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setStep(step === i ? null : i)}
                  className={cx(
                    "focusable flex w-full gap-3 rounded-lg px-2 py-1.5 text-left text-[14px] leading-snug transition-colors",
                    step === i ? "bg-[var(--signal-soft)]" : "hover:bg-[var(--inset)]",
                  )}
                >
                  <span className={cx("mono pt-[2px] text-[11px]", step === i ? "text-[var(--signal-ink)]" : "text-[var(--faint)]")}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 text-[var(--ink-2)]">{s}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Key size="sm" tone="ink" onClick={onTimer}><Timer size={13} /> Start 25 min timer</Key>
        </div>
      </div>
    </CardShell>
  );
}

export function ShoppingCard({ card }: { card: CardOf<"shoppingList"> }) {
  const [items, setItems] = useState(card.items);
  const left = items.filter((i) => !i.done).length;
  return (
    <CardShell
      kind={card.title}
      right={<span className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]"><Smartphone size={12} /> On {card.sentTo}</span>}
    >
      <ul className="divide-y divide-[var(--line)]">
        {items.map((it, i) => (
          <li key={it.name}>
            <button
              type="button"
              onClick={() => setItems(items.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
              className="focusable flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] hover:bg-[var(--inset)]/40"
            >
              <span
                className={cx("grid h-[18px] w-[18px] place-items-center rounded-[5px] border transition-colors", it.done ? "border-[var(--ink-2)] bg-[var(--ink-2)] text-[var(--panel)]" : "border-[var(--line-strong)] bg-[var(--raised)]")}
              >
                {it.done && <Check size={12} strokeWidth={3} />}
              </span>
              <span className={cx("flex-1", it.done && "text-[var(--faint)] line-through")}>{it.name}</span>
              {(it.name === "Milk" || it.name === "Fresh basil") && !it.done && <span className="lbl !text-[9px] !text-[var(--signal-ink)]">New</span>}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 border-t hairline px-4 py-2 text-[12px] text-[var(--muted)]">
        <ShoppingBasket size={13} /> {left} to buy · reminds you at the supermarket
      </div>
    </CardShell>
  );
}

export function EmailCard({ card }: { card: CardOf<"emailDraft"> }) {
  const [open, setOpen] = useState(false);
  const paras = card.body.split("\n\n");
  return (
    <CardShell kind="Email" right={<span className="mono rounded-[5px] border hairline px-1.5 py-[1px] text-[10px] uppercase tracking-wider text-[var(--muted)]">{card.status}</span>}>
      <div className="grid grid-cols-[64px_1fr] gap-y-1 border-b hairline px-4 py-2.5 text-[13px]">
        <span className="lbl pt-[3px]">To</span>
        <span>{card.to}</span>
        <span className="lbl pt-[3px]">Subject</span>
        <span className="font-medium">{card.subject}</span>
      </div>
      <div className="relative px-4 py-3 text-[14px] leading-relaxed text-[var(--ink-2)]">
        <div className={cx(!open && "max-h-[118px] overflow-hidden")}>
          {paras.map((p, i) => (
            <p key={i} className="mb-2 whitespace-pre-line last:mb-0">{p}</p>
          ))}
        </div>
        {!open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--panel)] to-transparent" />}
      </div>
      <div className="flex items-center gap-2 border-t hairline px-4 py-2">
        <Mail size={13} className="text-[var(--muted)]" />
        <span className="flex-1 text-[12px] text-[var(--muted)]">98 words · no attachments</span>
        <Key size="sm" tone="flat" onClick={() => setOpen(!open)}>{open ? "Less" : "Read all"}</Key>
      </div>
    </CardShell>
  );
}

export function ApprovalCard({ card, approved, onApprove, onChange }: { card: CardOf<"approval">; approved: boolean; onApprove: () => void; onChange: () => void }) {
  if (approved)
    return (
      <CardShell kind="Approved" right={<Led state="on" />}>
        <div className="flex items-center gap-3 px-4 py-3 text-[14px]">
          <Check size={16} />
          <span>
            {card.action}. Goes out <span className="mono">{card.when}</span>.
          </span>
        </div>
      </CardShell>
    );
  return (
    <CardShell kind="Needs your OK" accent right={<Led state="pulse" />}>
      <div className="px-4 py-3">
        <div className="text-[16px] font-semibold tracking-[-0.01em]">{card.action}</div>
        <div className="mt-1 text-[13px] text-[var(--muted)]">{card.detail}</div>
        <div className="mt-3 flex items-center gap-3">
          <div className="well rounded-lg px-3 py-2">
            <div className="lbl !text-[9px]">Sends</div>
            <div className="mono text-[13px] font-medium">{card.when}</div>
          </div>
          <p className="text-[12px] leading-snug text-[var(--muted)]">You approve this exact email once. hux won't ask again.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Key tone="signal" onClick={onApprove}><Check size={15} /> Approve</Key>
          <Key onClick={onChange}>Change something</Key>
        </div>
      </div>
    </CardShell>
  );
}

export function WeatherCard({ card }: { card: CardOf<"weather"> }) {
  const max = Math.max(...card.hourly.map((h) => h.temp));
  const min = Math.min(...card.hourly.map((h) => h.temp));
  return (
    <CardShell kind={`Tomorrow · ${card.place}`} right={<span className="text-[12px] text-[var(--muted)]">{card.now}</span>}>
      <div className="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-end">
        <div className="flex items-end gap-4">
          <div className="mono text-[46px] leading-none font-medium tracking-[-0.04em]">{card.temp}°</div>
          <div className="mono pb-1 text-[12px] text-[var(--muted)]">
            <div>H {card.high}°</div>
            <div>L {card.low}°</div>
          </div>
        </div>
        <div className="flex flex-1 items-end justify-between gap-2 sm:pl-4">
          {card.hourly.map((h) => {
            const t = (h.temp - min) / Math.max(1, max - min);
            return (
              <div key={h.time} className="flex flex-1 flex-col items-center gap-1">
                <span className="mono text-[11px]">{h.temp}°</span>
                <div className="well relative flex h-[46px] w-full max-w-[34px] items-end overflow-hidden rounded-[6px]">
                  <div className="w-full rounded-[5px] bg-[var(--ink-2)]/80" style={{ height: `${28 + t * 62}%` }} />
                </div>
                <div className="well h-[4px] w-full max-w-[34px] overflow-hidden rounded-full" title={`${h.rain}% chance of rain`}>
                  <div className="h-full rounded-full bg-[var(--signal)]" style={{ width: `${h.rain}%` }} />
                </div>
                <span className="mono text-[10px] text-[var(--muted)]">{h.time.padStart(2, "0")}:00</span>
                <span className={cx("mono flex items-center gap-0.5 text-[10px]", h.rain >= 40 ? "text-[var(--signal-ink)]" : "text-[var(--faint)]")}>
                  {h.rain > 0 && <CloudRain size={10} />}
                  {h.rain}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </CardShell>
  );
}

export function PortfolioCard({ card }: { card: CardOf<"portfolio"> }) {
  return (
    <div className="well rounded-xl p-3">
      <div className="flex items-baseline justify-between">
        <Label>Portfolio · {card.date}</Label>
        <span className="mono text-[12px] text-[var(--ink-2)]">{card.change} ({card.changePct})</span>
      </div>
      <div className="mono mt-1 text-[24px] font-medium tracking-[-0.03em]">{card.total}</div>
      <div className="mt-2 space-y-1">
        {card.lines.map((l) => (
          <div key={l.name} className="flex justify-between text-[12px]">
            <span className="text-[var(--ink-2)]">{l.name}</span>
            <span className="mono text-[var(--muted)]">{l.value} <span className="inline-block w-12 text-right">{l.change}</span></span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-[var(--muted)]">{card.note}</p>
    </div>
  );
}

export function ThreadCard({ thread }: { thread: NonNullable<Message["thread"]> }) {
  const { expert } = useInstrument();
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 w-full max-w-[560px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="key h-auto w-full !justify-start gap-3 !rounded-xl px-3.5 py-2.5 text-left"
      >
        <Led state={thread.status === "running" ? "pulse" : "on"} />
        <span className="flex-1">
          <span className="block text-[13px] font-semibold">{thread.title}</span>
          <span className="block text-[12px] text-[var(--muted)]">
            {thread.status === "done" ? "Finished this afternoon" : "Working on it"} · {thread.steps.length} steps
          </span>
        </span>
        <ChevronDown size={16} className={cx("text-[var(--muted)] transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ol className="fade mt-1 ml-[18px] border-l hairline pl-4">
          {thread.steps.map((s, i) => (
            <li key={s} className="relative py-1.5 text-[13px]">
              <span className="absolute top-[13px] -left-[20px] h-[7px] w-[7px] rounded-full border border-[var(--line-strong)] bg-[var(--ink-2)]" />
              <span>{s}</span>
              {expert && (
                <span className="mono ml-2 text-[11px] text-[var(--faint)]">
                  {threadSteps[i]?.helper} · {threadSteps[i]?.took}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
