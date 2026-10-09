// PROTOTYPE - concept 04 "Scenes": data model and keyword interpreter (a mock; the product lets the model interpret).

export type Area = "left" | "main" | "right" | "bottom";
export type Size = "s" | "m" | "l";
export type Kind = "ideas" | "recipe" | "timer" | "email" | "today" | "week" | "weather" | "shopping" | "money";
export type SurfaceId = "kitchen" | "phone" | "speaker";

export type Widget = { id: string; kind: Kind; area: Area; size: Size; at: string; minutes?: number; passing?: boolean };
export type Rule = { simple: string; expert: string };
export type Scene = { id: string; name: string; hue: string; rule?: Rule; widgets: Widget[]; base: Widget[]; changes: { at: string; text: string }[] };
export type World = { scenes: Scene[]; active: string; passing: Widget[]; away: Record<SurfaceId, Widget[]> };

export const AREAS: Area[] = ["left", "main", "right", "bottom"];
export const SIZES: Size[] = ["s", "m", "l"];
export const areaName: Record<Area, string> = { left: "Left", main: "Middle", right: "Right", bottom: "Bottom" };
export const areaWords: Record<Area, string> = { left: "on the left", main: "in the middle", right: "on the right", bottom: "along the bottom" };

export const kindTitle: Record<Kind, string> = {
  ideas: "Dinner ideas", recipe: "Recipe", timer: "Timer", email: "Email to Todd", today: "Calendar",
  week: "Next week", weather: "Weather", shopping: "Shopping list", money: "Portfolio",
};
export const kindHelper: Record<Kind, string> = {
  ideas: "Chief", recipe: "Chief", timer: "Chief", email: "Writer", today: "Chief", week: "Chief", weather: "Chief", shopping: "Chief", money: "Chief",
};
export const isPrivate = (k: Kind) => k === "email" || k === "money";

export const surfaces: { id: SurfaceId; name: string; short: string; shared: boolean; screen: boolean; showing: string; expert: string }[] = [
  { id: "kitchen", name: "Kitchen tablet", short: "the kitchen tablet", shared: true, screen: true, showing: "Clock and lights", expert: "node kitchen · shared · nobody identified" },
  { id: "phone", name: "Alex's phone", short: "your phone", shared: false, screen: true, showing: "With Alex", expert: "node phone · personal · Alex" },
  { id: "speaker", name: "Living room speaker", short: "the living room speaker", shared: true, screen: false, showing: "Sound only", expert: "node speaker · shared · no screen" },
];

export const HUES = { friday: "#C58A3E", morning: "#4F7CAC", cooking: "#5C8E62", other: "#8B7FB3" };

const w = (id: string, kind: Kind, area: Area, size: Size = "m"): Widget => ({ id, kind, area, size, at: "17:00" });

export function initialWorld(): World {
  const friday = [w("w-weather", "weather", "left"), w("w-today", "today", "left"), w("w-shop", "shopping", "left")];
  const morning = [w("m-weather", "weather", "main", "l"), w("m-today", "today", "left"), w("m-money", "money", "right")];
  return {
    active: "friday",
    passing: [],
    away: { kitchen: [], phone: [], speaker: [] },
    scenes: [
      { id: "morning", name: "Morning", hue: HUES.morning, rule: { simple: "Weekdays, 6:30 to 9:00", expert: "Mon–Fri ∧ 06:30–09:00 · this Surface" }, widgets: morning, base: morning, changes: [] },
      { id: "friday", name: "Friday evening", hue: HUES.friday, rule: { simple: "Fridays from 17:00", expert: "Fri ∧ time ≥ 17:00 · this Surface" }, widgets: friday, base: friday, changes: [] },
    ],
  };
}

export const DEMO = [
  "What could I cook tonight?",
  "Show the frittata recipe on the right and keep it there",
  "Start a 25 minute timer next to it",
  "Show me the email to Todd",
  "Put my calendar for next week along the bottom",
  "Make the weather smaller",
  "Remove the shopping list",
  "Move the timer to the kitchen tablet",
  "Show the email on the kitchen tablet",
  "Bring the timer back",
  "Clear everything except the timer",
  "Save this as my cooking screen",
  "Show Friday evening",
  "Show my cooking screen",
];

export type Outcome = {
  reply: string;
  world?: World;
  trace?: string;
  traceExpert?: string;
  open?: "schedule" | "settings";
  approve?: boolean;
  undo?: boolean;
  timer?: { id: string; minutes: number };
  confirm?: { widget: Widget; to: SurfaceId };
  ok?: boolean;
};

