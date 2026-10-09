// PROTOTYPE - concept 06 "Canvas": the docked conversation column.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUp, ArrowUpRight, Check, ChevronDown, Droplets, Mic, Smartphone, Square } from "lucide-react";
import { suggestions, type Card } from "../../fixtures";
import { ApprovalBlock, HourlyRain } from "./bodies";
import { cardKind, cx, deviceName, emailBody, hhmm, META, useHux, type Msg, type WinKind } from "./model";
import { Mark } from "./ui";

export function Conversation() {
  const h = useHux();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [h.messages.length, h.typing]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="v6-scroll min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-2">
        <div className="mb-4 flex items-center gap-3 text-[11px] text-(--ink-3)">
          <span className="h-px flex-1 bg-(--line-2)" />Friday 9 October<span className="h-px flex-1 bg-(--line-2)" />
        </div>
        <div className="space-y-5">
          {h.messages.map((m, i) => <Bubble key={m.id} m={m} fresh={i >= 12} />)}
          {h.typing && (
            <div className="flex items-center gap-2 text-(--ink-3) v6-rise">
              <Mark size={16} />
              <span className="v6-typing flex gap-1"><i /><i /><i /></span>
            </div>
          )}
        </div>
        <div ref={endRef} />
      </div>
      <Composer />
    </div>
  );
}

function Bubble({ m, fresh }: { m: Msg; fresh: boolean }) {
  const h = useHux();
  const meta = h.expert && (
    <div className={cx("v6-mono mt-1 text-[10.5px] text-(--ink-3)", m.from === "member" && "text-right")}>
      {hhmm(m.at)} · {deviceName(m.device)}{m.from === "assistant" ? ` · ${m.card?.type === "emailDraft" || m.card?.type === "approval" ? "Writer" : m.thread ? "Researcher → Writer" : "Chief"}` : ""}
    </div>
  );
  if (m.from === "member")
    return (
      <div className={cx("flex flex-col items-end", fresh && "v6-rise")}>
        <div className="max-w-[86%] rounded-[16px] rounded-br-[5px] bg-(--sunk) px-3.5 py-2 text-[14px] leading-[1.45]">{m.text}</div>
        {meta}
      </div>
    );
  return (
    <div className={cx("flex gap-2.5", fresh && "v6-rise")}>
      <div className="pt-[2px] text-(--ink-2)"><Mark size={16} /></div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] leading-[1.5]">{m.text}</div>
        {m.thread && <ThreadCard />}
        {m.card && <InlineCard card={m.card} />}
        {m.opens && (
          <button onClick={() => h.open(m.opens!)} className="mt-2 flex items-center gap-1.5 rounded-[9px] border border-(--line-2) px-2.5 py-1.5 text-[12px] text-(--ink-2) hover:bg-(--hover) hover:text-(--ink)">
            <WinIcon k={m.opens} /> {META[m.opens].title} <ArrowUpRight size={12} />
          </button>
        )}
        {meta}
      </div>
    </div>
  );
}

function WinIcon({ k }: { k: WinKind }) {
  const I = META[k].icon;
  return <I size={13} />;
}

/** A compact preview of something that lives as a window on the canvas. */
function Shell({ k, children, label }: { k: WinKind; children: ReactNode; label?: string }) {
  const h = useHux();
  const w = h.wins.find((x) => x.id === k);
  const where = !w ? "Open" : w.min ? "Restore" : h.isDesk ? "Show" : "Open";
  return (
    <div className="v6-card mt-2.5 overflow-hidden rounded-[14px] bg-(--win)">
      <button onClick={() => h.open(k)} className="flex w-full items-center gap-2 border-b border-(--line) px-3 py-2 text-left hover:bg-(--hover)">
        <span className="text-(--ink-3)"><WinIcon k={k} /></span>
        <span className="flex-1 text-[12px] font-medium text-(--ink-2)">{label ?? META[k].short}</span>
        <span className="flex items-center gap-1 text-[11px] text-(--ink-3)">
          {w && !w.min && h.isDesk && <span className="size-1.5 rounded-full bg-(--accent)" />}
          {where}<ArrowUpRight size={12} />
        </span>
      </button>
      <div className="px-3 py-2.5">{children}</div>
    </div>
  );
}

