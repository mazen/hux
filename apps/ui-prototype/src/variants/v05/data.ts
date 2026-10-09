// PROTOTYPE concept 05 "River": turns fixtures into one stream of moments on a timeline.
import { calendar, conversation, household, portfolioBriefing, reminders, routines, type Card, type MemberId, type Message } from "../../fixtures";

export type Kind = "talk" | "reminder" | "routine" | "calendar";
export type EntryKind = Kind | "ambient";

export const KINDS: { id: Kind; label: string; color: string }[] = [
  { id: "talk", label: "Conversation", color: "var(--talk)" },
  { id: "reminder", label: "Reminders", color: "var(--rem)" },
  { id: "routine", label: "Routines", color: "var(--rout)" },
  { id: "calendar", label: "Calendar", color: "var(--cal)" },
];
export const kindColor = (k: EntryKind) => (k === "ambient" ? "var(--muted)" : KINDS.find((x) => x.id === k)!.color);

export type Entry =
  | { id: string; at: Date; kind: "talk"; type: "message"; msg: Message }
  | { id: string; at: Date; kind: "talk"; type: "typing" }
  | { id: string; at: Date; kind: Kind; type: "done"; title: string; detail?: string; routineId?: string; card?: Card; helper?: string; device?: string }
  | { id: string; at: Date; kind: "routine"; type: "routine"; routineId: string }
  | { id: string; at: Date; kind: "reminder"; type: "reminder"; title: string; for: MemberId; source?: string }
  | { id: string; at: Date; end: Date; kind: "calendar"; type: "event"; title: string; calendar: string }
  | { id: string; at: Date; kind: "ambient"; type: "ambient"; title: string; detail?: string; icon: "quiet" | "rain" };

const TZ = "Europe/Berlin";
export const t = (day: number, hm: string) => new Date(`2026-10-${String(day).padStart(2, "0")}T${hm}:00+02:00`);

const fmtTime = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", timeZone: TZ });
const fmtSecs = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: TZ });
const fmtKey = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TZ });
export const time = (d: Date) => fmtTime.format(d);
export const timeSecs = (d: Date) => fmtSecs.format(d);
export const dayKey = (d: Date) => fmtKey.format(d);

export type Day = { key: string; date: Date; weekday: string; short: string; num: number; month: string; rel?: string; week: 0 | 1 };

// Two calendar weeks: this one (Mon 5 to Sun 11) and next (Mon 12 to Sun 18).
export const DAYS: Day[] = Array.from({ length: 14 }, (_, i) => {
  const num = 5 + i;
  const date = t(num, "12:00");
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: TZ }).format(date);
  return {
    key: dayKey(date), date, weekday, short: weekday.slice(0, 3), num, month: "October",
    rel: num === 9 ? "Today" : num === 10 ? "Tomorrow" : num === 8 ? "Yesterday" : undefined,
    week: i < 7 ? 0 : 1,
  };
});
export const TODAY_KEY = dayKey(t(9, "12:00"));

export const memberName = (id: MemberId) => household.members.find((m) => m.id === id)!.name;
export const memberColor = (id: MemberId) => household.members.find((m) => m.id === id)!.color;
export const routineById = (id: string) => routines.find((r) => r.id === id)!;

// Which helper did the work, for expert mode.
export function helperFor(m: Message) {
  if (m.card?.type === "emailDraft" || m.card?.type === "approval") return "Writer";
  if (/lights/i.test(m.text) && m.from === "assistant") return "Home";
  return "Chief";
}

export const updatedEmailBody = (body: string) => body.replace("next week", "over coffee on Tuesday");

