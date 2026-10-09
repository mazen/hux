// PROTOTYPE - concept 08 assistant view: huge greeting, hero input, newest exchange right below it.
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, Square, Sparkles, CalendarClock, Lightbulb, ChevronRight } from "lucide-react";
import { devices, helpers, home, reminders, calendar, suggestions, type Message } from "../../fixtures";
import { useStore } from "./store";
import { CardView, ThreadBlock, ApprovalCard } from "./cards";
import { Avatar, ExpertTag, Switch, cx, memberName } from "./ui";

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
const fmtTimeSec = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Berlin" });
const deviceName = (id: string) => devices.find((d) => d.id === id)?.name ?? id;

function helperFor(m: Message) {
  if (m.card?.type === "emailDraft" || m.card?.type === "approval") return helpers.find((h) => h.id === "writer")!;
  if (/lights? (are|is) off/i.test(m.text)) return helpers.find((h) => h.id === "home")!;
  return helpers.find((h) => h.id === "chief")!;
}

type Exchange = { id: string; ask?: Message; replies: Message[] };

function toExchanges(msgs: Message[]): Exchange[] {
  const out: Exchange[] = [];
  for (const m of msgs) {
    if (m.from === "member") out.push({ id: m.id, ask: m, replies: [] });
    else if (out.length) out[out.length - 1].replies.push(m);
    else out.push({ id: m.id, replies: [m] });
  }
  return out.reverse();
}

function HeroInput() {
  const { draft, setDraft, send, focusTick, thinking } = useStore();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (focusTick > 0) {
      ref.current?.focus();
      ref.current?.setSelectionRange(ref.current.value.length, ref.current.value.length);
    }
  }, [focusTick]);

  useEffect(() => {
    if (!listening) return;
    const words = "Turn off the office lights".split(" ");
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setDraft(words.slice(0, i).join(" "));
      if (i >= words.length) {
        window.clearInterval(t);
        window.setTimeout(() => setListening(false), 450);
      }
    }, 280);
    return () => window.clearInterval(t);
  }, [listening, setDraft]);

  const submit = () => {
    if (!draft.trim()) return;
    setListening(false);
    send(draft);
  };

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cx("bx sh-lg flex items-stretch gap-2 rounded-[28px] bg-surface p-2 transition-colors", listening && "bg-sun")}
      >
        <label htmlFor="v08-ask" className="sr-only">Ask hux</label>
        <textarea
          id="v08-ask"
          ref={ref}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={listening ? "Listening…" : "Ask or tell hux anything"}
          className={cx(
            "min-h-16 min-w-0 flex-1 resize-none bg-transparent px-3 py-4 font-display text-xl font-semibold leading-snug outline-none md:min-h-20 md:px-4 md:py-5 md:text-[28px]",
            listening && "text-[#161310] placeholder:!text-[#161310]",
          )}
          style={{ fieldSizing: "content", maxHeight: 200 } as React.CSSProperties}
        />
        <div className="flex shrink-0 items-center gap-2 self-end pb-0.5 pr-0.5 md:self-center">
          <button
            type="button"
            onClick={() => {
              if (listening) setListening(false);
              else {
                setDraft("");
                setListening(true);
              }
            }}
            aria-label={listening ? "Stop listening" : "Talk to hux"}
            aria-pressed={listening}
            className={cx("press bx sh-sm grid size-14 place-items-center rounded-2xl md:size-16", listening ? "bg-ink" : "bg-coral")}
          >
            {listening ? (
              <span className="flex h-6 items-center gap-[3px]" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="bar block h-6 w-[4px] rounded-full bg-[var(--sun)]" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </span>
            ) : (
              <Mic size={28} strokeWidth={2.5} />
            )}
          </button>
          <button
            type="submit"
            disabled={!draft.trim() || thinking}
            aria-label="Send"
            className="press bx sh-sm grid size-14 place-items-center rounded-2xl bg-ink md:size-16"
          >
            <ArrowUp size={28} strokeWidth={3} />
          </button>
        </div>
      </form>
      {listening && (
        <div className="mt-3 flex items-center gap-2 text-sm font-bold">
          <Square size={12} fill="currentColor" className="text-[var(--coral)]" /> Listening on the Desk PC
        </div>
      )}
    </div>
  );
}

