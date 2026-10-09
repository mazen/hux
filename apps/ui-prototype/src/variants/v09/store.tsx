// PROTOTYPE - concept 09 "Grove": all in-memory state, shared through one context.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import {
  conversation,
  home as homeFixture,
  memories as memoriesFixture,
  routines as routinesFixture,
  settingsGroups,
  type Message,
} from "../../fixtures";

export type View = "home" | "plans" | "household" | "settings";
export type Focus =
  | { kind: "setting"; group: string; item?: string }
  | { kind: "plan"; id: string }
  | { kind: "thing"; id: string }
  | { kind: "device"; id: string }
  | { kind: "helper"; id: string };
export type SheetKind = "memory" | "activity";
export type Approval = "pending" | "approved" | "declined";

export type Msg = Message & {
  link?: { label: string; view?: View; focus?: Focus; sheet?: SheetKind };
  fresh?: boolean;
};

export type Thing = { id: string; name: string; place: string; kind: string; on: boolean; onLabel: string; switchable: boolean };

const initialThings: Thing[] = homeFixture.map((h) => ({
  id: h.id,
  name: h.name,
  place: h.place,
  kind: h.kind,
  on: !h.state.startsWith("Off"),
  onLabel: h.state.startsWith("Off") ? "On" : h.state,
  switchable: h.kind !== "car",
}));

export const thingState = (t: Thing) => (t.on ? t.onLabel : "Off");

type Ctx = {
  dark: boolean;
  setDark: (v: boolean) => void;
  expert: boolean;
  setExpert: (v: boolean) => void;

  view: View;
  focus: (Focus & { nonce: number }) | null;
  go: (view: View, focus?: Focus) => void;

  sheet: SheetKind | null;
  setSheet: (s: SheetKind | null) => void;

  lifted: boolean;
  setLifted: (v: boolean) => void;
  query: string;
  setQuery: (q: string) => void;
  listening: boolean;
  listen: () => void;

  messages: Msg[];
  thinking: boolean;
  send: (text: string, about?: { group: string; item: string }) => void;

  things: Thing[];
  toggleThing: (id: string) => void;
  routineOn: Record<string, boolean>;
  toggleRoutine: (id: string) => void;
  remindersDone: Record<string, boolean>;
  toggleReminder: (id: string) => void;
  approval: Approval;
  setApproval: (a: Approval) => void;
  memories: typeof memoriesFixture;
  editMemory: (id: string, text: string) => void;
  removeMemory: (id: string) => void;
  restoreMemory: (m: (typeof memoriesFixture)[number], index: number) => void;
  shopping: { name: string; done: boolean }[];
  toggleShopping: (name: string) => void;
  emailBody: string;
  setEmailBody: (b: string) => void;
  timerUntil: number | null;
};

const C = createContext<Ctx | null>(null);

export function useGrove() {
  const c = useContext(C);
  if (!c) throw new Error("Grove context missing");
  return c;
}

const prefersDark = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

let idSeq = 100;
const nextId = () => `n${++idSeq}`;

