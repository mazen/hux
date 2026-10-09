// PROTOTYPE - concept 06 "Canvas": types, window catalogue and the shared store context.
import { createContext, useContext, type RefObject } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarClock, ChefHat, CloudSun, History, House, Mail, MonitorSmartphone, Newspaper, NotebookPen,
  ScanSearch, Settings2, ShoppingBasket, Timer, UsersRound,
} from "lucide-react";
import { devices, now, type Message, type MemberId, routines, memories } from "../../fixtures";

export type WinKind =
  | "recipe" | "shopping" | "email" | "weather" | "research" | "briefing" | "timer"
  | "plans" | "settings" | "home" | "devices" | "memory" | "activity" | "helpers";

export type Win = { id: WinKind; x: number; y: number; w: number; h: number; z: number; min: boolean; max: boolean };

export const META: Record<WinKind, { title: string; short: string; icon: LucideIcon; w: number; h: number; helper: string }> = {
  recipe: { title: "Spinach and feta frittata", short: "Recipe", icon: ChefHat, w: 340, h: 560, helper: "Chief" },
  shopping: { title: "Shopping list", short: "Shopping list", icon: ShoppingBasket, w: 290, h: 318, helper: "Chief" },
  email: { title: "Email to Todd", short: "Email to Todd", icon: Mail, w: 400, h: 540, helper: "Writer" },
  weather: { title: "Weather tomorrow", short: "Weather", icon: CloudSun, w: 316, h: 300, helper: "Chief" },
  research: { title: "Research: home batteries", short: "Research", icon: ScanSearch, w: 340, h: 360, helper: "Researcher" },
  briefing: { title: "Morning briefing", short: "Briefing", icon: Newspaper, w: 350, h: 470, helper: "Chief" },
  timer: { title: "Frittata timer", short: "Timer", icon: Timer, w: 270, h: 250, helper: "Chief" },
  plans: { title: "Plans", short: "Plans", icon: CalendarClock, w: 430, h: 560, helper: "Chief" },
  settings: { title: "Settings", short: "Settings", icon: Settings2, w: 470, h: 620, helper: "Chief" },
  home: { title: "Home", short: "Home", icon: House, w: 340, h: 470, helper: "Home" },
  devices: { title: "Devices", short: "Devices", icon: MonitorSmartphone, w: 370, h: 470, helper: "Chief" },
  memory: { title: "What hux remembers", short: "Memory", icon: NotebookPen, w: 390, h: 470, helper: "Chief" },
  activity: { title: "Recent activity", short: "Activity", icon: History, w: 370, h: 450, helper: "Chief" },
  helpers: { title: "Helpers", short: "Helpers", icon: UsersRound, w: 390, h: 500, helper: "Chief" },
};

export const LAUNCHERS: WinKind[] = ["plans", "home", "devices", "memory", "activity", "helpers", "settings"];

export type Approval = "pending" | "approved" | "later";
export type Msg = Message & { opens?: WinKind };
export type Routine = (typeof routines)[number] & { oneOff?: boolean };
export type Memory = (typeof memories)[number];
export type HomeThing = { on: boolean; state: string };

export type Hux = {
  expert: boolean;
  isDesk: boolean;
  // windows
  wins: Win[];
  focused: WinKind | null;
  open: (k: WinKind) => void;
  focus: (k: WinKind) => void;
  close: (k: WinKind) => void;
  minimise: (k: WinKind) => void;
  toggleMax: (k: WinKind) => void;
  move: (k: WinKind, x: number, y: number) => void;
  resize: (k: WinKind, w: number, h: number) => void;
  tidy: () => void;
  screenOf: (k: WinKind) => number;
  sendTo: (k: WinKind, device: string) => void;
  // conversation
  messages: Msg[];
  typing: boolean;
  send: (text: string) => void;
  draft: string;
  setDraft: (t: string) => void;
  askAbout: (text: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  listening: boolean;
  toggleMic: () => void;
  // data
  approval: Approval;
  setApproval: (a: Approval) => void;
  shopping: { name: string; done: boolean }[];
  toggleItem: (i: number) => void;
  addItem: (name: string) => void;
  routines: Routine[];
  toggleRoutine: (id: string) => void;
  homeState: Record<string, HomeThing>;
  toggleHome: (id: string) => void;
  mems: Memory[];
  editMem: (id: string, text: string) => void;
  removeMem: (id: string) => void;
  timer: { end: number | null; left: number };
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  settingsFocus: string | null;
  setSettingsFocus: (id: string | null) => void;
  settingVals: Record<string, string | boolean>;
  toggleSetting: (name: string) => void;
  toast: (text: string, undo?: () => void) => void;
  openPalette: () => void;
};

export const HuxCtx = createContext<Hux | null>(null);
export function useHux() {
  const c = useContext(HuxCtx);
  if (!c) throw new Error("useHux outside provider");
  return c;
}

// ---- helpers ----
const TZ = "Europe/Berlin";
export const hhmm = (iso: string | Date) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
export const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const key = (x: Date) => x.toLocaleDateString("en-CA", { timeZone: TZ });
  const tomorrow = new Date(now.getTime() + 864e5);
  if (key(d) === key(now)) return "Today";
  if (key(d) === key(tomorrow)) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
};
export const deviceName = (id: string) => devices.find((d) => d.id === id)?.name ?? id;
export const memberName = (id?: MemberId) =>
  id === "alex" ? "Alex" : id === "sam" ? "Sam" : id === "mia" ? "Mia" : "Everyone";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const cardKind: Record<string, WinKind | undefined> = {
  recipe: "recipe", shoppingList: "shopping", emailDraft: "email", weather: "weather",
};

