// PROTOTYPE concept 04: shared in-memory state for the household board.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  conversation,
  home as homeFixture,
  memories as memoryFixture,
  reminders as reminderFixture,
  routines as routineFixture,
  suggestions as suggestionFixture,
  type Card,
  type Message,
} from "../../fixtures";

export type View = "board" | "plans" | "handbook";
export type PinKey = "approval" | "shopping" | "recipe" | "weather" | "research" | "timer";
export type HouseTab = "home" | "devices" | "helpers" | "memory" | "activity";
export type ApprovalState = "pending" | "approved" | "held";
export type ChatMessage = Message & { pin?: PinKey; helper?: string };

type ShoppingItem = { name: string; done: boolean };
type Memory = (typeof memoryFixture)[number];
type Routine = (typeof routineFixture)[number];
type HomeThing = (typeof homeFixture)[number];

const pinFor: Record<string, PinKey> = { m4: "recipe", m6: "shopping", m8: "research", m10: "approval", m12: "weather" };
const helperFor: Record<string, string> = { m2: "Chief", m4: "Chief", m6: "Chief", m8: "Researcher, then Writer", m10: "Writer", m12: "Chief" };

const shoppingCard = conversation.find((m) => m.card?.type === "shoppingList")?.card as Extract<Card, { type: "shoppingList" }>;

export const TIMER_MINUTES = 25;

type Ctx = {
  dark: boolean;
  setDark: (v: boolean) => void;
  expert: boolean;
  setExpert: (v: boolean) => void;
  view: View;
  setView: (v: View) => void;
  sheetOpen: boolean;
  setSheetOpen: (v: boolean) => void;
  house: HouseTab | null;
  openHouse: (t: HouseTab | null) => void;

  messages: ChatMessage[];
  thinking: boolean;
  send: (text: string) => void;
  draft: string;
  setDraft: (v: string) => void;
  askHux: (text: string) => void;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  suggestions: string[];

  pins: PinKey[];
  freshPin: PinKey | null;
  togglePin: (k: PinKey) => void;
  flash: PinKey | null;
  showOnBoard: (k: PinKey) => void;

  shopping: ShoppingItem[];
  toggleItem: (name: string) => void;
  addItem: (name: string) => void;

  approval: ApprovalState;
  setApproval: (s: ApprovalState) => void;

  timerEndsAt: number | null;
  stopTimer: () => void;

  routines: Routine[];
  toggleRoutine: (id: string) => void;
  remindersDone: string[];
  toggleReminder: (id: string) => void;

  homeThings: HomeThing[];
  toggleHome: (id: string) => void;

  memories: Memory[];
  editMemory: (id: string, text: string) => void;
  forgetMemory: (id: string) => void;
  undoForget: () => void;
  lastForgotten: Memory | null;
};

const StateContext = createContext<Ctx | null>(null);

export function useHux() {
  const c = useContext(StateContext);
  if (!c) throw new Error("useHux outside provider");
  return c;
}

export const isOn = (state: string) => !state.startsWith("Off");

function replyFor(text: string): { text: string; pin?: PinKey; helper: string; effect?: "timer" | "officeOff" } {
  const t = text.toLowerCase();
  if (t.includes("timer")) return { text: `Timer set for ${TIMER_MINUTES} minutes on the kitchen tablet. I'll call you when it's done.`, pin: "timer", helper: "Chief", effect: "timer" };
  if (t.includes("step by step") || t.includes("read me"))
    return { text: "Step 1 of 5. Heat the oven grill. Slice the courgette thinly and soften it in an ovenproof pan for 4 minutes. Say “next” when you're ready.", helper: "Chief" };
  if (t === "next" || t.startsWith("next "))
    return { text: "Step 2 of 5. Add the spinach and let it wilt.", helper: "Chief" };
  if (t.includes("tomorrow"))
    return { text: "Tomorrow starts with Mia's swimming lesson at 9:00. Sam has a reminder for her bag at 8:15. Dry until mid-afternoon, then light rain.", helper: "Chief" };
  if (t.includes("office light"))
    return { text: "The office lights are off. The kitchen lights are still on.", helper: "Home", effect: "officeOff" };
  if (t.includes("remind"))
    return { text: "Noted. I've put it on the board under that person's name.", helper: "Chief" };
  if (t.startsWith("change") || t.includes("setting") || t.includes("quiet hours"))
    return { text: "Sure. Tell me what you'd like instead, and I'll change it and show you exactly what's different before it takes effect.", helper: "Chief" };
  return { text: "I'll look into that. Anything worth keeping, I'll pin to the board.", helper: "Chief" };
}