function InlineCard({ card }: { card: Card }) {
  const h = useHux();
  if (card.type === "approval") return <div className="mt-2.5"><ApprovalBlock compact /></div>;
  const k = cardKind[card.type];
  if (!k) return null;
  if (card.type === "recipe")
    return (
      <Shell k={k}>
        <div className="text-[14px] font-medium">{card.title}</div>
        <div className="text-[12px] text-(--ink-3)">{card.time} · serves {card.serves}</div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-(--sunk)">
            <div className="bg-(--green)" style={{ width: `${(card.have.length / (card.have.length + card.need.length)) * 100}%` }} />
          </div>
          <span className="text-[12px] text-(--ink-2)">{card.have.length} of {card.have.length + card.need.length}</span>
        </div>
        <div className="mt-1.5 text-[12px] text-(--ink-2)">Still need {card.need.map((n) => n.replace(/ \(.*\)/, "").toLowerCase()).join(" and ")}</div>
      </Shell>
    );
  if (card.type === "shoppingList")
    return (
      <Shell k={k}>
        <ul className="space-y-0.5">
          {h.shopping.map((it, i) => (
            <li key={it.name + i}>
              <button onClick={() => h.toggleItem(i)} className="flex w-full items-center gap-2 py-0.5 text-left text-[13px]">
                <span className={cx("grid size-4 place-items-center rounded-[5px] border", it.done ? "border-(--accent) bg-(--accent) text-(--accent-ink)" : "border-(--line-2)")}>
                  {it.done && <Check size={10} strokeWidth={3} />}
                </span>
                <span className={cx(it.done && "text-(--ink-3) line-through")}>{it.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-(--ink-3)"><Smartphone size={11} /> On {card.sentTo}</div>
      </Shell>
    );
  if (card.type === "emailDraft")
    return (
      <Shell k={k} label={`Email to ${card.to}`}>
        <div className="text-[13px] font-medium">{card.subject}</div>
        <div className="mt-0.5 line-clamp-2 text-[12px] leading-[1.5] text-(--ink-2)">{emailBody(card.body).replace("Hi Todd,\n\n", "")}</div>
      </Shell>
    );
  if (card.type === "weather")
    return (
      <Shell k={k} label="Weather tomorrow">
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-[26px] leading-none font-light tracking-[-0.04em]">{card.high}°</span>
          <span className="text-[12px] text-(--ink-2)">{card.place} · low {card.low}°</span>
          <span className="ml-auto flex items-center gap-1 text-[12px] text-(--ink-2)"><Droplets size={12} className="text-(--rain)" /> from 17:00</span>
        </div>
        <HourlyRain small />
      </Shell>
    );
  return null;
}

function ThreadCard() {
  const h = useHux();
  const [openSteps, setOpen] = useState(false);
  const steps = ["Read 9 sources", "Compared 4 systems", "Checked local installer prices", "Drafted summary for Todd"];
  return (
    <div className="mt-2.5 rounded-[12px] border border-(--line-2)">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="grid size-4 place-items-center rounded-full bg-(--green) text-white"><Check size={10} strokeWidth={3} /></span>
        <button onClick={() => h.open("research")} className="flex-1 text-left text-[13px] font-medium hover:underline">Research: home batteries</button>
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-[12px] text-(--ink-3) hover:text-(--ink)">
          {steps.length} steps <ChevronDown size={13} className={cx("transition-transform", openSteps && "rotate-180")} />
        </button>
      </div>
      {openSteps && (
        <ol className="v6-fade space-y-1 border-t border-(--line) px-3 py-2 text-[12px] text-(--ink-2)">
          {steps.map((s, i) => <li key={s} className="flex gap-2"><span className="v6-mono text-(--ink-3)">{i + 1}</span>{s}</li>)}
        </ol>
      )}
    </div>
  );
}

function Composer() {
  const h = useHux();
  const submit = () => { if (h.draft.trim()) { h.send(h.draft); h.setDraft(""); } };
  return (
    <div className="shrink-0 px-3 pt-1 pb-3">
      <div className="v6-noscroll -mx-3 mb-2 flex gap-1.5 overflow-x-auto px-3">
        {suggestions.map((s) => (
          <button key={s} onClick={() => h.send(s)}
            className="h-7 shrink-0 rounded-full border border-(--line-2) px-3 text-[12px] whitespace-nowrap text-(--ink-2) transition-colors hover:border-(--ink-3) hover:text-(--ink)">
            {s}
          </button>
        ))}
      </div>
      <div className={cx("flex items-center gap-1.5 rounded-[14px] bg-(--win) p-1.5 shadow-[0_0_0_1px_var(--line-2),var(--sh-1)]", h.listening && "shadow-[0_0_0_1.5px_var(--accent),var(--sh-1)]")}>
        {h.listening ? (
          <div className="flex h-9 flex-1 items-center gap-3 px-2 text-(--accent)">
            <span className="v6-wave flex items-center gap-[3px]">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</span>
            <span className="text-[13px] text-(--ink-2)">Listening…</span>
          </div>
        ) : (
          <input
            ref={h.inputRef}
            value={h.draft}
            onChange={(e) => h.setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
            placeholder="Message hux"
            className="h-9 min-w-0 flex-1 bg-transparent px-2 text-[14px] outline-none"
          />
        )}
        <button onClick={h.toggleMic} aria-label={h.listening ? "Stop listening" : "Speak"} title={h.listening ? "Stop" : "Speak"}
          className={cx("grid size-9 shrink-0 place-items-center rounded-[10px] transition-colors", h.listening ? "bg-(--accent) text-(--accent-ink)" : "text-(--ink-2) hover:bg-(--hover) hover:text-(--ink)")}>
          {h.listening ? <Square size={13} fill="currentColor" /> : <Mic size={17} />}
        </button>
        {!h.listening && (
          <button onClick={submit} disabled={!h.draft.trim()} aria-label="Send"
            className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-(--ink) text-(--panel) transition-opacity disabled:opacity-25">
            <ArrowUp size={17} />
          </button>
        )}
      </div>
    </div>
  );
}
