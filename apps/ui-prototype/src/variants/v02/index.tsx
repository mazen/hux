// PROTOTYPE - concept 02 "Hearth": voice-first, ambient. hux is a warm presence at the centre of the room.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, CalendarClock, ChevronUp, House, Mic, Moon, Settings, SlidersHorizontal, Square, Sun } from "lucide-react";
import {
  conversation,
  home,
  household,
  memories as memoryFixtures,
  reminders as reminderFixtures,
  routines as routineFixtures,
  suggestions as suggestionFixtures,
  type Card,
  type Message,
} from "../../fixtures";
import "./styles.css";
import { CardView, ThreadView, type ApprovalStatus } from "./Cards";
import { clock, deviceName, heardPhrases, helperFor, member, modelFor, replyTo, type HearthState, type SheetId } from "./data";
import { Hearth, HearthLabel, Mark, Wordmark } from "./Hearth";
import { HouseholdBody, isOn, type HomeTab, type HomeThing, type Memory } from "./Household";
import { PlansBody, type Reminder, type Routine } from "./Plans";
import { SettingsBody } from "./Settings";
import { Sheet } from "./Sheet";

export const name = "Hearth";

const approvalCard = conversation.find((m) => m.card?.type === "approval")!.card as Extract<Card, { type: "approval" }>;

const room: Record<string, string> = {
  desk: "At the desk",
  kitchen: "In the kitchen",
  phone: "On Alex's phone",
  speaker: "In the living room",
};

