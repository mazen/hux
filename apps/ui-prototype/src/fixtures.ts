// PROTOTYPE - shared mock data for all UI concepts. Read-only; variants copy into local state if they mutate.
// "Now" for every concept is Friday 9 October 2026, 18:40, Berlin time.

export const now = new Date("2026-10-09T18:40:00+02:00");

export type MemberId = "alex" | "sam" | "mia";

export const household = {
  name: "Home",
  assistantName: "hux",
  members: [
    { id: "alex" as MemberId, name: "Alex", role: "Owner", initials: "A", color: "#E07A5F" },
    { id: "sam" as MemberId, name: "Sam", role: "Adult", initials: "S", color: "#3D7EA6" },
    { id: "mia" as MemberId, name: "Mia", role: "Child", initials: "M", color: "#81B29A" },
  ],
  currentMember: "alex" as MemberId,
};

// Devices hux runs on (Nodes) and what each can do.
export const devices = [
  { id: "desk", name: "Desk PC", kind: "desktop", place: "Office", online: true, abilities: ["screen", "keyboard", "microphone", "speaker"], screens: 3, note: "You're here" },
  { id: "kitchen", name: "Kitchen tablet", kind: "tablet", place: "Kitchen", online: true, abilities: ["screen", "touch", "microphone", "speaker"], screens: 1 },
  { id: "phone", name: "Alex's phone", kind: "phone", place: "With Alex", online: true, abilities: ["screen", "touch", "notifications", "location"], screens: 1 },
  { id: "speaker", name: "Living room speaker", kind: "speaker", place: "Living room", online: true, abilities: ["microphone", "speaker"], screens: 0 },
  { id: "buildbox", name: "Build box", kind: "server", place: "Basement", online: false, abilities: ["workspace"], screens: 0, note: "Asleep since 14:02" },
];

// The main Conversation. `card` = a generated UI element shown inline.
export type Card =
  | { type: "recipe"; title: string; time: string; serves: number; have: string[]; need: string[]; steps: string[] }
  | { type: "shoppingList"; title: string; items: { name: string; done: boolean }[]; sentTo: string }
  | { type: "emailDraft"; to: string; subject: string; body: string; status: string }
  | { type: "weather"; place: string; now: string; temp: number; high: number; low: number; hourly: { time: string; temp: number; rain: number }[] }
  | { type: "portfolio"; date: string; total: string; change: string; changePct: string; lines: { name: string; value: string; change: string }[]; note: string }
  | { type: "approval"; action: string; detail: string; when: string };

export type Message = {
  id: string;
  from: "member" | "assistant";
  member?: MemberId;
  at: string; // ISO
  device: string; // device id it was said on
  text: string;
  card?: Card;
  thread?: { title: string; steps: string[]; status: "done" | "running" };
};

