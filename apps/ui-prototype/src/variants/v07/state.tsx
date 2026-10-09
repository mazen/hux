// PROTOTYPE - concept 07 "Glass": shared in-memory state.
import { createContext, useContext } from "react";
import { conversation, home, memories, reminders, routines, type Message } from "../../fixtures";

export type Tab = "assistant" | "plans" | "home" | "settings";
export type ApprovalState = "pending" | "approved" | "declined";

export type Ctx = {
  tab: Tab;
  setTab: (t: Tab) => void;
  dark: boolean;
  expert: boolean;
  messages: Message[];
  thinking: boolean;
  send: (text: string) => void;
  draft: string;
  setDraft: (s: string) => void;
  askHux: (prefill: string) => void;
  approval: ApprovalState;
  setApproval: (a: ApprovalState) => void;
  routineOn: Record<string, boolean>;
  toggleRoutine: (id: string) => void;
  homeState: Record<string, string>;
  toggleHome: (id: string) => void;
  mems: typeof memories;
  setMems: (m: typeof memories) => void;
  remindersDone: Record<string, boolean>;
  toggleReminder: (id: string) => void;
};

export const AppCtx = createContext<Ctx | null>(null);
export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("no ctx");
  return c;
}

export const initialRoutines = Object.fromEntries(routines.map((r) => [r.id, r.enabled]));
export const initialHome = Object.fromEntries(home.map((h) => [h.id, h.state]));
export const initialMessages = conversation;
export const initialReminders = Object.fromEntries(reminders.map((r) => [r.id, false]));

// Which helper answered, and on what (expert detail only).
export const helperFor: Record<string, string> = { m2: "chief", m4: "chief", m6: "chief", m8: "writer", m10: "writer", m12: "chief" };
export const modelFor: Record<string, string> = {
  chief: "qwen3-32b · Desk PC GPU · trust: home",
  research: "cloud endpoint · public data only",
  writer: "qwen3-32b · Desk PC GPU · trust: home",
  home: "llama-3.2-3b · Kitchen tablet · trust: home",
};

export const cannedReplies: Record<string, string> = {
  "Start the frittata timer": "Timer set for 25 minutes on the kitchen tablet. I'll call you when it's time for the grill.",
  "Read me the recipe step by step": "I'll read it on the kitchen tablet. Say “next” whenever you're ready for the next step.",
  "What's on tomorrow?": "Mia's swimming lesson at 9:00. Sam has a reminder to pack her bag at 8:15. Dry until mid-afternoon.",
  "Turn off the office lights": "The office lights are off.",
};
export const defaultReply = "Okay. I'll take care of that and show you here what changed, so you can undo it.";

export function hhmm(iso: string) {
  return iso.slice(11, 16);
}