export default function Variant() {
  // ---- appearance -------------------------------------------------------
  const [dark, setDark] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [expert, setExpert] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // ---- household state (in memory) --------------------------------------
  const [messages, setMessages] = useState<Message[]>(conversation);
  const [routines, setRoutines] = useState<Routine[]>(routineFixtures);
  const [reminders, setReminders] = useState<Reminder[]>(reminderFixtures);
  const [things, setThings] = useState<HomeThing[]>(home);
  const [mems, setMems] = useState<Memory[]>(memoryFixtures);
  const [approval, setApproval] = useState<ApprovalStatus>("pending");
  const [quietHours, setQuietHours] = useState("22:30 to 7:00");
  const [used, setUsed] = useState<string[]>([]);

  // ---- presence ---------------------------------------------------------
  const [hearth, setHearth] = useState<HearthState>("idle");
  const [caption, setCaption] = useState("");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [shownWords, setShownWords] = useState(0);
  const timers = useRef<number[]>([]);
  const heardIdx = useRef(0);
  const pendingPhrase = useRef("");
  const minute = useRef(41);

  // ---- navigation -------------------------------------------------------
  const [sheet, setSheet] = useState<SheetId>(null);
  const [plansTab, setPlansTab] = useState<"reminders" | "calendar" | "routines">("reminders");
  const [homeTab, setHomeTab] = useState<HomeTab>("things");
  const [draft, setDraft] = useState("");
  const [approvalOpen, setApprovalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const earlierEndRef = useRef<HTMLDivElement>(null);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheet(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (sheet === "earlier") later(() => earlierEndRef.current?.scrollIntoView({ block: "end" }), 60);
  }, [sheet]);

  // ---- conversation flow ------------------------------------------------
  const stamp = () => {
    const m = Math.min(minute.current++, 59);
    return `2026-10-09T18:${String(m).padStart(2, "0")}:00+02:00`;
  };

  const send = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    clearTimers();
    setSheet(null);
    setCaption("");
    setUsed((u) => [...u, text]);
    const at = stamp();
    setMessages((ms) => [...ms, { id: `u${Date.now()}`, from: "member", member: "alex", at, device: "desk", text }]);
    setHearth("thinking");
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    later(() => {
      const reply = replyTo(text);
      if (reply.effect === "officeLightsOff") setThings((ts) => ts.map((t) => (t.id === "h1" ? { ...t, state: "Off" } : t)));
      if (reply.effect === "plantsReminder")
        setReminders((rs) =>
          rs.some((r) => r.id === "r5") ? rs : [{ id: "r5", title: "Water the plants", when: "Sun 11 Oct, 9:00", whenKind: "time", for: "alex", fresh: true }, ...rs],
        );
      if (reply.effect === "quietHours") setQuietHours("22:00 to 7:00");
      const id = `a${Date.now()}`;
      setMessages((ms) => [...ms, { id, from: "assistant", at, device: "desk", text: reply.text }]);
      setSpeakingId(id);
      setShownWords(0);
      setHearth("speaking");
      const words = reply.text.split(" ").length;
      for (let i = 1; i <= words; i++) later(() => setShownWords(i), i * 150);
      later(() => {
        setHearth("idle");
        setSpeakingId(null);
      }, words * 150 + 900);
    }, 1300);
  }, []);

  const listen = () => {
    if (hearth === "thinking") return;
    if (hearth === "speaking") {
      clearTimers();
      setSpeakingId(null);
      setHearth("idle");
      return;
    }
    if (hearth === "listening") {
      // Tapping again means "I'm done talking".
      send(pendingPhrase.current);
      return;
    }
    const phrase = heardPhrases[heardIdx.current++ % heardPhrases.length];
    pendingPhrase.current = phrase;
    setSheet(null);
    setCaption("");
    setHearth("listening");
    const words = phrase.split(" ");
    words.forEach((_, i) => later(() => setCaption(words.slice(0, i + 1).join(" ")), 700 + i * 300));
    later(() => send(phrase), 700 + words.length * 300 + 900);
  };

  const ask = (prefill: string) => {
    setSheet(null);
    setDraft(prefill.endsWith("?") ? prefill : prefill + " ");
    later(() => inputRef.current?.focus(), 450);
  };

  // ---- derived ----------------------------------------------------------
  const lastMemberIdx = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].from === "member") return i;
    return 0;
  }, [messages]);
  const asked = messages[lastMemberIdx];
  const answer = messages[lastMemberIdx + 1] as Message | undefined;
  const earlier = messages.slice(0, lastMemberIdx);
  const earlierCount = earlier.filter((m) => m.from === "member").length;
  const suggestions = suggestionFixtures.filter((s) => !used.includes(s));
  const lightsOn = things.filter((t) => t.kind !== "car" && isOn(t));
  const activeRoutines = routines.filter((r) => r.enabled).length;

  const openHome = (tab: HomeTab) => {
    setHomeTab(tab);
    setSheet("home");
  };

  // Pull down at the top of the hearth to see earlier conversation.
  const touchY = useRef<number | null>(null);
  const onWheel = (e: React.WheelEvent) => {
    if (sheet === null && (mainRef.current?.scrollTop ?? 0) <= 0 && e.deltaY < -40) setSheet("earlier");
  };

  const cardProps = { expert, approval, onApproval: setApproval, onAsk: send };

  return (
    <div className={`v02 relative flex h-full flex-col overflow-clip ${dark ? "dark" : ""}`}>
      {/* ------------------------------------------------------------ header */}
      <header className="relative z-20 flex h-16 shrink-0 items-center gap-2 px-4 sm:px-6">
        <Wordmark />
        {expert && (
          <span className="ml-3 hidden items-center gap-1.5 rounded-full bg-[var(--surface-sunk)] px-3 py-1 text-[12px] text-[var(--ink-3)] lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)]" /> Gateway on Desk PC · 4 of 5 nodes online · local model
          </span>
        )}
        <nav className="ml-auto flex items-center gap-1 sm:gap-1.5" aria-label="Main">
          <TopButton icon={<CalendarClock size={18} />} label="Plans" onClick={() => setSheet("plans")} />
          <TopButton icon={<House size={18} />} label="Home" onClick={() => openHome("things")} dot={approval === "pending"} />
          <TopButton icon={<Settings size={18} />} label="Settings" onClick={() => setSheet("settings")} />
          <span className="mx-1 hidden h-6 w-px bg-[var(--line)] sm:block" />
          <button
            type="button"
            onClick={() => setExpert(!expert)}
            aria-pressed={expert}
            className={`flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold transition ${
              expert ? "bg-[var(--ink)] text-[var(--surface-solid)]" : "text-[var(--ink-2)] hover:bg-[var(--surface-sunk)]"
            }`}
            title={expert ? "Expert details on" : "Show expert details"}
          >
            <SlidersHorizontal size={16} className="hidden sm:block" />
            <span>Expert</span>
          </button>
          <button
            type="button"
            onClick={() => setDark(!dark)}
            className="grid h-10 w-10 place-items-center rounded-full text-[var(--ink-2)] hover:bg-[var(--surface-sunk)]"
            aria-label={dark ? "Switch to light" : "Switch to dark"}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span
            className="ml-1 hidden h-9 w-9 place-items-center rounded-full text-sm font-semibold text-white sm:grid"
            style={{ background: household.members[0].color }}
            title="Alex"
          >
            A
          </span>
        </nav>
      </header>

      {/* ------------------------------------------------------------ hearth + latest */}
      <div
        ref={mainRef}
        onWheel={onWheel}
        onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
        onTouchMove={(e) => {
          if (touchY.current !== null && (mainRef.current?.scrollTop ?? 0) <= 0 && e.touches[0].clientY - touchY.current > 90) {
            touchY.current = null;
            setSheet("earlier");
          }
        }}
        className="v02-scroll relative min-h-0 flex-1 overflow-y-auto"
      >
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 px-4 sm:px-6 xl:grid-cols-[1fr_minmax(0,720px)_1fr] xl:gap-10">
          {/* left rail: coming up */}
          <aside className="hidden pt-24 xl:block" aria-label="Coming up">
            <div className="sticky top-6 ml-auto max-w-[260px]">
              <RailTitle>Coming up</RailTitle>
              <ul className="space-y-3">
                <RailItem time="22:00" text="Checks the lottery tickets" faded={!routines.find((r) => r.id === "j2")?.enabled} />
                <RailItem time="Sat 8:15" text="Mia's swimming bag" />
                <RailItem time="Sat 9:00" text="Swimming lesson (Mia)" />
                <RailItem time="Mon 7:30" text={approval === "approved" ? "Email to Todd goes out" : "Email to Todd, waits for your OK"} />
              </ul>
              <button type="button" onClick={() => setSheet("plans")} className="mt-4 text-sm font-semibold text-[var(--accent-ink)]">
                All plans · {activeRoutines} routines on
              </button>
            </div>
          </aside>

          <main className="flex min-w-0 flex-col items-center pb-10">
            <button
              type="button"
              onClick={() => setSheet("earlier")}
              className="mt-1 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-3)] hover:bg-[var(--surface-sunk)] hover:text-[var(--ink-2)]"
            >
              <ChevronUp size={16} /> Earlier tonight · {earlierCount} more
            </button>

            <div className="mt-8 grid place-items-center md:mt-10">
              <Hearth state={hearth} onClick={listen} />
            </div>
            <div className="mt-7 md:mt-9">
              <HearthLabel state={hearth} caption={caption} />
            </div>
            {expert && (
              <p className="mt-1 text-[12px] text-[var(--ink-3)]">
                {hearth === "listening" ? "Desk PC microphone · speech-to-text on device" : hearth === "thinking" ? "Chief · local model on Desk PC" : "Wake word on 3 devices · voice stays at home"}
              </p>
            )}

            {approval === "pending" && answer?.card?.type !== "approval" && (
              <div className="mt-3 w-full max-w-[640px]">
                {approvalOpen ? (
                  <CardView card={approvalCard} {...cardProps} />
                ) : (
                  <button
                    type="button"
                    onClick={() => setApprovalOpen(true)}
                    className="mx-auto flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--ember)_14%,transparent)] px-4 py-2 text-sm text-[var(--ink)] ring-1 ring-[color-mix(in_srgb,var(--ember)_30%,transparent)]"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--ember)]" />
                    <span className="text-left">
                      <span className="font-semibold">Waiting for your OK:</span> email to Todd, Monday 7:30
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* the latest exchange, large and calm */}
            <section key={asked.id} className="v02-rise-in mt-6 w-full max-w-[640px]" aria-live="polite">
              <p className="flex items-center gap-2 text-sm text-[var(--ink-3)]">
                <span className="h-5 w-5 rounded-full text-center text-[11px] leading-5 font-semibold text-white" style={{ background: member(asked.member)?.color }}>
                  {member(asked.member)?.initials}
                </span>
                You asked · {clock(asked.at)}
                {expert && <> · {deviceName(asked.device)}</>}
              </p>
              <p className="mt-1.5 text-[17px] text-[var(--ink-2)]">{asked.text}</p>

              {answer ? (
                <div className="mt-5 flex flex-col gap-4">
                  <Answer text={answer.text} speaking={speakingId === answer.id} shown={shownWords} />
                  {answer.thread && <ThreadView thread={answer.thread} expert={expert} />}
                  {answer.card && <CardView card={answer.card} {...cardProps} />}
                  {expert && <Meta m={answer} />}
                </div>
              ) : (
                <p className="font-display mt-5 text-[26px] text-[var(--ink-3)] italic md:text-[32px]">One moment…</p>
              )}
            </section>
          </main>

          {/* right rail: at home */}
          <aside className="hidden pt-24 xl:block" aria-label="At home">
            <div className="sticky top-6 max-w-[260px]">
              <RailTitle>At home now</RailTitle>
              <ul className="space-y-3 text-[15px] text-[var(--ink-2)]">
                <li>
                  <span className="text-[var(--ink)]">{lightsOn.length === 0 ? "All lights off" : `${lightsOn.length} light${lightsOn.length === 1 ? "" : "s"} on`}</span>
                  {lightsOn.length > 0 && <span className="block text-sm">{lightsOn.map((t) => t.name).join(", ")}</span>}
                </li>
                <li>
                  <span className="text-[var(--ink)]">Car charging</span>
                  <span className="block text-sm">64%, on the driveway</span>
                </li>
                <li>
                  <span className="text-[var(--ink)]">Quiet from {quietHours.split(" ")[0]}</span>
                  <span className="block text-sm">hux keeps its voice down until 7:00</span>
                </li>
              </ul>
              <button type="button" onClick={() => openHome("things")} className="mt-4 text-sm font-semibold text-[var(--accent-ink)]">
                Home
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* ------------------------------------------------------------ composer */}
      <div className="relative z-10 shrink-0 px-4 pt-2 pb-4 sm:px-6 md:pb-16">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-[var(--bg-2)] to-transparent" />
        <div className="mx-auto max-w-[680px]">
          {suggestions.length > 0 && (
            <div className="v02-noscrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 [mask-image:linear-gradient(90deg,transparent,black_16px,black_calc(100%-16px),transparent)]">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  disabled={hearth === "thinking"}
                  className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--ink-2)] backdrop-blur hover:border-[var(--ember)] hover:text-[var(--ink)] disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
              setDraft("");
            }}
            className="flex items-center gap-3"
          >
            <button
              type="button"
              onClick={listen}
              aria-label={hearth === "listening" ? "Stop listening" : hearth === "speaking" ? "Stop speaking" : "Talk to hux"}
              className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-full text-[var(--on-accent)] shadow-[0_8px_24px_-6px_color-mix(in_srgb,var(--ember)_70%,transparent)] transition ${
                hearth === "listening" ? "scale-105 bg-[var(--ink)]" : "bg-[var(--ember)] hover:brightness-110"
              }`}
            >
              {hearth === "listening" || hearth === "speaking" ? <Square size={18} fill="currentColor" className={hearth === "listening" ? "text-[var(--surface-solid)]" : ""} /> : <Mic size={22} />}
            </button>
            <div className="v02-card flex min-w-0 flex-1 items-center gap-2 rounded-full py-1.5 pr-1.5 pl-5">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Or type to hux…"
                aria-label="Message hux"
                className="min-w-0 flex-1 bg-transparent py-2 text-[16px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-3)]"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-[var(--surface-solid)] transition disabled:bg-[var(--surface-sunk)] disabled:text-[var(--ink-3)]"
              >
                <ArrowUp size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ------------------------------------------------------------ sheets */}
      <Sheet open={sheet === "earlier"} onClose={() => setSheet(null)} from="top" title="Earlier tonight">
        <ol className="space-y-5 pt-2">
          {earlier.map((m, i) => {
            const moved = i > 0 && earlier[i - 1].device !== m.device;
            return (
              <li key={m.id}>
                {(i === 0 || moved) && (
                  <p className="mb-4 flex items-center gap-3 text-[12px] font-semibold tracking-[0.08em] text-[var(--ink-3)] uppercase">
                    <span className="h-px flex-1 bg-[var(--line)]" />
                    {room[m.device] ?? deviceName(m.device)} · {clock(m.at)}
                    <span className="h-px flex-1 bg-[var(--line)]" />
                  </p>
                )}
                {m.from === "member" ? (
                  <div className="flex justify-end">
                    <p className="max-w-[85%] rounded-[22px] rounded-br-md bg-[var(--surface-sunk)] px-4 py-2.5 text-[16px]">{m.text}</p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <span className="mt-1 shrink-0">
                      <Mark size={22} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <p className="font-display text-[19px] leading-snug">{m.text}</p>
                      {m.thread && <ThreadView thread={m.thread} expert={expert} />}
                      {m.card && <CardView card={m.card} compact {...cardProps} />}
                      {expert && <Meta m={m} />}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <div ref={earlierEndRef} className="pt-6 text-center">
          <button type="button" onClick={() => setSheet(null)} className="rounded-full bg-[var(--surface-sunk)] px-5 py-2.5 text-sm font-semibold text-[var(--ink-2)]">
            Back to now
          </button>
        </div>
      </Sheet>

      <Sheet open={sheet === "plans"} onClose={() => setSheet(null)} title="Plans">
        <PlansBody
          tab={plansTab}
          setTab={setPlansTab}
          routines={routines}
          toggleRoutine={(id) => setRoutines((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !r.enabled, nextRun: r.enabled ? "Paused" : r.nextRun === "Paused" ? "3 Nov" : r.nextRun } : r)))}
          reminders={reminders}
          expert={expert}
          onAsk={ask}
        />
      </Sheet>

      <Sheet open={sheet === "home"} onClose={() => setSheet(null)} title="Home">
        <HouseholdBody
          tab={homeTab}
          setTab={setHomeTab}
          things={things}
          toggleThing={(id) =>
            setThings((ts) => ts.map((t) => (t.id === id ? { ...t, state: isOn(t) ? "Off" : t.id === "h1" ? "On · 70%" : "On" } : t)))
          }
          memories={mems}
          setMemories={setMems}
          approval={approval}
          onApproval={setApproval}
          expert={expert}
          onAsk={send}
        />
      </Sheet>

      <Sheet open={sheet === "settings"} onClose={() => setSheet(null)} title="Settings">
        <SettingsBody expert={expert} setExpert={setExpert} onSay={send} onAsk={ask} onJump={openHome} quietHours={quietHours} />
      </Sheet>
    </div>
  );
}

function TopButton({ icon, label, onClick, dot }: { icon: React.ReactNode; label: string; onClick: () => void; dot?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-10 items-center gap-2 rounded-full px-2.5 text-sm font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)] md:px-3.5"
      aria-label={dot ? `${label}, 1 thing waits for you` : label}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
      {dot && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--ember)] md:static" />}
    </button>
  );
}

function Answer({ text, speaking, shown }: { text: string; speaking: boolean; shown: number }) {
  const words = text.split(" ");
  return (
    <p className="font-display text-[26px] leading-[1.3] font-light text-[var(--ink)] md:text-[34px]">
      {speaking ? (
        <>
          {words.slice(0, shown).map((w, i) => (
            <span key={i} className="v02-word">
              {w}{" "}
            </span>
          ))}
          <span className="sr-only">{text}</span>
        </>
      ) : (
        text
      )}
    </p>
  );
}

function Meta({ m }: { m: Message }) {
  const helper = helperFor[m.id] ?? "Chief";
  return (
    <p className="text-[12px] leading-relaxed text-[var(--ink-3)]">
      {deviceName(m.device)} · {clock(m.at)}:{new Date(m.at).getSeconds().toString().padStart(2, "0")} · {helper} · {modelFor[m.id] ?? "local model on Desk PC"} · trust: household
    </p>
  );
}

function RailTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display mb-4 text-[20px] text-[var(--ink-2)] italic">{children}</h2>;
}

function RailItem({ time, text, faded }: { time: string; text: string; faded?: boolean }) {
  return (
    <li className={`flex gap-3 text-[15px] ${faded ? "opacity-50" : ""}`}>
      <span className="w-16 shrink-0 text-[var(--ink-3)]">{time}</span>
      <span className="text-[var(--ink-2)]">{text}</span>
    </li>
  );
}
