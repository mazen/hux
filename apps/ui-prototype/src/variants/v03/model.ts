// PROTOTYPE - "Layers": state, placement rules and the keyword interpreter for concept 03.
// Two depths: the background (kept widgets, arranged along four edges) and one focus slot in front.

export type Zone = "top" | "left" | "right" | "bottom";
export const ZONES: Zone[] = ["top", "left", "right", "bottom"];
export const ZONE_WORD: Record<Zone, string> = { top: "along the top", left: "on the left", right: "on the right", bottom: "along the bottom" };

export type Size = "s" | "m" | "l";
export type Kind = "weather" | "today" | "shopping" | "ideas" | "recipe" | "timer" | "email" | "week" | "schedule" | "settings";

export type Widget = {
  id: string;
  kind: Kind;
  size: Size;
  bornAt: string;
  keptAt?: string;
  timer?: { minutes: number; endsAt: number | null; left: number };
  step?: number;
  done?: string[];
};

export type Bg = Record<Zone, string[]>;
export type Layout = { name: string; bg: Bg; widgets: Record<string, Widget> };
export type Exchange = { id: string; you: string; hux: string; at: string; helper: string };

export type SurfaceId = "kitchen" | "phone" | "speaker";
export const SURFACES: { id: SurfaceId; name: string; short: string; shared: boolean; screen: boolean }[] = [
  { id: "kitchen", name: "Kitchen tablet", short: "Kitchen", shared: true, screen: true },
  { id: "phone", name: "Alex's phone", short: "Phone", shared: false, screen: true },
  { id: "speaker", name: "Living room speaker", short: "Speaker", shared: true, screen: false },
];
export const surfaceName = (id: SurfaceId) => SURFACES.find((x) => x.id === id)!.name;
export type Away = { id: string; from?: { zone: Zone; index: number } };
export const isPrivate = (k: Kind) => k === "email";

export type State = {
  widgets: Record<string, Widget>;
  /** Widgets that left with a layout switch; they keep their state (a timer keeps running) for when the layout returns. */
  parked: Record<string, Widget>;
  bg: Bg;
  elsewhere: Record<SurfaceId, Away[]>;
  confirm: { id: string; to: SurfaceId } | null;
  focus: { id: string; from?: { zone: Zone; index: number } } | null;
  layouts: Layout[];
  active: string;
  emailBody: string;
  approved: boolean;
  routinesOn: Record<string, boolean>;
  log: Exchange[];
};

export const TITLE: Record<Kind, string> = {
  weather: "Weather",
  today: "Today",
  shopping: "Shopping list",
  ideas: "Ideas for tonight",
  recipe: "Spinach and feta frittata",
  timer: "Timer",
  email: "Email to Todd",
  week: "Next week",
  schedule: "Schedule",
  settings: "Settings",
};
const NOUN: Record<Kind, string> = {
  weather: "the weather", today: "today", shopping: "the shopping list", ideas: "the ideas", recipe: "the recipe",
  timer: "the timer", email: "the email", week: "next week", schedule: "your schedule", settings: "settings",
};
export const noun = (k: Kind) => NOUN[k];
export const canKeep = (k: Kind) => k !== "schedule" && k !== "settings";

const DEFAULT_SIZE: Record<Kind, Size> = {
  weather: "s", today: "m", shopping: "m", ideas: "m", recipe: "m", timer: "m", email: "l", week: "l", schedule: "l", settings: "l",
};

export function make(kind: Kind, at: string, extra: Partial<Widget> = {}): Widget {
  return { id: kind, kind, size: DEFAULT_SIZE[kind], bornAt: at, ...extra };
}

const emptyBg = (): Bg => ({ top: [], left: [], right: [], bottom: [] });
const cloneBg = (bg: Bg): Bg => ({ top: [...bg.top], left: [...bg.left], right: [...bg.right], bottom: [...bg.bottom] });

export function zoneOf(bg: Bg, id: string): { zone: Zone; index: number } | undefined {
  for (const z of ZONES) {
    const i = bg[z].indexOf(id);
    if (i >= 0) return { zone: z, index: i };
  }
}

/** Where "keep it" goes when no spot is named: the emptiest edge, preferring the sides. */
export function emptiestZone(bg: Bg): Zone {
  const order: Zone[] = ["right", "left", "top", "bottom"];
  return order.reduce((best, z) => (bg[z].length < bg[best].length ? z : best), order[0]);
}

