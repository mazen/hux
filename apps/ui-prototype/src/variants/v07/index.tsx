// PROTOTYPE - concept 07 "Glass": frosted sheets floating over an evening sky.
import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarCheck2, House, MessageCircle, Moon, Settings2, Sun } from "lucide-react";
import type { Message } from "../../fixtures";
import "./styles.css";
import { AssistantView } from "./assistant";
import { HomeView } from "./home";
import { PlansView } from "./plans";
import { SettingsView } from "./settings";
import {
  AppCtx, cannedReplies, defaultReply, initialHome, initialMessages, initialReminders, initialRoutines, type ApprovalState, type Ctx, type Tab,
} from "./state";
import { memories } from "../../fixtures";
import { Avatar, Wordmark } from "./ui";

export const name = "Glass";

const tabs: { id: Tab; label: string; icon: typeof Sun }[] = [
  { id: "assistant", label: "Assistant", icon: MessageCircle },
  { id: "plans", label: "Plans", icon: CalendarCheck2 },
  { id: "home", label: "Home", icon: House },
  { id: "settings", label: "Settings", icon: Settings2 },
];

function TabBar({ tab, setTab, dot, mobile }: { tab: Tab; setTab: (t: Tab) => void; dot: boolean; mobile?: boolean }) {
  const idx = tabs.findIndex((t) => t.id === tab);
  return (
    <nav aria-label="Sections" className={`glass-strong relative grid grid-cols-4 rounded-full p-1.5 ${mobile ? "w-full" : "w-[452px]"}`}>
      <span
        aria-hidden
        className="tab-indicator absolute top-1.5 bottom-1.5 left-1.5 rounded-full btn-accent"
        style={{ width: "calc((100% - 12px) / 4)", transform: `translateX(${idx * 100}%)`, boxShadow: "inset 0 1px 0 rgba(255,255,255,.3), 0 6px 16px -6px var(--accent)" }}
      />
      {tabs.map((t) => {
        const active = t.id === tab;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={active ? "page" : undefined}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors duration-300 ${
              mobile ? "flex-col gap-0.5 py-1.5 text-[11.5px]" : "py-2 text-[14px]"
            }`}
            style={{ color: active ? "var(--accent-ink)" : "var(--ink-2)" }}
          >
            <span className="relative">
              <Icon size={mobile ? 20 : 16} strokeWidth={2.2} />
              {dot && t.id === "home" && !active && <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full" style={{ background: "var(--ember)" }} />}
            </span>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

function ModeSwitch({ expert, setExpert }: { expert: boolean; setExpert: (b: boolean) => void }) {
  return (
    <div role="radiogroup" aria-label="Detail level" className="glass flex rounded-full p-1 text-[13px] font-semibold">
      {[false, true].map((v) => (
        <button
          key={String(v)}
          role="radio"
          aria-checked={expert === v}
          onClick={() => setExpert(v)}
          className={`rounded-full px-3 py-1.5 transition-colors ${expert === v ? "fill ink" : "ink-3"}`}
          style={expert === v ? { boxShadow: "0 1px 4px -1px var(--shadow), inset 0 0 0 1px var(--glass-line)", background: "var(--glass-strong)" } : undefined}
        >
          {v ? "Expert" : "Simple"}
        </button>
      ))}
    </div>
  );
}

export default function Variant() {
  const [tab, setTab] = useState<Tab>("assistant");
  const [dark, setDark] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [themeTouched, setThemeTouched] = useState(false);
  const [expert, setExpert] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [approval, setApproval] = useState<ApprovalState>("pending");
  const [routineOn, setRoutineOn] = useState(initialRoutines);
  const [homeState, setHomeState] = useState(initialHome);
  const [mems, setMems] = useState(memories);
  const [remindersDone, setRemindersDone] = useState(initialReminders);
  const seq = useRef(0);

  useEffect(() => {
    if (themeTouched) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [themeTouched]);

  const send = useCallback((text: string) => {
    const id = ++seq.current;
    const stamp = "2026-10-09T18:4" + Math.min(9, id) + ":00+02:00";
    setMessages((m) => [...m, { id: `u${id}`, from: "member", member: "alex", at: stamp, device: "desk", text }]);
    setThinking(true);
    setTimeout(() => {
      if (text === "Turn off the office lights") setHomeState((h) => ({ ...h, h1: "Off" }));
      setMessages((m) => [...m, { id: `a${id}`, from: "assistant", at: stamp.replace(":00+", ":03+"), device: "desk", text: cannedReplies[text] ?? defaultReply }]);
      setThinking(false);
    }, 1300);
  }, []);

  const ctx: Ctx = {
    tab, setTab, dark, expert, messages, thinking, send, draft, setDraft,
    askHux: (p) => { setDraft(p); setTab("assistant"); },
    approval, setApproval,
    routineOn, toggleRoutine: (id) => setRoutineOn((r) => ({ ...r, [id]: !r[id] })),
    homeState,
    toggleHome: (id) => setHomeState((h) => ({ ...h, [id]: h[id] === "Off" ? (id === "h1" ? "On · 70%" : "On") : "Off" })),
    mems, setMems,
    remindersDone, toggleReminder: (id) => setRemindersDone((r) => ({ ...r, [id]: !r[id] })),
  };

  const themeBtn = (
    <button
      onClick={() => { setDark(!dark); setThemeTouched(true); }}
      aria-label={dark ? "Switch to light" : "Switch to dark"}
      className="glass grid h-10 w-10 place-items-center rounded-full ink-2"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );

  return (
    <AppCtx.Provider value={ctx}>
      <div className={`v07 relative h-full overflow-hidden ${dark ? "dark" : ""}`}>
        <div className="backdrop" aria-hidden>
          <div className="blob blob-a" />
          <div className="blob blob-b" />
          <div className="blob blob-c" />
          <div className="grain" />
        </div>

        <div className="relative flex h-full flex-col">
          <header className="relative z-20 flex shrink-0 items-center justify-between gap-3 px-4 pt-3 pb-1 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr] md:pt-4">
            <button onClick={() => setTab("assistant")} aria-label="hux, go to Assistant" className="justify-self-start">
              <Wordmark />
            </button>
            <div className="hidden md:block">
              <TabBar tab={tab} setTab={setTab} dot={approval === "pending"} />
            </div>
            <div className="flex items-center gap-2 justify-self-end">
              <ModeSwitch expert={expert} setExpert={setExpert} />
              {themeBtn}
              <span className="hidden lg:inline-flex"><Avatar id="alex" size={40} /></span>
            </div>
          </header>

          <main className="relative min-h-0 flex-1">
            {tab === "assistant" && <AssistantView />}
            {tab === "plans" && <PlansView />}
            {tab === "home" && <HomeView />}
            {tab === "settings" && <SettingsView />}
          </main>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-3 md:hidden">
            <div className="pointer-events-auto mx-auto max-w-[420px]">
              <TabBar tab={tab} setTab={setTab} dot={approval === "pending"} mobile />
            </div>
          </div>
        </div>
      </div>
    </AppCtx.Provider>
  );
}
