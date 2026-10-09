// PROTOTYPE - concept 07 "Glass": the Assistant view.
import { useEffect, useRef, useState } from "react";
import { ArrowUp, CalendarDays, ChevronRight, Lightbulb, Mic, Square } from "lucide-react";
import { activity, conversation, devices, home, suggestions, type Card, type Message } from "../../fixtures";
import { ApprovalCard, CardView, ThreadStrip } from "./cards";
import { helperFor, hhmm, modelFor, useApp } from "./state";
import { Avatar, Meta, PanelTitle, Toggle } from "./ui";

const deviceName = (id: string) => devices.find((d) => d.id === id)?.name ?? id;
const helperName: Record<string, string> = { chief: "Chief", research: "Researcher", writer: "Writer", home: "Home" };
const approvalCard = conversation.find((m) => m.card?.type === "approval")!.card as Extract<Card, { type: "approval" }>;

function MemberBubble({ m, delay }: { m: Message; delay: number }) {
  const { expert } = useApp();
  return (
    <div className="rise flex flex-col items-end" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="max-w-[86%] rounded-[22px] rounded-br-md px-4 py-2.5 text-[15.5px] leading-relaxed sm:max-w-[72%]"
        style={{
          background: "linear-gradient(160deg, color-mix(in oklab, var(--accent) 92%, white 8%), color-mix(in oklab, var(--accent) 80%, black 20%))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), 0 10px 24px -14px var(--accent)",
          color: "var(--accent-ink)",
        }}
      >
        {m.text}
      </div>
      {expert && (
        <div className="mt-1 pr-1"><Meta>{hhmm(m.at)} · Alex · {deviceName(m.device)}</Meta></div>
      )}
    </div>
  );
}

function AssistantTurn({ m, delay }: { m: Message; delay: number }) {
  const { expert } = useApp();
  const helper = helperFor[m.id] ?? "chief";
  return (
    <div className="surface" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-3">
        <span className="mt-1 hidden h-7 w-7 shrink-0 rounded-full sm:block" style={{ background: "radial-gradient(circle at 35% 30%, #fff8, transparent 45%), linear-gradient(135deg, #8f7cff, #e86f55)", boxShadow: "0 4px 14px -4px var(--accent)" }} />
        <div className="min-w-0 flex-1">
          <p className="text-[16.5px] leading-relaxed">{m.text}</p>
          {expert && (
            <div className="mt-1"><Meta>{hhmm(m.at)} · {helperName[helper]} on {deviceName(m.device)} · {modelFor[helper]}</Meta></div>
          )}
          {m.thread && <ThreadStrip t={m.thread} />}
          {m.card && <CardView card={m.card} />}
        </div>
      </div>
    </div>
  );
}

function Composer() {
  const { draft, setDraft, send, thinking } = useApp();
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!listening) return;
    const t = setTimeout(() => {
      setListening(false);
      send("What's on tomorrow?");
    }, 2600);
    return () => clearTimeout(t);
  }, [listening, send]);

  useEffect(() => {
    if (draft) inputRef.current?.focus();
  }, [draft]);

  const submit = () => {
    if (!draft.trim() || thinking) return;
    send(draft.trim());
    setDraft("");
  };

  return (
    <div className="glass-strong flex items-center gap-2 rounded-full p-1.5 pl-5">
      {listening ? (
        <div className="flex min-w-0 flex-1 items-center gap-3" aria-live="polite">
          <span className="wave flex h-6 items-center gap-[3px]">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} style={{ animationDelay: `${i * 0.11}s` }} />)}
          </span>
          <span className="truncate text-[15.5px] ink-2">Listening on Desk PC…</span>
        </div>
      ) : (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Ask hux anything"
          aria-label="Message hux"
          className="min-w-0 flex-1 bg-transparent py-2 text-[16px] outline-none"
        />
      )}
      {draft.trim() && !listening ? (
        <button onClick={submit} aria-label="Send" className="btn-accent grid h-11 w-11 place-items-center rounded-full">
          <ArrowUp size={20} strokeWidth={2.5} />
        </button>
      ) : (
        <button
          onClick={() => setListening(!listening)}
          aria-label={listening ? "Stop listening" : "Talk to hux"}
          className="relative grid h-11 w-11 place-items-center rounded-full btn-accent"
        >
          {listening && (
            <>
              <span className="listen-ring absolute inset-0 rounded-full" style={{ background: "var(--accent)" }} />
              <span className="listen-ring delay absolute inset-0 rounded-full" style={{ background: "var(--accent)" }} />
            </>
          )}
          <span className="relative">{listening ? <Square size={16} fill="currentColor" /> : <Mic size={20} />}</span>
        </button>
      )}
    </div>
  );
}