export function initialState(emailBody: string): State {
  const at = "18:12";
  const widgets: Record<string, Widget> = {
    weather: make("weather", at, { keptAt: at, size: "m" }),
    today: make("today", at, { keptAt: at }),
    shopping: make("shopping", at, { keptAt: at, done: ["Dish soap"] }),
  };
  const bg: Bg = { ...emptyBg(), top: ["weather"], left: ["today", "shopping"] };
  return {
    widgets,
    parked: {},
    bg,
    focus: null,
    elsewhere: { kitchen: [], phone: [], speaker: [] },
    confirm: null,
    layouts: [{ name: "Friday evening", bg: cloneBg(bg), widgets: structuredClone(widgets) }],
    active: "Friday evening",
    emailBody,
    approved: false,
    routinesOn: {},
    log: [],
  };
}

export type Action =
  | { t: "show"; w: Widget }
  | { t: "pull"; id: string }
  | { t: "keep"; id?: string; zone?: Zone; index?: number; at: string }
  | { t: "dismiss" }
  | { t: "move"; id: string; zone: Zone; at: string }
  | { t: "remove"; id: string }
  | { t: "resize"; id: string; dir: 1 | -1 }
  | { t: "clear"; except: string[] }
  | { t: "save"; name: string }
  | { t: "load"; name: string }
  | { t: "patch"; id: string; patch: Partial<Widget> }
  | { t: "email"; body: string }
  | { t: "approve" }
  | { t: "routine"; id: string; on: boolean }
  | { t: "log"; ex: Exchange }
  | { t: "send"; id: string; to: SurfaceId }
  | { t: "bringBack"; id: string }
  | { t: "ask"; id: string; to: SurfaceId }
  | { t: "confirm"; yes: boolean };

function removeFromBg(bg: Bg, id: string): Bg {
  const next = cloneBg(bg);
  for (const z of ZONES) next[z] = next[z].filter((x) => x !== id);
  return next;
}
function insert(bg: Bg, zone: Zone, id: string, index?: number): Bg {
  const next = removeFromBg(bg, id);
  const list = next[zone];
  list.splice(index === undefined ? list.length : Math.min(index, list.length), 0, id);
  return next;
}
function without<T>(rec: Record<string, T>, id: string) {
  const next = { ...rec };
  delete next[id];
  return next;
}

export function awayAt(s: State, id: string): SurfaceId | undefined {
  return (Object.keys(s.elsewhere) as SurfaceId[]).find((k) => s.elsewhere[k].some((a) => a.id === id));
}
const awayIds = (s: State) => new Set(Object.values(s.elsewhere).flatMap((l) => l.map((a) => a.id)));

/** The focus slot empties: something pulled from the background goes back to its spot, anything passing goes away. */
function retireFocus(s: State): State {
  if (!s.focus) return s;
  const { id, from } = s.focus;
  if (from && s.widgets[id]) return { ...s, focus: null, bg: insert(s.bg, from.zone, id, from.index) };
  return { ...s, focus: null, widgets: without(s.widgets, id) };
}

