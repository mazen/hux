// PROTOTYPE - in-memory state for concept 01 "Paper".
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  conversation,
  devices,
  home as homeFixture,
  household,
  memories as memoriesFixture,
  routines as routinesFixture,
  type MemberId,
  type Message,
} from "../../fixtures";

export type Page = "conversation" | "plans" | "household" | "settings";
export type Entry = Message & { fresh?: boolean; helper?: string };
export type Approval = "pending" | "approved" | "held";
export type Memory = (typeof memoriesFixture)[number];

type Store = {
  page: Page;
  go: (p: Page, draft?: string) => void;
  dark: boolean;
  toggleDark: () => void;
  expert: boolean;
  setExpert: (v: boolean) => void;
  messages: Entry[];
  writing: boolean;
  send: (text: string) => void;
  draft: string;
  setDraft: (v: string) => void;
  draftNonce: number;
  approval: Approval;
  setApproval: (a: Approval) => void;
  routineOn: Record<string, boolean>;
  toggleRoutine: (id: string) => void;
  homeState: Record<string, string>;
  toggleHome: (id: string) => void;
  memories: Memory[];
  updateMemory: (id: string, text: string) => void;
  forgetMemory: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

export const memberById = (id?: MemberId) => household.members.find((m) => m.id === id);
export const deviceName = (id: string) => devices.find((d) => d.id === id)?.name ?? id;

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });

const helperByMessage: Record<string, string> = {
  m2: "Chief",
  m4: "Chief",
  m6: "Chief",
  m8: "Researcher, then Writer",
  m10: "Writer",
  m12: "Chief",
};

function useSystemDark(): [boolean, () => void] {
  const query = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const [dark, setDark] = useState(() => query?.matches ?? false);
  const chosen = useRef(false);
  useEffect(() => {
    if (!query) return;
    const on = (e: MediaQueryListEvent) => {
      if (!chosen.current) setDark(e.matches);
    };
    query.addEventListener("change", on);
    return () => query.removeEventListener("change", on);
  }, [query]);
  return [
    dark,
    () => {
      chosen.current = true;
      setDark((d) => !d);
    },
  ];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>("conversation");
  const [dark, toggleDark] = useSystemDark();
  const [expert, setExpert] = useState(false);
  const [messages, setMessages] = useState<Entry[]>(() =>
    conversation.map((m) => ({ ...m, helper: helperByMessage[m.id] })),
  );
  const [writing, setWriting] = useState(false);
  const [draft, setDraftRaw] = useState("");
  const [draftNonce, setDraftNonce] = useState(0);
  const [approval, setApproval] = useState<Approval>("pending");
  const [routineOn, setRoutineOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(routinesFixture.map((r) => [r.id, r.enabled])),
  );
  const [homeState, setHomeState] = useState<Record<string, string>>(() =>
    Object.fromEntries(homeFixture.map((h) => [h.id, h.state])),
  );
  const [memories, setMemories] = useState<Memory[]>(memoriesFixture);
  const clock = useRef(41); // minutes past 18:00

  const go = useCallback((p: Page, d?: string) => {
    setPage(p);
    if (d !== undefined) {
      setDraftRaw(d);
      setDraftNonce((n) => n + 1);
    }
  }, []);

  const send = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const minute = Math.min(clock.current, 59);
    clock.current += 1;
    const at = `2026-10-09T18:${String(minute).padStart(2, "0")}:00+02:00`;
    const id = `u${Date.now()}`;
    setMessages((ms) => [...ms, { id, from: "member", member: "alex", at, device: "desk", text, fresh: true }]);
    setDraftRaw("");
    setWriting(true);

    const reply = replyTo(text);
    window.setTimeout(() => {
      setWriting(false);
      setMessages((ms) => [
        ...ms,
        { id: `${id}r`, from: "assistant", at: at.replace(":00+", ":04+"), device: "desk", text: reply.text, fresh: true, helper: reply.helper ?? "Chief" },
      ]);
      if (reply.effect === "officeLightsOff") setHomeState((h) => ({ ...h, h1: "Off" }));
      if (reply.effect === "lotteryOff") setRoutineOn((r) => ({ ...r, j2: false }));
    }, 1100);
  }, []);

  const value: Store = {
    page,
    go,
    dark,
    toggleDark,
    expert,
    setExpert,
    messages,
    writing,
    send,
    draft,
    setDraft: setDraftRaw,
    draftNonce,
    approval,
    setApproval,
    routineOn,
    toggleRoutine: (id) => setRoutineOn((r) => ({ ...r, [id]: !r[id] })),
    homeState,
    toggleHome: (id) =>
      setHomeState((h) => {
        const cur = h[id] ?? "Off";
        return { ...h, [id]: cur.startsWith("Off") ? "On" : "Off" };
      }),
    memories,
    updateMemory: (id, text) => setMemories((ms) => ms.map((m) => (m.id === id ? { ...m, text, learned: "You edited this" } : m))),
    forgetMemory: (id) => setMemories((ms) => ms.filter((m) => m.id !== id)),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

type Reply = { text: string; helper?: string; effect?: "officeLightsOff" | "lotteryOff" };

function replyTo(text: string): Reply {
  const t = text.toLowerCase();
  if (t.includes("timer"))
    return { text: "Timer set for 25 minutes on the kitchen tablet. I'll call you when it's time to put the pan under the grill." };
  if (t.includes("step by step") || t.includes("read me the recipe"))
    return { text: "Step one: heat the oven grill. Slice the courgette thinly and soften it in an ovenproof pan for 4 minutes. Say \"next\" when you're ready." };
  if (t.includes("tomorrow"))
    return { text: "Tomorrow is Saturday. Mia has swimming at 9:00, and Sam gets a reminder about her bag at 8:15. Dry until mid-afternoon." };
  if (t.includes("office lights"))
    return { text: "The office lights are off.", helper: "Home", effect: "officeLightsOff" };
  if (t.includes("lottery"))
    return { text: "I've paused the lottery check. Your three tickets are still saved, so just say when to start again.", effect: "lotteryOff" };
  if (t.includes("quiet hours"))
    return { text: "Done. On Fridays, quiet hours now start at 23:00. The other days stay at 22:30." };
  if (t.startsWith("remind me") || t.includes("reminder"))
    return { text: "I'll remind you. You'll find it under Plans." };
  if (t.startsWith("help me with"))
    return { text: "Of course. Tell me how you'd like it to be, and I'll show you the change before I make it." };
  return { text: "Noted. I'll look into it and add what I find here." };
}