// Plain-language example requests, one per settings group, for "Ask hux to change this".
export const askExamples: Record<string, string> = {
  people: "Let Mia ask for music in her room",
  devices: "Let the kitchen tablet answer first",
  home: "Look for new lights in the living room",
  ai: "Keep everything inside our home",
  helpers: "What can the Researcher do?",
  privacy: "Ask me before you turn off any lights",
  connections: "Connect Sam's calendar too",
  addons: "Check my lottery tickets on Saturdays too",
  notifications: "Make quiet hours start at 23:00",
  system: "Back up every night at 2:00",
};

// Current values for settings rows. Booleans render as switches.
export const initialSettingVals: Record<string, string | boolean> = {
  "Who lives here": "Alex, Sam, Mia",
  "What each person can ask for": "Adults: anything · Mia: limited",
  "Kids mode for Mia": true,
  "Voice recognition per person": true,
  "Approval rules per person": "Adults approve, Mia asks a parent",
  "Add a device": "",
  "Rename or move a device": "",
  "Which device speaks up": "The one nearest you",
  "Device keys and pairing history": "5 devices paired",
  "What each device may do": "",
  "Forwarded AI models": "None",
  Rooms: "Office, Kitchen, Living room, Driveway",
  "Lights, plugs and the car": "6 things",
  "Find new devices": "",
  "Connections: Matter, Zigbee, Home Assistant, Meross, Govee": "3 active",
  "Presence sources": "Phones, Wi-Fi",
  "Which AI hux uses": "The one at home",
  "What may leave your home": "Only web searches",
  "Model endpoints and trust levels": "2 local · 1 cloud (public only)",
  "Per-helper model choice": "",
  "Sampler presets": "Balanced",
  "Usage and cost": "€1.84 this month",
  "What each helper does": "",
  "Add a helper": "",
  "Helper personalities": "Calm, brief",
  "Tools and data each helper may use": "",
  Teams: "1 team",
  "What hux may do on its own": "Asks before sending or paying",
  "What hux remembers": "5 things",
  "Activity history": "Kept for 90 days",
  "Action tiers per app": "",
  "Custom rules": "2 rules",
  "Data labels": "",
  "Audit log export": "",
  "Connect email": "Connected",
  "Connect calendar": "Connected",
  "Connect bank": "Read only",
  "Allowed websites per service": "",
  "Stored keys": "4 keys",
  "Tool servers": "2 running",
  "Lottery checker": true,
  Recipes: true,
  "Browse more": "",
  "Permissions per extra": "",
  "Install from file": "",
  "Update policy": "Automatic",
  "Quiet hours": "22:30 to 7:00",
  "How urgent things reach you": "Phone, then speaker",
  "Escalation steps": "3 steps",
  "Per-device notification rules": "",
  Backup: "Last night, 3:00",
  Updates: "Up to date",
  "Language and region": "English · Berlin",
  "Gateway address and remote access": "hux.local · remote off",
  Logs: "",
  "Move to another computer": "",
  "Developer options": "Off",
};

// Rows that are better answered by another window.
export const settingLinks: Record<string, WinKind> = {
  "What hux remembers": "memory",
  "Activity history": "activity",
  "Add a device": "devices",
  "Rename or move a device": "devices",
  "Lights, plugs and the car": "home",
  "What each helper does": "helpers",
};

export const emailBody = (body: string) => body.replace("next week", "over coffee on Tuesday");