export const conversation: Message[] = [
  { id: "m1", from: "member", member: "alex", at: "2026-10-09T17:52:00+02:00", device: "desk", text: "What could I cook tonight? Something quick, I'm tired." },
  { id: "m2", from: "assistant", at: "2026-10-09T17:52:10+02:00", device: "desk", text: "A few quick ideas: lemon garlic pasta, a vegetable frittata, or chickpea curry. If you tell me what's in the fridge, I'll pick the one that fits." },
  { id: "m3", from: "member", member: "alex", at: "2026-10-09T18:05:00+02:00", device: "kitchen", text: "I've got eggs, half a courgette, spinach, feta and some cherry tomatoes." },
  {
    id: "m4", from: "assistant", at: "2026-10-09T18:05:08+02:00", device: "kitchen",
    text: "Frittata it is. You have almost everything. I've noted what's in your fridge.",
    card: {
      type: "recipe", title: "Spinach and feta frittata", time: "25 min", serves: 2,
      have: ["6 eggs", "Half a courgette", "Spinach", "Feta", "Cherry tomatoes"],
      need: ["Milk (a splash)", "Fresh basil"],
      steps: [
        "Heat the oven grill. Slice the courgette thinly and soften it in an ovenproof pan for 4 minutes.",
        "Add the spinach and let it wilt.",
        "Whisk the eggs with a splash of milk, salt and pepper. Pour into the pan.",
        "Scatter feta and halved tomatoes on top. Cook on low heat for 6 minutes.",
        "Finish under the grill for 3 minutes until set and golden.",
      ],
    },
  },
  { id: "m5", from: "member", member: "alex", at: "2026-10-09T18:06:00+02:00", device: "kitchen", text: "Put the milk and basil on my shopping list and send it to my phone." },
  {
    id: "m6", from: "assistant", at: "2026-10-09T18:06:04+02:00", device: "kitchen",
    text: "Done. I'll remind you when you're at the supermarket.",
    card: { type: "shoppingList", title: "Shopping list", sentTo: "Alex's phone", items: [{ name: "Milk", done: false }, { name: "Fresh basil", done: false }, { name: "Coffee beans", done: false }, { name: "Dish soap", done: true }] },
  },
  {
    id: "m7", from: "member", member: "alex", at: "2026-10-09T18:20:00+02:00", device: "desk",
    text: "Can you show me the email to Todd from this afternoon?",
  },
  {
    id: "m8", from: "assistant", at: "2026-10-09T18:20:05+02:00", device: "desk",
    text: "Here's the draft. I looked at four home battery options and summarised the two that fit your roof and budget.",
    thread: { title: "Research: home batteries", status: "done", steps: ["Read 9 sources", "Compared 4 systems", "Checked local installer prices", "Drafted summary for Todd"] },
    card: {
      type: "emailDraft", to: "Todd Becker", subject: "Home battery options for the garage",
      body: "Hi Todd,\n\nAs promised, a short summary of what I found. Two systems make sense for us: a 10 kWh battery that pairs with the existing inverter, or a modular 7.5 kWh one we could extend later. The first is about €1,200 more but needs no extra hardware.\n\nHappy to talk it through next week.\n\nBest,\nAlex",
      status: "Draft",
    },
  },
  { id: "m9", from: "member", member: "alex", at: "2026-10-09T18:31:00+02:00", device: "desk", text: "Change \"next week\" to \"over coffee on Tuesday\". Send it Monday morning before work, and remind me on Friday to follow up." },
  {
    id: "m10", from: "assistant", at: "2026-10-09T18:31:06+02:00", device: "desk",
    text: "Updated. It will go out Monday at 7:30. Please confirm the exact email once, then I won't ask again.",
    card: { type: "approval", action: "Send email to Todd Becker", detail: "\"Home battery options for the garage\", 98 words, no attachments", when: "Monday 12 Oct, 7:30" },
  },
  { id: "m11", from: "member", member: "alex", at: "2026-10-09T18:38:00+02:00", device: "desk", text: "What's the weather tomorrow?" },
  {
    id: "m12", from: "assistant", at: "2026-10-09T18:38:03+02:00", device: "desk",
    text: "Dry until mid-afternoon, then light rain. Good morning for a bike ride.",
    card: { type: "weather", place: "Berlin", now: "Partly cloudy", temp: 13, high: 16, low: 8, hourly: [{ time: "8", temp: 9, rain: 0 }, { time: "11", temp: 13, rain: 0 }, { time: "14", temp: 16, rain: 10 }, { time: "17", temp: 14, rain: 60 }, { time: "20", temp: 11, rain: 40 }] },
  },
];

// Things the assistant suggests next (shown as quick replies or prompts).
export const suggestions = ["Start the frittata timer", "Read me the recipe step by step", "What's on tomorrow?", "Turn off the office lights"];

// Reminders, one-off.
export const reminders = [
  { id: "r1", title: "Buy milk and basil", when: "When you're at the supermarket", whenKind: "place", for: "alex" as MemberId, source: "Shopping list" },
  { id: "r2", title: "Follow up with Todd about the battery", when: "Fri 16 Oct, 9:00", whenKind: "time", for: "alex" as MemberId },
  { id: "r3", title: "Mia's swimming bag", when: "Tomorrow, 8:15", whenKind: "time", for: "sam" as MemberId },
  { id: "r4", title: "Return the library books", when: "Mon 12 Oct, 17:00", whenKind: "time", for: "mia" as MemberId },
];

