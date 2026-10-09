// PROTOTYPE concept 03 - the assistant view: conversation as plain text, the stage, the phone deck, the composer.
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUp, ChevronDown, ChevronUp, Mic, Pin, Square } from "lucide-react";
import { household, suggestions, type Message } from "../../fixtures";
import { useHux, type StageItem } from "./store";
import { CardBody, CardHead } from "./cards";
import { Label } from "./ui";
import { deviceName, hhmm } from "./data";

const helperFor = (m: Message) =>
  m.card?.type === "emailDraft" || m.card?.type === "approval" ? "Writer" : m.thread ? "Researcher" : m.text.includes("lights") ? "Home" : "Chief";

/* ---------- Conversation ---------- */

function CardRef({ item }: { item: StageItem }) {
  const { stageKey, show, pinned, approval } = useHux();
  const onStage = stageKey === item.key;
  const alert = item.kind === "approval" && approval === "pending";
  const done = item.kind === "approval" && approval !== "pending";
  return (
    <button
      onClick={() => show(item.key)}
      className={`group mt-3 flex w-full max-w-[34rem] items-center gap-3 border-t py-2 text-left ${alert ? "b-sig" : "b-ink"}`}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 border"
        style={{
          borderColor: alert ? "var(--signal)" : "var(--ink)",
          background: alert ? "var(--signal)" : onStage ? "var(--ink)" : "transparent",
        }}
      />
      <span className={`t-label shrink-0 ${alert ? "c-sig" : ""}`}>{done ? (approval === "approved" ? "Approved" : "On hold") : item.label}</span>
      <span className="min-w-0 flex-1 truncate text-[14px]">{item.title}</span>
      {pinned.includes(item.key) && <Pin size={12} className="c-mute shrink-0" />}
      <span className="t-meta shrink-0 group-hover:text-[var(--ink)]">{onStage ? "On the right" : "Show"}</span>
    </button>
  );
}

function Turn({ m, first }: { m: Message; first: boolean }) {
  const { item, expert } = useHux();
  const isMember = m.from === "member";
  const name = isMember ? household.members.find((x) => x.id === m.member)?.name ?? "Alex" : "hux";
  const refs = [m.thread ? item(`${m.id}:thread`) : undefined, m.card ? item(m.id) : undefined].filter(Boolean) as StageItem[];
  return (
    <li className={`m-in grid grid-cols-[3.25rem_1fr] gap-x-3 sm:grid-cols-[3rem_3.5rem_1fr] ${first ? "" : isMember ? "mt-7" : "mt-3"}`}>
      <span className="t-meta hidden pt-[3px] tabular-nums sm:block">{hhmm(m.at)}</span>
      <span className={`pt-[2px] text-[13px] ${isMember ? "c-mute font-medium" : "font-bold"}`}>{name}</span>
      <div className="min-w-0">
        <p className={`max-w-[38rem] text-[16px] leading-[1.5] lg:text-[17px] ${isMember ? "c-ink2" : ""}`}>{m.text}</p>
        {expert && (
          <div className="t-meta mt-1">
            <span className="sm:hidden">{hhmm(m.at)} · </span>
            {deviceName(m.device)}
            {!isMember && ` · ${helperFor(m)} · on this network`}
          </div>
        )}
        {m.thread && (
          <ol className="mt-3 max-w-[34rem] border-l pl-3 text-[13px] leading-6 c-ink2">
            {m.thread.steps.map((s, i) => (
              <li key={s} className="flex gap-2"><span className="c-mute w-3 tabular-nums">{i + 1}</span>{s}</li>
            ))}
          </ol>
        )}
        {refs.map((r) => <CardRef key={r.key} item={r} />)}
      </div>
    </li>
  );
}

