// PROTOTYPE concept 03 - local copy, canned replies and setting values.
import { devices, household, type MemberId } from "../../fixtures";

export function hhmm(iso: string) {
  return iso.slice(11, 16);
}

export function memberName(id?: MemberId | string) {
  return household.members.find((m) => m.id === id)?.name ?? "Everyone";
}

export function deviceName(id: string) {
  return devices.find((d) => d.id === id)?.name ?? id;
}

/** Canned replies for the prototype. In the product the model interprets; this only fakes it. */
export function replyFor(text: string): { text: string; effect?: "officeLightsOff" } {
  const t = text.toLowerCase();
  if (t.includes("timer")) return { text: "Timer set for 25 minutes on the kitchen tablet. I'll call you when it's time for the grill." };
  if (t.includes("step by step") || t.includes("read me")) return { text: "I'll read it on the kitchen tablet. Step 1: heat the oven grill, slice the courgette thinly and soften it in an ovenproof pan for 4 minutes. Say \"next\" when you're ready." };
  if (t.includes("tomorrow") || t.includes("what's on")) return { text: "Tomorrow at 9:00 Mia has her swimming lesson. Sam has a reminder for the swimming bag at 8:15. Dry until mid-afternoon." };
  if (t.includes("office lights") || (t.includes("lights") && t.includes("off"))) return { text: "Office lights are off.", effect: "officeLightsOff" };
  if (t.startsWith("change") || t.includes("setting")) return { text: "I can do that. I've noted the change; you'll find it in Settings, and you can undo it there." };
  return { text: "Got it. I'll take care of that and tell you here when it's done." };
}

/** Current value for every setting item, as a short phrase. `toggle` items get a switch. */
export const settingValues: Record<string, { value: string; toggle?: boolean; on?: boolean; hint?: string }> = {
  "Who lives here": { value: "Alex, Sam, Mia", hint: "Three people. Alex manages the household." },
  "What each person can ask for": { value: "Adults: anything · Mia: limited", hint: "Mia can ask about homework, music and timers. Nothing that sends or buys." },
  "Kids mode for Mia": { value: "On", toggle: true, on: true, hint: "Simpler answers, no web shopping, quiet after 20:00." },
  "Voice recognition per person": { value: "Alex and Sam", hint: "hux recognises who is speaking on the kitchen tablet and speaker." },
  "Approval rules per person": { value: "Sending and paying ask Alex" },

  "Add a device": { value: "Phone, tablet or computer", hint: "Open hux on the new device and enter the six-digit code shown here." },
  "Rename or move a device": { value: "5 devices" },
  "Which device speaks up": { value: "The one nearest you", hint: "If nobody is near a screen, the living room speaker." },
  "Device keys and pairing history": { value: "5 keys · last paired 2 Sep" },
  "What each device may do": { value: "Kitchen tablet: no email" },
  "Forwarded AI models": { value: "Build box (asleep)" },

  Rooms: { value: "Office, Kitchen, Living room, Driveway" },
  "Lights, plugs and the car": { value: "6 things" },
  "Find new devices": { value: "Last search 3 days ago" },
  "Connections: Matter, Zigbee, Home Assistant, Meross, Govee": { value: "3 of 5 in use" },
  "Presence sources": { value: "Phones and router" },

  "Which AI hux uses": { value: "At home, on this network", hint: "Your conversations are handled by a computer in your home." },
  "What may leave your home": { value: "Public web searches only", hint: "Anything personal stays here. Only searches like \"home battery prices\" go out." },
  "Model endpoints and trust levels": { value: "2 endpoints · 1 local, 1 cloud" },
  "Per-helper model choice": { value: "Researcher uses cloud" },
  "Sampler presets": { value: "Balanced" },
  "Usage and cost": { value: "€1.84 this month" },

  "What each helper does": { value: "Chief, Researcher, Writer, Home" },
  "Add a helper": { value: "For example: a helper for school emails" },
  "Helper personalities": { value: "Calm, brief" },
  "Tools and data each helper may use": { value: "12 tools" },
  Teams: { value: "1 team" },

  "What hux may do on its own": { value: "Asks before sending or paying", hint: "Reminders, lights and lists: on its own. Emails and money: always asks." },
  "What hux remembers": { value: "5 things about this household" },
  "Activity history": { value: "Kept for 90 days" },
  "Action tiers per app": { value: "4 tiers" },
  "Custom rules": { value: "2 rules" },
  "Data labels": { value: "Health, Money, Kids" },
  "Audit log export": { value: "Last export: never" },

  "Connect email": { value: "Alex's mail · connected" },
  "Connect calendar": { value: "Family, Work, Personal" },
  "Connect bank": { value: "Read only", hint: "hux can see balances. It can never move money." },
  "Allowed websites per service": { value: "Bank: 1 site" },
  "Stored keys": { value: "3 keys" },
  "Tool servers": { value: "2 running" },

  "Lottery checker": { value: "On · Tue and Fri", toggle: true, on: true },
  Recipes: { value: "On", toggle: true, on: true },
  "Browse more": { value: "24 extras available" },
  "Permissions per extra": { value: "Recipes: reads fridge notes" },
  "Install from file": { value: "Not allowed", toggle: true, on: false },
  "Update policy": { value: "Automatic" },

  "Quiet hours": { value: "22:30 to 7:00", toggle: true, on: true, hint: "Only urgent things come through, on your phone." },
  "How urgent things reach you": { value: "Phone, then speaker" },
  "Escalation steps": { value: "3 steps over 10 minutes" },
  "Per-device notification rules": { value: "2 rules" },

  Backup: { value: "Last night, 03:00" },
  Updates: { value: "Up to date" },
  "Language and region": { value: "English · Berlin" },
  "Gateway address and remote access": { value: "hux.local · remote off" },
  Logs: { value: "Normal detail" },
  "Move to another computer": { value: "Takes about 20 minutes" },
  "Developer options": { value: "Off", toggle: true, on: false },
};
