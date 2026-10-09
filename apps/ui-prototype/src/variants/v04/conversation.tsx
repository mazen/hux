// PROTOTYPE concept 04: the Conversation, a side panel on desktop and a bottom sheet on phones.
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, ChefHat, ChevronDown, ChevronUp, CloudSun, Mail, Mic, Pin, ShoppingBasket, Timer, X } from "lucide-react";
import { devices, helpers, type Card } from "../../fixtures";
import { TIMER_MINUTES, useHux, type ChatMessage, type PinKey } from "./state";
import { Avatar, Magnet, cx, fmtTime, fmtTimeSec, member } from "./ui";

const deviceName = (id: string) => devices.find((d) => d.id === id)?.name ?? id;
const deviceLower = (id: string) => {
  const n = deviceName(id);
  return n.startsWith("Alex") ? n : n.charAt(0).toLowerCase() + n.slice(1);
};

export function useTick(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [active]);
  return now;
}

export function needText(need: string[]) {
  const n = need.map((x) => x.replace(/\s*\(.*\)/, "").toLowerCase());
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}` : n[0];
}

export function TalkPanel() {
  const s = useHux();
  const toggleOnPhone = () => {
    if (window.innerWidth < 1024) s.setSheetOpen(!s.sheetOpen);
  };
  return (
    <>
      <div className="v4-scrim" data-open={s.sheetOpen} onClick={() => s.setSheetOpen(false)} />
      <aside
        className="v4-sheet flex min-h-0 flex-col bg-[var(--panel)] lg:border-l lg:border-[var(--line)]"
        data-open={s.sheetOpen}
        aria-label="Conversation with hux"
      >
        <header
          className="flex flex-none cursor-pointer items-center gap-3 border-b border-[var(--line)] px-4 pb-3 pt-2 lg:cursor-default lg:px-5 lg:py-4"
          onClick={toggleOnPhone}
        >
          <div className="flex-1 min-w-0">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[var(--line-strong)] lg:hidden" />
            <div className="flex items-center gap-2.5">
              <Magnet className="!h-4 !w-4" />
              <div className="min-w-0">
                <div className="v4-serif text-lg font-semibold leading-tight">Talk to hux</div>
                {s.expert && <div className="truncate text-xs text-[var(--ink-3)]">Chief on this network · listening on Desk PC</div>}
              </div>
            </div>
          </div>
          <span className="mt-3 grid h-8 w-8 place-items-center rounded-full text-[var(--ink-2)] lg:hidden" aria-hidden>
            {s.sheetOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </span>
        </header>
        <Messages />
        <Composer />
      </aside>
    </>
  );
}

function Messages() {
  const s = useHux();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [s.messages.length, s.thinking]);

  let prevDevice = "";
  return (
    <div className="v4-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-5">
      <div className="mb-4 text-center text-xs font-medium text-[var(--ink-3)]">Today</div>
      <div className="space-y-4">
        {s.messages.map((m, i) => {
          const moved = m.from === "member" && prevDevice && m.device !== prevDevice;
          const first = i === 0;
          if (m.from === "member") prevDevice = m.device;
          return (
            <div key={m.id} className={cx(m.id.startsWith("u") || m.id.startsWith("a") ? "v4-rise" : "")}>
              {(moved || first) && (
                <div className="mb-3 flex items-center gap-3 text-[11px] text-[var(--ink-3)]">
                  <span className="h-px flex-1 bg-[var(--line)]" />
                  {first ? `Desk PC · ${fmtTime(m.at)}` : `Continued on the ${deviceLower(m.device)} · ${fmtTime(m.at)}`}
                  <span className="h-px flex-1 bg-[var(--line)]" />
                </div>
              )}
              {m.from === "member" ? <MemberBubble m={m} /> : <HuxMessage m={m} />}
            </div>
          );
        })}
        {s.thinking && (
          <div className="flex items-center gap-2.5 pl-0.5">
            <Magnet />
            <span className="v4-dots text-lg leading-none text-[var(--ink-3)]">
              <span>·</span>
              <span>·</span>
              <span>·</span>
            </span>
          </div>
        )}
      </div>
      <div ref={end} className="h-2" />
    </div>
  );
}

function MemberBubble({ m }: { m: ChatMessage }) {
  const { expert } = useHux();
  const who = member(m.member)!;
  return (
    <div className="flex flex-col items-end">
      <div className="flex max-w-[86%] items-end gap-2">
        <div
          className="rounded-2xl rounded-br-md px-3.5 py-2.5 text-[15px] leading-snug"
          style={{ background: `color-mix(in oklab, ${who.color} 15%, var(--paper))` }}
        >
          {m.text}
        </div>
        <Avatar id={who.id} size={22} />
      </div>
      {expert && (
        <div className="mr-8 mt-1 text-[11px] text-[var(--ink-3)]">
          {who.name} · {deviceName(m.device)} · {fmtTimeSec(m.at)}
        </div>
      )}
    </div>
  );
}

function HuxMessage({ m }: { m: ChatMessage }) {
  const { expert } = useHux();
  const models = (m.helper ?? "Chief")
    .split(/, then /)
    .map((h) => helpers.find((x) => x.name === h)?.model.toLowerCase())
    .filter(Boolean)
    .join(" / ");
  return (
    <div className="flex gap-2.5">
      <Magnet className="mt-1" />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-relaxed">{m.text}</p>
        {expert && (
          <div className="mt-1 text-[11px] text-[var(--ink-3)]">
            {m.helper ?? "Chief"} · {models} · {deviceName(m.device)} · {fmtTimeSec(m.at)}
          </div>
        )}
        {(m.card || m.thread || m.pin) && (
          <div className="mt-2.5">
            <Ticket m={m} />
          </div>
        )}
      </div>
    </div>
  );
}

function Ticket({ m }: { m: ChatMessage }) {
  const s = useHux();
  const card = m.card;
  const body = (() => {
    if (m.pin === "timer") return <TimerTicket />;
    if (!card) return null;
    switch (card.type) {
      case "recipe":
        return <RecipeTicket c={card} />;
      case "shoppingList":
        return <ShoppingTicket c={card} />;
      case "emailDraft":
        return <ResearchTicket c={card} m={m} />;
      case "approval":
        return <ApprovalTicket c={card} />;
      case "weather":
        return <WeatherTicket c={card} />;
      default:
        return null;
    }
  })();
  if (!body) return null;
  const k = m.pin;
  return (
    <div className="v4-paper overflow-hidden">
      {body}
      {k && <PinFooter k={k} pinned={s.pins.includes(k)} />}
    </div>
  );
}

function PinFooter({ k, pinned }: { k: PinKey; pinned: boolean }) {
  const s = useHux();
  return (
    <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--paper-2)] px-3.5 py-2 text-xs">
      {pinned ? (
        <>
          <span className="flex items-center gap-2 text-[var(--ink-2)]">
            <Magnet color="var(--alex)" className="!h-2.5 !w-2.5" /> On the board
          </span>
          <button className="font-semibold text-[var(--ink)] underline-offset-2 hover:underline" onClick={() => s.showOnBoard(k)}>
            Show me
          </button>
        </>
      ) : (
        <>
          <span className="text-[var(--ink-3)]">Not on the board</span>
          <button className="flex items-center gap-1 font-semibold text-[var(--ink)]" onClick={() => s.togglePin(k)}>
            <Pin size={13} /> Pin it
          </button>
        </>
      )}
    </div>
  );
}

function TicketHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-[var(--paper-2)] text-[var(--ink-2)]">{icon}</span>
      <div className="min-w-0">
        <div className="v4-serif text-[16px] font-semibold leading-snug">{title}</div>
        {sub && <div className="text-xs text-[var(--ink-3)]">{sub}</div>}
      </div>
    </div>
  );
}

function RecipeTicket({ c }: { c: Extract<Card, { type: "recipe" }> }) {
  const total = c.have.length + c.need.length;
  return (
    <div className="p-3.5">
      <TicketHead icon={<ChefHat size={18} />} title={c.title} sub={`${c.time} · serves ${c.serves} · ${c.steps.length} steps`} />
      <p className="mt-2.5 text-sm text-[var(--ink-2)]">
        You have {c.have.length} of {total} things. Still need {needText(c.need)}.
      </p>
    </div>
  );
}

function ShoppingTicket({ c }: { c: Extract<Card, { type: "shoppingList" }> }) {
  const s = useHux();
  return (
    <div className="p-3.5">
      <TicketHead icon={<ShoppingBasket size={18} />} title={c.title} sub={`Sent to ${c.sentTo}`} />
      <ul className="mt-2.5 space-y-1">
        {s.shopping.map((i) => (
          <li key={i.name}>
            <button className="flex w-full items-center gap-2.5 py-0.5 text-left text-sm" onClick={() => s.toggleItem(i.name)}>
              <Box done={i.done} />
              <span className={cx(i.done && "text-[var(--ink-3)] line-through")}>{i.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Box({ done }: { done: boolean }) {
  return (
    <span
      className={cx(
        "grid h-[18px] w-[18px] flex-none place-items-center rounded-[5px] border transition",
        done ? "border-transparent bg-[var(--mia)] text-white" : "border-[var(--line-strong)] bg-[var(--paper)]",
      )}
    >
      {done && <Check size={12} strokeWidth={3} />}
    </span>
  );
}

function ResearchTicket({ c, m }: { c: Extract<Card, { type: "emailDraft" }>; m: ChatMessage }) {
  const { expert } = useHux();
  const [steps, setSteps] = useState(false);
  const [full, setFull] = useState(false);
  return (
    <div>
      {m.thread && (
        <div className="border-b border-[var(--line)] px-3.5 py-2.5">
          <button className="flex w-full items-center gap-2 text-left text-sm" onClick={() => setSteps(!steps)}>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--mia)] text-white">
              <Check size={12} strokeWidth={3} />
            </span>
            <span className="flex-1 font-semibold">{m.thread.title}</span>
            <span className="text-xs text-[var(--ink-3)]">{steps ? "Hide steps" : `${m.thread.steps.length} steps`}</span>
          </button>
          {steps && (
            <ol className="mt-2 space-y-1 border-l-2 border-[var(--line)] pl-4 text-sm text-[var(--ink-2)]">
              {m.thread.steps.map((st, i) => (
                <li key={st}>
                  {st}
                  {expert && <span className="text-[11px] text-[var(--ink-3)]"> · {i < 3 ? "Researcher, cloud" : "Writer, on this network"}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      <div className="p-3.5">
        <TicketHead icon={<Mail size={18} />} title={c.subject} sub={`To ${c.to} · ${c.status}`} />
        <p className={cx("mt-2.5 whitespace-pre-line text-sm leading-relaxed text-[var(--ink-2)]", !full && "line-clamp-3")}>{c.body}</p>
        <button className="mt-1.5 text-xs font-semibold text-[var(--ink)] underline-offset-2 hover:underline" onClick={() => setFull(!full)}>
          {full ? "Show less" : "Read the whole email"}
        </button>
      </div>
    </div>
  );
}

export function ApprovalActions({ compact }: { compact?: boolean }) {
  const s = useHux();
  if (s.approval === "approved")
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        <span className="flex items-center gap-1.5 font-semibold text-[var(--ink)]">
          <Check size={15} className="text-[var(--mia)]" strokeWidth={3} /> Approved. Goes out Monday at 7:30.
        </span>
        <button className="text-xs text-[var(--ink-3)] underline underline-offset-2" onClick={() => s.setApproval("pending")}>
          Undo
        </button>
      </div>
    );
  if (s.approval === "held")
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="text-[var(--ink-2)]">Held back. It won't go out until you say so.</span>
        <button className="font-semibold underline underline-offset-2" onClick={() => s.setApproval("approved")}>
          Approve now
        </button>
      </div>
    );
  return (
    <div className={cx("flex flex-wrap gap-2", compact && "text-sm")}>
      <button
        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--btn)] px-4 py-2 text-sm font-semibold text-[var(--btn-ink)] transition hover:opacity-90"
        onClick={() => s.setApproval("approved")}
      >
        <Check size={15} strokeWidth={2.5} /> Yes, send it Monday
      </button>
      <button
        className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--paper-2)]"
        onClick={() => s.setApproval("held")}
      >
        Not yet
      </button>
    </div>
  );
}

function ApprovalTicket({ c }: { c: Extract<Card, { type: "approval" }> }) {
  const s = useHux();
  return (
    <div>
      {s.approval === "pending" && (
        <div className="flex items-center gap-2 bg-[var(--honey-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--honey-ink)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--honey)]" /> Waiting for you
        </div>
      )}
      <div className="p-3.5">
        <div className="font-semibold">{c.action}</div>
        <div className="mt-0.5 text-sm text-[var(--ink-2)]">{c.detail}</div>
        <div className="mt-0.5 text-sm text-[var(--ink-2)]">{c.when}</div>
        <div className="mt-3">
          <ApprovalActions />
        </div>
      </div>
    </div>
  );
}

export function rainWord(r: number) {
  return r >= 50 ? "Rain" : r > 0 ? "Light" : "Dry";
}

function WeatherTicket({ c }: { c: Extract<Card, { type: "weather" }> }) {
  return (
    <div className="p-3.5">
      <TicketHead icon={<CloudSun size={18} />} title={`Tomorrow in ${c.place}`} sub={`${c.now} · high ${c.high}°, low ${c.low}°`} />
      <div className="mt-3 grid grid-cols-5 gap-1 text-center">
        {c.hourly.map((h) => (
          <div key={h.time} className="rounded-lg bg-[var(--paper-2)] px-1 py-2">
            <div className="text-[11px] text-[var(--ink-3)]">{h.time}:00</div>
            <div className="text-sm font-semibold">{h.temp}°</div>
            <div className={cx("text-[10px]", h.rain >= 50 ? "font-semibold text-[var(--sam)]" : "text-[var(--ink-3)]")}>
              {h.rain ? `${h.rain}%` : "dry"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function timerLeft(endsAt: number, now: number) {
  const left = Math.max(0, endsAt - now);
  const mm = Math.floor(left / 60000);
  const ss = Math.floor((left % 60000) / 1000);
  return { left, label: `${mm}:${String(ss).padStart(2, "0")}` };
}

function TimerTicket() {
  const s = useHux();
  const now = useTick(!!s.timerEndsAt);
  if (!s.timerEndsAt)
    return (
      <div className="p-3.5">
        <TicketHead icon={<Timer size={18} />} title="Frittata timer" sub="Stopped" />
      </div>
    );
  const { label } = timerLeft(s.timerEndsAt, now);
  return (
    <div className="flex items-center gap-3 p-3.5">
      <TicketHead icon={<Timer size={18} />} title="Frittata timer" sub={`${TIMER_MINUTES} minutes · kitchen tablet`} />
      <span className="ml-auto font-mono text-lg font-semibold tabular-nums">{label}</span>
    </div>
  );
}

function Composer() {
  const s = useHux();
  const [listening, setListening] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const el = s.composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [s.draft, s.composerRef]);

  const mic = () => {
    if (listening) {
      if (timer.current) window.clearTimeout(timer.current);
      setListening(false);
      return;
    }
    setListening(true);
    timer.current = window.setTimeout(() => {
      setListening(false);
      s.send("What's on tomorrow?");
    }, 2600);
  };

  return (
    <div className="flex-none border-t border-[var(--line)] px-3 pb-4 pt-3 lg:px-4">
      {s.suggestions.length > 0 && (
        <div className="v4-scroll -mx-1 mb-2.5 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {s.suggestions.map((q) => (
            <button
              key={q}
              onClick={() => s.send(q)}
              className="flex-none rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-2)] transition hover:border-[var(--ink-3)] hover:text-[var(--ink)]"
            >
              {q}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex min-h-[48px] flex-1 items-center rounded-3xl border border-[var(--line-strong)] bg-[var(--paper)] py-1.5 pl-4 pr-1.5 shadow-sm focus-within:border-[var(--ink-3)]">
          {listening ? (
            <div className="flex flex-1 items-center gap-3 py-1.5 text-[var(--honey-ink)]">
              <span className="v4-wave flex items-center gap-[3px]">
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className="text-[15px] text-[var(--ink-2)]">Listening. Go ahead.</span>
            </div>
          ) : (
            <textarea
              ref={s.composerRef}
              rows={1}
              value={s.draft}
              onChange={(e) => s.setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  s.send(s.draft);
                }
              }}
              placeholder="Message hux"
              aria-label="Message hux"
              className="v4-scroll max-h-[140px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-snug outline-none placeholder:text-[var(--ink-3)]"
            />
          )}
          {s.draft.trim() && !listening && (
            <button
              onClick={() => s.send(s.draft)}
              aria-label="Send"
              className="ml-1 grid h-9 w-9 flex-none place-items-center rounded-full bg-[var(--btn)] text-[var(--btn-ink)] transition hover:opacity-90"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
        <button
          onClick={mic}
          aria-label={listening ? "Stop listening" : "Speak to hux"}
          className={cx(
            "grid h-12 w-12 flex-none place-items-center rounded-full bg-[var(--honey)] text-[#2a2420] shadow-[var(--shadow)] transition hover:brightness-105",
            listening && "v4-listening",
          )}
        >
          {listening ? <X size={20} strokeWidth={2.4} /> : <Mic size={20} strokeWidth={2.2} />}
        </button>
      </div>
      {s.expert && <div className="mt-2 pl-4 text-[11px] text-[var(--ink-3)]">Voice is turned into text on this computer. Nothing leaves your home.</div>}
    </div>
  );
}
