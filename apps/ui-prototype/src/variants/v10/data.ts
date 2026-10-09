// PROTOTYPE - extra mock detail for concept 10 (expert layer). Everything else comes from ../../fixtures.
import { devices, household, type MemberId } from "../../fixtures";

export const deviceName = (id: string) => devices.find((d) => d.id === id)?.name ?? id;
export const member = (id?: MemberId) => household.members.find((m) => m.id === id);

/** "2026-10-09T18:05:08+02:00" -> "18:05" (string slice keeps Berlin time regardless of viewer timezone). */
export const hhmm = (iso: string) => iso.slice(11, 16);
export const hhmmss = (iso: string) => iso.slice(11, 19);

export type MsgMeta = {
  input?: "Typed" | "Voice";
  voiceMatch?: string;
  chain?: string[];
  model?: string;
  runsOn?: string;
  trust?: string;
  ms?: number;
  tokens?: number;
  tools?: string[];
};

export const msgMeta: Record<string, MsgMeta> = {
  m1: { input: "Typed" },
  m2: { chain: ["Chief"], model: "qwen3-32b-q4", runsOn: "Desk PC", trust: "Home", ms: 1140, tokens: 212 },
  m3: { input: "Voice", voiceMatch: "Alex, 97% match" },
  m4: { chain: ["Chief"], model: "qwen3-32b-q4", runsOn: "Desk PC", trust: "Home", ms: 2310, tokens: 486, tools: ["recipes.find", "memory.save"] },
  m5: { input: "Voice", voiceMatch: "Alex, 95% match" },
  m6: { chain: ["Chief"], model: "qwen3-32b-q4", runsOn: "Desk PC", trust: "Home", ms: 960, tokens: 141, tools: ["lists.add", "phone.notify", "place.remind"] },
  m7: { input: "Typed" },
  m8: { chain: ["Chief", "Researcher", "Writer"], model: "qwen3-32b-q4 + cloud-large", runsOn: "Desk PC, cloud", trust: "Public for search, Home for email", ms: 3020, tokens: 1840, tools: ["web.search ×9", "email.draft"] },
  m9: { input: "Typed" },
  m10: { chain: ["Chief", "Writer"], model: "qwen3-32b-q4", runsOn: "Desk PC", trust: "Home, asks before sending", ms: 1480, tokens: 302, tools: ["email.edit", "schedule.create", "reminder.create"] },
  m11: { input: "Typed" },
  m12: { chain: ["Chief"], model: "qwen3-8b-q5", runsOn: "Desk PC", trust: "Home", ms: 690, tokens: 96, tools: ["weather.forecast"] },
};

export const threadSteps: { helper: string; took: string }[] = [
  { helper: "Researcher", took: "4 min" },
  { helper: "Researcher", took: "2 min" },
  { helper: "Researcher", took: "1 min" },
  { helper: "Writer", took: "40 s" },
];

export type Run = { at: string; result: "ok" | "skip" | "fail"; note: string };

export const runHistory: Record<string, Run[]> = {
  j1: [
    { at: "Fri 07:00", result: "ok", note: "Kitchen tablet, phone" },
    { at: "Thu 07:00", result: "ok", note: "Kitchen tablet, phone" },
    { at: "Wed 07:00", result: "ok", note: "Kitchen tablet, phone" },
    { at: "Tue 07:00", result: "ok", note: "Phone only, tablet asleep" },
    { at: "Mon 07:00", result: "ok", note: "Kitchen tablet, phone" },
  ],
  j2: [
    { at: "Tue 22:00", result: "ok", note: "No win" },
    { at: "Fri 22:00", result: "ok", note: "No win" },
    { at: "Tue 22:00", result: "ok", note: "No win" },
    { at: "Fri 22:00", result: "ok", note: "Won €8.20, seen by Alex" },
    { at: "Tue 22:00", result: "fail", note: "Results page late, retried 22:30" },
  ],
  j3: [
    { at: "Fri 08:12", result: "ok", note: "4 lights, coffee machine" },
    { at: "Thu 08:20", result: "ok", note: "2 lights" },
    { at: "Wed 08:05", result: "skip", note: "Mia stayed home" },
    { at: "Tue 08:09", result: "ok", note: "3 lights, coffee machine" },
    { at: "Mon 08:31", result: "ok", note: "1 light" },
  ],
  j4: [],
  j5: [
    { at: "3 Oct", result: "ok", note: "Both plans ran" },
    { at: "3 Sep", result: "ok", note: "Both plans ran" },
    { at: "3 Aug", result: "fail", note: "Bank asked to sign in again" },
  ],
};

export const routineMeta: Record<string, { helper: string; runsOn: string; trigger: string }> = {
  j1: { helper: "Chief", runsOn: "Desk PC", trigger: "cron 0 7 * * 1-5" },
  j2: { helper: "Researcher", runsOn: "Desk PC", trigger: "cron 0 22 * * 2,5" },
  j3: { helper: "Home", runsOn: "Desk PC", trigger: "presence: last leaves" },
  j4: { helper: "Writer", runsOn: "Desk PC", trigger: "once 2026-10-12 07:30" },
  j5: { helper: "Chief", runsOn: "Desk PC", trigger: "cron 0 9 3 * *" },
};

export const homeMeta: Record<string, string> = {
  h1: "Zigbee",
  h2: "Zigbee",
  h3: "Matter",
  h4: "Govee",
  h5: "Meross",
  h6: "Home Assistant",
};