export function Conversation() {
  const { messages, typing, send } = useHux();
  const end = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: mounted.current ? "smooth" : "auto", block: "end" });
    mounted.current = true;
  }, [messages.length, typing]);
  return (
    <div className="scroll h-full overflow-y-auto">
      <div className="px-4 pb-8 pt-6 sm:px-8 lg:px-10 lg:pt-10">
        <div className="mb-8 flex items-baseline justify-between border-b b-ink pb-2">
          <Label>Today</Label>
          <span className="t-meta">Friday 9 October</span>
        </div>
        <ol>
          {messages.map((m, i) => <Turn key={m.id} m={m} first={i === 0} />)}
          {typing && (
            <li className="mt-3 grid grid-cols-[3.25rem_1fr] gap-x-3 sm:grid-cols-[3rem_3.5rem_1fr]">
              <span className="hidden sm:block" />
              <span className="text-[13px] font-bold">hux</span>
              <span className="flex items-center gap-2 text-[15px] c-mute">
                <span className="m-blink h-2 w-2" style={{ background: "var(--signal)" }} /> Working on it
              </span>
            </li>
          )}
        </ol>
        <div className="mt-10 grid-cols-[3rem_3.5rem_1fr] gap-x-3 sm:grid">
          <span className="hidden sm:block" />
          <Label className="c-mute mb-2 pt-[3px] sm:mb-0">Next</Label>
          <ul className="flex flex-col">
            {suggestions.map((s) => (
              <li key={s}>
                <button onClick={() => send(s)} className="group flex items-center gap-2 py-1 text-left text-[15px] font-medium">
                  <ArrowRight size={14} className="c-mute transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--ink)]" />
                  <span className="act">{s}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div ref={end} />
      </div>
    </div>
  );
}

/* ---------- Composer ---------- */

export function Composer() {
  const { draft, setDraft, send, expert } = useHux();
  const [listening, setListening] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (draft) input.current?.focus(); }, [draft]);

  const stopListening = () => {
    setListening(false);
    send("What's on tomorrow?");
  };

  return (
    <div className="border-t b-ink bg-paper px-4 pb-3 pt-3 sm:px-8 lg:px-10 lg:pb-16">
      <form
        onSubmit={(e) => { e.preventDefault(); send(draft); }}
        className="flex items-center gap-2"
      >
        {listening ? (
          <button type="button" onClick={stopListening} className="flex h-12 flex-1 items-center gap-3 text-left c-sig">
            <span className="m-level flex h-5 items-center gap-[3px]"><i /><i /><i /><i /><i /></span>
            <span className="text-[16px] font-semibold">Listening. Tap to finish.</span>
          </button>
        ) : (
          <input
            ref={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask hux or tell it what to do"
            className="h-12 min-w-0 flex-1 bg-transparent text-[17px] outline-none"
            aria-label="Message hux"
          />
        )}
        <button
          type="button"
          onClick={() => (listening ? stopListening() : setListening(true))}
          aria-label={listening ? "Stop listening" : "Speak"}
          className={`grid h-11 w-11 shrink-0 place-items-center border ${listening ? "bg-sig b-sig" : "b-ink hover:bg-[var(--paper-2)]"}`}
        >
          {listening ? <Square size={14} fill="currentColor" /> : <Mic size={18} />}
        </button>
        <button
          type="submit"
          aria-label="Send"
          disabled={!draft.trim() || listening}
          className="grid h-11 w-11 shrink-0 place-items-center bg-ink disabled:opacity-25"
        >
          <ArrowUp size={18} />
        </button>
      </form>
      <div className="t-meta mt-1.5 hidden lg:block">
        {expert ? "Desk PC · Chief helper · local model on this network" : "Or say “hux” near the kitchen tablet or living room speaker."}
      </div>
    </div>
  );
}

/* ---------- Needs-you strip ---------- */

export function NeedsYou({ compact, className = "" }: { compact?: boolean; className?: string }) {
  const { approval, show, stageKey, item } = useHux();
  const a = item("m10");
  if (approval !== "pending" || !a || a.card?.type !== "approval" || stageKey === "m10") return null;
  return (
    <div className={className}>
    <button
      onClick={() => show("m10")}
      className={`m-in flex w-full items-center gap-3 border-l-4 b-sig bg-sigsoft text-left ${compact ? "px-3 py-2" : "px-4 py-3"}`}
    >
      <span className="t-label c-sig shrink-0">Needs your OK</span>
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{a.card.action}, {a.card.when.replace("Monday", "Mon")}</span>
      <span className="text-[13px] font-semibold c-sig">Review</span>
    </button>
    </div>
  );
}

/* ---------- Stage (desktop) ---------- */

export function Stage() {
  const { stageKey, item, pinned, show } = useHux();
  const current = item(stageKey);
  const pinnedItems = pinned.map(item).filter(Boolean) as StageItem[];
  return (
    <section className="flex h-full min-h-0 flex-col border-l b-ink" aria-label="Stage">
      <NeedsYou className="px-10 pt-10" />
      <div className="scroll min-h-0 flex-1 overflow-y-auto px-10 pb-10 pt-6">
        {current && (
          <div key={current.key} className="m-stage">
            <CardHead item={current} />
            <div className="pt-6"><CardBody item={current} big /></div>
          </div>
        )}
      </div>
      <div className="border-t b-ink px-10 pb-16 pt-3">
        <div className="mb-1 flex items-baseline justify-between">
          <Label>Pinned</Label>
          <span className="t-meta">{pinnedItems.length ? String(pinnedItems.length) : "Pin a card to keep it here"}</span>
        </div>
        <ol>
          {pinnedItems.map((p, i) => (
            <li key={p.key}>
              <button
                onClick={() => show(p.key)}
                className="grid w-full grid-cols-[2rem_7.5rem_1fr_auto] items-baseline gap-2 border-b py-2 text-left hover:bg-[var(--paper-2)]"
              >
                <span className="t-num text-[15px] c-mute">{String(i + 1).padStart(2, "0")}</span>
                <span className="t-label">{p.label}</span>
                <span className={`truncate text-[14px] ${p.key === stageKey ? "font-semibold" : ""}`}>{p.title}</span>
                <span className="t-meta">{p.key === stageKey ? "Showing" : ""}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Deck (phone) ---------- */

export function MobileDeck() {
  const { stageKey, pinned, item } = useHux();
  const [open, setOpen] = useState(true);
  const [idx, setIdx] = useState(0);
  const strip = useRef<HTMLDivElement>(null);

  const keys = useMemo(() => (pinned.includes(stageKey) ? pinned : [stageKey, ...pinned]), [pinned, stageKey]);
  const items = keys.map(item).filter(Boolean) as StageItem[];

  // Bring the current card into view whenever it changes.
  useEffect(() => {
    setOpen(true);
    const i = keys.indexOf(stageKey);
    const el = strip.current;
    if (el && i >= 0) {
      requestAnimationFrame(() => el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" }));
      setIdx(i);
    }
  }, [stageKey, keys]);

  const current = items[idx] ?? items[0];

  return (
    <section className="border-t b-ink bg-paper" aria-label="Cards">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-2 text-left">
        <Label>Cards</Label>
        <span className="flex gap-1">
          {items.map((it, i) => (
            <span key={it.key} className="h-1.5 w-1.5" style={{ background: i === idx ? "var(--ink)" : "var(--hair)" }} />
          ))}
        </span>
        {!open && current && <span className="min-w-0 flex-1 truncate text-[13px]">{current.title}</span>}
        <span className="ml-auto c-mute">{open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</span>
      </button>
      {open && (
        <div
          ref={strip}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
          }}
          className="noscroll flex snap-x snap-mandatory overflow-x-auto"
        >
          {items.map((it, i) => (
            <div key={it.key} className="w-full shrink-0 snap-start px-4 pb-3">
              <div className="scroll max-h-[34vh] overflow-y-auto">
                <CardHead item={it} index={i} total={items.length} />
                <div className="pt-4"><CardBody item={it} big={false} /></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