export function HuxProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [expert, setExpert] = useState(false);
  const [view, setViewRaw] = useState<View>("board");
  const [sheetOpen, setSheetOpen] = useState(true);
  const [house, openHouse] = useState<HouseTab | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    conversation.map((m) => ({ ...m, pin: pinFor[m.id], helper: helperFor[m.id] })),
  );
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [used, setUsed] = useState<string[]>([]);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const minute = useRef(40);

  const [pins, setPins] = useState<PinKey[]>(["approval", "shopping", "recipe", "research", "weather"]);
  const [freshPin, setFreshPin] = useState<PinKey | null>(null);
  const [flash, setFlash] = useState<PinKey | null>(null);

  const [shopping, setShopping] = useState<ShoppingItem[]>(() => shoppingCard.items.map((i) => ({ ...i })));
  const [approval, setApproval] = useState<ApprovalState>("pending");
  const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
  const [routines, setRoutines] = useState<Routine[]>(() => routineFixture.map((r) => ({ ...r })));
  const [remindersDone, setRemindersDone] = useState<string[]>([]);
  const [homeThings, setHomeThings] = useState<HomeThing[]>(() => homeFixture.map((h) => ({ ...h })));
  const [memories, setMemories] = useState<Memory[]>(() => memoryFixture.map((m) => ({ ...m })));
  const [lastForgotten, setLastForgotten] = useState<Memory | null>(null);

  const setView = useCallback((v: View) => setViewRaw(v), []);

  const focusComposer = () => requestAnimationFrame(() => composerRef.current?.focus());

  const askHux = useCallback((text: string) => {
    setDraft(text);
    setSheetOpen(true);
    focusComposer();
  }, []);

  const send = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    minute.current = Math.min(59, minute.current + 1);
    const at = `2026-10-09T18:${String(minute.current).padStart(2, "0")}:00+02:00`;
    setMessages((m) => [...m, { id: `u${Date.now()}`, from: "member", member: "alex", at, device: "desk", text }]);
    setUsed((u) => [...u, text]);
    setDraft("");
    setThinking(true);
    window.setTimeout(() => {
      const r = replyFor(text);
      if (r.effect === "timer") {
        setTimerEndsAt(Date.now() + TIMER_MINUTES * 60_000);
        setPins((p) => (p.includes("timer") ? p : ["timer", ...p]));
        setFreshPin("timer");
      }
      if (r.effect === "officeOff") setHomeThings((h) => h.map((x) => (x.id === "h1" ? { ...x, state: "Off" } : x)));
      setMessages((m) => [
        ...m,
        { id: `a${Date.now()}`, from: "assistant", at: at.replace(":00+", ":04+"), device: "desk", text: r.text, pin: r.pin, helper: r.helper },
      ]);
      setThinking(false);
    }, 950);
  }, []);

  const togglePin = (k: PinKey) => {
    if (pins.includes(k)) {
      setPins((p) => p.filter((x) => x !== k));
    } else {
      setFreshPin(k);
      setPins((p) => [...p, k]);
    }
  };

  const showOnBoard = useCallback((k: PinKey) => {
    setViewRaw("board");
    setSheetOpen(false);
    setPins((p) => (p.includes(k) ? p : [...p, k]));
    window.setTimeout(() => {
      document.getElementById(`v4-pin-${k}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlash(k);
      window.setTimeout(() => setFlash(null), 1600);
    }, 120);
  }, []);

  useEffect(() => {
    if (!freshPin) return;
    const t = window.setTimeout(() => setFreshPin(null), 700);
    return () => window.clearTimeout(t);
  }, [freshPin]);

  const value: Ctx = {
    dark, setDark, expert, setExpert, view, setView, sheetOpen, setSheetOpen, house, openHouse,
    messages, thinking, send, draft, setDraft, askHux, composerRef,
    suggestions: suggestionFixture.filter((s) => !used.includes(s)),
    pins, freshPin, togglePin, flash, showOnBoard,
    shopping,
    toggleItem: (name) => setShopping((s) => s.map((i) => (i.name === name ? { ...i, done: !i.done } : i))),
    addItem: (name) => {
      const n = name.trim();
      if (n) setShopping((s) => [...s.filter((i) => i.name.toLowerCase() !== n.toLowerCase()), { name: n, done: false }]);
    },
    approval, setApproval,
    timerEndsAt,
    stopTimer: () => {
      setTimerEndsAt(null);
      setPins((p) => p.filter((x) => x !== "timer"));
    },
    routines,
    toggleRoutine: (id) => setRoutines((r) => r.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x))),
    remindersDone,
    toggleReminder: (id) => setRemindersDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id])),
    homeThings,
    toggleHome: (id) =>
      setHomeThings((h) =>
        h.map((x) => {
          if (x.id !== id || x.kind === "car") return x;
          if (isOn(x.state)) return { ...x, state: "Off" };
          return { ...x, state: homeFixture.find((f) => f.id === id && isOn(f.state))?.state ?? "On" };
        }),
      ),
    memories,
    editMemory: (id, text) => setMemories((m) => m.map((x) => (x.id === id ? { ...x, text } : x))),
    forgetMemory: (id) => {
      const gone = memories.find((m) => m.id === id) ?? null;
      setLastForgotten(gone);
      setMemories((m) => m.filter((x) => x.id !== id));
    },
    undoForget: () => {
      if (!lastForgotten) return;
      const order = memoryFixture.map((m) => m.id);
      setMemories((m) => [...m, lastForgotten].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)));
      setLastForgotten(null);
    },
    lastForgotten,
  };

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}

export const reminderList = reminderFixture;