// Calendar (read from a connected calendar).
export const calendar = [
  { id: "c1", title: "Swimming lesson (Mia)", start: "2026-10-10T09:00:00+02:00", end: "2026-10-10T10:00:00+02:00", calendar: "Family" },
  { id: "c2", title: "Lunch with Sam's parents", start: "2026-10-11T12:30:00+02:00", end: "2026-10-11T15:00:00+02:00", calendar: "Family" },
  { id: "c3", title: "Team stand-up", start: "2026-10-12T09:30:00+02:00", end: "2026-10-12T09:45:00+02:00", calendar: "Work" },
  { id: "c4", title: "Coffee with Todd", start: "2026-10-13T10:00:00+02:00", end: "2026-10-13T10:30:00+02:00", calendar: "Work" },
  { id: "c5", title: "Dentist", start: "2026-10-14T16:00:00+02:00", end: "2026-10-14T16:45:00+02:00", calendar: "Personal" },
];

// Things hux does on its own, on a schedule or when something happens.
export const routines = [
  { id: "j1", title: "Morning briefing", detail: "Weather, calendar and your portfolio", when: "Weekdays at 7:00", where: "Kitchen tablet and phone", enabled: true, lastRun: "Today 7:00", nextRun: "Mon 7:00" },
  { id: "j2", title: "Check lottery tickets", detail: "3 Eurojackpot tickets. Tells you right away if one wins, and keeps reminding you until you've seen it.", when: "Tuesdays and Fridays at 22:00", where: "Phone, then speaker", enabled: true, lastRun: "Tue 22:00 · no win", nextRun: "Today 22:00" },
  { id: "j3", title: "Lights off when everyone leaves", detail: "Turns off all lights and the coffee machine plug", when: "When the last person leaves home", where: "Home", enabled: true, lastRun: "Today 8:12", nextRun: "When everyone leaves" },
  { id: "j4", title: "Send email to Todd", detail: "Home battery options for the garage", when: "Mon 12 Oct at 7:30", where: "Email", enabled: true, lastRun: "Never", nextRun: "Mon 7:30", oneOff: true },
  { id: "j5", title: "Savings plan check", detail: "Checks that this month's savings plans went through", when: "3rd of every month", where: "Phone", enabled: false, lastRun: "3 Oct · all fine", nextRun: "Paused" },
];

export const portfolioBriefing: Card = {
  type: "portfolio", date: "Fri 9 Oct", total: "€48,210", change: "+€312", changePct: "+0.65%",
  lines: [
    { name: "World ETF", value: "€31,480", change: "+0.8%" },
    { name: "Emerging markets ETF", value: "€6,920", change: "+0.4%" },
    { name: "Savings account", value: "€9,810", change: "±0" },
  ],
  note: "Both savings plans ran on the 3rd as usual.",
};

// Home devices hux can see and control.
export const home = [
  { id: "h1", name: "Office lights", place: "Office", kind: "light", state: "On · 70%" },
  { id: "h2", name: "Kitchen lights", place: "Kitchen", kind: "light", state: "On" },
  { id: "h3", name: "Living room lamp", place: "Living room", kind: "light", state: "Off" },
  { id: "h4", name: "LED strip", place: "Living room", kind: "light", state: "Off" },
  { id: "h5", name: "Coffee machine", place: "Kitchen", kind: "plug", state: "Off" },
  { id: "h6", name: "Car", place: "Driveway", kind: "car", state: "Charging · 64%" },
];

// Recent things hux did, for "what have you been up to?".
export const activity = [
  { id: "a1", at: "18:31", text: "Scheduled the email to Todd for Monday 7:30", who: "alex" as MemberId, needsYou: true },
  { id: "a2", at: "18:06", text: "Sent the shopping list to Alex's phone", who: "alex" as MemberId },
  { id: "a3", at: "18:05", text: "Remembered what's in the fridge", who: "alex" as MemberId },
  { id: "a4", at: "15:10", text: "Researched home batteries (9 sources)", who: "alex" as MemberId },
  { id: "a5", at: "08:12", text: "Turned off 4 lights and the coffee machine after everyone left", who: undefined },
  { id: "a6", at: "07:00", text: "Sent the morning briefing", who: undefined },
];