export function reduce(s: State, a: Action): State {
  switch (a.t) {
    case "show": {
      if (s.focus?.id === a.w.id) return { ...s, widgets: { ...s.widgets, [a.w.id]: { ...s.widgets[a.w.id], ...a.w } } };
      const r = retireFocus(s);
      const from = zoneOf(r.bg, a.w.id);
      if (from) return { ...r, bg: removeFromBg(r.bg, a.w.id), focus: { id: a.w.id, from }, widgets: { ...r.widgets, [a.w.id]: { ...r.widgets[a.w.id], ...a.w, keptAt: r.widgets[a.w.id].keptAt } } };
      return { ...r, widgets: { ...r.widgets, [a.w.id]: a.w }, focus: { id: a.w.id } };
    }
    case "pull": {
      if (s.focus?.id === a.id) return s;
      const r = retireFocus(s);
      const from = zoneOf(r.bg, a.id);
      if (!from) return r;
      return { ...r, bg: removeFromBg(r.bg, a.id), focus: { id: a.id, from } };
    }
    case "keep": {
      if (!s.focus || (a.id && s.focus.id !== a.id)) return s;
      const { id, from } = s.focus;
      if (!canKeep(s.widgets[id].kind)) return s;
      const zone = a.zone ?? from?.zone ?? emptiestZone(s.bg);
      const index = a.index ?? (from && zone === from.zone ? from.index : undefined);
      return {
        ...s,
        focus: null,
        bg: insert(s.bg, zone, id, index),
        widgets: { ...s.widgets, [id]: { ...s.widgets[id], keptAt: s.widgets[id].keptAt ?? a.at } },
      };
    }
    case "dismiss":
      return retireFocus(s);
    case "move": {
      if (s.focus?.id === a.id) return reduce(s, { t: "keep", zone: a.zone, at: a.at });
      if (!zoneOf(s.bg, a.id)) return s;
      return { ...s, bg: insert(s.bg, a.zone, a.id) };
    }
    case "remove": {
      if (s.focus?.id === a.id) return { ...s, focus: null, widgets: without(s.widgets, a.id) };
      return { ...s, bg: removeFromBg(s.bg, a.id), widgets: without(s.widgets, a.id) };
    }
    case "resize": {
      const w = s.widgets[a.id];
      if (!w) return s;
      const order: Size[] = ["s", "m", "l"];
      const size = order[Math.max(0, Math.min(2, order.indexOf(w.size) + a.dir))];
      return { ...s, widgets: { ...s.widgets, [a.id]: { ...w, size } } };
    }
    case "clear": {
      const keep = new Set(a.except);
      const bg = emptyBg();
      for (const z of ZONES) bg[z] = s.bg[z].filter((id) => keep.has(id));
      let widgets: Record<string, Widget> = {};
      const away = awayIds(s);
      for (const id of Object.keys(s.widgets)) if (keep.has(id) || away.has(id)) widgets[id] = s.widgets[id];
      let focus = s.focus && keep.has(s.focus.id) ? s.focus : null;
      if (focus && focus.from) {
        // the kept thing was in front; it goes home
        bg[focus.from.zone].splice(focus.from.index, 0, focus.id);
        focus = null;
      }
      widgets = { ...widgets };
      return { ...s, bg, widgets, focus };
    }
    case "save": {
      const ids = ZONES.flatMap((z) => s.bg[z]);
      const widgets: Record<string, Widget> = {};
      for (const id of ids) widgets[id] = structuredClone(s.widgets[id]);
      const layout: Layout = { name: a.name, bg: cloneBg(s.bg), widgets };
      const layouts = s.layouts.some((l) => l.name.toLowerCase() === a.name.toLowerCase())
        ? s.layouts.map((l) => (l.name.toLowerCase() === a.name.toLowerCase() ? layout : l))
        : [...s.layouts, layout];
      return { ...s, layouts, active: a.name };
    }
    case "load": {
      const layout = s.layouts.find((l) => l.name.toLowerCase() === a.name.toLowerCase());
      if (!layout) return s;
      const widgets: Record<string, Widget> = {};
      const away = awayIds(s);
      for (const id of away) widgets[id] = s.widgets[id];
      for (const id of Object.keys(layout.widgets)) {
        if (away.has(id)) continue;
        const live = s.widgets[id] ?? s.parked[id];
        widgets[id] = live ? { ...live, size: layout.widgets[id].size } : structuredClone(layout.widgets[id]);
      }
      const parked = { ...s.parked };
      for (const id of Object.keys(s.widgets)) if (!widgets[id] && s.focus?.id !== id) parked[id] = s.widgets[id];
      for (const id of Object.keys(widgets)) delete parked[id];
      const bg = cloneBg(layout.bg);
      for (const z of ZONES) bg[z] = bg[z].filter((id) => !away.has(id));
      return { ...s, focus: null, bg, widgets, parked, active: layout.name };
    }
    case "patch": {
      const w = s.widgets[a.id];
      return w ? { ...s, widgets: { ...s.widgets, [a.id]: { ...w, ...a.patch } } } : s;
    }
    case "email":
      return { ...s, emailBody: a.body };
    case "approve": {
      const r = s.focus?.id === "email" ? reduce(s, { t: "remove", id: "email" }) : s;
      return { ...r, approved: true };
    }
    case "routine":
      return { ...s, routinesOn: { ...s.routinesOn, [a.id]: a.on } };
    case "log":
      return { ...s, log: [...s.log, a.ex] };
    case "send": {
      const w = s.widgets[a.id];
      if (!w) return s;
      let from: Away["from"];
      let r: State = s;
      if (s.focus?.id === a.id) {
        from = s.focus.from;
        r = { ...s, focus: null };
      } else {
        from = zoneOf(s.bg, a.id);
        r = { ...s, bg: removeFromBg(s.bg, a.id) };
      }
      const elsewhere = { ...r.elsewhere };
      for (const k of Object.keys(elsewhere) as SurfaceId[]) elsewhere[k] = elsewhere[k].filter((x) => x.id !== a.id);
      elsewhere[a.to] = [...elsewhere[a.to], { id: a.id, from }];
      return { ...r, elsewhere, confirm: null };
    }
    case "bringBack": {
      const where = awayAt(s, a.id);
      if (!where) return s;
      const entry = s.elsewhere[where].find((x) => x.id === a.id)!;
      const r = retireFocus({ ...s, elsewhere: { ...s.elsewhere, [where]: s.elsewhere[where].filter((x) => x.id !== a.id) } });
      return { ...r, focus: { id: a.id, from: entry.from } };
    }
    case "ask":
      return { ...s, confirm: { id: a.id, to: a.to } };
    case "confirm":
      if (!s.confirm) return s;
      return a.yes ? reduce(s, { t: "send", id: s.confirm.id, to: s.confirm.to }) : { ...s, confirm: null };
  }
}