export function buildEntries(opts: { messages: Message[]; typing: boolean; extra: Entry[]; quietStart: string }): Entry[] {
  const e: Entry[] = [];

  // What hux did earlier this week.
  for (const day of [5, 6, 7, 8]) {
    e.push({ id: `brief-${day}`, at: t(day, "07:00"), kind: "routine", type: "done", routineId: "j1", title: "Morning briefing", detail: "Sent to the kitchen tablet and phone" });
  }
  e.push({ id: "lotto-6", at: t(6, "22:00"), kind: "routine", type: "done", routineId: "j2", title: "Checked lottery tickets", detail: "No win this time" });
  e.push({ id: "lights-7", at: t(7, "08:04"), kind: "routine", type: "done", routineId: "j3", title: "Lights off when everyone left", detail: "Turned off 3 lights" });

  // Today, before the conversation.
  e.push({ id: "brief-9", at: t(9, "07:00"), kind: "routine", type: "done", routineId: "j1", title: "Morning briefing", detail: "Weather, calendar and your portfolio", card: portfolioBriefing, device: "Kitchen tablet and phone" });
  e.push({ id: "lights-9", at: t(9, "08:12"), kind: "routine", type: "done", routineId: "j3", title: "Lights off when everyone left", detail: "Turned off 4 lights and the coffee machine" });
  e.push({ id: "research", at: t(9, "15:10"), kind: "talk", type: "done", title: "Looked into home batteries", detail: "Read 9 sources for your email to Todd", helper: "Researcher", device: "Desk PC" });

  for (const m of opts.messages) e.push({ id: m.id, at: new Date(m.at), kind: "talk", type: "message", msg: m });
  if (opts.typing) e.push({ id: "typing", at: t(9, "18:40"), kind: "talk", type: "typing" });

  // Ahead.
  e.push({ id: "j2-9", at: t(9, "22:00"), kind: "routine", type: "routine", routineId: "j2" });
  e.push({ id: "quiet", at: t(9, opts.quietStart), kind: "ambient", type: "ambient", icon: "quiet", title: "Quiet hours", detail: "Only urgent things until 7:00" });
  e.push({ id: "rain-10", at: t(10, "15:00"), kind: "ambient", type: "ambient", icon: "rain", title: "Light rain likely", detail: "Dry until then" });
  for (const day of [12, 13, 14, 15, 16]) e.push({ id: `j1-${day}`, at: t(day, "07:00"), kind: "routine", type: "routine", routineId: "j1" });
  e.push({ id: "j4", at: t(12, "07:30"), kind: "routine", type: "routine", routineId: "j4" });
  e.push({ id: "j2-13", at: t(13, "22:00"), kind: "routine", type: "routine", routineId: "j2" });
  e.push({ id: "j2-16", at: t(16, "22:00"), kind: "routine", type: "routine", routineId: "j2" });

  const reminderTimes: Record<string, Date> = { r2: t(16, "09:00"), r3: t(10, "08:15"), r4: t(12, "17:00") };
  for (const r of reminders) {
    const at = reminderTimes[r.id];
    if (at) e.push({ id: r.id, at, kind: "reminder", type: "reminder", title: r.title, for: r.for });
  }
  for (const c of calendar) e.push({ id: c.id, at: new Date(c.start), end: new Date(c.end), kind: "calendar", type: "event", title: c.title, calendar: c.calendar });

  e.push(...opts.extra);
  return e.sort((a, b) => a.at.getTime() - b.at.getTime());
}

// Canned replies for the prototype. A real hux lets the model decide; this only fakes it.
export type Reply = { text: string; effect?: "timer" | "officeLightsOff" | "quiet22" };
export function replyFor(input: string): Reply {
  const s = input.toLowerCase();
  if (s.includes("timer")) return { text: "Timer set for 25 minutes on the kitchen tablet. I'll call you at 19:05.", effect: "timer" };
  if (s.includes("step by step") || s.includes("recipe")) return { text: "Step 1 of 5: heat the oven grill. Slice the courgette thinly and soften it in an ovenproof pan for 4 minutes. Say \"next\" when you're ready." };
  if (s.includes("tomorrow")) return { text: "Saturday starts with Mia's swimming at 9:00. Sam has a reminder for the swimming bag at 8:15. Dry until mid-afternoon, then light rain." };
  if (s.includes("office lights")) return { text: "The office lights are off.", effect: "officeLightsOff" };
  if (s.includes("quiet hours")) return { text: "Done. Quiet hours now start at 22:00 and end at 7:00.", effect: "quiet22" };
  if (s.includes("lottery")) return { text: "Done. I'll check your tickets on Saturdays too, at 22:00." };
  if (s.includes("forget")) return { text: "All right. I'll forget what's in the fridge tomorrow morning." };
  if (s.includes("sam's calendar")) return { text: "I've sent Sam a request to connect their calendar. I'll let you know when it's done." };
  if (s.includes("this network")) return { text: "Done. Everything stays on this network now, including web searches. Some answers may take a little longer." };
  return { text: "Got it. Anything with a time will show up below Now." };
}