// What hux remembers about the current member. Each item is visible and editable.
export const memories = [
  { id: "k1", text: "Prefers quick vegetarian dinners on weekdays", learned: "From conversations", about: "alex" as MemberId },
  { id: "k2", text: "Works from home on Mondays and Fridays", learned: "You told me", about: "alex" as MemberId },
  { id: "k3", text: "Todd Becker is a colleague, writes informally", learned: "From email", about: "alex" as MemberId },
  { id: "k4", text: "In the fridge: eggs, spinach, feta, cherry tomatoes", learned: "Today, kitchen", about: undefined },
  { id: "k5", text: "Mia has swimming on Saturdays at 9:00", learned: "From the family calendar", about: "mia" as MemberId },
];

// Settings, grouped. `simple` = shown in simple mode; expert-only fields are listed separately.
export const settingsGroups = [
  {
    id: "people", title: "People", summary: "Alex, Sam and Mia",
    simple: ["Who lives here", "What each person can ask for", "Kids mode for Mia"],
    expert: ["Voice recognition per person", "Approval rules per person"],
  },
  {
    id: "devices", title: "Devices", summary: "4 connected, 1 asleep",
    simple: ["Add a device", "Rename or move a device", "Which device speaks up"],
    expert: ["Device keys and pairing history", "What each device may do", "Forwarded AI models"],
  },
  {
    id: "home", title: "Home", summary: "6 things in 4 rooms",
    simple: ["Rooms", "Lights, plugs and the car", "Find new devices"],
    expert: ["Connections: Matter, Zigbee, Home Assistant, Meross, Govee", "Presence sources"],
  },
  {
    id: "ai", title: "AI models", summary: "Running on this network",
    simple: ["Which AI hux uses", "What may leave your home"],
    expert: ["Model endpoints and trust levels", "Per-helper model choice", "Sampler presets", "Usage and cost"],
  },
  {
    id: "helpers", title: "Helpers", summary: "Chief, Researcher, Writer, Home",
    simple: ["What each helper does", "Add a helper"],
    expert: ["Helper personalities", "Tools and data each helper may use", "Teams"],
  },
  {
    id: "privacy", title: "Privacy and permissions", summary: "Asks before sending or paying",
    simple: ["What hux may do on its own", "What hux remembers", "Activity history"],
    expert: ["Action tiers per app", "Custom rules", "Data labels", "Audit log export"],
  },
  {
    id: "connections", title: "Accounts and services", summary: "Email, calendar, bank (read only)",
    simple: ["Connect email", "Connect calendar", "Connect bank"],
    expert: ["Allowed websites per service", "Stored keys", "Tool servers"],
  },
  {
    id: "addons", title: "Extras", summary: "3 installed",
    simple: ["Lottery checker", "Recipes", "Browse more"],
    expert: ["Permissions per extra", "Install from file", "Update policy"],
  },
  {
    id: "notifications", title: "Notifications", summary: "Quiet 22:30 to 7:00",
    simple: ["Quiet hours", "How urgent things reach you"],
    expert: ["Escalation steps", "Per-device notification rules"],
  },
  {
    id: "system", title: "System", summary: "Up to date",
    simple: ["Backup", "Updates", "Language and region"],
    expert: ["Gateway address and remote access", "Logs", "Move to another computer", "Developer options"],
  },
];

// The helpers (Roles). Plain-language names in the UI.
export const helpers = [
  { id: "chief", name: "Chief", does: "Talks with you and hands work to the others", model: "On this network", canDo: ["Remember things", "Make reminders", "Ask other helpers"] },
  { id: "research", name: "Researcher", does: "Looks things up on the web", model: "Cloud (public info only)", canDo: ["Search the web", "Read web pages"] },
  { id: "writer", name: "Writer", does: "Drafts and sends emails and messages", model: "On this network", canDo: ["Read your email", "Draft emails", "Send (asks first)"] },
  { id: "home", name: "Home", does: "Lights, plugs and the car", model: "On this network", canDo: ["Switch lights and plugs", "See who's home"] },
];