/** True when the background differs from the saved layout it came from. */
export function isEdited(s: State): boolean {
  const l = s.layouts.find((x) => x.name === s.active);
  if (!l) return true;
  const sig = (bg: Bg, ws: Record<string, Widget | undefined>) =>
    ZONES.map((z) => z + ":" + bg[z].map((id) => id + "/" + (ws[id]?.size ?? "")).join(",")).join("|");
  return sig(s.bg, s.widgets) !== sig(l.bg, l.widgets);
}

// ---------------------------------------------------------------------------------------------
// Keyword interpreter. A mock: the real product has a model interpret and code validate.

export type Plan = { now: Action[]; later?: Action[]; reply: string; helper?: string; ui?: "dark" | "light" | "expert" | "simple" };

const KIND_WORDS: [Kind, string[]][] = [
  ["timer", ["timer"]],
  ["recipe", ["recipe", "frittata"]],
  ["email", ["email", "todd", "draft"]],
  ["week", ["next week"]],
  ["shopping", ["shopping", "list"]],
  ["weather", ["weather"]],
  ["today", ["today"]],
  ["ideas", ["ideas", "cook tonight"]],
  ["schedule", ["schedule"]],
  ["settings", ["settings"]],
];

function zoneIn(t: string): Zone | undefined {
  if (/\bright\b/.test(t)) return "right";
  if (/\bleft\b/.test(t)) return "left";
  if (/\b(top|up there)\b/.test(t)) return "top";
  if (/\b(bottom|below|underneath)\b/.test(t)) return "bottom";
}

function kindsIn(t: string): Kind[] {
  const out: Kind[] = [];
  for (const [k, words] of KIND_WORDS) if (words.some((w) => t.includes(w))) out.push(k);
  if (t.includes("calendar") && !out.includes("week")) out.push(t.includes("today") ? "today" : "week");
  return out;
}

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