export function GroveProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState<boolean>(prefersDark);
  const [expert, setExpert] = useState(false);
  const [view, setView] = useState<View>("home");
  const [focus, setFocus] = useState<(Focus & { nonce: number }) | null>(null);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [lifted, setLifted] = useState(false);
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(conversation);
  const [thinking, setThinking] = useState(false);
  const [things, setThings] = useState<Thing[]>(initialThings);
  const [routineOn, setRoutineOn] = useState<Record<string, boolean>>(() => Object.fromEntries(routinesFixture.map((r) => [r.id, r.enabled])));
  const [remindersDone, setRemindersDone] = useState<Record<string, boolean>>({});
  const [approval, setApproval] = useState<Approval>("pending");
  const [memories, setMemories] = useState(memoriesFixture);
  const [shopping, setShopping] = useState(() => {
    const card = conversation.find((m) => m.card?.type === "shoppingList")?.card;
    return card && card.type === "shoppingList" ? card.items.map((i) => ({ ...i })) : [];
  });
  const [emailBody, setEmailBody] = useState(() => {
    const card = conversation.find((m) => m.card?.type === "emailDraft")?.card;
    return card && card.type === "emailDraft" ? card.body : "";
  });
  const [timerUntil, setTimerUntil] = useState<number | null>(null);
  const thingsRef = useRef(things);
  thingsRef.current = things;
  const listenTimer = useRef<number[]>([]);

  const go = useCallback((v: View, f?: Focus) => {
    setView(v);
    setFocus(f ? { ...f, nonce: Date.now() } : null);
  }, []);

  const toggleThing = useCallback((id: string) => {
    setThings((ts) => ts.map((t) => (t.id === id && t.switchable ? { ...t, on: !t.on } : t)));
  }, []);

  const toggleRoutine = useCallback((id: string) => setRoutineOn((r) => ({ ...r, [id]: !r[id] })), []);
  const toggleReminder = useCallback((id: string) => setRemindersDone((r) => ({ ...r, [id]: !r[id] })), []);
  const toggleShopping = useCallback((name: string) => setShopping((s) => s.map((i) => (i.name === name ? { ...i, done: !i.done } : i))), []);
  const editMemory = useCallback((id: string, text: string) => setMemories((ms) => ms.map((m) => (m.id === id ? { ...m, text } : m))), []);
  const removeMemory = useCallback((id: string) => setMemories((ms) => ms.filter((m) => m.id !== id)), []);
  const restoreMemory = useCallback((m: (typeof memoriesFixture)[number], index: number) => {
    setMemories((ms) => {
      const copy = ms.slice();
      copy.splice(Math.min(index, copy.length), 0, m);
      return copy;
    });
  }, []);

  const send = useCallback(
    (raw: string, about?: { group: string; item: string }) => {
      const text = raw.trim();
      if (!text) return;
      const at = new Date("2026-10-09T18:41:00+02:00").toISOString();
      setMessages((ms) => [...ms, { id: nextId(), from: "member", member: "alex", at, device: "desk", text, fresh: true }]);
      setQuery("");
      setLifted(false);
      setView("home");
      setFocus(null);
      setThinking(true);

      const lower = text.toLowerCase();
      let reply: Pick<Msg, "text" | "link"> = { text: "Got it. I'll look into that and tell you here when I have something." };

      if (about) {
        const group = settingsGroups.find((g) => g.id === about.group);
        reply = {
          text: `Done. I've changed “${about.item}” as you asked. It's in Settings under ${group?.title ?? "Settings"} if you want to look.`,
          link: { label: `Open ${group?.title ?? "Settings"}`, view: "settings", focus: { kind: "setting", group: about.group, item: about.item } },
        };
      } else if (/light|lamp/.test(lower)) {
        const turnOn = /\bon\b/.test(lower) && !/\boff\b/.test(lower);
        const targets = thingsRef.current.filter(
          (t) => t.kind === "light" && (lower.includes(t.place.toLowerCase()) || lower.includes(t.name.toLowerCase()) || /all|every/.test(lower)),
        );
        const chosen = targets.length ? targets : thingsRef.current.filter((t) => t.kind === "light" && t.place === "Office");
        setThings((ts) => ts.map((t) => (chosen.some((c) => c.id === t.id) ? { ...t, on: turnOn } : t)));
        const names = chosen.map((c) => c.name);
        const label = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
        const stillOn = thingsRef.current.filter((t) => t.kind === "light" && t.on && !chosen.some((c) => c.id === t.id)).map((t) => t.name.toLowerCase());
        reply = {
          text: `${label} ${names.length === 1 ? "is" : "are"} ${turnOn ? "on" : "off"}.${!turnOn && stillOn.length ? ` The ${stillOn.join(" and ")} ${stillOn.length === 1 ? "is" : "are"} still on.` : ""}`,
          link: { label: "Lights at home", view: "household", focus: { kind: "thing", id: chosen[0]?.id ?? "h1" } },
        };
      } else if (/timer/.test(lower)) {
        setTimerUntil(25);
        reply = { text: "Timer set for 25 minutes on the kitchen tablet. I'll tell you when it's time for the grill." };
      } else if (/tomorrow|saturday/.test(lower)) {
        reply = {
          text: "Tomorrow starts with Mia's swimming lesson at 9:00. Sam has a reminder at 8:15 to pack her bag. Dry until mid-afternoon, then light rain.",
          link: { label: "See plans", view: "plans", focus: { kind: "plan", id: "c1" } },
        };
      } else if (/step|recipe|read me/.test(lower)) {
        reply = { text: "Step 1 of 5. Heat the oven grill. Slice the courgette thinly and soften it in an ovenproof pan for 4 minutes. Say “next” when you're ready." };
      } else if (/remind|reminder/.test(lower)) {
        reply = { text: "Okay, I'll remind you. You'll find it with your other plans.", link: { label: "Open plans", view: "plans" } };
      } else if (/forget|remember/.test(lower)) {
        reply = { text: "Noted. You can see everything I remember, and change it, any time.", link: { label: "What hux remembers", sheet: "memory" } };
      }

      window.setTimeout(() => {
        setThinking(false);
        setMessages((ms) => [...ms, { id: nextId(), from: "assistant", at, device: "desk", fresh: true, ...reply }]);
      }, 1100);
    },
    [],
  );

  const listen = useCallback(() => {
    listenTimer.current.forEach((t) => window.clearTimeout(t));
    listenTimer.current = [];
    if (listening) {
      setListening(false);
      return;
    }
    setListening(true);
    setQuery("");
    const phrase = "Turn off the office lights";
    const words = phrase.split(" ");
    words.forEach((_, i) => {
      listenTimer.current.push(window.setTimeout(() => setQuery(words.slice(0, i + 1).join(" ")), 900 + i * 260));
    });
    listenTimer.current.push(
      window.setTimeout(() => {
        setListening(false);
        send(phrase);
      }, 900 + words.length * 260 + 700),
    );
  }, [listening, send]);

  const value = useMemo<Ctx>(
    () => ({
      dark, setDark, expert, setExpert, view, focus, go, sheet, setSheet, lifted, setLifted, query, setQuery, listening, listen,
      messages, thinking, send, things, toggleThing, routineOn, toggleRoutine, remindersDone, toggleReminder, approval, setApproval,
      memories, editMemory, removeMemory, restoreMemory, shopping, toggleShopping, emailBody, setEmailBody, timerUntil,
    }),
    [dark, expert, view, focus, go, sheet, lifted, query, listening, listen, messages, thinking, send, things, toggleThing, routineOn, toggleRoutine,
      remindersDone, toggleReminder, approval, memories, editMemory, removeMemory, restoreMemory, shopping, toggleShopping, emailBody, timerUntil],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}
