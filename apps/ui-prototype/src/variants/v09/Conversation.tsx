// PROTOTYPE - concept 09 "Grove": the Conversation and its inline cards.
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Check, ChefHat, ChevronDown, Clock, CloudSun, Mail, Pencil, ShieldCheck, ShoppingBasket, Smartphone, Timer, Undo2, Users,
} from "lucide-react";
import type { Card as CardT, Message } from "../../fixtures";
import { deviceName, messageMeta, threadMeta } from "./data";
import { useGrove, type Msg } from "./store";
import { Button, Card, ExpertNote, IconTile, RingMark } from "./ui";

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });

function CardHead({ icon, tone, label, right }: { icon: typeof Mail; tone: "moss" | "clay" | "ochre" | "rain" | "stone"; label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-5 pt-4">
      <IconTile icon={icon} tone={tone} size={30} />
      <span className="text-[13px] font-semibold tracking-[0.04em] text-(--ink-3) uppercase">{label}</span>
      <span className="ml-auto">{right}</span>
    </div>
  );
}

function RecipeCard({ c }: { c: Extract<CardT, { type: "recipe" }> }) {
  const g = useGrove();
  const [steps, setSteps] = useState(false);
  return (
    <Card className="overflow-hidden">
      <CardHead icon={ChefHat} tone="clay" label="Recipe" right={<span className="text-[13.5px] text-(--ink-2)">{c.time} · serves {c.serves}</span>} />
      <div className="px-5 pt-2 pb-4">
        <h3 className="g-display text-[24px] leading-tight font-bold">{c.title}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-[13px] font-semibold text-(--moss-text)">You have</div>
            <ul className="space-y-1">
              {c.have.map((h) => (
                <li key={h} className="flex items-center gap-2 text-[15px]">
                  <Check size={15} className="shrink-0 text-(--moss)" strokeWidth={2.4} />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1.5 text-[13px] font-semibold text-(--clay)">You need</div>
            <ul className="space-y-1">
              {c.need.map((h) => (
                <li key={h} className="flex items-center gap-2 text-[15px]">
                  <span className="ml-1 size-1.5 shrink-0 rounded-full bg-(--clay)" />
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-(--clay-soft) px-2.5 py-1 text-[12.5px] font-semibold text-(--clay)">
              <ShoppingBasket size={13} /> On your shopping list
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-(--line)">
        <button onClick={() => setSteps((s) => !s)} className="flex w-full items-center gap-2 px-5 py-3 text-left text-[14.5px] font-semibold text-(--ink-2) hover:text-(--ink)">
          {steps ? "Hide steps" : `${c.steps.length} steps`}
          <ChevronDown size={16} className={`transition-transform ${steps ? "rotate-180" : ""}`} />
        </button>
        {steps && (
          <ol className="g-rise space-y-3 px-5 pb-4">
            {c.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-snug">
                <span className="g-display grid size-6 shrink-0 place-items-center rounded-full bg-(--sunk) text-[13px] font-bold text-(--ink-2)">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
        )}
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          <Button small kind="soft" icon={Timer} onClick={() => g.send("Start the frittata timer")}>Start 25 min timer</Button>
          <Button small kind="line" onClick={() => g.send("Read me the recipe step by step")}>Read it to me</Button>
        </div>
      </div>
    </Card>
  );
}

function ShoppingCard({ c }: { c: Extract<CardT, { type: "shoppingList" }> }) {
  const g = useGrove();
  return (
    <Card>
      <CardHead
        icon={ShoppingBasket}
        tone="moss"
        label={c.title}
        right={
          <span className="flex items-center gap-1 text-[13px] text-(--ink-2)">
            <Smartphone size={14} /> On {c.sentTo}
          </span>
        }
      />
      <ul className="px-3 pt-2 pb-3">
        {g.shopping.map((i) => (
          <li key={i.name}>
            <button onClick={() => g.toggleShopping(i.name)} className="flex w-full items-center gap-3 rounded-[12px] px-2 py-1.5 text-left hover:bg-(--sunk)">
              <span className={`grid size-5 place-items-center rounded-[7px] border-[1.5px] transition ${i.done ? "border-(--moss) bg-(--moss) text-(--moss-ink)" : "border-(--line-strong)"}`}>
                {i.done && <Check size={13} strokeWidth={3} />}
              </span>
              <span className={`text-[15.5px] ${i.done ? "text-(--ink-3) line-through" : ""}`}>{i.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ThreadRow({ t }: { t: NonNullable<Message["thread"]> }) {
  const { expert } = useGrove();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[18px] border border-dashed border-(--line-strong) bg-(--surface)">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left">
        <span className="grid size-6 place-items-center rounded-full bg-(--moss-soft) text-(--moss-text)">
          <Check size={13} strokeWidth={3} />
        </span>
        <span className="flex-1 text-[15px] font-semibold">{t.title}</span>
        <span className="text-[13px] text-(--ink-3)">{t.status === "done" ? "Done" : "Working"} · {t.steps.length} steps</span>
        <ChevronDown size={16} className={`text-(--ink-3) transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="g-rise px-4 pb-3">
          <ol className="relative ml-3 border-l-[1.5px] border-(--moss-soft) pl-5">
            {t.steps.map((s) => (
              <li key={s} className="relative py-1 text-[14.5px] text-(--ink-2)">
                <span className="absolute top-[11px] -left-[25px] size-2 rounded-full bg-(--moss)" />
                {s}
              </li>
            ))}
          </ol>
          {expert && (
            <ExpertNote className="mt-2 pl-3">
              {threadMeta.helper} · {threadMeta.model} · {threadMeta.took} · {threadMeta.tokens}
            </ExpertNote>
          )}
        </div>
      )}
    </div>
  );
}

function EmailCard({ c }: { c: Extract<CardT, { type: "emailDraft" }> }) {
  const g = useGrove();
  const [editing, setEditing] = useState(false);
  const status = g.approval === "approved" ? "Sends Mon 7:30" : c.status;
  return (
    <Card>
      <CardHead
        icon={Mail}
        tone="rain"
        label="Email"
        right={
          <span className={`rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ${g.approval === "approved" ? "bg-(--moss-soft) text-(--moss-text)" : "bg-(--sunk) text-(--ink-2)"}`}>{status}</span>
        }
      />
      <dl className="mx-5 mt-3 grid grid-cols-[64px_1fr] gap-y-1 border-b border-(--line) pb-3 text-[14.5px]">
        <dt className="text-(--ink-3)">To</dt>
        <dd className="font-semibold">{c.to}</dd>
        <dt className="text-(--ink-3)">Subject</dt>
        <dd className="font-semibold">{c.subject}</dd>
      </dl>
      {editing ? (
        <textarea
          value={g.emailBody}
          onChange={(e) => g.setEmailBody(e.target.value)}
          rows={11}
          className="mx-5 mt-3 block w-[calc(100%-40px)] resize-y rounded-[14px] border border-(--line-strong) bg-(--surface) p-3 text-[15px] leading-relaxed outline-none focus:border-(--moss)"
        />
      ) : (
        <p className="px-5 pt-3 text-[15px] leading-relaxed whitespace-pre-wrap text-(--ink)">{g.emailBody}</p>
      )}
      <div className="flex gap-2 px-5 pt-3 pb-4">
        <Button small kind={editing ? "solid" : "line"} icon={editing ? Check : Pencil} onClick={() => setEditing((e) => !e)}>
          {editing ? "Done" : "Edit"}
        </Button>
      </div>
    </Card>
  );
}

export function ApprovalCard({ c, compact }: { c: Extract<CardT, { type: "approval" }>; compact?: boolean }) {
  const g = useGrove();
  if (g.approval !== "pending")
    return (
      <div className="g-rise flex items-center gap-3 rounded-[20px] border border-(--line) bg-(--surface) px-4 py-3">
        <IconTile icon={g.approval === "approved" ? Check : Clock} tone={g.approval === "approved" ? "moss" : "stone"} size={30} />
        <p className="flex-1 text-[14.5px]">
          {g.approval === "approved" ? <>Approved. It goes out <b>{c.when}</b>.</> : <>Not sent. The draft stays as it is.</>}
        </p>
        <Button small kind="ghost" icon={Undo2} onClick={() => g.setApproval("pending")}>Undo</Button>
      </div>
    );
  return (
    <div id={compact ? undefined : "v09-approval"} className={`rounded-[22px] border border-(--ochre)/40 bg-(--ochre-soft) ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.04em] text-(--ochre) uppercase">
        <ShieldCheck size={15} /> Needs your OK
      </div>
      <div className={`g-display mt-1.5 font-bold ${compact ? "text-[19px]" : "text-[21px]"}`}>{c.action}</div>
      <p className="mt-0.5 text-[14.5px] text-(--ink-2)">{c.detail}</p>
      <p className="mt-0.5 text-[14.5px] text-(--ink-2)">{c.when}</p>
      {g.expert && <ExpertNote className="mt-2">tier: send · helper: Writer · approval binds to this exact message (sha256 9f3c…a71e)</ExpertNote>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button small={compact} kind="solid" icon={Check} onClick={() => g.setApproval("approved")}>Approve</Button>
        <Button small={compact} kind="ghost" onClick={() => g.setApproval("declined")}>Not now</Button>
      </div>
    </div>
  );
}

function WeatherCard({ c }: { c: Extract<CardT, { type: "weather" }> }) {
  const temps = c.hourly.map((h) => h.temp);
  const min = Math.min(...temps) - 2;
  const max = Math.max(...temps) + 2;
  const W = 300;
  const H = 54;
  const x = (i: number) => (W / c.hourly.length) * (i + 0.5);
  const y = (t: number) => H - ((t - min) / (max - min)) * (H - 12) - 6;
  const path = c.hourly.map((h, i) => `${i ? "L" : "M"}${x(i)},${y(h.temp)}`).join(" ");
  return (
    <Card>
      <CardHead icon={CloudSun} tone="ochre" label={`Tomorrow · ${c.place}`} />
      <div className="flex items-end gap-4 px-5 pt-2">
        <div className="g-display g-num text-[52px] leading-none font-bold">{c.high}°</div>
        <div className="pb-1.5 text-[15px] text-(--ink-2)">
          <div>{c.now}, rain later</div>
          <div className="g-num text-(--ink-3)">Low {c.low}° · now {c.temp}°</div>
        </div>
      </div>
      <div className="px-5 pt-3 pb-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[54px] w-full overflow-visible" preserveAspectRatio="none" aria-hidden>
          <path d={path} fill="none" stroke="var(--ochre)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${c.hourly.length}, 1fr)` }}>
          {c.hourly.map((h) => (
            <div key={h.time} className="flex flex-col items-center gap-1">
              <span className="g-num text-[15px] font-semibold">{h.temp}°</span>
              <span className="flex h-9 w-5 items-end overflow-hidden rounded-[6px] bg-(--sunk)">
                <span className="block w-full rounded-[6px] bg-(--rain)" style={{ height: `${h.rain}%` }} />
              </span>
              <span className={`g-num text-[12px] ${h.rain ? "font-semibold text-(--rain)" : "text-(--ink-3)"}`}>{h.rain ? `${h.rain}%` : "dry"}</span>
              <span className="g-num text-[12.5px] text-(--ink-3)">{h.time}:00</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function CardView({ c }: { c: CardT }) {
  switch (c.type) {
    case "recipe": return <RecipeCard c={c} />;
    case "shoppingList": return <ShoppingCard c={c} />;
    case "emailDraft": return <EmailCard c={c} />;
    case "approval": return <ApprovalCard c={c} />;
    case "weather": return <WeatherCard c={c} />;
    default: return null;
  }
}

function MessageView({ m }: { m: Msg }) {
  const g = useGrove();
  if (m.from === "member") {
    return (
      <div className={`flex flex-col items-end ${m.fresh ? "g-rise" : ""}`}>
        <div className="max-w-[85%] rounded-[22px] rounded-br-[8px] bg-(--sunk) px-4 py-2.5 text-[16.5px] leading-snug sm:max-w-[75%]">{m.text}</div>
        {g.expert && <ExpertNote className="mt-1 mr-1">{time(m.at)} · {deviceName[m.device]} · Alex (voice match 0.97)</ExpertNote>}
      </div>
    );
  }
  const meta = messageMeta[m.id];
  return (
    <div className={`flex gap-3 ${m.fresh ? "g-rise" : ""}`}>
      <span className="mt-0.5 shrink-0 text-(--moss)"><RingMark size={22} /></span>
      <div className="min-w-0 flex-1 space-y-3">
        <p className="text-[16.5px] leading-relaxed text-(--ink)">{m.text}</p>
        {m.thread && <ThreadRow t={m.thread} />}
        {m.card && <CardView c={m.card} />}
        {m.link && (
          <button
            onClick={() => {
              if (m.link!.view) g.go(m.link!.view, m.link!.focus);
              if (m.link!.sheet) g.setSheet(m.link!.sheet);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-(--line-strong) px-3 py-1.5 text-[13.5px] font-semibold text-(--moss-text) hover:bg-(--sunk)"
          >
            {m.link.label} <ArrowRight size={14} />
          </button>
        )}
        {g.expert && (
          <ExpertNote>
            {time(m.at)} · {deviceName[m.device]} · {meta ? `${meta.helper} · ${meta.model} · ${meta.trust}` : "Chief · qwen3-30b-a3b · desk · local"}
          </ExpertNote>
        )}
      </div>
    </div>
  );
}

export function Conversation() {
  const g = useGrove();
  const endRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: first.current ? "auto" : "smooth", block: "end" });
    first.current = false;
  }, [g.messages.length, g.thinking]);

  return (
    <div className="mx-auto w-full max-w-[720px] space-y-7 px-4 pt-6 pb-6 sm:px-6">
      <div className="flex items-center gap-3 text-[13px] text-(--ink-3)">
        <span className="h-px flex-1 bg-(--line)" />
        <span className="flex items-center gap-1.5">
          Friday evening
          {g.expert && <><Users size={13} /> Alex · 3 devices</>}
        </span>
        <span className="h-px flex-1 bg-(--line)" />
      </div>
      {g.messages.map((m) => (
        <MessageView key={m.id} m={m} />
      ))}
      {g.thinking && (
        <div className="g-fade flex items-center gap-3">
          <span className="text-(--moss)"><RingMark size={22} /></span>
          <span className="flex gap-1">
            <span className="g-dot size-1.5 rounded-full bg-(--ink-3)" />
            <span className="g-dot size-1.5 rounded-full bg-(--ink-3)" />
            <span className="g-dot size-1.5 rounded-full bg-(--ink-3)" />
          </span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