export function interpret(raw: string, s: State, at: string): Plan {
  const t = raw.toLowerCase().replace(/[.?!]+$/g, "").trim();
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  const zone = zoneIn(t);
  const kinds = kindsIn(t);
  const exists = (id: string) => !!s.widgets[id];
  const inBg = (id: string) => !!zoneOf(s.bg, id);
  const it = kinds[0] ?? s.focus?.id;

  // Theme and mode
  if (has("dark mode")) return { now: [], reply: "Dark.", ui: "dark" };
  if (has("light mode")) return { now: [], reply: "Light.", ui: "light" };
  if (has("expert mode")) return { now: [], reply: "Expert mode on.", ui: "expert" };
  if (has("simple mode")) return { now: [], reply: "Simple mode on.", ui: "simple" };

  // Layouts
  const save = t.match(/\b(?:save|set)\b.*?\bas (?:my |the |a )?(.+?)(?:\s+(?:screen|layout|arrangement))?$/);
  if (save) {
    const name = cap(save[1]);
    return { now: [{ t: "save", name }], reply: `Saved as ${name}. Say "Show my ${name.toLowerCase()} screen" to bring it back.` };
  }
  if (has("screen", "layout")) {
    const l = s.layouts.find((x) => t.includes(x.name.toLowerCase()));
    if (l) return { now: [{ t: "load", name: l.name }], reply: `${l.name}.` };
  }

  // Predesigned screens
  if (has("setting")) return { now: [{ t: "show", w: make("settings", at) }], reply: "Settings." };
  if (has("schedule", "reminders", "routines")) return { now: [{ t: "show", w: make("schedule", at) }], reply: "Your schedule." };

  // Other surfaces: pull back
  const device: SurfaceId | undefined = has("kitchen", "tablet") ? "kitchen" : has("phone") ? "phone" : has("speaker", "living room") ? "speaker" : undefined;
  const awayKind = kinds.find((k) => awayAt(s, k));
  if (awayKind && (has("back", "from", "show", "bring", "forward") && !has("send", "move", "put"))) {
    const where = awayAt(s, awayKind)!;
    return { now: [{ t: "bringBack", id: awayKind }], reply: `${cap(noun(awayKind))} is back here, from the ${surfaceName(where).toLowerCase().replace("alex's", "your")}.` };
  }
  if (has("from the desk", "from my desk")) {
    const k = kinds[0];
    if (k && exists(k)) return { now: inBg(k) ? [{ t: "pull", id: k }] : [], reply: `${cap(noun(k))} is already on this screen.` };
  }

  // Other surfaces: push
  if (device && has("send", "move", "put", " on the", "show") && !(kinds.includes("schedule") || kinds.includes("settings"))) {
    let k = kinds.find((x) => x !== "today" || has("today")) ?? (s.focus ? s.widgets[s.focus.id].kind : undefined);
    if (!k) return { now: [], reply: "Which one? Name it, like the recipe or the timer." };
    const pre: Action[] = [];
    if (!exists(k)) {
      if (k !== "email" && k !== "recipe" && k !== "week") return { now: [], reply: `${cap(noun(k))} isn't on this screen.` };
      pre.push({ t: "show", w: make(k, at, k === "recipe" ? { step: 0 } : {}) });
    }
    const name = surfaceName(device);
    if (awayAt(s, k) === device) return { now: [], reply: `${cap(noun(k))} is already on the ${name.toLowerCase()}.` };
    if (device === "speaker" && k !== "timer") return { now: [], reply: "The speaker has no screen. It can ring the timer." };
    if (isPrivate(k) && SURFACES.find((x) => x.id === device)!.shared) {
      return { now: [...pre, { t: "ask", id: k, to: device }], reply: "That's private. Confirm on your phone to show it there." };
    }
    const tail = k === "timer" ? " It keeps running." : "";
    const where = device === "phone" ? "your phone" : `the ${name.toLowerCase()}`;
    return { now: [...pre, { t: "send", id: k, to: device }], reply: device === "speaker" ? `The timer rings on the speaker now.` : `${cap(noun(k))} is on ${where} now.${tail}` };
  }

  if (has("approve") || (has("send") && has("email"))) {
    if (s.approved) return { now: [], reply: "Already approved. It goes out Monday at 7:30." };
    return { now: [{ t: "approve" }], reply: "Approved. It goes out Monday 12 Oct at 7:30.", helper: "Writer" };
  }

  if (has("clear")) {
    const except = has("except", "but") ? kinds : [];
    const left = except.filter(exists);
    return {
      now: [{ t: "clear", except: left }],
      reply: left.length ? `Cleared. ${cap(noun(s.widgets[left[0]].kind))} stays.` : "Cleared.",
    };
  }

  if (has("remove", "get rid", "close", "hide", "delete", "dismiss", "take away")) {
    const id = it;
    if (!id || !exists(id)) return { now: [], reply: "That isn't on this screen." };
    return { now: [{ t: "remove", id }], reply: `${cap(noun(s.widgets[id].kind))} removed.` };
  }

  if (has("smaller", "shrink", "bigger", "larger", "grow")) {
    const id = it;
    if (!id || !exists(id)) return { now: [], reply: "That isn't on this screen." };
    const dir = has("smaller", "shrink") ? -1 : 1;
    const w = s.widgets[id];
    const edge = (dir === -1 && w.size === "s") || (dir === 1 && w.size === "l");
    if (edge) return { now: [], reply: `${cap(noun(w.kind))} is already as ${dir === -1 ? "small" : "large"} as it goes.` };
    return { now: [{ t: "resize", id, dir }], reply: `${cap(noun(w.kind))} is ${dir === -1 ? "smaller" : "larger"}.` };
  }

  // Creating things
  if (kinds.includes("timer") && has("start", "set", "minute", "timer for")) {
    const minutes = Number(t.match(/(\d+)\s*(?:-|\s)?min/)?.[1] ?? 25);
    const near = has("next to", "beside", "by it", "with it") ? zoneOf(s.bg, "recipe") ?? (s.focus ? undefined : undefined) : undefined;
    const target = zone ?? near?.zone ?? "right";
    const index = !zone && near ? near.index + 1 : undefined;
    const w = make("timer", at, { timer: { minutes, endsAt: Date.now() + minutes * 60_000, left: minutes * 60_000 } });
    return {
      now: [{ t: "show", w }],
      later: [{ t: "keep", id: "timer", zone: target, index, at }],
      reply: `${minutes} minutes, running${near ? ", next to the recipe" : ` ${ZONE_WORD[target]}`}.`,
    };
  }

  if (kinds.includes("email")) {
    if (s.approved) return { now: [], reply: "The email to Todd is approved. It goes out Monday at 7:30.", helper: "Writer" };
    return { now: [{ t: "show", w: make("email", at) }], reply: "The draft. Approve it and it goes out Monday at 7:30.", helper: "Writer" };
  }

  if (kinds.includes("week")) {
    const target = zone ?? (has("keep", "put") ? "bottom" : undefined);
    if (inBg("week") && !target) return { now: [{ t: "pull", id: "week" }], reply: "Next week." };
    if (inBg("week") && target) return { now: [{ t: "move", id: "week", zone: target, at }], reply: `Next week, ${ZONE_WORD[target]}.` };
    return {
      now: [{ t: "show", w: make("week", at) }],
      later: target ? [{ t: "keep", id: "week", zone: target, at }] : undefined,
      reply: target ? `Next week, ${ZONE_WORD[target]}.` : "Next week. Three things, all after Monday.",
    };
  }

  if (kinds.includes("recipe")) {
    const wantsKeep = !!zone || has("keep", "stay");
    if (inBg("recipe") && zone) return { now: [{ t: "move", id: "recipe", zone, at }], reply: `Recipe moved ${ZONE_WORD[zone]}.` };
    if (inBg("recipe")) return { now: [{ t: "pull", id: "recipe" }], reply: "The recipe, in front. Close it and it goes back." };
    if (s.focus?.id === "recipe" && wantsKeep) {
      const z = zone ?? "right";
      return { now: [{ t: "keep", zone: z, at }], reply: `Recipe kept ${ZONE_WORD[z]}.` };
    }
    const z = zone ?? "right";
    return {
      now: [{ t: "show", w: make("recipe", at, { step: 0 }) }],
      later: wantsKeep ? [{ t: "keep", id: "recipe", zone: z, at }] : undefined,
      reply: wantsKeep ? `Frittata ${ZONE_WORD[z]}. It stays until you remove it.` : "Frittata, 25 minutes. Say keep it and it stays.",
    };
  }

  if (has("cook", "dinner", "eat tonight") || kinds.includes("ideas")) {
    return { now: [{ t: "show", w: make("ideas", at) }], reply: "Three quick ones. The frittata uses what's in your fridge." };
  }

  if (has("keep", "pin", "leave it")) {
    if (!s.focus) return { now: [], reply: "Nothing is in front to keep." };
    const k = s.widgets[s.focus.id].kind;
    if (!canKeep(k)) return { now: [], reply: `${cap(noun(k))} can't be kept on the screen.` };
    const z = zone ?? s.focus.from?.zone ?? emptiestZone(s.bg);
    return { now: [{ t: "keep", zone: z, at }], reply: `Kept ${ZONE_WORD[z]}.` };
  }

  if (zone && it && inBg(it)) {
    return { now: [{ t: "move", id: it, zone, at }], reply: `${cap(noun(s.widgets[it].kind))} moved ${ZONE_WORD[zone]}.` };
  }

  if (kinds.length) {
    const k = kinds[0];
    if (inBg(k)) return { now: [{ t: "pull", id: k }], reply: `${cap(noun(k))}, in front.` };
    if (k === "weather" || k === "today" || k === "shopping") {
      return { now: [{ t: "show", w: make(k, at, k === "shopping" ? { done: ["Dish soap"] } : {}) }], reply: `${cap(noun(k))}.` };
    }
  }

  if (has("put it back", "go back", "never mind", "done")) {
    return { now: [{ t: "dismiss" }], reply: "Back to calm." };
  }

  return { now: [], reply: "I can't do that on this screen yet. The suggestions below work." };
}
