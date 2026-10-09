// PROTOTYPE - concept 10 "Instrument": hux as a precise household instrument.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, Gauge, MessageCircle, Moon, SlidersHorizontal, Sun, X } from "lucide-react";
import "./styles.css";
import {
  activity as activityFixture,
  conversation,
  home as homeFixture,
  memories as memoryFixture,
  routines as routineFixture,
  suggestions as suggestionFixture,
} from "../../fixtures";
import { Display, type Msg } from "./assistant";
import type { Drawer } from "./data";
import {
  ActivityModule,
  Avatar,
  DevicesModule,
  HelpersModule,
  HomeModule,
  MemoryModule,
  NeedsYouModule,
  NowModule,
  TimerModule,
  TrustModule,
  type ActivityItem,
  type HomeItem,
  type Memory,
} from "./modules";
import { Plans, type Routine } from "./plans";
import { Settings } from "./settings";
import { InstrumentCtx, Key, Led, Selector, Wordmark, cx, type Ctx } from "./ui";

export const name = "Instrument";

type View = "talk" | "plans" | "status" | "settings";

const NAV: { id: View; label: string; icon: typeof MessageCircle; className?: string }[] = [
  { id: "talk", label: "Talk", icon: MessageCircle },
  { id: "plans", label: "Plans", icon: CalendarClock },
  { id: "status", label: "Status", icon: Gauge, className: "xl:hidden" },
  { id: "settings", label: "Settings", icon: SlidersHorizontal },
];

const CLOCK = "18:40";
const TIMER_SECONDS = 25 * 60;

function initialHome(): HomeItem[] {
  return homeFixture.map((h) => ({
    ...h,
    on: h.state.startsWith("On") || h.state.startsWith("Charging"),
  }));
}

