// PROTOTYPE concept 03 - the cards hux shows. One component per card, two sizes: stage (large) and compact (phone deck).
import { useState } from "react";
import { ArrowUpRight, Check, Pin, PinOff, Plus } from "lucide-react";
import { helpers, type Card } from "../../fixtures";
import { useHux, type StageItem } from "./store";
import { Btn, Label } from "./ui";
import { deviceName, hhmm } from "./data";

type Size = { big: boolean };

/** Big number with a small unit label underneath. */
function Figure({ n, unit, big, signal }: { n: string; unit: string; big: boolean; signal?: boolean }) {
  return (
    <div className="min-w-0">
      <div className={`t-num ${big ? "text-[56px] lg:text-[72px]" : "text-[36px]"} ${signal ? "c-sig" : ""}`}>{n}</div>
      <div className="t-meta mt-2">{unit}</div>
    </div>
  );
}

function Title({ children, big }: { children: string; big: boolean }) {
  return <h3 className={`t-display ${big ? "text-[34px] lg:text-[44px]" : "text-[24px]"}`}>{children}</h3>;
}

/* ---------- Recipe ---------- */
function Recipe({ c, big }: Size & { c: Extract<Card, { type: "recipe" }> }) {
  const { send } = useHux();
  const [step, setStep] = useState<number | null>(null);
  return (
    <div>
      <Title big={big}>{c.title}</Title>
      <div className={`mt-6 grid grid-cols-3 gap-4 border-t b-ink pt-4`}>
        <Figure big={big} n={c.time.replace(" min", "")} unit="minutes" />
        <Figure big={big} n={String(c.serves)} unit="people" />
        <Figure big={big} n={`${c.have.length}/${c.have.length + c.need.length}`} unit="already at home" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-3">
        <div>
          <Label className="c-mute mb-2">You have</Label>
          <ul className="text-[14px] leading-6">{c.have.map((h) => <li key={h}>{h}</li>)}</ul>
        </div>
        <div>
          <Label className="c-mute mb-2">To buy</Label>
          <ul className="text-[14px] leading-6">{c.need.map((h) => <li key={h}>{h}</li>)}</ul>
          <div className="t-meta mt-1">On your shopping list</div>
        </div>
      </div>
      <div className="mt-6 border-t pt-3">
        <Label className="c-mute mb-1">Method</Label>
        <ol>
          {(big ? c.steps : c.steps.slice(0, 2)).map((s, i) => (
            <li key={i}>
              <button
                onClick={() => setStep(step === i ? null : i)}
                className={`grid w-full grid-cols-[2.25rem_1fr] items-baseline gap-2 border-b py-2.5 text-left transition-colors ${step === i ? "" : "hover:bg-[var(--paper-2)]"}`}
                style={step === i ? { boxShadow: "inset 3px 0 0 var(--ink)" } : undefined}
              >
                <span className={`t-num pl-2 ${big ? "text-[22px]" : "text-[18px]"} ${step === i ? "" : "c-mute"}`}>{i + 1}</span>
                <span className={`text-[14px] leading-[1.45] ${step === i ? "font-semibold" : ""}`}>{s}</span>
              </button>
            </li>
          ))}
        </ol>
        {!big && <div className="t-meta mt-2">{c.steps.length - 2} more steps</div>}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Btn tone="ink" onClick={() => send("Start the frittata timer")}>Start 25 min timer</Btn>
        <Btn onClick={() => send("Read me the recipe step by step")}>Read it to me</Btn>
      </div>
    </div>
  );
}

