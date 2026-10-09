// PROTOTYPE - concept 02 "Hearth": local helpers and canned behaviour.
import { devices, household, type MemberId, type Message } from "../../fixtures";

export type HearthState = "idle" | "listening" | "thinking" | "speaking";
export type SheetId = "plans" | "settings" | "home" | "earlier" | null;

export function clock(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
}

export function dayLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Berlin" });
}

export function member(id?: MemberId) {
  return household.members.find((m) => m.id === id);
}

export function deviceName(id: string) {
  return devices.find((d) => d.id === id)?.name ?? id;
}

/** Which helper handled each assistant message (shown in expert mode). */
export const helperFor: Record<string, string> = {
  m2: "Chief",
  m4: "Chief",
  m6: "Chief",
  m8: "Researcher, then Writer",
  m10: "Writer",
  m12: "Chief",
};

export const modelFor: Record<string, string> = {
  m8: "web search: cloud model (public info only) · draft: local model",
};

/** Phrases the "voice" will hear, in turn, when you tap the hearth or the mic. */
export const heardPhrases = [
  "Start the frittata timer",
  "Remind me to water the plants on Sunday morning",
  "Turn off the office lights",
  "What's on tomorrow?",
];

export type Reply = { text: string; effect?: "officeLightsOff" | "plantsReminder" | "quietHours" };

export function replyTo(text: string): Reply {
  const t = text.toLowerCase();
  if (t.includes("timer")) return { text: "Timer set for 25 minutes on the kitchen tablet. I'll tell you when it's time for the grill." };
  if (t.includes("step by step") || t.includes("read me"))
    return { text: "Step one. Heat the oven grill, then slice the courgette thinly and soften it in an ovenproof pan for 4 minutes. Say \"next\" when you're ready." };
  if (t.includes("tomorrow") || t.includes("what's on"))
    return { text: "Mia's swimming lesson is at 9:00, and Sam has a reminder at 8:15 to pack her bag. Dry until mid-afternoon." };
  if (t.includes("office light")) return { text: "The office lights are off.", effect: "officeLightsOff" };
  if (t.includes("plants")) return { text: "I'll remind you on Sunday at 9:00 to water the plants.", effect: "plantsReminder" };
  if (t.includes("quiet hours")) return { text: "Done. Quiet hours now start at 22:00. Say the word if you want them back at 22:30.", effect: "quietHours" };
  if (t.includes("mia")) return { text: "I can do that. Since it's about Mia, Sam gets a note too." };
  if (t.includes("connect") || t.includes("calendar"))
    return { text: "Sam needs to say yes on their phone first. I've sent them a request." };
  if (t.includes("what can") || t.includes("?")) return { text: "Good question. Give me a moment and I'll put the answer here." };
  return { text: "Okay, done. You'll find it in Settings if you ever want to check." };
}

/** What a group's "Ask hux" button suggests saying. */
export const askExamples: Record<string, string> = {
  people: "Let Mia ask for music in her room",
  devices: "Let the kitchen tablet speak up first",
  home: "Add the garden lights",
  ai: "Keep everything inside our home",
  helpers: "What can the Researcher do?",
  privacy: "Always ask me before turning on the car charger",
  connections: "Connect Sam's calendar",
  addons: "Find an extra for the garden",
  notifications: "Start quiet hours at 22:00",
  system: "Make a backup tonight",
};

/** Current values for settings items, so the list reads like a summary rather than a menu. */
export const settingValues: Record<string, string> = {
  "Who lives here": "Alex, Sam, Mia",
  "What each person can ask for": "Mia: no shopping or email",
  "Which device speaks up": "The one nearest you",
  "Rename or move a device": "5 devices",
  Rooms: "4 rooms",
  "Lights, plugs and the car": "6 things",
  "Which AI hux uses": "Runs at home",
  "What may leave your home": "Web searches only",
  "What each helper does": "4 helpers",
  "What hux may do on its own": "Asks before sending or paying",
  "What hux remembers": "5 things",
  "Activity history": "Kept for 30 days",
  "Connect email": "Connected",
  "Connect calendar": "Connected",
  "Connect bank": "Read only",
  "Lottery checker": "On",
  Recipes: "On",
  "Quiet hours": "22:30 to 7:00",
  "How urgent things reach you": "Phone, then speaker",
  Backup: "Last night, 3:00",
  Updates: "Up to date",
  "Language and region": "English · Berlin",
  // expert
  "Voice recognition per person": "3 voices enrolled",
  "Approval rules per person": "Default for adults",
  "Device keys and pairing history": "5 keys",
  "Forwarded AI models": "Desk PC → network",
  "Connections: Matter, Zigbee, Home Assistant, Meross, Govee": "3 active",
  "Presence sources": "Phones, router",
  "Model endpoints and trust levels": "2 endpoints · local trusted",
  "Per-helper model choice": "Researcher uses cloud",
  "Sampler presets": "Balanced",
  "Usage and cost": "€0.42 this month",
  "Action tiers per app": "4 tiers",
  "Audit log export": "JSON, CSV",
  "Stored keys": "6 keys",
  "Tool servers": "2 MCP servers",
  "Update policy": "Ask first",
  "Escalation steps": "Phone → speaker → Sam",
  "Gateway address and remote access": "hux.local:7420 · remote off",
  "Developer options": "Off",
};

export const toggleSettings: Record<string, boolean> = {
  "Kids mode for Mia": true,
};

export type Msg = Message;