export default function Variant() {
  const [dark, setDark] = useState(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const [expert, setExpert] = useState(false);
  const [view, setView] = useState<View>("talk");
  const [messages, setMessages] = useState<Msg[]>(conversation);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [approved, setApproved] = useState(false);
  const [homeItems, setHomeItems] = useState<HomeItem[]>(initialHome);
  const [routines, setRoutines] = useState<Routine[]>(routineFixture);
  const [memories, setMemories] = useState<Memory[]>(memoryFixture);
  const [activity, setActivity] = useState<ActivityItem[]>(activityFixture);
  const [timer, setTimer] = useState<number | null>(null);
  const [drawer, setDrawer] = useState<Drawer | null>(null);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [usedSuggestions, setUsedSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const seconds = useRef(0);
  const timeouts = useRef<number[]>([]);
  const listenTimers = useRef<number[]>([]);

  // Follow the system theme until the person picks one.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(
    () => () => {
      timeouts.current.forEach((t) => clearTimeout(t));
      listenTimers.current.forEach((t) => clearTimeout(t));
    },
    [],
  );

  useEffect(() => {
    if (timer === null || timer <= 0) return;
    const t = setTimeout(() => setTimer((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const later = (fn: () => void, ms: number) => {
    timeouts.current.push(window.setTimeout(fn, ms));
  };

  const stamp = () => {
    seconds.current += 7;
    const s = seconds.current;
    const mm = 40 + Math.floor(s / 60);
    return `2026-10-09T18:${String(mm).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}+02:00`;
  };

  const log = (text: string, needsYou = false) =>
    setActivity((a) => [{ id: `a${Date.now()}${Math.random()}`, at: CLOCK, text, who: "alex", needsYou }, ...a]);

  const startTimer = useCallback(() => {
    setTimer(TIMER_SECONDS);
  }, []);

  const approve = () => {
    if (approved) return;
    setApproved(true);
    setActivity((a) => a.map((x) => (x.needsYou ? { ...x, needsYou: false } : x)));
    log("You approved the email to Todd for Monday 7:30");
  };

  const toggleHome = (id: string) => {
    const target = homeItems.find((h) => h.id === id);
    if (!target) return;
    const on = !target.on;
    log(`Turned ${on ? "on" : "off"} the ${target.name.toLowerCase()}`);
    setHomeItems((items) => items.map((h) => (h.id === id ? { ...h, on, state: on ? (h.id === "h1" ? "On · 70%" : "On") : "Off" } : h)));
  };

  const reply = (text: string): { text: string; effect?: () => void } => {
    const t = text.toLowerCase();
    if (t.includes("timer"))
      return { text: "Timer set for 25 minutes. It will ring on the kitchen tablet.", effect: startTimer };
    if (t.includes("step by step"))
      return { text: "Step 1 of 5: heat the oven grill. Slice the courgette thinly and soften it in an ovenproof pan for 4 minutes. Say “next” when you're ready." };
    if (t.includes("tomorrow"))
      return { text: "Mia has swimming at 9:00, and Sam will be reminded about her swimming bag at 8:15. Dry until mid-afternoon, 16° at most." };
    if (t.includes("office lights"))
      return {
        text: "The office lights are off.",
        effect: () => {
          setHomeItems((items) => items.map((h) => (h.id === "h1" ? { ...h, on: false, state: "Off" } : h)));
          log("Turned off the office lights");
        },
      };
    if (t.includes("todd"))
      return { text: "Okay. I'll show you the changed email before it goes out on Monday." };
    if (t.includes("remind"))
      return { text: "Done. You'll find it under Plans." };
    if (t.startsWith("about") || t.includes("quiet hours") || t.includes("mia") || t.includes("forget") || t.includes("never"))
      return { text: "Changed. You can see the new setting under Settings, and undo it there or by asking me." };
    return { text: "On it. I'll let you know here when it's done." };
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || thinking) return;
    setMessages((m) => [...m, { id: `u${Date.now()}`, from: "member", member: "alex", at: stamp(), device: "desk", text, fresh: true }]);
    setDraft("");
    if (suggestionFixture.includes(text)) setUsedSuggestions((u) => [...u, text]);
    setThinking(true);
    const r = reply(text);
    later(() => {
      setThinking(false);
      setMessages((m) => [...m, { id: `h${Date.now()}`, from: "assistant", at: stamp(), device: "desk", text: r.text, fresh: true }]);
      r.effect?.();
    }, 950);
  };

  const toggleListening = () => {
    if (listening) {
      setListening(false);
      setHeard("");
      listenTimers.current.forEach((t) => clearTimeout(t));
      listenTimers.current = [];
      return;
    }
    setListening(true);
    setHeard("");
    const words = ["What's", "on", "tomorrow?"];
    const listenLater = (fn: () => void, ms: number) => listenTimers.current.push(window.setTimeout(fn, ms));
    words.forEach((_, i) => listenLater(() => setHeard(words.slice(0, i + 1).join(" ")), 700 + i * 380));
    listenLater(() => {
      setListening(false);
      setHeard("");
      send("What's on tomorrow?");
    }, 2400);
  };

  const ask = useCallback((text: string) => {
    setDrawer(null);
    setView("talk");
    setDraft(text);
    setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }, 60);
  }, []);

  const ctx: Ctx = useMemo(() => ({ expert, ask, openDrawer: setDrawer }), [expert, ask]);

  const heardOn = [...messages].reverse().find((m) => m.from === "member")?.device ?? "desk";
  const suggestions = suggestionFixture.filter((s) => !usedSuggestions.includes(s));
  const pending = approved ? 0 : 1;

  const timerModule = timer !== null && (
    <TimerModule remaining={Math.max(0, timer)} onStop={() => setTimer(null)} />
  );
  const leftModules = (
    <>
      <NowModule clock={CLOCK} />
      <NeedsYouModule approved={approved} onApprove={approve} />
      {timerModule}
      <HomeModule items={homeItems} onToggle={toggleHome} />
    </>
  );
  const rightModules = (
    <>
      <DevicesModule heardOn={heardOn} />
      {expert && <TrustModule />}
      <ActivityModule items={activity} />
      <MemoryModule items={memories} setItems={setMemories} />
      <HelpersModule />
    </>
  );

  const drawerTitle: Record<Drawer, string> = {
    devices: "Devices",
    home: "Home",
    helpers: "Helpers",
    memory: "What hux remembers",
    activity: "Recent activity",
  };

  return (
    <InstrumentCtx.Provider value={ctx}>
      <div className={cx("v10 relative flex h-full flex-col overflow-hidden", dark && "dark")}>
        {/* Top plate */}
        <header className="relative z-10 flex h-[60px] shrink-0 items-center gap-3 px-3 sm:px-5 lg:px-6">
          <Wordmark />
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1.5 md:flex">
            {NAV.map((n) => (
              <NavKey key={n.id} item={n} active={view === n.id} onClick={() => setView(n.id)} badge={n.id === "status" && pending > 0} />
            ))}
          </nav>
          <span className="flex-1" />
          <div className="mr-1 hidden items-baseline gap-2 lg:flex">
            <span className="mono text-[15px] font-medium">{CLOCK}</span>
            <span className="lbl">Fri 9 Oct</span>
          </div>
          <Selector
            label="Detail level"
            value={expert ? "expert" : "simple"}
            onChange={(v) => setExpert(v === "expert")}
            options={[
              { value: "simple", label: "Simple" },
              { value: "expert", label: <><Led state={expert ? "signal" : "off"} />Expert</> },
            ]}
          />
          <Selector
            label="Light or dark"
            value={dark ? "dark" : "light"}
            onChange={(v) => setDark(v === "dark")}
            options={[
              { value: "light", label: <Sun size={14} aria-label="Light" />, title: "Light" },
              { value: "dark", label: <Moon size={14} aria-label="Dark" />, title: "Dark" },
            ]}
          />
          <span className="hidden items-center gap-2 pl-1 sm:flex" title="Alex · Owner">
            <Avatar id="alex" size={28} />
          </span>
        </header>

        {/* Phone navigation */}
        <nav aria-label="Main" className="grid shrink-0 grid-cols-4 gap-1.5 px-3 pb-2 md:hidden">
          {NAV.map((n) => (
            <NavKey key={n.id} item={n} active={view === n.id} onClick={() => setView(n.id)} badge={n.id === "status" && pending > 0} compact />
          ))}
        </nav>

        <main className="min-h-0 flex-1">
          {view === "talk" && (
            <div className="grid h-full min-h-0 grid-cols-1 gap-4 px-2 sm:px-4 lg:px-6 xl:grid-cols-[296px_minmax(0,1fr)_316px]">
              <aside aria-label="Status" className="scroll hidden min-h-0 flex-col gap-4 overflow-y-auto pb-2 xl:flex [&>*]:shrink-0">{leftModules}</aside>
              <div className="flex min-h-0 flex-col gap-2">
                {timer !== null && (
                  <button type="button" onClick={() => setView("status")} className="key h-9 shrink-0 !justify-start gap-2 !rounded-xl px-3 text-[13px] xl:hidden">
                    <Led state="pulse" />
                    <span className="flex-1 text-left">Frittata timer</span>
                    <span className="mono">{String(Math.floor(timer / 60)).padStart(2, "0")}:{String(timer % 60).padStart(2, "0")}</span>
                  </button>
                )}
                <div className="min-h-0 flex-1">
                  <Display
                    messages={messages}
                    thinking={thinking}
                    approved={approved}
                    onApprove={approve}
                    onTimer={() => send("Start the frittata timer")}
                    draft={draft}
                    setDraft={setDraft}
                    send={send}
                    listening={listening}
                    heard={heard}
                    toggleListening={toggleListening}
                    suggestions={suggestions}
                    inputRef={inputRef}
                  />
                </div>
              </div>
              <aside aria-label="Household" className="scroll hidden min-h-0 flex-col gap-4 overflow-y-auto pb-2 xl:flex [&>*]:shrink-0">{rightModules}</aside>
            </div>
          )}

          {view === "status" && (
            <div className="scroll h-full overflow-y-auto px-3 pb-4 sm:px-6">
              <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-4">{leftModules}</div>
                <div className="flex flex-col gap-4">{rightModules}</div>
              </div>
            </div>
          )}

          {view === "plans" && (
            <Plans
              routines={routines}
              toggle={(id) => setRoutines((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))}
            />
          )}

          {view === "settings" && <Settings setExpert={setExpert} />}
        </main>

        {/* Base plate: keeps the bottom centre clear for the prototype switcher */}
        <footer className="flex h-14 shrink-0 items-center justify-between px-4 sm:px-6">
          <span className="lbl hidden items-center gap-2 sm:flex">
            <Led state="on" /> 4 of 5 devices on
          </span>
          <span className="lbl hidden sm:block">{expert ? "hux 0.9.3 · hux.local:7420" : "Runs at home"}</span>
        </footer>

        {/* Drawer for devices, home, helpers, memory and activity */}
        {drawer && (
          <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={drawerTitle[drawer]}>
            <button type="button" aria-label="Close" className="fade absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setDrawer(null)} />
            <div className="slide-in scroll relative flex h-full w-full max-w-[420px] flex-col gap-3 overflow-y-auto bg-[var(--chassis)] p-3 shadow-2xl sm:p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-semibold tracking-[-0.02em]">{drawerTitle[drawer]}</h2>
                <Key size="sm" onClick={() => setDrawer(null)} aria-label="Close"><X size={14} /></Key>
              </div>
              {drawer === "devices" && <DevicesModule heardOn={heardOn} />}
              {drawer === "home" && <HomeModule items={homeItems} onToggle={toggleHome} />}
              {drawer === "helpers" && <HelpersModule />}
              {drawer === "memory" && <MemoryModule items={memories} setItems={setMemories} />}
              {drawer === "activity" && <ActivityModule items={activity} />}
            </div>
          </div>
        )}
      </div>
    </InstrumentCtx.Provider>
  );
}

function NavKey({
  item,
  active,
  onClick,
  badge,
  compact,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  onClick: () => void;
  badge?: boolean;
  compact?: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cx(
        "focusable relative flex items-center justify-center gap-2 rounded-[10px] text-[13px] font-medium transition-colors",
        compact ? "h-10 flex-col !gap-0.5 text-[11px]" : "h-9 px-3.5",
        active ? "well text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]",
        item.className,
      )}
    >
      {!compact && <Led state={active ? "signal" : "off"} />}
      {compact && <Icon size={15} />}
      {item.label}
      {badge && <span className="absolute top-1 right-1.5 h-[6px] w-[6px] rounded-full bg-[var(--signal)]" />}
    </button>
  );
}