export const helperMeta: Record<string, { model: string; trust: string; level: number; lastJob: string }> = {
  chief: { model: "qwen3-32b-q4 · Desk PC", trust: "Home", level: 3, lastJob: "18:38 weather" },
  research: { model: "cloud-large · public tier", trust: "Public info only", level: 1, lastJob: "15:10 batteries" },
  writer: { model: "qwen3-32b-q4 · Desk PC", trust: "Home, sends after approval", level: 2, lastJob: "18:31 email edit" },
  home: { model: "qwen3-8b-q5 · Desk PC", trust: "Home", level: 3, lastJob: "08:12 lights off" },
};

export const deviceMeta: Record<string, { lastHeard?: string; detail: string }> = {
  desk: { lastHeard: "18:38", detail: "Runs 2 models · 41 °C · 3 screens" },
  kitchen: { lastHeard: "18:06", detail: "Wake word on · battery 82%" },
  phone: { detail: "Location shared · notifications on" },
  speaker: { lastHeard: "Thu 21:14", detail: "Wake word on · volume 40%" },
  buildbox: { detail: "Wakes for coding jobs" },
};

/** The value shown on the right of a settings row. `toggle` rows get a switch; `action` rows a key. */
export type SettingValue = { text?: string; toggle?: boolean; action?: string; opens?: Drawer };
export type Drawer = "devices" | "home" | "helpers" | "memory" | "activity";

export const settingValues: Record<string, SettingValue> = {
  "Who lives here": { text: "Alex, Sam, Mia" },
  "What each person can ask for": { text: "Set per person" },
  "Kids mode for Mia": { toggle: true },
  "Voice recognition per person": { text: "Alex and Sam trained" },
  "Approval rules per person": { text: "Mia always asks a parent" },
  "Add a device": { action: "Add" },
  "Rename or move a device": { text: "5 devices", opens: "devices" },
  "Which device speaks up": { text: "The one nearest you" },
  "Device keys and pairing history": { text: "5 keys · last 2 Sep" },
  "What each device may do": { text: "Per device" },
  "Forwarded AI models": { text: "Desk PC shares 2" },
  Rooms: { text: "Office, Kitchen, Living room, Driveway" },
  "Lights, plugs and the car": { text: "6 things", opens: "home" },
  "Find new devices": { action: "Search" },
  "Connections: Matter, Zigbee, Home Assistant, Meross, Govee": { text: "5 connected" },
  "Presence sources": { text: "Phones, home Wi-Fi" },
  "Which AI hux uses": { text: "At home, on Desk PC" },
  "What may leave your home": { text: "Public web searches only" },
  "Model endpoints and trust levels": { text: "3 endpoints" },
  "Per-helper model choice": { text: "Researcher uses cloud" },
  "Sampler presets": { text: "Balanced" },
  "Usage and cost": { text: "€1.84 this month" },
  "What each helper does": { text: "4 helpers", opens: "helpers" },
  "Add a helper": { action: "Add" },
  "Helper personalities": { text: "Calm, brief" },
  "Tools and data each helper may use": { text: "Per helper" },
  Teams: { text: "1 team" },
  "What hux may do on its own": { text: "Asks before sending or paying" },
  "What hux remembers": { text: "5 things", opens: "memory" },
  "Activity history": { text: "Kept 90 days", opens: "activity" },
  "Action tiers per app": { text: "4 tiers" },
  "Custom rules": { text: "2 rules" },
  "Data labels": { text: "Private, Family, Public" },
  "Audit log export": { action: "Export" },
  "Connect email": { text: "Connected" },
  "Connect calendar": { text: "Family, Work, Personal" },
  "Connect bank": { text: "Read only" },
  "Allowed websites per service": { text: "12 sites" },
  "Stored keys": { text: "4 keys" },
  "Tool servers": { text: "2 running" },
  "Lottery checker": { toggle: true },
  Recipes: { toggle: true },
  "Browse more": { action: "Browse" },
  "Permissions per extra": { text: "Per extra" },
  "Install from file": { action: "Choose file" },
  "Update policy": { text: "Automatic" },
  "Quiet hours": { text: "22:30 – 07:00" },
  "How urgent things reach you": { text: "Phone, then speaker" },
  "Escalation steps": { text: "3 steps" },
  "Per-device notification rules": { text: "Per device" },
  Backup: { text: "Last night, 03:00" },
  Updates: { text: "Up to date" },
  "Language and region": { text: "English · Berlin" },
  "Gateway address and remote access": { text: "hux.local · remote off" },
  Logs: { action: "View" },
  "Move to another computer": { action: "Start" },
  "Developer options": { toggle: false },
};

/** A natural example of what you could say for each settings group. */
export const askExamples: Record<string, string> = {
  people: "Let Mia ask for music, but not for anything that costs money",
  devices: "Only let the kitchen tablet speak up in the morning",
  home: "Call the LED strip the TV light",
  ai: "Never send anything about money outside the house",
  helpers: "Have the Writer keep my emails shorter",
  privacy: "Forget everything about the fridge after a week",
  connections: "Connect Sam's calendar too",
  addons: "Turn off the lottery checker for the holidays",
  notifications: "Make quiet hours start at 23:00 on Fridays",
  system: "Back up to the build box as well",
};