function Suggestions() {
  const { send, thinking } = useStore();
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 pt-1 md:mx-0 md:flex-wrap md:px-0">
      {suggestions.map((s, i) => (
        <button
          key={s}
          type="button"
          disabled={thinking}
          onClick={() => send(s)}
          className={cx(
            "press bx sh-sm min-h-12 shrink-0 whitespace-nowrap rounded-full px-4 text-[15px] font-bold",
            ["bg-sun", "bg-mint", "bg-sky", "bg-lilac"][i % 4],
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function Thinking() {
  return (
    <div className="pop flex items-center gap-3 py-2" aria-live="polite">
      <HuxMark />
      <span className="flex gap-1.5" aria-label="hux is thinking">
        {[0, 1, 2].map((i) => (
          <span key={i} className="dot block size-3 rounded-full border-2 border-line bg-sun" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </span>
    </div>
  );
}

export function HuxMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-[10px] border-[2.5px] border-line bg-sun font-display font-extrabold text-[#161310]"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden
    >
      h
    </span>
  );
}

function ExchangeView({ ex, fresh }: { ex: Exchange; fresh: boolean }) {
  const { expert, thinking } = useStore();
  return (
    <article className={cx("py-7 md:py-9", fresh && "pop")}>
      {ex.ask && (
        <header className="flex items-start gap-3">
          <Avatar id={ex.ask.member ?? "alex"} size={38} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-muted">
              <span className="text-ink">{memberName(ex.ask.member)}</span>
              <span>{fmtTime(ex.ask.at)}</span>
              {expert && <ExpertTag>{deviceName(ex.ask.device)}</ExpertTag>}
            </div>
            <p className="mt-0.5 font-display text-xl font-bold leading-snug md:text-2xl">{ex.ask.text}</p>
          </div>
        </header>
      )}
      {ex.ask && ex.replies.length === 0 && thinking && (
        <div className="mt-4">
          <Thinking />
        </div>
      )}
      {ex.replies.map((r) => {
        const h = helperFor(r);
        return (
          <div key={r.id} className={cx("flex items-start gap-3", ex.ask && "mt-5")}>
            <HuxMark size={38} />
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                {expert && (
                  <div className="mb-1 flex flex-wrap gap-1.5">
                    <ExpertTag>{h.name}</ExpertTag>
                    <ExpertTag>{h.id === "research" ? "cloud model · public data" : "qwen3-32b · local · trust high"}</ExpertTag>
                    <ExpertTag>{deviceName(r.device)}</ExpertTag>
                    <ExpertTag>{fmtTimeSec(r.at)}</ExpertTag>
                  </div>
                )}
                <p className="text-[17px] leading-relaxed md:text-lg">{r.text}</p>
              </div>
              {r.thread && <ThreadBlock thread={r.thread} expert={expert} />}
              {r.card && <CardView card={r.card} />}
            </div>
          </div>
        );
      })}
    </article>
  );
}

function SidePanel() {
  const { approval, homeState, toggleHome, go, reminderDone, toggleReminder } = useStore();
  const approvalMsg = useStore().messages.find((m) => m.card?.type === "approval");
  const next = reminders.filter((r) => !reminderDone[r.id]).slice(0, 2);
  const lights = home.filter((h) => h.kind === "light" || h.kind === "plug").slice(0, 4);
  const nextEvent = calendar[0];
  return (
    <aside className="space-y-6">
      {approval === "pending" && approvalMsg?.card?.type === "approval" && (
        <div>
          <h3 className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-muted">Needs you</h3>
          <ApprovalCard card={approvalMsg.card} compact />
        </div>
      )}
      <div>
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-muted">Coming up</h3>
        <div className="bx sh rounded-2xl bg-surface">
          <div className="flex items-center gap-3 border-b-[3px] border-line bg-sky p-3 on-block">
            <CalendarClock size={20} strokeWidth={2.5} />
            <div className="min-w-0">
              <div className="font-bold leading-tight">{nextEvent.title}</div>
              <div className="text-sm on-block-muted">Tomorrow, 9:00</div>
            </div>
          </div>
          {next.map((r) => (
            <button key={r.id} type="button" onClick={() => toggleReminder(r.id)} className="flex w-full items-center gap-3 border-b-2 border-line p-3 text-left last:border-b-0">
              <span className="size-6 shrink-0 rounded-md border-[2.5px] border-line" />
              <span className="min-w-0">
                <span className="block font-bold leading-tight">{r.title}</span>
                <span className="block text-sm text-muted">{r.when}</span>
              </span>
            </button>
          ))}
          <button type="button" onClick={() => go("plans")} className="flex w-full items-center justify-between rounded-b-[13px] bg-sunk px-3 py-2.5 text-sm font-bold">
            All plans <ChevronRight size={18} strokeWidth={2.75} />
          </button>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-muted">At home now</h3>
        <div className="bx sh divide-line rounded-2xl bg-surface">
          {lights.map((h) => {
            const on = homeState[h.id].startsWith("On");
            return (
              <div key={h.id} className="flex items-center gap-3 p-3">
                <span className={cx("grid size-9 place-items-center rounded-lg border-[2.5px] border-line", on ? "bg-sun" : "bg-sunk")}>
                  <Lightbulb size={18} strokeWidth={2.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold leading-tight">{h.name}</span>
                  <span className="block text-sm text-muted">{homeState[h.id]}</span>
                </span>
                <Switch on={on} onChange={() => toggleHome(h.id)} label={h.name} tone="sun" />
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export function AssistantView() {
  const { messages, approval, go } = useStore();
  const exchanges = toExchanges(messages);
  const initialCount = useRef(messages.length);
  const freshIds = new Set(messages.slice(initialCount.current).map((m) => m.id));

  return (
    <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 pb-28 pt-6 md:px-10 md:pt-12 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <section aria-labelledby="v08-greet">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold text-muted md:text-base">
            <span>Friday 9 October</span>
            <span aria-hidden>·</span>
            <span>18:40</span>
            <span aria-hidden>·</span>
            <span>13° in Berlin</span>
          </div>
          <h1 id="v08-greet" className="font-display text-[56px] font-extrabold leading-[0.9] md:text-[104px] xl:text-[120px]">
            Good evening,
            <br />
            <span className="relative isolate inline-block">
              Alex.
              <span className="absolute -bottom-1 left-0 h-3 w-full rounded-sm bg-sun md:h-5" style={{ zIndex: -1 }} aria-hidden />
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted md:text-xl">
            Dinner's sorted and the email to Todd is ready.{" "}
            {approval === "pending" ? (
              <button type="button" onClick={() => document.getElementById("v08-approval")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="font-bold text-ink underline decoration-[var(--coral)] decoration-[3px] underline-offset-4">
                It needs your OK.
              </button>
            ) : (
              <span className="font-bold text-ink">It goes out Monday.</span>
            )}
          </p>
          <div className="mt-7 md:mt-9">
            <HeroInput />
          </div>
          <div className="mt-4">
            <Suggestions />
          </div>
        </section>

        <section aria-label="Conversation" className="mt-8">
          <div className="flex items-center gap-3">
            <Sparkles size={18} strokeWidth={2.75} />
            <h2 className="font-display text-sm font-extrabold uppercase tracking-[0.16em]">Today, newest first</h2>
            <div className="rule flex-1" />
          </div>
          <div className="divide-line">
            {exchanges.map((ex) => (
              <div key={ex.id} id={ex.replies.some((r) => r.card?.type === "approval") ? "v08-approval" : undefined}>
                <ExchangeView ex={ex} fresh={freshIds.has(ex.id)} />
              </div>
            ))}
          </div>
          <div className="rule-dash pt-6 text-center text-sm font-semibold text-muted">
            <button type="button" onClick={() => go("house")} className="font-bold text-ink underline underline-offset-4">What hux did on its own today</button>
          </div>
        </section>
      </div>
      <div className="hidden xl:block xl:pt-[52px]">
        <div className="sticky top-8">
          <SidePanel />
        </div>
      </div>
    </div>
  );
}
