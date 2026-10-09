// PROTOTYPE - concept 07 "Glass": inline cards the assistant shows.
import { useState } from "react";
import {
  Check, ChevronDown, Clock, CloudRain, CloudSun, Droplets, Mail, Pencil, Phone, Play, Send, ShoppingBasket, Timer, Users, X,
} from "lucide-react";
import type { Card, Message } from "../../fixtures";
import { useApp } from "./state";
import { Meta } from "./ui";

type Of<T extends Card["type"]> = Extract<Card, { type: T }>;

function Sheet({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass mt-3 overflow-hidden rounded-[22px] ${className}`}>{children}</div>;
}

function Kicker({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] font-bold tracking-wide uppercase ink-3">
      {icon}
      {children}
    </div>
  );
}

export function RecipeCard({ c }: { c: Of<"recipe"> }) {
  const { send } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <Sheet>
      <div className="relative p-5">
        <div
          className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full opacity-60"
          style={{ background: "radial-gradient(circle, rgba(129,178,154,.55), transparent 65%)" }}
        />
        <Kicker icon={<Timer size={13} />}>Recipe</Kicker>
        <h3 className="serif mt-1 text-[30px] leading-tight">{c.title}</h3>
        <div className="mt-1 flex gap-4 text-[13px] font-medium ink-2">
          <span className="flex items-center gap-1"><Clock size={14} /> {c.time}</span>
          <span className="flex items-center gap-1"><Users size={14} /> Serves {c.serves}</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="pane rounded-2xl p-3.5">
            <div className="mb-2 text-[12px] font-bold ok">You have</div>
            <ul className="space-y-1.5 text-[14px]">
              {c.have.map((h) => (
                <li key={h} className="flex items-center gap-2"><Check size={14} className="ok" />{h}</li>
              ))}
            </ul>
          </div>
          <div className="pane rounded-2xl p-3.5">
            <div className="mb-2 text-[12px] font-bold ember">You need</div>
            <ul className="space-y-1.5 text-[14px]">
              {c.need.map((h) => (
                <li key={h} className="flex items-center gap-2"><ShoppingBasket size={14} className="ember" />{h}</li>
              ))}
            </ul>
            <div className="mt-2 text-[12px] ink-3">On your shopping list</div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between border-t line px-5 py-3 text-left text-[14px] font-semibold hover:bg-[var(--fill-2)]"
        aria-expanded={open}
      >
        {open ? "Hide the steps" : `Show the ${c.steps.length} steps`}
        <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ol className="rise space-y-3 px-5 pb-4">
          {c.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-[14.5px] leading-relaxed">
              <span className="accent-soft accent mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-wrap gap-2 border-t line px-5 py-3">
        <button onClick={() => send("Start the frittata timer")} className="btn-accent flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-semibold">
          <Play size={14} /> Start cooking
        </button>
        <button onClick={() => send("Read me the recipe step by step")} className="pane rounded-full px-4 py-2 text-[13.5px] font-semibold">
          Read it to me
        </button>
      </div>
    </Sheet>
  );
}

export function ShoppingCard({ c }: { c: Of<"shoppingList"> }) {
  const [items, setItems] = useState(c.items);
  const left = items.filter((i) => !i.done).length;
  return (
    <Sheet className="max-w-[420px]">
      <div className="flex items-start justify-between p-5 pb-3">
        <div>
          <Kicker icon={<ShoppingBasket size={13} />}>{c.title}</Kicker>
          <div className="mt-1 text-[22px] font-bold tracking-tight">{left} to buy</div>
        </div>
        <span className="ok-soft ok flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold">
          <Phone size={12} /> On {c.sentTo}
        </span>
      </div>
      <ul className="px-2 pb-3">
        {items.map((it, i) => (
          <li key={it.name}>
            <button
              onClick={() => setItems(items.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[15px] hover:bg-[var(--fill-2)]"
            >
              <span
                className={`grid h-[22px] w-[22px] place-items-center rounded-full border-2 transition-colors ${it.done ? "btn-accent border-transparent" : "border-[var(--ink-3)]"}`}
              >
                {it.done && <Check size={13} strokeWidth={3} />}
              </span>
              <span className={it.done ? "line-through ink-3" : ""}>{it.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export function ThreadStrip({ t }: { t: NonNullable<Message["thread"]> }) {
  const { expert } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <div className="pane mt-3 rounded-2xl">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3 text-left" aria-expanded={open}>
        <span className="ok-soft ok grid h-7 w-7 place-items-center rounded-full"><Check size={15} strokeWidth={2.5} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold">{t.title}</span>
          <span className="block text-[12.5px] ink-3">
            {t.status === "done" ? "Finished this afternoon" : "Working on it"} · {t.steps.length} steps
          </span>
        </span>
        <ChevronDown size={18} className={`ink-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ol className="rise relative mx-4 mb-4 ml-[29px] border-l-2 line pl-5">
          {t.steps.map((s, i) => (
            <li key={s} className="relative py-1.5 text-[14px]">
              <span className="absolute top-[13px] -left-[26px] h-2.5 w-2.5 rounded-full" style={{ background: "var(--ok)" }} />
              {s}
              {expert && (
                <div><Meta>{["Researcher · 15:10", "Researcher · 15:16", "Researcher · 15:21", "Writer · 15:24"][i]}</Meta></div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function EmailCard({ c }: { c: Of<"emailDraft"> }) {
  const { approval } = useApp();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(c.body.replace("next week", "over coffee on Tuesday"));
  const status = approval === "approved" ? "Scheduled · Mon 7:30" : approval === "declined" ? "Kept as draft" : c.status;
  return (
    <Sheet>
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <Kicker icon={<Mail size={13} />}>Email</Kicker>
        <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${approval === "approved" ? "ok-soft ok" : "fill-2 ink-2"}`}>{status}</span>
      </div>
      <div className="px-5 pt-2 pb-1 text-[14px]">
        <div className="flex gap-2 border-b line py-2"><span className="w-16 ink-3">To</span><span className="font-semibold">{c.to}</span></div>
        <div className="flex gap-2 border-b line py-2"><span className="w-16 ink-3">Subject</span><span className="font-semibold">{c.subject}</span></div>
      </div>
      <div className="px-5 py-3">
        {editing ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={11}
            className="pane w-full resize-none rounded-2xl p-3 text-[14.5px] leading-relaxed outline-none"
          />
        ) : (
          <p className="text-[14.5px] leading-relaxed whitespace-pre-line">{body}</p>
        )}
      </div>
      <div className="flex gap-2 border-t line px-5 py-3">
        <button onClick={() => setEditing(!editing)} className="pane flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-semibold">
          {editing ? <><Check size={14} /> Done editing</> : <><Pencil size={14} /> Edit</>}
        </button>
      </div>
    </Sheet>
  );
}

export function ApprovalCard({ c, compact = false }: { c: Of<"approval">; compact?: boolean }) {
  const { approval, setApproval, expert } = useApp();
  if (approval !== "pending") {
    return (
      <div className={`pane flex items-center gap-3 rounded-2xl px-4 py-3 ${compact ? "" : "mt-3 max-w-[460px]"}`}>
        <span className={`grid h-7 w-7 place-items-center rounded-full ${approval === "approved" ? "ok-soft ok" : "fill-2 ink-3"}`}>
          {approval === "approved" ? <Check size={15} strokeWidth={2.5} /> : <X size={15} />}
        </span>
        <span className="flex-1 text-[14px]">
          {approval === "approved" ? <>Approved. It goes out <b>{c.when}</b>.</> : <>Not sent. The draft is waiting for you.</>}
        </span>
        <button onClick={() => setApproval("pending")} className="text-[13px] font-semibold accent">Undo</button>
      </div>
    );
  }
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] ${compact ? "pane" : "glass-strong mt-3 max-w-[460px]"}`}
      style={{ boxShadow: compact ? undefined : "inset 0 1px 0 var(--glass-hi), 0 0 0 1.5px var(--accent), 0 20px 50px -24px var(--accent)" }}
    >
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-[12px] font-bold tracking-wide uppercase accent">
          <Send size={13} /> Needs your OK
        </div>
        <div className="mt-1.5 text-[17px] font-bold tracking-tight">{c.action}</div>
        <div className="mt-0.5 text-[14px] ink-2">{c.detail}</div>
        <div className="mt-2 flex items-center gap-1.5 text-[13.5px] font-semibold"><Clock size={14} className="ink-3" />{c.when}</div>
        {expert && <div className="mt-2"><Meta>tier: send-external · rule after approval: auto-send identical drafts · helper: Writer</Meta></div>}
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <button onClick={() => setApproval("approved")} className="btn-accent flex-1 rounded-full px-4 py-2.5 text-[14px] font-bold">Approve</button>
        <button onClick={() => setApproval("declined")} className={`${compact ? "fill-2" : "pane"} rounded-full px-4 py-2.5 text-[14px] font-semibold`}>Not now</button>
      </div>
    </div>
  );
}

export function WeatherCard({ c }: { c: Of<"weather"> }) {
  const max = Math.max(...c.hourly.map((h) => h.temp));
  const min = Math.min(...c.hourly.map((h) => h.temp));
  return (
    <Sheet className="max-w-[460px]">
      <div className="relative p-5">
        <div
          className="pointer-events-none absolute -top-14 -right-8 h-44 w-44 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,200,120,.55), transparent 65%)" }}
        />
        <Kicker icon={<CloudSun size={13} />}>Tomorrow · {c.place}</Kicker>
        <div className="mt-1 flex items-end gap-4">
          <div className="serif text-[64px] leading-none">{c.high}°</div>
          <div className="pb-2 text-[14px] ink-2">
            <div className="font-semibold ink">{c.now}, rain later</div>
            <div>Low {c.low}° · High {c.high}°</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1 px-4 pb-4">
        {c.hourly.map((h) => {
          const pct = (h.temp - min) / Math.max(1, max - min);
          return (
            <div key={h.time} className="pane flex flex-col items-center rounded-2xl px-1 py-3">
              <div className="text-[12px] font-semibold ink-3">{h.time}:00</div>
              <div className="relative my-2 h-14 w-1.5 rounded-full fill-2">
                <div
                  className="absolute bottom-0 left-0 w-full rounded-full"
                  style={{ height: `${25 + pct * 75}%`, background: "linear-gradient(to top, #f0a35e, #e86f55)" }}
                />
              </div>
              <div className="text-[15px] font-bold tabular">{h.temp}°</div>
              <div className={`mt-1 flex items-center gap-0.5 text-[11.5px] font-semibold ${h.rain >= 40 ? "accent" : "ink-3"}`}>
                {h.rain >= 40 ? <CloudRain size={12} /> : <Droplets size={12} />}
                {h.rain}%
              </div>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

export function PortfolioCard({ c }: { c: Of<"portfolio"> }) {
  return (
    <div className="pane rounded-2xl p-4">
      <div className="text-[12px] font-bold tracking-wide uppercase ink-3">Portfolio · {c.date}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[24px] font-bold tracking-tight tabular">{c.total}</span>
        <span className="text-[14px] font-semibold ok tabular">{c.change} ({c.changePct})</span>
      </div>
      <ul className="mt-2 space-y-1 text-[13.5px]">
        {c.lines.map((l) => (
          <li key={l.name} className="flex justify-between gap-3">
            <span className="ink-2">{l.name}</span>
            <span className="tabular"><b className="font-semibold">{l.value}</b> <span className="ink-3">{l.change}</span></span>
          </li>
        ))}
      </ul>
      <div className="mt-2 text-[13px] ink-3">{c.note}</div>
    </div>
  );
}

export function CardView({ card }: { card: Card }) {
  switch (card.type) {
    case "recipe": return <RecipeCard c={card} />;
    case "shoppingList": return <ShoppingCard c={card} />;
    case "emailDraft": return <EmailCard c={card} />;
    case "approval": return <ApprovalCard c={card} />;
    case "weather": return <WeatherCard c={card} />;
    case "portfolio": return <Sheet className="p-1"><PortfolioCard c={card} /></Sheet>;
  }
}
