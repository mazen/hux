// PROTOTYPE - concept 09 "Grove": local copy-on-write data and copy that the shared fixtures don't carry.
import { household, type MemberId } from "../../fixtures";

export const memberById = (id?: MemberId) => household.members.find((m) => m.id === id);

export const deviceName: Record<string, string> = {
  desk: "Desk PC",
  kitchen: "Kitchen tablet",
  phone: "Alex's phone",
  speaker: "Living room speaker",
  buildbox: "Build box",
};

/** Expert-only detail on who answered each assistant message, and with what. */
export const messageMeta: Record<string, { helper: string; model: string; trust: string }> = {
  m2: { helper: "Chief", model: "qwen3-30b-a3b · desk", trust: "local" },
  m4: { helper: "Chief", model: "qwen3-30b-a3b · desk", trust: "local" },
  m6: { helper: "Chief", model: "qwen3-30b-a3b · desk", trust: "local" },
  m8: { helper: "Writer", model: "qwen3-30b-a3b · desk", trust: "local" },
  m10: { helper: "Writer", model: "qwen3-30b-a3b · desk", trust: "local" },
  m12: { helper: "Chief", model: "qwen3-30b-a3b · desk", trust: "local" },
};

export const threadMeta = { helper: "Researcher", model: "cloud · public info only", trust: "public", took: "4 min 12 s", tokens: "38.4k tokens" };

/** Agenda placement for one-off reminders (fixtures only carry display strings). */
export const reminderAt: Record<string, string | null> = {
  r1: null,
  r2: "2026-10-16T09:00:00+02:00",
  r3: "2026-10-10T08:15:00+02:00",
  r4: "2026-10-12T17:00:00+02:00",
};

export type ItemInfo = { desc: string; ask?: string; kw?: string };

