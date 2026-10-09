// PROTOTYPE concept 03 - in-memory state for the whole concept.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import {
  conversation,
  home as homeFixture,
  memories as memoryFixture,
  portfolioBriefing,
  routines as routineFixture,
  type Card,
  type Message,
} from "../../fixtures";
import { replyFor } from "./data";

export type View = "assistant" | "plans" | "home" | "memory" | "activity" | "settings";

/** Something that can be put on the stage: a card from a message, a task thread, or the morning briefing. */
export type StageItem = {
  key: string;
  kind: Card["type"] | "thread";
  title: string;
  label: string;
  card?: Card;
  msg?: Message;
};

type Approval = "pending" | "approved" | "held";

type Hux = {
  view: View;
  setView: (v: View) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  expert: boolean;
  setExpert: (e: boolean) => void;

  messages: Message[];
  typing: boolean;
  send: (text: string) => void;
  draft: string;
  setDraft: (t: string) => void;
  askAbout: (text: string) => void;

  stageItems: StageItem[];
  stageKey: string;
  show: (key: string) => void;
  pinned: string[];
  togglePin: (key: string) => void;
  item: (key: string) => StageItem | undefined;

  approval: Approval;
  setApproval: (a: Approval) => void;

  shop: { name: string; done: boolean }[];
  toggleShop: (i: number) => void;
  addShop: (name: string) => void;

  routines: typeof routineFixture;
  toggleRoutine: (id: string) => void;

  homeState: Record<string, boolean>;
  toggleHome: (id: string) => void;

  memories: { id: string; text: string; learned: string; about?: string }[];
  editMemory: (id: string, text: string) => void;
  forgetMemory: (id: string) => void;
};

const Ctx = createContext<Hux | null>(null);

export function useHux() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHux outside provider");
  return v;
}

const kindLabel: Record<StageItem["kind"], string> = {
  recipe: "Recipe",
  shoppingList: "Shopping list",
  emailDraft: "Email draft",
  weather: "Weather",
  portfolio: "Briefing",
  approval: "Needs your OK",
  thread: "Task",
};

function cardTitle(c: Card): string {
  switch (c.type) {
    case "recipe": return c.title;
    case "shoppingList": return c.title;
    case "emailDraft": return c.subject;
    case "weather": return `${c.place}, tomorrow`;
    case "portfolio": return `Portfolio, ${c.date}`;
    case "approval": return c.action;
  }
}

function itemsFrom(messages: Message[]): StageItem[] {
  const out: StageItem[] = [];
  for (const m of messages) {
    if (m.thread) out.push({ key: `${m.id}:thread`, kind: "thread", title: m.thread.title, label: kindLabel.thread, msg: m });
    if (m.card) out.push({ key: m.id, kind: m.card.type, title: cardTitle(m.card), label: kindLabel[m.card.type], card: m.card, msg: m });
  }
  out.push({ key: "briefing", kind: "portfolio", title: cardTitle(portfolioBriefing), label: "Morning briefing", card: portfolioBriefing });
  return out;
}

function systemDark() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

let clock = 41; // minutes past 18:00 for new messages
function nextAt() {
  const m = clock++;
  const hh = 18 + Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  return `2026-10-09T${hh}:${mm}:00+02:00`;
}

export function HuxProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>("assistant");
  const [dark, setDark] = useState(systemDark);
  const [expert, setExpert] = useState(false);
  const [messages, setMessages] = useState<Message[]>(conversation);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [stageKey, setStageKey] = useState("m12");
  const [pinned, setPinned] = useState<string[]>(["m4", "m6"]);
  const [approval, setApproval] = useState<Approval>("pending");
  const [shop, setShop] = useState(() => {
    const c = conversation.find((m) => m.card?.type === "shoppingList")?.card;
    return c && c.type === "shoppingList" ? c.items.map((i) => ({ ...i })) : [];
  });
  const [routines, setRoutines] = useState(routineFixture);
  const [homeState, setHomeState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(homeFixture.map((h) => [h.id, !h.state.startsWith("Off")])),
  );
  const [memories, setMemories] = useState(() => memoryFixture.map((m) => ({ ...m, about: m.about as string | undefined })));
  const timer = useRef<number | undefined>(undefined);

  const stageItems = useMemo(() => itemsFrom(messages), [messages]);
  const item = useCallback((key: string) => stageItems.find((i) => i.key === key), [stageItems]);

  const send = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const at = nextAt();
    setMessages((ms) => [...ms, { id: `u${Date.now()}`, from: "member", member: "alex", at, device: "desk", text }]);
    setDraft("");
    setTyping(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const r = replyFor(text);
      if (r.effect === "officeLightsOff") setHomeState((s) => ({ ...s, h1: false }));
      const replyAt = nextAt();
      setMessages((ms) => [...ms, { id: `a${Date.now()}`, from: "assistant", at: replyAt, device: "desk", text: r.text }]);
      setTyping(false);
    }, 900);
  }, []);

  const value: Hux = {
    view, setView, dark, setDark, expert, setExpert,
    messages, typing, send, draft, setDraft,
    askAbout: (text) => { setDraft(text); setView("assistant"); },
    stageItems, stageKey, item,
    show: (key) => { setStageKey(key); setView("assistant"); },
    pinned,
    togglePin: (key) => setPinned((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key])),
    approval, setApproval,
    shop,
    toggleShop: (i) => setShop((s) => s.map((it, j) => (j === i ? { ...it, done: !it.done } : it))),
    addShop: (name) => setShop((s) => [...s, { name, done: false }]),
    routines,
    toggleRoutine: (id) => setRoutines((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))),
    homeState,
    toggleHome: (id) => setHomeState((s) => ({ ...s, [id]: !s[id] })),
    memories,
    editMemory: (id, text) => setMemories((ms) => ms.map((m) => (m.id === id ? { ...m, text, learned: "You changed this" } : m))),
    forgetMemory: (id) => setMemories((ms) => ms.filter((m) => m.id !== id)),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