function NowRail() {
  const { approval, homeState, toggleHome, setTab, expert } = useApp();
  const lights = home.filter((h) => h.kind === "light");
  return (
    <aside className="scroll-soft hidden w-[340px] shrink-0 overflow-y-auto pt-2 pr-6 pb-20 xl:block">
      <div className="space-y-4">
        {approval === "pending" && (
          <div className="glass rounded-[24px] p-2">
            <ApprovalCard c={approvalCard} compact />
          </div>
        )}

        <section className="glass rounded-[24px] pb-2">
          <PanelTitle aside={<button onClick={() => setTab("plans")} className="text-[13px] font-semibold accent">All plans</button>}>Coming up</PanelTitle>
          <ul className="px-2">
            {[
              { t: "Pack Mia's swimming bag", w: "Tomorrow 8:15", who: "sam" as const },
              { t: "Swimming lesson", w: "Tomorrow 9:00", who: "mia" as const },
              { t: "Lunch with Sam's parents", w: "Sunday 12:30", who: undefined },
              { t: "Email to Todd goes out", w: "Monday 7:30", who: "alex" as const },
            ].map((x) => (
              <li key={x.t} className="flex items-center gap-3 rounded-2xl px-3 py-2">
                <span className="fill-2 grid h-9 w-9 place-items-center rounded-xl ink-2"><CalendarDays size={16} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{x.t}</span>
                  <span className="block text-[12.5px] ink-3">{x.w}</span>
                </span>
                {x.who && <Avatar id={x.who} size={22} />}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass rounded-[24px] pb-2">
          <PanelTitle aside={<button onClick={() => setTab("home")} className="text-[13px] font-semibold accent">Home</button>}>Lights</PanelTitle>
          <ul className="px-2">
            {lights.map((h) => {
              const on = homeState[h.id] !== "Off";
              return (
                <li key={h.id} className="flex items-center gap-3 rounded-2xl px-3 py-2">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${on ? "ember-soft ember" : "fill-2 ink-3"}`}><Lightbulb size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold">{h.name}</span>
                    <span className="block text-[12.5px] ink-3">{homeState[h.id]}</span>
                  </span>
                  <Toggle on={on} onChange={() => toggleHome(h.id)} label={h.name} />
                </li>
              );
            })}
          </ul>
        </section>

        <section className="glass rounded-[24px] pb-3">
          <PanelTitle>Earlier today</PanelTitle>
          <ul className="space-y-2.5 px-5">
            {activity.slice(1, 5).map((a) => (
              <li key={a.id} className="flex gap-3 text-[13.5px]">
                <span className="w-10 shrink-0 font-semibold tabular ink-3">{a.at}</span>
                <span className="ink-2">{a.text}{expert && a.who && <span className="ink-3"> · for Alex</span>}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}

export function AssistantView() {
  const { messages, thinking, send } = useApp();
  const scroller = useRef<HTMLDivElement>(null);
  const initialCount = useRef(messages.length);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: messages.length > initialCount.current ? "smooth" : "auto" });
  }, [messages.length, thinking]);

  return (
    <div className="flex h-full min-h-0">
      <section className="flex min-w-0 flex-1 flex-col">
        <div ref={scroller} className="scroll-soft fade-top min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[760px] px-4 pt-4 pb-8 sm:px-6">
            <div className="rise mb-8 pt-4 md:pt-8">
              <div className="text-[13px] font-semibold tracking-wide uppercase ink-3">Friday 9 October · 18:40</div>
              <h1 className="serif mt-1 text-[42px] leading-[1.05] md:text-[54px]">Good evening, Alex.</h1>
              <p className="mt-2 text-[15px] ink-2">Dinner's sorted, Todd's email waits for your OK, and tomorrow stays dry until the afternoon.</p>
            </div>
            <div className="space-y-7">
              {messages.map((m, i) => {
                const delay = i < initialCount.current ? Math.min(i, 12) * 45 : 0;
                return m.from === "member" ? <MemberBubble key={m.id} m={m} delay={delay} /> : <AssistantTurn key={m.id} m={m} delay={delay} />;
              })}
              {thinking && (
                <div className="surface flex items-center gap-3" aria-live="polite">
                  <span className="glass grid h-10 w-[68px] place-items-center rounded-full">
                    <span className="depth-dots flex gap-1.5"><span /><span /><span /></span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[760px] px-3 pt-2 pb-[92px] sm:px-6 md:pb-[68px]">
          <div className="no-scrollbar -mx-3 mb-2.5 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
            {suggestions.filter((s) => !messages.some((m) => m.text === s)).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={thinking}
                className="glass flex shrink-0 items-center gap-1 rounded-full py-2 pr-3 pl-4 text-[13.5px] font-semibold whitespace-nowrap disabled:opacity-60"
              >
                {s}
                <ChevronRight size={14} className="ink-3" />
              </button>
            ))}
          </div>
          <Composer />
        </div>
      </section>
      <NowRail />
    </div>
  );
}