export const itemInfo: Record<string, ItemInfo> = {
  // People
  "Who lives here": { desc: "Alex, Sam and Mia. Add someone, or change what hux calls them.", ask: "Add my mum Ruth as a guest for the weekend", kw: "family members household guest person" },
  "What each person can ask for": { desc: "Sam can do everything you can. Mia can't buy things or message people outside the family.", ask: "Let Sam approve emails too", kw: "permissions allowed rights" },
  "Kids mode for Mia": { desc: "Simpler answers, no shopping and no messages outside the family.", ask: "Turn off kids mode on Saturday mornings", kw: "child children parental mia" },
  "Voice recognition per person": { desc: "Voice profiles and match confidence per member on shared speakers.", kw: "voice speaker identify" },
  "Approval rules per person": { desc: "Which actions need whose confirmation, by tier and device.", kw: "approve confirm" },
  // Devices
  "Add a device": { desc: "Phones, tablets, computers and speakers can all run hux.", ask: "Add the bedroom speaker", kw: "new pair connect phone tablet" },
  "Rename or move a device": { desc: "Tell hux which room each device is in, so it knows who's nearby.", ask: "The kitchen tablet is now in the hallway", kw: "room location name" },
  "Which device speaks up": { desc: "When hux has something to say, it uses the device nearest to you.", ask: "Never talk on the living room speaker after 21:00", kw: "voice speaker talk announce sound" },
  "Device keys and pairing history": { desc: "Node public keys, pairing dates and revocation.", kw: "security node key" },
  "What each device may do": { desc: "Capability grants per node: screen, microphone, location, workspace.", kw: "abilities capability" },
  "Forwarded AI models": { desc: "Model endpoints a node offers to the rest of the network.", kw: "model gpu" },
  // Home
  Rooms: { desc: "Office, Kitchen, Living room and Driveway.", ask: "Add a room called Mia's room", kw: "room house" },
  "Lights, plugs and the car": { desc: "Six things hux can switch on and off or check on.", ask: "Rename the LED strip to TV light", kw: "lights light lamp plug car charging switch coffee" },
  "Find new devices": { desc: "Look for new lights, plugs or sensors at home.", ask: "Look for the new hallway lamp", kw: "discover scan add lights" },
  "Connections: Matter, Zigbee, Home Assistant, Meross, Govee": { desc: "Bridges and integrations, with status and last sync.", kw: "smart home bridge lights" },
  "Presence sources": { desc: "Phone location, Wi-Fi presence and the door sensor, and how much each counts.", kw: "who is home away leave" },
  // AI
  "Which AI hux uses": { desc: "hux thinks on the computers in your home. It only goes online for public web searches.", ask: "Only use the AI at home, even for web searches", kw: "model brain cloud local think ai" },
  "What may leave your home": { desc: "Public questions can go online. Your messages, calendar and money stay here.", ask: "Never send anything about money outside our home", kw: "privacy cloud data online share" },
  "Model endpoints and trust levels": { desc: "Each endpoint, where it runs, and which data labels it may receive.", kw: "model trust" },
  "Per-helper model choice": { desc: "Pin a model to Chief, Researcher, Writer or Home.", kw: "model helper" },
  "Sampler presets": { desc: "Temperature and sampling per task type.", kw: "temperature" },
  "Usage and cost": { desc: "This month: 1.2M tokens, €3.40 cloud spend.", kw: "money cost tokens" },
  // Helpers
  "What each helper does": { desc: "Chief talks with you. Researcher looks things up. Writer drafts emails. Home switches things.", ask: "What did the Researcher do today?", kw: "assistant roles helpers" },
  "Add a helper": { desc: "Give hux a new kind of job, like planning holidays.", ask: "Add a helper that plans our holidays", kw: "new role" },
  "Helper personalities": { desc: "System prompts and tone per helper.", kw: "prompt tone" },
  "Tools and data each helper may use": { desc: "Tool and MCP grants per helper, with data labels.", kw: "tools mcp" },
  Teams: { desc: "Groups of helpers that take on longer tasks together.", kw: "team" },
  // Privacy
  "What hux may do on its own": { desc: "Lights and reminders: on its own. Emails: asks first. Payments: never.", ask: "Ask me before switching off the coffee machine", kw: "permission approve ask first allowed automatic own" },
  "What hux remembers": { desc: "Five things about your household. See, change or remove any of them.", ask: "Forget what's in the fridge", kw: "memory memories forget remember" },
  "Activity history": { desc: "Everything hux did today, and who asked for it.", ask: "What did you do this morning?", kw: "history log done activity" },
  "Action tiers per app": { desc: "Read, draft, act and pay tiers for each connected app.", kw: "tier permission" },
  "Custom rules": { desc: "Your own rules for when hux must ask first.", kw: "rule" },
  "Data labels": { desc: "Labels like Private, Family and Money decide where data may flow.", kw: "label data" },
  "Audit log export": { desc: "Download a signed log of every action.", kw: "audit log export" },
  // Connections
  "Connect email": { desc: "Connected. hux reads and drafts, and asks before sending.", ask: "Also connect Sam's email", kw: "mail inbox account email" },
  "Connect calendar": { desc: "Family, Work and Personal calendars are connected.", ask: "Add Mia's school calendar", kw: "events schedule calendar" },
  "Connect bank": { desc: "Read only. hux can see balances, never move money.", ask: "How much did we spend on groceries in September?", kw: "money account savings portfolio finance bank" },
  "Allowed websites per service": { desc: "Domains each service may reach.", kw: "domain web" },
  "Stored keys": { desc: "API keys and tokens, encrypted on the gateway.", kw: "key token secret" },
  "Tool servers": { desc: "MCP servers and the tools they expose.", kw: "mcp tool" },
  // Extras
  "Lottery checker": { desc: "Checks your 3 Eurojackpot tickets on Tuesdays and Fridays.", ask: "Add a fourth lottery ticket", kw: "eurojackpot tickets lottery" },
  Recipes: { desc: "Suggests dinners from what's in your fridge.", ask: "Only suggest vegetarian recipes on weekdays", kw: "cook food dinner recipe" },
  "Browse more": { desc: "Extras for bin collection days, plant watering, school holidays and more.", ask: "Is there an extra for bin collection days?", kw: "add install extras" },
  "Permissions per extra": { desc: "What each extra may read and do.", kw: "permission" },
  "Install from file": { desc: "Load an extra from a package file.", kw: "install" },
  "Update policy": { desc: "Update automatically, pin a version, or ask first.", kw: "update" },
  // Notifications
  "Quiet hours": { desc: "No sounds from 22:30 to 7:00, unless it's urgent.", ask: "Start quiet hours at 22:00 on weekdays", kw: "night sleep silent do not disturb mute quiet" },
  "How urgent things reach you": { desc: "Urgent things go to your phone first, then the speaker.", ask: "Ring my phone if the car stops charging", kw: "alerts urgent important notify" },
  "Escalation steps": { desc: "Order and timing: phone, then speaker after 5 min, then Sam.", kw: "escalate" },
  "Per-device notification rules": { desc: "Which device may notify, and when.", kw: "device notify" },
  // System
  Backup: { desc: "Last backup at 3:00 this morning, kept on the Desk PC.", ask: "Back up now", kw: "save restore backup" },
  Updates: { desc: "Up to date. Updates install at night.", ask: "Hold updates until next week", kw: "version upgrade update" },
  "Language and region": { desc: "English, Berlin time, 24-hour clock.", ask: "Speak German with Mia", kw: "language time zone date format german" },
  "Gateway address and remote access": { desc: "hux.home.arpa:8443 · remote access through relay.", kw: "network remote address" },
  Logs: { desc: "Gateway and node logs from the last 7 days.", kw: "log debug" },
  "Move to another computer": { desc: "Move the gateway and all its data to new hardware.", kw: "migrate move" },
  "Developer options": { desc: "Debug endpoints, protocol traces and feature flags.", kw: "developer debug" },
};

export const groupKw: Record<string, string> = {
  people: "family person members kids",
  devices: "tablet phone speaker computer",
  home: "lights smart home plugs car",
  ai: "model brain think",
  helpers: "roles assistant",
  privacy: "permissions security memory",
  connections: "email calendar bank accounts",
  addons: "extras plugins apps",
  notifications: "alerts quiet sounds",
  system: "backup update language",
};

export const homeKw: Record<string, string> = {
  light: "light lights lamp",
  plug: "plug socket power coffee",
  car: "car charging ev battery",
};

export const routineKw: Record<string, string> = {
  j1: "morning briefing weather news",
  j2: "lottery eurojackpot tickets",
  j3: "lights leave away coffee",
  j4: "email todd send battery",
  j5: "savings money bank",
};

export const memberColor = (id?: MemberId) => memberById(id)?.color ?? "var(--ink-3)";
