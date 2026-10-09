// PROTOTYPE - concept 08 in-memory state. Everything resets on reload.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { conversation, home, memories as memoryFixtures, routines as routineFixtures, type Message } from "../../fixtures";

export type View = "talk" | "plans" | "house" | "settings";
export type ApprovalState = "pending" | "approved" | "held";

type Store = {
  dark: boolean;
  setDark: (v: boolean) => void;
  expert: boolean;
  setExpert: (v: boolean) => void;
  view: View;
  go: (v: View) => void;

  messages: Message[];
  thinking: boolean;
  send: (text: string) => void;
  draft: string;
  setDraft: (t: string) => void;
  /** Jump to the assistant with the input prefilled, ready to send. */
  askAbout: (text: string) => void;
  focusTick: number;

  approval: ApprovalState;
  setApproval: (a: ApprovalState) => void;

  routineOn: Record<string, boolean>;
  setRoutine: (id: string, on: boolean) => void;
  reminderDone: Record<string, boolean>;
  toggleReminder: (id: string) => void;

  homeState: Record<string, string>;
  toggleHome: (id: string) => void;

  memories: typeof memoryFixtures;
  editMemory: (id: string, text: string) => void;
  forgetMemory: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("v08 store missing");
  return s;
}

function cannedReply(text: string): { reply: string; effect?: "officeOff" } {
  const t = text.toLowerCase();
  if (t.includes("timer")) return { reply: "Timer set for 25 minutes on the kitchen tablet. I'll call you when it's time to put it under the grill." };
  if (t.includes("step by step") || t.includes("read me"))
    return { reply: "Starting on the kitchen tablet. Step 1: heat the oven grill and slice the courgette thinly. Say “next” when you're ready." };
  if (t.includes("tomorrow")) return { reply: "Mia's swimming lesson at 9:00. Sam has a reminder for the swimming bag at 8:15. The afternoon is free, and it stays dry until about three." };
  if (t.includes("office lights") || (t.includes("light") && t.includes("off")))
    return { reply: "The office lights are off.", effect: "officeOff" };
  if (t.includes("quiet") || t.includes("setting") || t.includes("change") || t.includes("turn on") || t.includes("make"))
    return { reply: "Done. I've changed that for you. You can see it under Settings, and undo it there any time." };
  if (t.includes("remind")) return { reply: "Noted. I'll remind you and show it under Plans." };
  return { reply: "Got it. I'll take care of that and tell you here when it's done." };
}

export function StoreProvider({ children, initialDark }: { children: ReactNode; initialDark: boolean }) {
  const [dark, setDark] = useState(initialDark);
  const [expert, setExpert] = useState(false);
  const [view, setView] = useState<View>("talk");
  const [messages, setMessages] = useState<Message[]>(conversation);
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [focusTick, setFocusTick] = useState(0);
  const [approval, setApproval] = useState<ApprovalState>("pending");
  const [routineOn, setRoutineOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(routineFixtures.map((r) => [r.id, r.enabled])),
  );
  const [reminderDone, setReminderDone] = useState<Record<string, boolean>>({});
  const [homeState, setHomeState] = useState<Record<string, string>>(() => Object.fromEntries(home.map((h) => [h.id, h.state])));
  const [memories, setMemories] = useState(memoryFixtures);
  const counter = useRef(0);

  const go = useCallback((v: View) => {
    setView(v);
  }, []);

  const send = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    counter.current += 1;
    const n = counter.current;
    const at = new Date(Date.parse("2026-10-09T18:40:00+02:00") + n * 30_000).toISOString();
    setMessages((m) => [...m, { id: `u${n}`, from: "member", member: "alex", at, device: "desk", text }]);
    setDraft("");
    setThinking(true);
    const { reply, effect } = cannedReply(text);
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: `a${n}`, from: "assistant", at, device: "desk", text: reply }]);
      setThinking(false);
      if (effect === "officeOff") setHomeState((s) => ({ ...s, h1: "Off" }));
    }, 1100);
  }, []);

  const askAbout = useCallback((text: string) => {
    setDraft(text);
    setView("talk");
    setFocusTick((t) => t + 1);
  }, []);

  const value = useMemo<Store>(
    () => ({
      dark, setDark, expert, setExpert, view, go,
      messages, thinking, send, draft, setDraft, askAbout, focusTick,
      approval, setApproval,
      routineOn, setRoutine: (id, on) => setRoutineOn((s) => ({ ...s, [id]: on })),
      reminderDone, toggleReminder: (id) => setReminderDone((s) => ({ ...s, [id]: !s[id] })),
      homeState,
      toggleHome: (id) =>
        setHomeState((s) => {
          const cur = s[id];
          const on = cur.startsWith("On");
          return { ...s, [id]: on ? "Off" : "On" };
        }),
      memories,
      editMemory: (id, text) => setMemories((ms) => ms.map((m) => (m.id === id ? { ...m, text } : m))),
      forgetMemory: (id) => setMemories((ms) => ms.filter((m) => m.id !== id)),
    }),
    [dark, expert, view, go, messages, thinking, send, draft, askAbout, focusTick, approval, routineOn, reminderDone, homeState, memories],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