export const activeScene = (wd: World) => wd.scenes.find((s) => s.id === wd.active)!;

function kindIn(t: string): Kind | undefined {
  if (/next week|\bweek\b/.test(t)) return "week";
  if (/calendar|today/.test(t)) return "today";
  if (/weather/.test(t)) return "weather";
  if (/shopping|\blist\b/.test(t)) return "shopping";
  if (/recipe|frittata/.test(t)) return "recipe";
  if (/timer/.test(t)) return "timer";
  if (/email|todd|draft/.test(t)) return "email";
  if (/ideas/.test(t)) return "ideas";
  if (/portfolio|money|investments/.test(t)) return "money";
  return undefined;
}

function areaIn(t: string): Area | undefined {
  if (/\bleft\b/.test(t)) return "left";
  if (/\bright\b/.test(t)) return "right";
  if (/bottom|underneath/.test(t)) return "bottom";
  if (/middle|centre|center/.test(t)) return "main";
  return undefined;
}

function surfaceIn(t: string): SurfaceId | undefined {
  if (/tablet|kitchen/.test(t)) return "kitchen";
  if (/phone/.test(t)) return "phone";
  if (/speaker|living room/.test(t)) return "speaker";
  return undefined;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const title = (k: Kind) => kindTitle[k];
const lower = (k: Kind) => (k === "email" ? "the email to Todd" : `the ${kindTitle[k].toLowerCase()}`);

/** Replace the active scene's widgets and log the change on the scene. */
export function editActive(wd: World, widgets: Widget[], text: string, at: string, passing = wd.passing): World {
  return {
    ...wd,
    passing,
    scenes: wd.scenes.map((s) => (s.id === wd.active ? { ...s, widgets, changes: [...s.changes, { at, text }] } : s)),
  };
}

/** Take a widget off this Surface (scene or passing) and put it on another Surface. */
export function moveAway(wd: World, id: string, to: SurfaceId, at: string): { world?: World; reply: string; trace?: string; confirm?: { widget: Widget; to: SurfaceId } } {
  const sc = activeScene(wd);
  const wid = [...sc.widgets, ...wd.passing].find((x) => x.id === id);
  if (!wid) return { reply: "That isn't on this screen." };
  const surf = surfaces.find((s) => s.id === to)!;
  if (!surf.screen && wid.kind !== "timer") return { reply: "The living room speaker has no screen. Only a timer can go there." };
  if (isPrivate(wid.kind) && surf.shared) return { reply: `That's private. Confirm on your phone to show it on ${surf.short}.`, confirm: { widget: wid, to } };
  return { ...placeAway(wd, wid, to, at), reply: wid.kind === "timer" ? `The timer is on ${surf.short} now and keeps running.` : `${cap(lower(wid.kind))} is on ${surf.short} now.` };
}

export function placeAway(wd: World, wid: Widget, to: SurfaceId, at: string): { world: World; trace: string } {
  const surf = surfaces.find((s) => s.id === to)!;
  const inScene = activeScene(wd).widgets.some((x) => x.id === wid.id);
  const text = `${title(wid.kind)} moved to ${surf.name}`;
  const base = inScene ? editActive(wd, activeScene(wd).widgets.filter((x) => x.id !== wid.id), text, at) : { ...wd, passing: wd.passing.filter((x) => x.id !== wid.id) };
  const away = { ...base.away };
  (Object.keys(away) as SurfaceId[]).forEach((k) => (away[k] = away[k].filter((x) => x.id !== wid.id)));
  away[to] = [...away[to], { ...wid, passing: !inScene }];
  return { world: { ...base, away }, trace: text };
}

export function bringBack(wd: World, id: string, at: string): { world: World; trace: string } | undefined {
  const from = (Object.keys(wd.away) as SurfaceId[]).find((k) => wd.away[k].some((x) => x.id === id));
  if (!from) return undefined;
  const wid = wd.away[from].find((x) => x.id === id)!;
  const away = { ...wd.away, [from]: wd.away[from].filter((x) => x.id !== id) };
  const text = `${title(wid.kind)} back ${areaWords[wid.area]}`;
  if (wid.passing) return { world: { ...wd, away, passing: [...wd.passing, wid] }, trace: text };
  return { world: { ...editActive(wd, [...activeScene(wd).widgets, { ...wid, passing: false }], text, at), away }, trace: text };
}

const cookingPreset = (id: (k: string) => string, at: string): Widget[] => [
  { id: id("recipe"), kind: "recipe", area: "right", size: "m", at },
  { id: id("timer"), kind: "timer", area: "right", size: "m", at, minutes: 25 },
  { id: id("shop"), kind: "shopping", area: "left", size: "s", at },
];

export function interpret(raw: string, wd: World, at: string, id: (k: string) => string, approved: boolean): Outcome {
  const t = raw.toLowerCase().trim();
  const sc = activeScene(wd);
  const onScreen = [...wd.passing, ...sc.widgets];
  const findKind = (k: Kind) => onScreen.find((x) => x.kind === k) ?? (k === "today" ? onScreen.find((x) => x.kind === "week") : undefined);
  const awayList = (Object.keys(wd.away) as SurfaceId[]).flatMap((s) => wd.away[s].map((x) => ({ s, x })));
  const kind = kindIn(t);
  const area = areaIn(t);
  const surf = surfaceIn(t);

  if (/^(undo|take that back)/.test(t)) return { reply: "", undo: true };
  if (/schedule|reminders|routines/.test(t)) return { reply: "Your schedule is open.", open: "schedule", ok: true };
  if (/settings/.test(t)) return { reply: "Settings are open.", open: "settings", ok: true };
  if (/^(approve|send it|looks good)/.test(t)) {
    return approved ? { reply: "Already approved. It goes out Monday at 7:30." } : { reply: "Approved. It goes out Monday at 7:30.", approve: true, ok: true };
  }

  // Scene rule: "Show it when someone is in the kitchen after 18:00"
  if (/when (someone|anyone|i)/.test(t) && /kitchen/.test(t)) {
    const target = wd.scenes.find((s) => s.id === "cooking") ?? sc;
    const rule = { simple: "When someone is in the kitchen after 18:00", expert: "presence(kitchen) ∧ time ≥ 18:00 · this Surface" };
    return {
      reply: `Done. ${target.name} comes on by itself when someone is in the kitchen after 18:00.`,
      world: { ...wd, scenes: wd.scenes.map((s) => (s.id === target.id ? { ...s, rule, changes: [...s.changes, { at, text: "Rule added" }] } : s)) },
      trace: `${target.name} now comes on when someone is in the kitchen after 18:00`, traceExpert: `rule ${target.id}: ${rule.expert}`, ok: true,
    };
  }

  // Pull back from another Surface
  if (/\b(bring|get|pull)\b/.test(t) && /\bback\b|from/.test(t)) {
    const hit = awayList.find((a) => (!kind || a.x.kind === kind) && (!surf || a.s === surf)) ;
    if (!hit) return { reply: "Nothing from that is elsewhere right now." };
    const r = bringBack(wd, hit.x.id, at)!;
    return { reply: `${cap(lower(hit.x.kind))} is back ${areaWords[hit.x.area]}.`, world: r.world, trace: r.trace, ok: true };
  }

  // Push to another Surface
  if (surf && /\b(move|send|put|show|take)\b/.test(t) && !/save|set up/.test(t)) {
    const target = kind ? findKind(kind) : sc.widgets[sc.widgets.length - 1];
    if (!target) {
      const there = kind && awayList.find((a) => a.x.kind === kind);
      return { reply: there ? `${cap(lower(kind!))} is already on ${surfaces.find((s) => s.id === there.s)!.short}.` : "That isn't on this screen." };
    }
    const r = moveAway(wd, target.id, surf, at);
    return { ...r, ok: true };
  }

  // Save the current arrangement as a named scene
  const save = t.match(/(?:save|set) (?:this|it)(?: up)? as (?:my |the |a )?([a-z ]+?) (?:screen|scene|layout)/);
  if (save) {
    const name = cap(save[1].trim());
    const sid = name.toLowerCase().replace(/\s+/g, "-");
    const widgets = sc.widgets;
    const exists = wd.scenes.find((s) => s.id === sid);
    const hue = sid === "cooking" ? HUES.cooking : HUES.other;
    const others = wd.scenes.filter((s) => s.id !== sid).map((s) => (s.id === sc.id && s.id !== sid ? { ...s, widgets: s.base } : s));
    const scene: Scene = { id: sid, name, hue, rule: exists?.rule, widgets, base: widgets, changes: [{ at, text: `Saved from ${sc.name}` }] };
    return {
      reply: `Saved as ${name}. ${sc.name} is back the way you set it up.${sid === "cooking" ? " Should Cooking come on by itself when someone is in the kitchen after 18:00?" : ""}`,
      world: { ...wd, scenes: [...others, scene], active: sid, passing: [] },
      trace: `${name} saved · ${sc.name} kept as before`, traceExpert: `scene ${sid} ← ${widgets.length} widgets; ${sc.id} reset to base`, ok: true,
    };
  }

  // Create a scene from scratch
  const setup = t.match(/(?:set up|make|create) (?:a |my |the )?([a-z ]+?) (?:screen|scene)/);
  if (setup) {
    const name = cap(setup[1].trim());
    const sid = name.toLowerCase().replace(/\s+/g, "-");
    const exists = wd.scenes.find((s) => s.id === sid);
    if (exists) return { reply: `${name} is ready.`, world: { ...wd, active: sid }, trace: `Switched to ${name}`, ok: true };
    const widgets = sid === "cooking" ? cookingPreset(id, at) : [];
    const scene: Scene = { id: sid, name, hue: sid === "cooking" ? HUES.cooking : HUES.other, widgets, base: widgets, changes: [{ at, text: "Created" }] };
    return {
      reply: sid === "cooking" ? "Cooking is ready: the frittata on the right, a 25 minute timer under it, your shopping list on the left. Should it come on when someone is in the kitchen after 18:00?" : `${name} is ready and empty. Tell me what to put on it.`,
      world: { ...wd, scenes: [...wd.scenes, scene], active: sid, passing: [] },
      trace: `${name} created`, timer: sid === "cooking" ? { id: widgets[1].id, minutes: 25 } : undefined, ok: true,
    };
  }

  // Switch scene by name
  const named = wd.scenes.find((s) => t.includes(s.name.toLowerCase()) || (s.id === "friday" && /friday/.test(t)));
  if (named && /(show|switch|open|go|back|bring up|put on)/.test(t) && !kind) {
    if (named.id === wd.active) return { reply: `${named.name} is already on.` };
    return { reply: `${named.name} is on.`, world: { ...wd, active: named.id }, trace: `Switched to ${named.name}`, ok: true };
  }

  // Clear
  if (/\bclear\b|remove everything|get rid of everything/.test(t)) {
    const keepK = /except|but|apart from/.test(t) ? kind : undefined;
    const widgets = keepK ? sc.widgets.filter((x) => x.kind === keepK) : [];
    const passing = keepK ? wd.passing.filter((x) => x.kind === keepK) : [];
    const text = keepK ? `Cleared everything except the ${title(keepK).toLowerCase()}` : "Cleared everything";
    return { reply: keepK ? `Only the ${title(keepK).toLowerCase()} is left.` : "The screen is clear.", world: editActive(wd, widgets, text, at, passing), trace: text, ok: true };
  }

  // Remove one
  if (/\b(remove|get rid of|close|hide|take away|delete|dismiss)\b/.test(t) && kind) {
    const target = findKind(kind);
    if (!target) return { reply: `There's no ${title(kind).toLowerCase()} on this screen.` };
    if (target.passing) return { reply: "Gone.", world: { ...wd, passing: wd.passing.filter((x) => x.id !== target.id) }, ok: true };
    const text = `${title(target.kind)} removed`;
    return { reply: "Removed.", world: editActive(wd, sc.widgets.filter((x) => x.id !== target.id), text, at), trace: text, ok: true };
  }

  // Resize
  const smaller = /smaller|less space|shrink/.test(t);
  const bigger = /bigger|larger|more space|grow/.test(t);
  if ((smaller || bigger) && kind) {
    const target = findKind(kind);
    if (!target) return { reply: `There's no ${title(kind).toLowerCase()} on this screen.` };
    const i = SIZES.indexOf(target.size) + (smaller ? -1 : 1);
    if (i < 0 || i > 2) return { reply: `That's as ${smaller ? "small" : "big"} as it goes.` };
    const size = SIZES[i];
    const text = `${title(target.kind)} made ${smaller ? "smaller" : "bigger"}`;
    if (target.passing) return { reply: "Done.", world: { ...wd, passing: wd.passing.map((x) => (x.id === target.id ? { ...x, size } : x)) }, ok: true };
    return { reply: "Done.", world: editActive(wd, sc.widgets.map((x) => (x.id === target.id ? { ...x, size } : x)), text, at), trace: text, traceExpert: `${target.id}: size ${target.size} → ${size}`, ok: true };
  }

  // Keep a passing widget
  if (/^keep\b/.test(t) && kind) {
    const target = wd.passing.find((x) => x.kind === kind);
    if (!target) return { reply: "That's already part of this scene." };
    const text = `${title(kind)} kept ${areaWords[target.area]}`;
    return { reply: "Kept.", world: editActive(wd, [...sc.widgets, { ...target, passing: false }], text, at, wd.passing.filter((x) => x.id !== target.id)), trace: text, ok: true };
  }

  // Ideas (passing)
  if (/cook|dinner|eat tonight/.test(t) && kind !== "recipe" && kind !== "timer") {
    const ideas: Widget = { id: id("ideas"), kind: "ideas", area: "main", size: "m", at, passing: true };
    return { reply: "Three quick ones. The frittata fits what's in your fridge.", world: { ...wd, passing: [...wd.passing.filter((x) => x.kind !== "ideas"), ideas] }, ok: true };
  }

  // Add or move a specific widget
  if (kind && kind !== "ideas") {
    const awayHit = awayList.find((a) => a.x.kind === kind);
    if (awayHit) {
      const r = bringBack(wd, awayHit.x.id, at)!;
      return { reply: `Brought it back from ${surfaces.find((s) => s.id === awayHit.s)!.short}.`, world: r.world, trace: r.trace, ok: true };
    }
    const existing = findKind(kind);
    if (kind === "today" && existing?.kind === "week" && !/today/.test(t)) {
      // "calendar" alone with next week showing: fall through to treat as move
    }
    if (existing && existing.kind === kind) {
      if (area && area !== existing.area) {
        const text = `${title(kind)} moved ${areaWords[area]}`;
        if (existing.passing) return { reply: "Moved.", world: { ...wd, passing: wd.passing.map((x) => (x.id === existing.id ? { ...x, area } : x)) }, ok: true };
        return { reply: "Moved.", world: editActive(wd, sc.widgets.map((x) => (x.id === existing.id ? { ...x, area } : x)), text, at), trace: text, traceExpert: `${existing.id}: ${existing.area} → ${area}`, ok: true };
      }
      if (existing.passing && /keep|stay|leave/.test(t)) {
        const text = `${title(kind)} kept ${areaWords[existing.area]}`;
        return { reply: "Kept.", world: editActive(wd, [...sc.widgets, { ...existing, passing: false }], text, at, wd.passing.filter((x) => x.id !== existing.id)), trace: text, ok: true };
      }
      if (kind !== "timer") return { reply: `It's ${areaWords[existing.area]}.` };
    }
    const last = sc.widgets[sc.widgets.length - 1];
    const defaults: Record<Kind, Area> = { ideas: "main", recipe: "right", timer: "right", email: "main", today: "left", week: "bottom", weather: "left", shopping: "left", money: "right" };
    const where: Area = area ?? (/next to|beside|under it|with it/.test(t) && last ? last.area : defaults[kind]);
    const minutes = kind === "timer" ? Number(t.match(/(\d+)\s*(?:min|minute)/)?.[1] ?? 10) : undefined;
    const size: Size = kind === "email" || kind === "week" ? "l" : "m";
    const wid: Widget = { id: id(kind), kind, area: where, size, at, minutes };
    const timer = minutes ? { id: wid.id, minutes } : undefined;
    // The email draft is a passing thing until asked to keep it.
    const passing = kind === "email" && !/keep|stay/.test(t);
    if (passing) {
      return { reply: approved ? "Here's the email. It's approved for Monday 7:30." : "Here's the draft. It goes out Monday at 7:30 once you approve it.", world: { ...wd, passing: [...wd.passing.filter((x) => x.kind !== "ideas"), { ...wid, passing: true }] }, ok: true };
    }
    const text = kind === "timer" ? `${minutes} minute timer added ${areaWords[where]}` : `${title(kind)} added ${areaWords[where]}`;
    const dropIdeas = kind === "recipe" ? wd.passing.filter((x) => x.kind !== "ideas") : wd.passing;
    const reply = kind === "recipe" ? "Spinach and feta frittata, on the right. It stays until you remove it." : kind === "timer" ? `${minutes} minutes, running.` : "Done.";
    return { reply, world: editActive(wd, [...sc.widgets, wid], text, at, dropIdeas), trace: text, traceExpert: `+${wid.id} → ${where} · ${size}`, timer, ok: true };
  }

  return { reply: "I didn't catch that. Try one of the suggestions below." };
}