/* ---------- Shopping list ---------- */
function Shopping({ c, big }: Size & { c: Extract<Card, { type: "shoppingList" }> }) {
  const { shop, toggleShop, addShop, expert } = useHux();
  const [adding, setAdding] = useState("");
  const left = shop.filter((i) => !i.done).length;
  return (
    <div>
      <div className="flex items-end justify-between gap-6">
        <Title big={big}>{c.title}</Title>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t b-ink pt-4">
        <Figure big={big} n={String(left)} unit="still to buy" />
        <div className="self-end">
          <div className="text-[14px] font-semibold">On {c.sentTo}</div>
          <div className="t-meta">Reminds you at the supermarket</div>
        </div>
      </div>
      <ul className="mt-6 border-t">
        {shop.map((it, i) => (
          <li key={it.name + i} className="border-b">
            <button onClick={() => toggleShop(i)} className="flex w-full items-center gap-3 py-3 text-left hover:bg-[var(--paper-2)]">
              <span className="grid h-[18px] w-[18px] shrink-0 place-items-center border b-ink" style={{ background: it.done ? "var(--ink)" : "transparent" }}>
                {it.done && <Check size={12} strokeWidth={3} style={{ color: "var(--paper)" }} />}
              </span>
              <span className={`text-[15px] ${it.done ? "c-mute line-through" : ""}`}>{it.name}</span>
              {expert && <span className="t-meta ml-auto pr-1">{it.done ? "Bought Wed" : "Added by Alex"}</span>}
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => { e.preventDefault(); if (adding.trim()) { addShop(adding.trim()); setAdding(""); } }}
      >
        <Plus size={16} className="c-mute" />
        <input value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="Add something" className="h-9 flex-1 bg-transparent text-[15px] outline-none" />
      </form>
    </div>
  );
}

/* ---------- Email draft ---------- */
function Email({ c, big }: Size & { c: Extract<Card, { type: "emailDraft" }> }) {
  const { approval, show, expert } = useHux();
  const [before, after] = c.body.split("next week");
  const status =
    approval === "approved" ? "Scheduled for Mon 12 Oct, 7:30" : approval === "held" ? "On hold. Not scheduled." : "Waiting for your OK to send Monday 7:30";
  return (
    <div>
      <Title big={big}>{c.subject}</Title>
      <dl className="mt-6 grid grid-cols-[5rem_1fr] border-t b-ink text-[14px]">
        <dt className="t-label c-mute border-b py-2.5">To</dt>
        <dd className="border-b py-2 font-semibold">{c.to}</dd>
        <dt className="t-label c-mute border-b py-2.5">Status</dt>
        <dd className={`border-b py-2 ${approval === "pending" ? "c-sig font-semibold" : ""}`}>{status}</dd>
        {expert && (
          <>
            <dt className="t-label c-mute border-b py-2.5">Made by</dt>
            <dd className="border-b py-2 c-ink2">Writer, from the Researcher's notes · 98 words · on this network</dd>
          </>
        )}
      </dl>
      <div className={`mt-5 whitespace-pre-line ${big ? "text-[16px] leading-[1.6]" : "text-[14px] leading-[1.5] line-clamp-6"} max-w-[60ch]`}>
        {after !== undefined ? (
          <>
            {before}
            <mark className="bg-transparent" style={{ color: "inherit", boxShadow: "inset 0 -2px 0 var(--ink)" }}>over coffee on Tuesday</mark>
            {after}
          </>
        ) : c.body}
      </div>
      <div className="t-meta mt-3">Underlined: changed at your request, 18:31</div>
      {approval === "pending" && (
        <div className="mt-5">
          <Btn tone="signal" onClick={() => show("m10")}>Review and approve</Btn>
        </div>
      )}
    </div>
  );
}

/* ---------- Approval ---------- */
function Approval({ c, big }: Size & { c: Extract<Card, { type: "approval" }> }) {
  const { approval, setApproval, show, expert } = useHux();
  const pending = approval === "pending";
  const [day, time] = c.when.split(", ");
  const actions = (
    <div className="mt-6">
        {pending ? (
          <div className="flex flex-wrap gap-2">
            <Btn tone="signal" onClick={() => setApproval("approved")}><Check size={15} strokeWidth={2.5} />Approve and schedule</Btn>
            <Btn onClick={() => setApproval("held")}>Not yet</Btn>
            <Btn tone="plain" className="h-9 px-1" onClick={() => show("m8")}>Show the email</Btn>
          </div>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t b-ink pt-3">
            <p className="text-[15px]">
              {approval === "approved" ? "Goes out Monday at 7:30. I won't ask again for this email." : "I won't send it. It stays in your drafts."}
            </p>
            <Btn tone="plain" onClick={() => setApproval("pending")}>Undo</Btn>
          </div>
        )}
      </div>
  );
  return (
    <div>
      <div className={`flex items-center gap-2 ${pending ? "c-sig" : "c-mute"}`}>
        <span className="h-2 w-2" style={{ background: pending ? "var(--signal)" : "var(--mute)" }} />
        <Label>{pending ? "Needs your OK" : approval === "approved" ? "Approved" : "On hold"}</Label>
      </div>
      <h3 className={`t-display mt-3 ${big ? "text-[34px] lg:text-[44px]" : "text-[24px]"}`}>{c.action}</h3>
      <p className="c-ink2 mt-2 text-[15px]">{c.detail}</p>
      {!big && actions}
      <div className={`mt-6 grid grid-cols-[auto_1fr] gap-6 border-t pt-4 ${pending ? "b-sig" : "b-ink"}`}>
        <Figure big={big} n={time} unit="Before work" signal={pending} />
        <div className="self-end pb-6">
          <div className="t-head text-[20px]">{day}</div>
          <div className="t-meta mt-1">In 2 days and 13 hours</div>
        </div>
      </div>
      {expert && (
        <dl className="mt-6 grid grid-cols-[7rem_1fr] border-t text-[13px]">
          {[
            ["Helper", "Writer"],
            ["Why it asks", "Sending email always needs your OK"],
            ["After this", "This exact email goes out without asking again"],
            ["Requested", "Desk PC, 18:31"],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="t-label c-mute border-b py-2">{k}</dt>
              <dd className="border-b py-1.5">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {big && actions}
    </div>
  );
}

/* ---------- Weather ---------- */
function Weather({ c, big }: Size & { c: Extract<Card, { type: "weather" }> }) {
  const max = Math.max(...c.hourly.map((h) => h.temp));
  const barH = big ? 120 : 64;
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Title big={big}>{`${c.place}, Saturday`}</Title>
          <p className="c-ink2 mt-2 text-[15px]">{c.now}. Light rain from mid-afternoon.</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-[auto_1fr] items-end gap-6 border-t b-ink pt-4">
        <div className={`t-num ${big ? "text-[120px] lg:text-[160px]" : "text-[72px]"}`} style={{ marginLeft: "-0.04em" }}>{c.temp}°</div>
        <div className="grid grid-cols-2 gap-4 pb-1">
          <Figure big={false} n={`${c.high}°`} unit="High" />
          <Figure big={false} n={`${c.low}°`} unit="Low" />
        </div>
      </div>
      <div className="mt-6 border-t pt-3">
        <div className="grid grid-cols-[3.5rem_repeat(5,1fr)] gap-x-2">
          <span />
          {c.hourly.map((h) => (
            <div key={h.time} className="flex flex-col justify-end" style={{ height: barH + 22 }}>
              <span className="text-[13px] font-semibold">{h.temp}°</span>
              <span className="mt-1 block w-[45%]" style={{ height: (h.temp / max) * barH, background: "var(--ink)" }} />
            </div>
          ))}
          <span className="t-label c-mute self-center pt-2">Rain</span>
          {c.hourly.map((h) => (
            <div key={h.time} className="border-t b-ink pt-2">
              <div className="h-1.5 w-full bg-paper2"><div className="h-full" style={{ width: `${h.rain}%`, background: "var(--mute)" }} /></div>
              <div className="t-meta mt-1">{h.rain}%</div>
            </div>
          ))}
          <span className="t-label c-mute self-center">Time</span>
          {c.hourly.map((h) => <div key={h.time} className="text-[13px] font-semibold">{h.time}:00</div>)}
        </div>
      </div>
    </div>
  );
}

/* ---------- Portfolio (morning briefing) ---------- */
function Portfolio({ c, big }: Size & { c: Extract<Card, { type: "portfolio" }> }) {
  return (
    <div>
      <Title big={big}>Your money this morning</Title>
      <div className="mt-6 grid grid-cols-[auto_1fr] items-end gap-6 border-t b-ink pt-4">
        <Figure big={big} n={c.total} unit={`Total, ${c.date}`} />
        <div className="pb-6 text-[15px] font-semibold">{c.change} · {c.changePct}</div>
      </div>
      <table className="mt-6 w-full border-t text-[14px]">
        <tbody>
          {c.lines.map((l) => (
            <tr key={l.name} className="border-b">
              <td className="py-2.5">{l.name}</td>
              <td className="py-2.5 text-right font-semibold">{l.value}</td>
              <td className="c-mute w-20 py-2.5 text-right">{l.change}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="c-ink2 mt-4 text-[14px]">{c.note}</p>
      <p className="t-meta mt-1">Read only. hux can't move money.</p>
    </div>
  );
}

/* ---------- Task thread ---------- */
function Thread({ item, big }: Size & { item: StageItem }) {
  const { expert, show } = useHux();
  const t = item.msg!.thread!;
  const researcher = helpers.find((h) => h.id === "research")!;
  return (
    <div>
      <Title big={big}>Home batteries</Title>
      <p className="c-ink2 mt-2 text-[15px]">Done this afternoon. The result is the email to Todd.</p>
      <div className="mt-6 grid grid-cols-3 gap-4 border-t b-ink pt-4">
        <Figure big={big} n="9" unit="sources read" />
        <Figure big={big} n="4" unit="systems compared" />
        <Figure big={big} n="2" unit="fit your roof and budget" />
      </div>
      <ol className="mt-6 border-t">
        {t.steps.map((s, i) => (
          <li key={s} className="grid grid-cols-[2.25rem_1fr_auto] items-baseline gap-2 border-b py-2.5">
            <span className="t-num c-mute text-[18px]">{i + 1}</span>
            <span className="text-[14px]">{s}</span>
            <Check size={14} className="c-mute" />
          </li>
        ))}
      </ol>
      {expert && (
        <div className="t-meta mt-3">
          Researcher · {researcher.model} · 15:10 to 15:24 · Writer drafted the summary
        </div>
      )}
      <div className="mt-5"><Btn onClick={() => show("m8")}>Open the email <ArrowUpRight size={14} /></Btn></div>
    </div>
  );
}

export function CardBody({ item, big }: { item: StageItem; big: boolean }) {
  if (item.kind === "thread") return <Thread item={item} big={big} />;
  const c = item.card!;
  switch (c.type) {
    case "recipe": return <Recipe c={c} big={big} />;
    case "shoppingList": return <Shopping c={c} big={big} />;
    case "emailDraft": return <Email c={c} big={big} />;
    case "approval": return <Approval c={c} big={big} />;
    case "weather": return <Weather c={c} big={big} />;
    case "portfolio": return <Portfolio c={c} big={big} />;
  }
}

/** Header row above a card: kind, when, pin. */
export function CardHead({ item, index, total }: { item: StageItem; index?: number; total?: number }) {
  const { pinned, togglePin, expert, approval } = useHux();
  const isPinned = pinned.includes(item.key);
  const alert = item.kind === "approval" && approval === "pending";
  return (
    <div className="flex items-center justify-between gap-3 border-b b-ink pb-2">
      <div className="flex min-w-0 items-baseline gap-3">
        {index !== undefined && total !== undefined && (
          <span className="t-label c-mute tabular-nums">{String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}</span>
        )}
        <Label className={alert ? "c-sig" : ""}>{item.label}</Label>
        {item.msg && (
          <span className="t-meta truncate">
            {hhmm(item.msg.at)}
            {expert && ` · ${deviceName(item.msg.device)}`}
          </span>
        )}
        {!item.msg && <span className="t-meta">Today 7:00{expert && " · Kitchen tablet and phone"}</span>}
      </div>
      <button
        onClick={() => togglePin(item.key)}
        className={`inline-flex h-7 shrink-0 items-center gap-1.5 px-2 text-[12px] font-semibold ${isPinned ? "bg-ink" : "border b-ink"}`}
        aria-pressed={isPinned}
      >
        {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
        {isPinned ? "Pinned" : "Pin"}
      </button>
    </div>
  );
}
