// PROTOTYPE - concept 01 "Free space": the Surface is open space with nine soft regions.
// hux places widgets in the region you name, nudges the others aside, and you can drag, resize, keep or let go.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUp, CalendarClock, CalendarDays, Check, ChefHat, ChevronDown, CloudSun, Lightbulb, Lock, Mail, MessageSquare, Mic,
  Monitor, Moon, Pause, Pin, Play, RotateCcw, Send, Settings, ShoppingBasket, Smartphone, Speaker, Sun, Tablet, Timer, Undo2, X,
  type LucideIcon,
} from "lucide-react";
import { calendar, conversation, household, reminders, routines, settingsGroups, helpers } from "../../fixtures";
import "./styles.css";

export const name = "Free space";

// ---------- model ----------

type Kind = "weather" | "today" | "shopping" | "ideas" | "recipe" | "timer" | "email" | "week";
type Region = "top-left" | "top" | "top-right" | "left" | "centre" | "right" | "bottom-left" | "bottom" | "bottom-right";
type Row = "top" | "mid" | "bottom";
type Col = "left" | "mid" | "right";
type Size = { W: number; H: number };
type Rect = { x: number; y: number; w: number; h: number };
type Widget = Rect & {
  id: Kind; pinned: boolean; region: Region; stretch?: boolean; compact?: boolean;
  touched: number; born: number; z: number; leaving?: boolean; fly?: { x: number; y: number }; squeezed?: boolean;
};
type Snap = { id: Kind; fx: number; fy: number; w: number; h: number; region: Region; stretch?: boolean; compact?: boolean };
type Layout = { name: string; items: Snap[]; at: string };
type Msg = { from: "you" | "hux"; text: string; at: string; meta?: string; action?: { label: string; cmd: string } };
type SurfId = "desk" | "kitchen" | "phone" | "speaker";

const M = 24; // margin to the Surface edge
const GAP = 16; // breathing room between widgets
const GRID = 24; // loose snap grid
const FADE_START = 60_000;
const FADE_END = 180_000;

const KINDS: Record<Kind, { title: string; icon: LucideIcon; size: [number, number]; min: [number, number]; region: Region; private?: boolean }> = {
  weather: { title: "Weather", icon: CloudSun, size: [260, 186], min: [168, 84], region: "top-left" },
  today: { title: "Calendar", icon: CalendarDays, size: [260, 230], min: [200, 140], region: "left" },
  shopping: { title: "Shopping list", icon: ShoppingBasket, size: [240, 226], min: [190, 140], region: "top-right" },
  ideas: { title: "Quick dinners", icon: Lightbulb, size: [340, 230], min: [240, 160], region: "centre" },
  recipe: { title: "Recipe", icon: ChefHat, size: [380, 560], min: [260, 240], region: "right" },
  timer: { title: "Timer", icon: Timer, size: [232, 184], min: [180, 140], region: "top-right" },
  email: { title: "Email to Todd", icon: Mail, size: [600, 470], min: [340, 300], region: "centre", private: true },
  week: { title: "Next week", icon: CalendarDays, size: [900, 196], min: [380, 150], region: "bottom" },
};
const COMPACT: Partial<Record<Kind, [number, number]>> = { weather: [176, 92], timer: [184, 140], shopping: [200, 150] };

const SURFS: { id: SurfId; name: string; short: string; icon: LucideIcon; shared: boolean; screen: boolean; expert: string }[] = [
  { id: "desk", name: "Desk PC", short: "Desk", icon: Monitor, shared: false, screen: true, expert: "desk · screen 1 of 3 (left)" },
  { id: "kitchen", name: "Kitchen tablet", short: "Kitchen", icon: Tablet, shared: true, screen: true, expert: "kitchen · shared · touch" },
  { id: "phone", name: "Alex's phone", short: "Phone", icon: Smartphone, shared: false, screen: true, expert: "phone · personal" },
  { id: "speaker", name: "Living room speaker", short: "Speaker", icon: Speaker, shared: true, screen: false, expert: "speaker · voice only" },
];
const surf = (id: SurfId) => SURFS.find((s) => s.id === id)!;

const SCRIPT = [
  "What could I cook tonight?",
  "Show the frittata recipe on the right and keep it there",
  "Start a 25 minute timer next to it",
  "Move the recipe to the kitchen tablet",
  "Bring the recipe back",
  "Show me the email to Todd",
  "Move the email to the kitchen tablet",
  "Put my calendar for next week along the bottom",
  "Make the weather smaller",
  "Remove the shopping list",
  "Clear everything except the timer",
  "Save this as my cooking screen",
  "Show my Friday evening screen",
  "Show my cooking screen",
  "Show my schedule",
  "Open settings",
];
const PHONE_EXTRA = "Show me the recipe from the desk";

// ---------- geometry ----------

function parts(r: Region): [Row, Col] {
  switch (r) {
    case "centre": return ["mid", "mid"];
    case "left": return ["mid", "left"];
    case "right": return ["mid", "right"];
    case "top": return ["top", "mid"];
    case "bottom": return ["bottom", "mid"];
    default: { const [a, b] = r.split("-"); return [a as Row, b as Col]; }
  }
}
function join(row: Row, col: Col): Region {
  if (row === "mid" && col === "mid") return "centre";
  if (row === "mid") return col as Region;
  if (col === "mid") return row as Region;
  return `${row}-${col}` as Region;
}
const REGIONS: Region[] = (["top", "mid", "bottom"] as Row[]).flatMap((r) => (["left", "mid", "right"] as Col[]).map((c) => join(r, c)));
const regionLabel = (r: Region) => r.replace("-", " ");
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function regionAt(cx: number, cy: number, S: Size): Region {
  const col: Col = cx < S.W / 3 ? "left" : cx > (2 * S.W) / 3 ? "right" : "mid";
  const row: Row = cy < S.H / 3 ? "top" : cy > (2 * S.H) / 3 ? "bottom" : "mid";
  return join(row, col);
}
function regionRect(r: Region, S: Size, stretch?: boolean): Rect {
  const [row, col] = parts(r);
  const cw = S.W / 3, rh = S.H / 3, p = 6;
  const x = stretch ? 0 : col === "left" ? 0 : col === "mid" ? cw : 2 * cw;
  const y = row === "top" ? 0 : row === "mid" ? rh : 2 * rh;
  return { x: x + p, y: y + p, w: (stretch ? S.W : cw) - 2 * p, h: rh - 2 * p };
}
function anchorPos(r: Region, w: number, h: number, S: Size) {
  const [row, col] = parts(r);
  const x = col === "left" ? M : col === "right" ? S.W - M - w : (S.W - w) / 2;
  const y = row === "top" ? M : row === "bottom" ? S.H - M - h : (S.H - h) / 2;
  return { x: clamp(x, M, Math.max(M, S.W - M - w)), y: clamp(y, M, Math.max(M, S.H - M - h)) };
}
const hit = (a: Rect, b: Rect) => a.x < b.x + b.w + GAP && b.x < a.x + a.w + GAP && a.y < b.y + b.h + GAP && b.y < a.y + a.h + GAP;
const inBounds = (r: Rect, S: Size) => r.x >= M - 1 && r.y >= M - 1 && r.x + r.w <= S.W - M + 1 && r.y + r.h <= S.H - M + 1;

// Choose where a widget `b` goes when `a` lands on it: the shortest free move, squeezing it if it must.
function bestSpot(b: Widget, a: Rect, live: Widget[], fixed: Set<Widget>, S: Size): Rect & { cost: number } {
  const [minW, minH] = KINDS[b.id].min;
  const cands: { r: Rect; extra: number }[] = [
    { r: { ...b, x: a.x - GAP - b.w }, extra: 0 },
    { r: { ...b, x: a.x + a.w + GAP }, extra: 0 },
    { r: { ...b, y: a.y - GAP - b.h }, extra: 0 },
    { r: { ...b, y: a.y + a.h + GAP }, extra: 0 },
  ];
  const upH = a.y - GAP - M;
  if (upH >= minH && upH < b.h) cands.push({ r: { x: b.x, y: M, w: b.w, h: upH }, extra: 500 + (b.h - upH) });
  const dY = a.y + a.h + GAP, dH = S.H - M - dY;
  if (dH >= minH && dH < b.h) cands.push({ r: { x: b.x, y: dY, w: b.w, h: dH }, extra: 500 + (b.h - dH) });
  if (!b.stretch) {
    const lW = a.x - GAP - M;
    if (lW >= minW && lW < b.w) cands.push({ r: { x: M, y: b.y, w: lW, h: b.h }, extra: 500 + (b.w - lW) });
    const rX = a.x + a.w + GAP, rW = S.W - M - rX;
    if (rW >= minW && rW < b.w) cands.push({ r: { x: rX, y: b.y, w: rW, h: b.h }, extra: 500 + (b.w - rW) });
  }
  // Crowded? Look for the nearest open patch anywhere on the loose grid.
  const free = (w: number, h: number) => {
    let found: Rect | null = null, d = Infinity;
    for (let y = M; y + h <= S.H - M; y += GRID) for (let x = M; x + w <= S.W - M; x += GRID) {
      const r = { x, y, w, h };
      if (live.some((o) => o !== b && !o.leaving && hit(r, o))) continue;
      const dist = Math.abs(x - b.x) + Math.abs(y - b.y);
      if (dist < d) { d = dist; found = r; }
    }
    return found;
  };
  const f1 = free(b.w, b.h);
  if (f1) cands.push({ r: f1, extra: 120 });
  else {
    const f2 = free(Math.max(minW, Math.round(b.w * 0.75)), Math.max(minH, Math.round(b.h * 0.7))) ?? free(minW, minH);
    if (f2) cands.push({ r: f2, extra: 600 });
  }
  let best = cands[0].r, bestCost = Infinity;
  for (const { r, extra } of cands) {
    let cost = extra + Math.abs(r.x - b.x) + Math.abs(r.y - b.y);
    if (!inBounds(r, S)) cost += 5000;
    for (const o of live) {
      if (o === b || o.leaving || !hit(r, o)) continue;
      cost += fixed.has(o) ? 10000 : o.pinned ? 2500 : 1500;
    }
    if (cost < bestCost) { bestCost = cost; best = r; }
  }
  return { ...best, cost: bestCost, x: clamp(best.x, M, Math.max(M, S.W - M - best.w)), y: clamp(best.y, M, Math.max(M, S.H - M - best.h)) };
}

// The anchor stays; everything it touches is nudged, and whatever those touch, and so on.
// When there is truly no room, passing things give way (they fade out); kept things squeeze.
function resolve(list: Widget[], anchorId: Kind, S: Size): Widget[] {
  const ws = list.map((w) => ({ ...w }));
  const live = ws.filter((w) => !w.leaving);
  const anchor = live.find((w) => w.id === anchorId);
  if (!anchor) return ws;
  const fixed = new Set<Widget>([anchor]);
  let topZ = Math.max(...ws.map((w) => w.z));
  const queue: Widget[] = [anchor];
  let guard = 0;
  while (queue.length && guard++ < 60) {
    const a = queue.shift()!;
    for (const b of live) {
      if (fixed.has(b) || !hit(a, b)) continue;
      const { cost, ...spot } = bestSpot(b, a, live, fixed, S);
      if (cost >= 1500 && !b.pinned && b.id !== "timer") { b.leaving = true; fixed.add(b); continue; }
      if (spot.w < b.w || spot.h < b.h) b.squeezed = true;
      Object.assign(b, spot);
      fixed.add(b);
      queue.push(b);
    }
  }
  // No room at all: smaller things lie on top, like papers on a desk, so nothing hides completely.
  const rest = live.filter((w) => !w.leaving);
  for (const a of rest) for (const b of rest) {
    if (a === b) continue;
    const over = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    if (over && a.w * a.h < b.w * b.h && a.z <= b.z) a.z = ++topZ;
  }
  return ws;
}

// When room opens up, squeezed widgets breathe back to their own size if they fit.
function relax(list: Widget[], S: Size): Widget[] {
  const ws = list.filter((w) => !w.leaving).map((w) => ({ ...w }));
  for (const w of ws) {
    if (!w.squeezed) continue;
    const [nw0, nh0] = w.compact ? COMPACT[w.id] ?? KINDS[w.id].size : KINDS[w.id].size;
    const nw = w.stretch ? w.w : Math.min(nw0, S.W - 2 * M), nh = Math.min(nh0, S.H - 2 * M);
    let best: Rect | null = null;
    for (const tw of [nw, Math.round((nw + w.w) / 2), w.w]) for (let th = nh; th >= w.h; th -= GRID) {
      for (const x of [w.x, w.x + w.w - tw]) for (const y of [w.y, w.y + w.h - th]) {
        const r = { x: clamp(x, M, S.W - M - tw), y: clamp(y, M, S.H - M - th), w: tw, h: th };
        if (ws.some((o) => o !== w && hit(r, o))) continue;
        if (!best || r.w * r.h > best.w * best.h) best = r;
      }
    }
    const ok = best && best.w * best.h > w.w * w.h ? best : null;
    if (ok) Object.assign(w, ok, { squeezed: ok.w < nw || ok.h < nh });
  }
  return ws;
}

function snapAxis(v: number, size: number, total: number) {
  const far = total - M - size, mid = (total - size) / 2;
  if (Math.abs(v - M) < GRID) return M;
  if (Math.abs(v - far) < GRID) return far;
  if (Math.abs(v - mid) < GRID / 2) return mid;
  return clamp(Math.round(v / GRID) * GRID, M, Math.max(M, far));
}

const toFrac = (w: Widget, S: Size): Snap => ({
  id: w.id, w: w.w, h: w.h, region: w.region, stretch: w.stretch, compact: w.compact,
  fx: clamp((w.x - M) / Math.max(1, S.W - 2 * M - w.w), 0, 1),
  fy: clamp((w.y - M) / Math.max(1, S.H - 2 * M - w.h), 0, 1),
});
function fromFrac(s: Snap, S: Size): Rect {
  const w = s.stretch ? S.W - 2 * M : Math.min(s.w, S.W - 2 * M);
  const h = Math.min(s.h, S.H - 2 * M);
  return { w, h, x: M + s.fx * Math.max(0, S.W - 2 * M - w), y: M + s.fy * Math.max(0, S.H - 2 * M - h) };
}

// ---------- language (a mock: keyword matching) ----------

function parseRegion(t: string): { region: Region; stretch: boolean } | null {
  const stretch = /(along|across) the (top|bottom)/.test(t);
  const table: [RegExp, Region][] = [
    [/top[ -]?left|upper left/, "top-left"], [/top[ -]?right|upper right/, "top-right"],
    [/bottom[ -]?left|lower left/, "bottom-left"], [/bottom[ -]?right|lower right/, "bottom-right"],
    [/\b(cent(re|er)|middle)\b/, "centre"], [/\bleft\b/, "left"], [/\bright\b/, "right"],
    [/\btop\b/, "top"], [/\bbottom\b/, "bottom"],
  ];
  for (const [re, r] of table) if (re.test(t)) return { region: r, stretch };
  return null;
}
function kindsIn(t: string): Kind[] {
  const out: Kind[] = [];
  if (/timer/.test(t)) out.push("timer");
  if (/recipe|frittata/.test(t)) out.push("recipe");
  if (/email|todd|draft/.test(t)) out.push("email");
  if (/weather/.test(t)) out.push("weather");
  if (/shopping|list\b/.test(t)) out.push("shopping");
  if (/next week|\bweek\b/.test(t)) out.push("week");
  else if (/calendar|today/.test(t)) out.push("today");
  if (/ideas|dinners/.test(t)) out.push("ideas");
  return out;
}
function surfIn(t: string): SurfId | null {
  if (/kitchen|tablet/.test(t)) return "kitchen";
  if (/phone/.test(t)) return "phone";
  if (/speaker|living room/.test(t)) return "speaker";
  if (/desk|office|computer|pc\b/.test(t)) return "desk";
  return null;
}
const nameOf = (k: Kind) => ({ weather: "weather", today: "calendar", shopping: "shopping list", ideas: "dinner ideas", recipe: "recipe", timer: "timer", email: "email to Todd", week: "calendar for next week" })[k];

// ---------- time ----------

const BASE_MIN = 18 * 60 + 40; // Fri 9 Oct, 18:40
const hm = (min: number) => `${Math.floor(min / 60) % 24}:${String(Math.floor(min % 60)).padStart(2, "0")}`;
const t24 = (iso: string) => iso.slice(11, 16).replace(/^0/, "");
const mmss = (ms: number) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

// ============================================================================

export default function Variant() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [S, setS] = useState<Size>({ W: 1200, H: 640 });
  const sRef = useRef(S);
  const stacked = S.W < 640;
  const here: SurfId = stacked ? "phone" : "desk";
  const [dark, setDark] = useState(() => typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches);
  const [expert, setExpert] = useState(false);
  const mount = useRef(Date.now());
  const [tick, setTick] = useState(() => Date.now());
  const clockMin = BASE_MIN + (tick - mount.current) / 60000;

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const zc = useRef(10);
  const ready = useRef(false);
  const lastPlaced = useRef<Kind | null>(null);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [layoutName, setLayoutName] = useState("Friday evening");
  const [dirty, setDirty] = useState(false);
  const [hint, setHint] = useState<{ rect: Rect; label: string; key: number } | null>(null);
  const [flash, setFlash] = useState<Kind | null>(null);

  // content state that survives moves between Surfaces
  const [timer, setTimer] = useState({ total: 25 * 60000, endsAt: null as number | null, left: 25 * 60000 });
  const [shop, setShop] = useState([{ name: "Milk", done: false }, { name: "Fresh basil", done: false }, { name: "Coffee beans", done: false }, { name: "Dish soap", done: true }]);
  const [emailBody, setEmailBody] = useState(() => {
    const c = conversation.find((m) => m.card?.type === "emailDraft")?.card;
    return c && c.type === "emailDraft" ? c.body.replace("next week", "over coffee on Tuesday") : "";
  });
  const [approved, setApproved] = useState(false);
  const [stepsDone, setStepsDone] = useState<number[]>([]);
  const [routinesOn, setRoutinesOn] = useState<Record<string, boolean>>(() => Object.fromEntries(routines.map((r) => [r.id, r.enabled])));

  // other Surfaces
  const [remote, setRemote] = useState<Record<SurfId, Widget[]>>({ desk: [], kitchen: [], phone: [], speaker: [] });
  const [confirm, setConfirm] = useState<{ id: Kind; dest: SurfId } | null>(null);
  const [pulse, setPulse] = useState<SurfId | null>(null);
  const [surfMenu, setSurfMenu] = useState<SurfId | null>(null);
  const [moveMenu, setMoveMenu] = useState<Kind | null>(null);
  const tileRefs = useRef<Partial<Record<SurfId, HTMLElement | null>>>({});
  const dropRefs = useRef<Partial<Record<SurfId, HTMLElement | null>>>({});

  // dialogue
  const [log, setLog] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [used, setUsed] = useState<string[]>([]);
  const [panel, setPanel] = useState<null | "schedule" | "settings">(null);
  const [layoutMenu, setLayoutMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // drag
  const drag = useRef<null | { id: Kind; mode: "move" | "resize"; sx: number; sy: number; o: Widget; base: Widget[] }>(null);
  const [dragging, setDragging] = useState<null | { id: Kind; mode: "move" | "resize"; region: Region; over: SurfId | null }>(null);

  useEffect(() => { const i = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(i); }, []);

  // Measure the Surface; first measurement lays out Alex's Friday evening.
  useLayoutEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const measure = () => {
      const next = { W: el.clientWidth, H: el.clientHeight };
      const prev = sRef.current;
      if (ready.current && prev.W === next.W && prev.H === next.H) return;
      sRef.current = next;
      setS(next);
      if (!ready.current) {
        ready.current = true;
        const t = Date.now();
        let list: Widget[] = [];
        const add = (id: Kind, region: Region, y?: number) => {
          const [w, h] = KINDS[id].size;
          const p = anchorPos(region, w, h, next);
          list.push({ id, x: p.x, y: y ?? p.y, w, h: Math.min(h, next.H - 2 * M), pinned: true, region, touched: t, born: t, z: ++zc.current });
          list = resolve(list, id, next);
        };
        add("weather", "top-left");
        add("today", "left", M + KINDS.weather.size[1] + GAP);
        add("shopping", "top-right");
        setWidgets(list);
        setLayouts([{ name: "Friday evening", items: list.map((w) => toFrac(w, next)), at: "Tue 6 Oct" }]);
        return;
      }
      setWidgets((ws) => ws.map((w) => {
        const r = fromFrac(toFrac(w, prev), next);
        return { ...w, ...r };
      }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Widgets that gave way or were closed leave after their fade-out.
  const hasLeaving = widgets.some((w) => w.leaving && !drag.current);
  useEffect(() => {
    if (!hasLeaving) return;
    const t = setTimeout(() => { if (!drag.current) setWidgets((prev) => relax(prev, sRef.current)); }, 600);
    return () => clearTimeout(t);
  }, [hasLeaving]);

  // Passing widgets fade away unless touched.
  const timerLeft = timer.endsAt ? Math.max(0, timer.endsAt - tick) : timer.left;
  const fades = (w: Widget) => !w.pinned && !(w.id === "timer" && timer.endsAt);
  useEffect(() => {
    const expired = widgets.filter((w) => !w.leaving && fades(w) && tick - w.touched > FADE_END).map((w) => w.id);
    if (expired.length) removeIds(expired, true);
    if (timer.endsAt && timerLeft === 0) setTimer((x) => ({ ...x, endsAt: null, left: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  // ---------- widget operations ----------

  const showHint = (rect: Rect, label: string) => {
    if (stackedNow()) return;
    setHint({ rect, label, key: Date.now() });
    setTimeout(() => setHint((h) => (h && Date.now() - h.key > 1500 ? null : h)), 1700);
  };
  const stackedNow = () => sRef.current.W < 640;
  const flashIt = (id: Kind) => {
    setFlash(id);
    setTimeout(() => setFlash((f) => (f === id ? null : f)), 1400);
    if (stackedNow()) setTimeout(() => document.getElementById(`v01-w-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
  };

  function place(id: Kind, opts: { region?: Region; stretch?: boolean; near?: Kind; keep?: boolean; from?: Widget } = {}) {
    const S = sRef.current;
    const t = Date.now();
    let hintRect: Rect | null = null, hintLabel = "";
    setWidgets((prev) => {
      const existing = opts.from ?? prev.find((w) => w.id === id && !w.leaving);
      let [w, h] = existing ? [existing.w, existing.h] : KINDS[id].size;
      const region = opts.region ?? existing?.region ?? KINDS[id].region;
      const stretch = opts.stretch ?? (opts.region ? false : existing?.stretch ?? id === "week");
      if (stretch) w = S.W - 2 * M;
      w = Math.min(w, S.W - 2 * M);
      h = Math.min(h, S.H - 2 * M);
      let pos = anchorPos(region, w, h, S);
      let finalRegion = region;
      const ref = opts.near ? prev.find((x) => x.id === opts.near && !x.leaving) : undefined;
      if (ref) {
        const c: Rect[] = [
          { x: ref.x - GAP - w, y: ref.y, w, h }, { x: ref.x + ref.w + GAP, y: ref.y, w, h },
          { x: ref.x, y: ref.y + ref.h + GAP, w, h }, { x: ref.x, y: ref.y - GAP - h, w, h },
        ];
        const pick = c.find((r) => inBounds(r, S) && !prev.some((o) => o.id !== ref.id && o.id !== id && !o.leaving && o.pinned && hit(r, o))) ?? c.find((r) => inBounds(r, S)) ?? c[0];
        pos = { x: clamp(pick.x, M, S.W - M - w), y: clamp(pick.y, M, S.H - M - h) };
        finalRegion = regionAt(pos.x + w / 2, pos.y + h / 2, S);
        hintRect = { x: pos.x - 8, y: pos.y - 8, w: w + 16, h: h + 16 };
        hintLabel = `next to the ${nameOf(ref.id)}`;
      } else {
        hintRect = regionRect(region, S, stretch);
        hintLabel = stretch ? `along the ${parts(region)[0]}` : regionLabel(region);
      }
      const nw: Widget = {
        id, x: pos.x, y: pos.y, w, h, region: finalRegion, stretch, compact: existing?.compact,
        pinned: opts.keep ?? existing?.pinned ?? false, touched: t, born: existing?.born ?? t, z: (zc.current = Math.max(zc.current, ...prev.map((x) => x.z)) + 1),
      };
      return resolve(prev.filter((x) => x.id !== id).concat(nw), id, S);
    });
    lastPlaced.current = id;
    setDirty(true);
    queueMicrotask(() => { if (hintRect) showHint(hintRect, hintLabel); });
    flashIt(id);
  }

  function removeIds(ids: Kind[], silent = false) {
    setWidgets((prev) => prev.map((w) => (ids.includes(w.id) ? { ...w, leaving: true } : w)));
    if (!silent) setDirty(true);
  }
  const touch = (id: Kind, force = false) => {
    const t = Date.now();
    setWidgets((prev) => {
      const w = prev.find((x) => x.id === id);
      if (!w || (!force && t - w.touched < 4000)) return prev;
      return prev.map((x) => (x.id === id ? { ...x, touched: t } : x));
    });
  };
  const setPinned = (id: Kind, pinned: boolean) => { setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, pinned, touched: Date.now() } : w))); setDirty(true); };
  function resizeTo(id: Kind, compact: boolean) {
    const S = sRef.current;
    setWidgets((prev) => {
      const w = prev.find((x) => x.id === id && !x.leaving);
      if (!w) return prev;
      const [nw, nh] = compact ? COMPACT[id] ?? [Math.round(w.w * 0.75), Math.round(w.h * 0.75)] : KINDS[id].size;
      const [row, col] = parts(w.region);
      const x = col === "right" ? w.x + w.w - nw : col === "mid" ? w.x + (w.w - nw) / 2 : w.x;
      const y = row === "bottom" ? w.y + w.h - nh : row === "mid" ? w.y + (w.h - nh) / 2 : w.y;
      const next = { ...w, w: nw, h: nh, x: clamp(x, M, S.W - M - nw), y: clamp(y, M, S.H - M - nh), compact, touched: Date.now() };
      return resolve(prev.map((o) => (o.id === id ? next : o)), id, S);
    });
    setDirty(true);
    flashIt(id);
  }

  // ---------- other Surfaces ----------

  function moveTo(id: Kind, dest: SurfId, confirmed = false): string {
    const d = surf(dest);
    if (dest === here) return `The ${nameOf(id)} is already here.`;
    if (!d.screen && id !== "timer") return `The speaker has no screen. Only a timer can go there.`;
    if (KINDS[id].private && d.shared && !confirmed) {
      setConfirm({ id, dest });
      return `That's private. Confirm on your phone to show it on the ${d.name.toLowerCase()}.`;
    }
    const w = widgets.find((x) => x.id === id && !x.leaving);
    const S = sRef.current;
    const stored: Widget = w ?? (() => { const [ww, hh] = KINDS[id].size; const p = anchorPos(KINDS[id].region, ww, hh, S); return { id, ...p, w: ww, h: hh, region: KINDS[id].region, pinned: false, touched: Date.now(), born: Date.now(), z: 0 }; })();
    if (w) {
      // fly towards the Surface's tile in the top bar
      const tile = tileRefs.current[dest]?.getBoundingClientRect();
      const sr = surfaceRef.current?.getBoundingClientRect();
      const fly = tile && sr ? { x: tile.left - sr.left, y: tile.top - sr.top } : { x: w.x, y: -40 };
      setWidgets((prev) => prev.map((x) => (x.id === id ? { ...x, leaving: true, fly } : x)));
    }
    setRemote((r) => {
      const n = { ...r } as Record<SurfId, Widget[]>;
      (Object.keys(n) as SurfId[]).forEach((k) => (n[k] = n[k].filter((x) => x.id !== id)));
      n[dest] = [...n[dest], { ...stored, leaving: false, fly: undefined }];
      return n;
    });
    setPulse(dest);
    setTimeout(() => setPulse((p) => (p === dest ? null : p)), 1900);
    setDirty(true);
    if (id === "timer" && dest === "speaker") return `The timer is on the living room speaker now. It will say when it's done.`;
    return `The ${nameOf(id)} is on the ${d.name === "Alex's phone" ? "your phone" : d.name.toLowerCase()} now.${id === "timer" ? " It keeps running." : ""}`.replace("the your", "your");
  }
  function pull(id: Kind, from?: SurfId): string {
    const src = from ?? (Object.keys(remote) as SurfId[]).find((k) => remote[k].some((x) => x.id === id));
    const stored = src ? remote[src].find((x) => x.id === id) : undefined;
    if (src) setRemote((r) => ({ ...r, [src]: r[src].filter((x) => x.id !== id) }));
    place(id, { from: stored, region: stored?.region });
    const where = src ? (src === "phone" ? "your phone" : `the ${surf(src).name.toLowerCase()}`) : null;
    return where ? `Brought the ${nameOf(id)} here from ${where}.` : `Here's the ${nameOf(id)}.`;
  }
  const whereIs = (id: Kind) => (Object.keys(remote) as SurfId[]).find((k) => remote[k].some((x) => x.id === id));

  // ---------- commands ----------

  function interpret(raw: string): Omit<Msg, "from" | "at"> {
    const t = raw.toLowerCase().trim();
    const reg = parseRegion(t);
    const kinds = kindsIn(t);
    const k = kinds[0];
    const onSurface = (id: Kind) => widgets.some((w) => w.id === id && !w.leaving);
    const meta = (helper: string) => `${helper} · on this network · ${(0.3 + Math.random() * 0.6).toFixed(1)} s`;

    if (/settings|preferences/.test(t)) { setPanel("settings"); return { text: "Settings are open on the right.", meta: meta("Chief") }; }
    if (/schedule|reminders|routines/.test(t)) { setPanel("schedule"); return { text: "Your schedule: 4 reminders, 5 routines.", meta: meta("Chief") }; }
    if (/dark mode|light mode/.test(t)) { setDark(/dark/.test(t)); return { text: /dark/.test(t) ? "Dark it is." : "Light it is." }; }

    // layouts
    const save = t.match(/save (?:this|it)?\s*(?:as )?(?:my |the |a )?(.+?)(?: screen| layout)?$/);
    if (/^save\b/.test(t) && save) {
      const nm = save[1].replace(/^(this|it)$/, "my screen").trim();
      const title = nm.charAt(0).toUpperCase() + nm.slice(1);
      const S = sRef.current;
      const items = widgets.filter((w) => !w.leaving).map((w) => toFrac(w, S));
      setLayouts((ls) => [...ls.filter((l) => l.name.toLowerCase() !== title.toLowerCase()), { name: title, items, at: `Today ${hm(clockMin)}` }]);
      setWidgets((ws) => ws.map((w) => ({ ...w, pinned: true })));
      setLayoutName(title); setDirty(false);
      return { text: `Saved as "${title}" with ${items.length} ${items.length === 1 ? "thing" : "things"}, all kept. Say "Show my ${nm} screen" to bring it back.`, meta: meta("Chief") };
    }
    const recall = t.match(/(?:show|bring back|open|switch to|go to) (?:me )?(?:my |the )?(.+?) (?:screen|layout)$/);
    if (recall) {
      const l = layouts.find((x) => x.name.toLowerCase().includes(recall[1].trim()) || recall[1].includes(x.name.toLowerCase()));
      if (l) { recallLayout(l); return { text: `Back to "${l.name}".`, meta: meta("Chief") }; }
      if (!/schedule/.test(t)) return { text: `I don't have a screen called "${recall[1]}". You have ${layouts.map((x) => `"${x.name}"`).join(" and ")}.` };
    }

    // moves between Surfaces: push
    const dest = surfIn(t);
    if (/^(move|send|put|show|throw)\b/.test(t) && dest && dest !== here && /\bto\b|\bon\b/.test(t) && !/\bfrom\b/.test(t)) {
      const id = k ?? lastPlaced.current;
      if (!id) return { text: "Which one? Say, for example, the recipe or the timer." };
      const text = moveTo(id, dest);
      const ok = !/private|no screen|already/.test(text);
      return { text, meta: meta("Chief"), action: ok ? { label: "Bring it back", cmd: `Bring the ${nameOf(id)} back` } : undefined };
    }
    // pull
    if (k && (/\bback\b/.test(t) || /\bfrom (the |my )?(kitchen|tablet|phone|speaker|desk|office)/.test(t))) {
      const src = /\bfrom\b/.test(t) ? surfIn(t.split(/\bfrom\b/)[1]) ?? undefined : undefined;
      if (KINDS[k].private && surf(here).shared) { setConfirm({ id: k, dest: here }); return { text: "That's private. Confirm on your phone to show it here." }; }
      return { text: pull(k, src ?? undefined), meta: meta("Chief") };
    }

    // clearing and removing
    if (/^clear|clear (everything|all)|remove everything|close everything/.test(t)) {
      const keep = /except|but\b/.test(t) ? kindsIn(t.split(/except|but\b/)[1]) : [];
      const gone = widgets.filter((w) => !w.leaving && !keep.includes(w.id)).map((w) => w.id);
      removeIds(gone);
      return { text: keep.length ? `Cleared ${gone.length} things. The ${keep.map(nameOf).join(" and ")} stays.` : `Cleared ${gone.length} things.`, meta: meta("Chief") };
    }
    if (/\b(remove|get rid of|close|hide|dismiss|take away)\b/.test(t) && k) {
      if (!onSurface(k)) return { text: `The ${nameOf(k)} isn't on this screen.` };
      removeIds([k]);
      return { text: k === "shopping" ? "Removed the shopping list. It's still on your phone." : `Removed the ${nameOf(k)}.`, meta: meta("Chief") };
    }
    if (/smaller|shrink|compact|tiny/.test(t) && k) {
      if (!onSurface(k)) return { text: `The ${nameOf(k)} isn't on this screen.` };
      resizeTo(k, true); return { text: `Made the ${nameOf(k)} smaller.`, meta: meta("Chief") };
    }
    if (/bigger|larger|full size|normal size/.test(t) && k) {
      if (!onSurface(k)) return { text: `The ${nameOf(k)} isn't on this screen.` };
      resizeTo(k, false); return { text: `Made the ${nameOf(k)} bigger.`, meta: meta("Chief") };
    }
    if (/\b(unpin|let .* go|stop keeping|don't keep)\b/.test(t) && k) { setPinned(k, false); return { text: `The ${nameOf(k)} will fade when you stop using it.` }; }
    if (/^(keep|pin)\b/.test(t) && k) { setPinned(k, true); return { text: `The ${nameOf(k)} stays until you remove it.` }; }
    if (/^(move|put|place)\b/.test(t) && k && onSurface(k) && reg) {
      place(k, { region: reg.region, stretch: reg.stretch });
      return { text: `Moved the ${nameOf(k)} to the ${regionLabel(reg.region)}.`, meta: meta("Chief") };
    }

    // email approval
    if (/approve/.test(t)) { setApproved(true); return { text: "Approved. It goes out Monday at 7:30.", meta: meta("Writer") }; }

    // showing things
    const keep = /\b(keep|stay|pin)\b/.test(t);
    const near = /next to|beside|by it|alongside/.test(t) ? kindsIn(t.split(/next to|beside|alongside/)[1] ?? "")[0] ?? lastPlaced.current ?? undefined : undefined;
    const elsewhere = (id: Kind) => { const s = whereIs(id); return s ? ` It was on the ${surf(s).name.toLowerCase()}.` : ""; };
    const takeHome = (id: Kind) => { const s = whereIs(id); if (s) setRemote((r) => ({ ...r, [s]: r[s].filter((x) => x.id !== id) })); };

    if (/cook|dinner|eat tonight/.test(t) && !k) {
      place("ideas", { region: reg?.region ?? "centre" });
      return { text: "Three quick ones. The frittata fits what's in your fridge.", meta: meta("Chief") };
    }
    if (k === "timer" || /\btimer\b/.test(t)) {
      const mins = Number(t.match(/(\d+)\s*(min|minute)/)?.[1] ?? 25);
      setTimer({ total: mins * 60000, endsAt: Date.now() + mins * 60000, left: mins * 60000 });
      if (whereIs("timer")) return { text: `${mins} minute timer running on the ${surf(whereIs("timer")!).name.toLowerCase()}. Ends at ${hm(clockMin + mins)}.` };
      place("timer", { region: reg?.region, near: near && near !== "timer" ? near : undefined, keep });
      return { text: `${mins} minute timer running${near ? ` next to the ${nameOf(near)}` : ""}. Ends at ${hm(clockMin + mins)}.`, meta: meta("Chief") };
    }
    if (k === "recipe") {
      const note = elsewhere("recipe"); takeHome("recipe");
      place("recipe", { region: reg?.region ?? "right", keep });
      return { text: `Spinach and feta frittata, on the ${regionLabel(reg?.region ?? "right")}.${keep ? " It stays until you remove it." : ""}${note}`, meta: meta("Chief") };
    }
    if (k === "email") {
      const note = elsewhere("email"); takeHome("email");
      place("email", { region: reg?.region ?? "centre", keep });
      return { text: approved ? `The email to Todd. Approved, goes out Monday 7:30.${note}` : `The draft to Todd. It goes out Monday at 7:30 once you approve it.${note}`, meta: meta("Writer") };
    }
    if (k === "week") {
      place("week", { region: reg?.region ?? "bottom", stretch: reg ? reg.stretch : true, keep });
      return { text: "Next week: swimming Saturday, lunch Sunday, coffee with Todd Tuesday, dentist Wednesday.", meta: meta("Chief") };
    }
    if (k) { const note = elsewhere(k); takeHome(k); place(k, { region: reg?.region, stretch: reg?.stretch, keep }); return { text: `Here's the ${nameOf(k)}${reg ? `, ${regionLabel(reg.region)}` : ""}.${note}`, meta: meta("Chief") }; }
    return { text: "I can't do that in this prototype. Try one of the suggestions." };
  }

  function recallLayout(l: Layout) {
    const S = sRef.current, t = Date.now();
    setWidgets((prev) => {
      const ids = l.items.map((i) => i.id);
      const kept = l.items.map((i) => {
        const old = prev.find((w) => w.id === i.id);
        return { id: i.id, ...fromFrac(i, S), region: i.region, stretch: i.stretch, compact: i.compact, pinned: true, touched: t, born: old?.born ?? t, z: old?.z ?? ++zc.current } as Widget;
      });
      const leaving = prev.filter((w) => !ids.includes(w.id)).map((w) => ({ ...w, leaving: true }));
      return [...kept, ...leaving];
    });
    setRemote((r) => { const n = { ...r }; (Object.keys(n) as SurfId[]).forEach((k) => (n[k] = n[k].filter((x) => !l.items.some((i) => i.id === x.id)))); return n; });
    setLayoutName(l.name); setDirty(false); setLayoutMenu(false);
  }

  function run(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setInput("");
    if (SCRIPT.includes(clean) || clean === PHONE_EXTRA) setUsed((u) => (u.includes(clean) ? u : [...u, clean]));
    const at = hm(clockMin);
    setLog((l) => [...l, { from: "you", text: clean, at }]);
    setBusy(true);
    setTimeout(() => {
      const r = interpret(clean);
      setLog((l) => [...l, { from: "hux", at, ...r }]);
      setBusy(false);
    }, 320);
  }
  const confirmOnPhone = (yes: boolean) => {
    if (!confirm) return;
    const { id, dest } = confirm;
    setConfirm(null);
    const at = hm(clockMin);
    if (!yes) { setLog((l) => [...l, { from: "hux", at, text: "Okay, the email stays private." }]); return; }
    const text = dest === here ? pull(id) : moveTo(id, dest, true);
    setLog((l) => [...l, { from: "hux", at, text: `Confirmed on your phone. ${text}`, meta: "Writer · approval from phone (personal device)", action: dest !== here ? { label: "Bring it back", cmd: `Bring the ${nameOf(id)} back` } : undefined }]);
  };
  function voice() {
    if (listening) return;
    setListening(true);
    const next = (stacked && !used.includes(PHONE_EXTRA) ? [PHONE_EXTRA] : []).concat(SCRIPT).find((s) => !used.includes(s)) ?? SCRIPT[0];
    let i = 0;
    const typer = setInterval(() => { i += 3; setInput(next.slice(0, i)); if (i >= next.length) clearInterval(typer); }, 40);
    setTimeout(() => { setListening(false); run(next); }, 1900);
  }

  // ---------- drag and resize ----------

  function startDrag(e: React.PointerEvent, id: Kind, mode: "move" | "resize") {
    if (stacked || e.button !== 0) return;
    if (mode === "move" && (e.target as HTMLElement).closest("button")) return;
    const w = widgets.find((x) => x.id === id);
    if (!w || w.leaving) return;
    e.preventDefault();
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    const z = (zc.current = Math.max(zc.current, ...widgets.map((x) => x.z)) + 1);
    const base = widgets.map((x) => (x.id === id ? { ...x, z, touched: Date.now() } : x));
    drag.current = { id, mode, sx: e.clientX, sy: e.clientY, o: { ...w, z }, base };
    setDragging({ id, mode, region: w.region, over: null });
    setMoveMenu(null);
  }
  function overTarget(e: React.PointerEvent): SurfId | null {
    for (const s of SURFS) {
      const el = dropRefs.current[s.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return s.id;
    }
    return null;
  }
  function onDragMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const S = sRef.current;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    const [minW, minH] = KINDS[d.id].min;
    const moved: Widget = d.mode === "move"
      ? { ...d.o, x: clamp(d.o.x + dx, M, S.W - M - d.o.w), y: clamp(d.o.y + dy, M - 60, S.H - M - d.o.h) }
      : { ...d.o, w: clamp(d.o.w + dx, minW, S.W - M - d.o.x), h: clamp(d.o.h + dy, minH, S.H - M - d.o.y), stretch: d.o.stretch && Math.abs(dx) < 4, compact: false };
    const over = d.mode === "move" ? overTarget(e) : null;
    const anchorAt = { ...moved, y: Math.max(M, moved.y) };
    setWidgets(over ? d.base.map((x) => (x.id === d.id ? moved : x)) : resolve(d.base.map((x) => (x.id === d.id ? anchorAt : x)), d.id, S).map((x) => (x.id === d.id ? moved : x)));
    setDragging({ id: d.id, mode: d.mode, region: regionAt(moved.x + moved.w / 2, moved.y + moved.h / 2, S), over });
  }
  function endDrag(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const over = d.mode === "move" ? overTarget(e) : null;
    setDragging(null);
    if (over && over !== here) {
      setWidgets(d.base);
      const text = moveTo(d.id, over);
      const ok = !/private|no screen|already/.test(text);
      setLog((l) => [...l, { from: "hux", at: hm(clockMin), text, action: ok ? { label: "Bring it back", cmd: `Bring the ${nameOf(d.id)} back` } : undefined }]);
      return;
    }
    const S = sRef.current;
    setWidgets((prev) => {
      const w = prev.find((x) => x.id === d.id);
      if (!w) return prev;
      const ww = w.stretch ? S.W - 2 * M : w.w;
      const snapped: Widget = d.mode === "move"
        ? { ...w, w: ww, x: w.stretch ? M : snapAxis(w.x, ww, S.W), y: snapAxis(Math.max(M, w.y), w.h, S.H) }
        : { ...w, w: Math.round(w.w / GRID) * GRID, h: Math.round(w.h / GRID) * GRID };
      snapped.w = Math.min(snapped.w, S.W - M - snapped.x);
      snapped.h = Math.min(snapped.h, S.H - M - snapped.y);
      snapped.region = regionAt(snapped.x + snapped.w / 2, snapped.y + snapped.h / 2, S);
      snapped.touched = Date.now();
      return resolve(prev.map((x) => (x.id === d.id ? snapped : x)), d.id, S);
    });
    lastPlaced.current = d.id;
    setDirty(true);
  }

  // ---------- rendering ----------

  const remaining = (() => {
    const order = stacked ? [PHONE_EXTRA, ...SCRIPT] : SCRIPT;
    return order;
  })();
  const nextStep = remaining.find((s) => !used.includes(s));
  const last = [...log].reverse().find((m) => m.from === "hux");
  const pendingEmail = !approved;
  const others = SURFS.filter((s) => s.id !== here);
  const timerRunning = !!timer.endsAt;

  const widgetBody = (w: Widget): ReactNode => {
    const narrow = stacked || w.w < 520;
    switch (w.id) {
      case "weather": return <WeatherBody compact={!!w.compact && !stacked} />;
      case "today": return <TodayBody />;
      case "shopping": return <ShoppingBody items={shop} onToggle={(i) => setShop((s) => s.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} />;
      case "ideas": return <IdeasBody onPick={(c) => run(c)} />;
      case "recipe": return <RecipeBody done={stepsDone} onStep={(i) => setStepsDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))} />;
      case "timer": return <TimerBody left={timerLeft} total={timer.total} running={timerRunning} endsAt={hm(clockMin + timerLeft / 60000)} compact={!!w.compact}
        onToggle={() => setTimer((x) => (x.endsAt ? { ...x, endsAt: null, left: Math.max(0, x.endsAt - Date.now()) } : { ...x, endsAt: Date.now() + (x.left || x.total), left: x.left || x.total }))}
        onReset={() => setTimer((x) => ({ ...x, endsAt: null, left: x.total }))} />;
      case "email": return <EmailBody body={emailBody} setBody={setEmailBody} approved={approved} onApprove={() => run("Approve the email to Todd")} />;
      case "week": return <WeekBody narrow={narrow} />;
    }
  };

  const renderWidget = (w: Widget) => {
    const k = KINDS[w.id];
    const Icon = k.icon;
    const age = tick - w.touched;
    const fading = fades(w);
    const op = w.leaving ? 0 : fading && age > FADE_START ? Math.max(0.28, 1 - (0.72 * (age - FADE_START)) / (FADE_END - FADE_START)) : 1;
    const lifted = dragging?.id === w.id;
    const style: React.CSSProperties = stacked
      ? { position: "relative", opacity: op, maxHeight: w.id === "recipe" || w.id === "email" ? "72vh" : undefined }
      : {
          transform: w.fly ? `translate(${w.fly.x}px, ${w.fly.y}px) scale(0.08)` : `translate(${w.x}px, ${w.y}px)`,
          transformOrigin: "top left", width: w.w, height: w.h, zIndex: lifted ? 9999 : w.z, opacity: lifted && dragging?.over ? 0.55 : op,
        };
    const cls = ["w", stacked && "stacked", lifted && "lifted", lifted && dragging?.mode === "resize" && "resizing", w.leaving && "leaving", w.fly && "flying", flash === w.id && "flash", !w.pinned && "passing"].filter(Boolean).join(" ");
    const fadeIn = fading ? Math.max(0, Math.round((FADE_END - age) / 1000)) : null;
    return (
      <div key={w.id} id={`v01-w-${w.id}`} className={cls} style={style} onPointerEnter={() => touch(w.id)} onPointerDown={() => touch(w.id, true)} onKeyDown={() => touch(w.id)}>
        <div className="w-in" style={stacked ? { maxHeight: style.maxHeight } : undefined}>
          <header onPointerDown={(e) => startDrag(e, w.id, "move")} onPointerMove={onDragMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
            <Icon size={14} strokeWidth={2} />
            <span className="title">{w.compact && w.id === "weather" ? "Berlin" : k.title}</span>
            {k.private && <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--faint)]" title="Only Alex can see this"><Lock size={11} />{w.w > 380 || stacked ? "Only Alex" : ""}</span>}
            {w.pinned && <Pin size={12} fill="currentColor" className="pinmark" />}
            <div className="ctl">
              <button className={`ib pin ${w.pinned ? "on" : ""}`} title={w.pinned ? "Kept. Click to let it fade" : "Keep"} onClick={() => setPinned(w.id, !w.pinned)}><Pin size={14} fill={w.pinned ? "currentColor" : "none"} /></button>
              <button className="ib" title="Move to another screen" onClick={() => setMoveMenu(moveMenu === w.id ? null : w.id)}><Send size={14} /></button>
              <button className="ib" title="Close" onClick={() => removeIds([w.id])}><X size={14} /></button>
            </div>
          </header>
          {moveMenu === w.id && (
            <div className="pop absolute right-2 top-9 z-10 w-52 p-1.5">
              {others.map((s) => {
                const blocked = !s.screen && w.id !== "timer";
                return (
                  <button key={s.id} disabled={blocked} onClick={() => { setMoveMenu(null); const text = moveTo(w.id, s.id); setLog((l) => [...l, { from: "hux", at: hm(clockMin), text, action: /private|no screen/.test(text) ? undefined : { label: "Bring it back", cmd: `Bring the ${nameOf(w.id)} back` } }]); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-[var(--card2)] disabled:opacity-40">
                    <s.icon size={14} className="text-[var(--muted)]" />
                    <span className="flex-1">{s.name}</span>
                    {KINDS[w.id].private && s.shared && <Lock size={12} className="text-[var(--faint)]" />}
                  </button>
                );
              })}
            </div>
          )}
          <div className="body">{widgetBody(w)}</div>
          {expert && (
            <footer className="mono">
              {w.region}{w.stretch ? " · stretched" : ""} · {Math.round(w.x)},{Math.round(w.y)} · {Math.round(w.w)}×{Math.round(w.h)} · {w.pinned ? "kept" : `passing · fades in ${fadeIn}s`}
            </footer>
          )}
          {!stacked && <div className="rs" onPointerDown={(e) => startDrag(e, w.id, "resize")} onPointerMove={onDragMove} onPointerUp={endDrag} onPointerCancel={endDrag} />}
        </div>
      </div>
    );
  };

  const RANK: Record<Region, number> = { "top-left": 0, top: 1, "top-right": 2, left: 3, centre: 4, right: 5, "bottom-left": 6, bottom: 7, "bottom-right": 8 };
  const stackOrder = [...widgets].sort((a, b) => RANK[a.region] - RANK[b.region] || a.born - b.born);
  const chips = stacked ? [PHONE_EXTRA, ...SCRIPT] : SCRIPT;

  return (
    <div className={`v01 ${dark ? "dark" : ""} relative flex h-full flex-col overflow-hidden`} onClick={(e) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".pop, .ib, .tile, .lm")) { setMoveMenu(null); setSurfMenu(null); setLayoutMenu(false); }
    }}>
      {/* ---------- top bar ---------- */}
      <div className={`relative z-30 flex h-12 flex-none items-center px-3 sm:px-4 ${stacked ? "gap-0.5" : "gap-2"}`}>
        <div className={`items-center gap-2 text-[15px] font-bold tracking-tight ${stacked ? "hidden" : "flex"}`}>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--text)] text-[11px] text-[var(--bg)]">h</span>
          {!stacked && <span>hux</span>}
        </div>
        <span className="whitespace-nowrap text-[12px] text-[var(--faint)]" title="This screen">
          {surf(here).name}{expert ? ` · ${here === "desk" ? "left screen" : "personal"}` : ""}
        </span>
        <div className="relative">
          <button className="lm flex h-7 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-[12.5px] font-medium text-[var(--muted)] hover:bg-[var(--card)]" onClick={() => setLayoutMenu((v) => !v)}>
            <span className={stacked ? "max-w-[70px] truncate" : ""}>{layoutName}</span>{dirty && !stacked && <span className="text-[var(--faint)]">, changed</span>}<ChevronDown size={13} />
          </button>
          {layoutMenu && (
            <div className="pop absolute left-0 top-9 w-64 p-1.5">
              <div className="label px-2 pb-1 pt-1">Saved screens</div>
              {layouts.map((l) => (
                <button key={l.name} onClick={() => recallLayout(l)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-[var(--card2)]">
                  <span>{l.name}</span>
                  <span className="text-[11px] text-[var(--faint)]">{expert ? `${l.items.length} widgets · ${l.at}` : `${l.items.length} things`}</span>
                </button>
              ))}
              <button className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-[13px] text-[var(--accent)] hover:bg-[var(--card2)]" onClick={() => { setLayoutMenu(false); setInput("Save this as my "); inputRef.current?.focus(); }}>
                Save this arrangement
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* other Surfaces, live */}
        <div className="flex items-center gap-0.5">
          {others.map((s) => {
            const items = remote[s.id];
            return (
              <div key={s.id} className="relative">
                <button ref={(el) => { tileRefs.current[s.id] = el; }} className={`tile ${pulse === s.id ? "pulse" : ""}`} style={stacked ? { padding: "0 5px" } : undefined} title={s.name} onClick={() => setSurfMenu(surfMenu === s.id ? null : s.id)}>
                  <s.icon size={14} />
                  {!stacked && <span className="hidden lg:inline">{s.short}</span>}
                  {items.length > 0 && <span className="dot">{items.some((x) => x.id === "timer") && timerRunning && !stacked ? mmss(timerLeft) : items.length}</span>}
                </button>
                {surfMenu === s.id && (
                  <div className="pop absolute right-0 top-9 w-64 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold">{s.name}</span>
                      <span className="text-[11px] text-[var(--faint)]">{s.shared ? "Shared" : "Only Alex"}</span>
                    </div>
                    {expert && <div className="mono mt-0.5 text-[var(--faint)]">{s.expert} · online</div>}
                    <div className="mt-2 flex flex-col gap-1.5">
                      {items.length === 0 && <div className="text-[12.5px] text-[var(--faint)]">Nothing from here</div>}
                      {items.map((x) => {
                        const I = KINDS[x.id].icon;
                        return (
                          <div key={x.id} className="flex items-center gap-2 rounded-lg bg-[var(--card2)] px-2 py-1.5 text-[13px]">
                            <I size={13} className="text-[var(--muted)]" />
                            <span className="flex-1">{KINDS[x.id].title}{x.id === "timer" ? ` · ${mmss(timerLeft)}` : ""}</span>
                            <button className="flex items-center gap-1 text-[12px] font-semibold text-[var(--accent)]" onClick={() => { setSurfMenu(null); run(`Bring the ${nameOf(x.id)} back`); }}>
                              <Undo2 size={12} />Bring back
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {!stacked && <div className="mt-2 text-[11.5px] text-[var(--faint)]">Drag a widget up here to move it.</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!stacked && <span className="mx-1 h-4 w-px bg-[var(--line)]" />}
        {!stacked && <span className="text-[12px] tabular-nums text-[var(--muted)]">Fri 9 Oct · {hm(clockMin)}</span>}
        <button className="ib" title="Schedule" onClick={() => setPanel(panel === "schedule" ? null : "schedule")}><CalendarClock size={15} /></button>
        <button className="ib" title="Settings" onClick={() => setPanel(panel === "settings" ? null : "settings")}><Settings size={15} /></button>
        <button className="ib" title={dark ? "Light" : "Dark"} onClick={() => setDark((d) => !d)}>{dark ? <Sun size={15} /> : <Moon size={15} />}</button>
        <button className={`h-6 rounded-md px-1.5 text-[11px] font-semibold ${expert ? "bg-[var(--text)] text-[var(--bg)]" : "text-[var(--faint)] hover:text-[var(--text)]"}`} onClick={() => setExpert((v) => !v)} title="Expert mode">
          {expert ? "Expert" : "Simple"}
        </button>
      </div>

      {/* ---------- the Surface ---------- */}
      <div ref={surfaceRef} className={`surface relative isolate min-h-0 flex-1 ${dragging?.mode === "move" ? "is-dragging" : ""} ${stacked ? "overflow-y-auto" : "overflow-visible"}`}>
        {!stacked && dragging?.mode === "move" && !dragging.over && REGIONS.map((r) => {
          const rr = regionRect(r, S);
          return <div key={r} className={`guide ${dragging.region === r ? "on" : ""}`} style={{ left: rr.x, top: rr.y, width: rr.w, height: rr.h }}><span>{regionLabel(r)}</span></div>;
        })}
        {!stacked && dragging?.mode === "move" && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-[10000] flex -translate-x-1/2 gap-3">
            {others.map((s) => {
              const blocked = !s.screen && dragging.id !== "timer";
              const priv = KINDS[dragging.id].private && s.shared;
              return (
                <div key={s.id} ref={(el) => { dropRefs.current[s.id] = el; }} className={`drop flex w-36 flex-col items-center gap-1 px-3 py-3 ${dragging.over === s.id && !blocked ? "over" : ""} ${blocked ? "no" : ""}`}>
                  <s.icon size={18} className="text-[var(--muted)]" />
                  <span className="text-[12px] font-semibold">{s.name}</span>
                  <span className="text-[11px] text-[var(--faint)]">{blocked ? "No screen" : priv ? "Asks your phone" : s.shared ? "Shared" : "Only Alex"}</span>
                </div>
              );
            })}
          </div>
        )}
        {hint && !stacked && <div key={hint.key} className="hint" style={{ left: hint.rect.x, top: hint.rect.y, width: hint.rect.w, height: hint.rect.h }}><span>{hint.label}</span></div>}

        {stacked ? <div className="flex flex-col gap-3 p-3 pb-6">{stackOrder.map(renderWidget)}</div> : widgets.map(renderWidget)}

        {confirm && (
          <div className={`pop z-[10001] w-72 p-3 ${stacked ? "fixed left-1/2 top-16 -translate-x-1/2" : "absolute bottom-4 right-4"}`} style={{ animation: "v01-in .4s" }}>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)]"><Smartphone size={13} />On Alex's phone</div>
            <div className="mt-1.5 text-[13.5px]">Show "Home battery options" on the {confirm.dest === here ? surf(here).name.toLowerCase() : surf(confirm.dest).name.toLowerCase()}? Anyone in the kitchen can read it.</div>
            <div className="mt-2.5 flex gap-2">
              <button className="btn primary" onClick={() => confirmOnPhone(true)}>Show it</button>
              <button className="btn" onClick={() => confirmOnPhone(false)}>Keep private</button>
            </div>
            {expert && <div className="mono mt-2 text-[var(--faint)]">rule: private items on shared screens need a personal-device approval</div>}
          </div>
        )}
      </div>

      {/* ---------- dialogue ---------- */}
      <div className="relative z-20 mx-auto w-full max-w-[720px] flex-none px-3 pb-[60px] pt-2">
        {showLog && (
          <div className="pop absolute bottom-full left-3 right-3 mb-2 max-h-[50vh] overflow-y-auto p-3">
            <div className="label mb-2">Earlier today</div>
            {conversation.map((m) => (
              <div key={m.id} className={`mb-1.5 text-[13px] ${m.from === "member" ? "text-[var(--muted)]" : ""}`}>
                <span className="mr-2 tabular-nums text-[11px] text-[var(--faint)]">{t24(m.at)}</span>{m.from === "member" ? "You: " : ""}{m.text}
                {expert && <span className="mono ml-2 text-[var(--faint)]">{m.device}</span>}
              </div>
            ))}
            {log.length > 0 && <div className="label mb-2 mt-3">Now</div>}
            {log.map((m, i) => (
              <div key={i} className={`mb-1.5 text-[13px] ${m.from === "you" ? "text-[var(--muted)]" : ""}`}>
                <span className="mr-2 tabular-nums text-[11px] text-[var(--faint)]">{m.at}</span>{m.from === "you" ? "You: " : ""}{m.text}
                {expert && m.meta && <span className="mono ml-2 text-[var(--faint)]">{m.meta}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="mb-2 flex min-h-[22px] flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[13.5px]">
          {busy ? <span className="think text-[var(--faint)]">…</span> : last ? (
            <>
              <span>{last.text}</span>
              {last.action && <button className="flex items-center gap-1 text-[12.5px] font-semibold text-[var(--accent)]" onClick={() => run(last.action!.cmd)}><Undo2 size={12} />{last.action.label}</button>}
              {expert && last.meta && <span className="mono text-[var(--faint)]">{last.meta}</span>}
            </>
          ) : pendingEmail ? (
            <span className="flex items-center gap-2 text-[var(--muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--warn)]" />
              Email to Todd needs your OK before Monday 7:30.
              <button className="font-semibold text-[var(--accent)]" onClick={() => run("Show me the email to Todd")}>Review</button>
            </span>
          ) : null}
        </div>

        <div className="noscroll mb-2 flex gap-1.5 overflow-x-auto px-1">
          {pendingEmail && last && (
            <button className="chip flex items-center gap-1.5" style={{ borderColor: "var(--warn)", color: "var(--warn)", background: "var(--warn-soft)" }} onClick={() => run("Show me the email to Todd")}>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--warn)]" />Email to Todd needs your OK
            </button>
          )}
          {chips.map((c) => (
            <button key={c} className={`chip ${c === nextStep ? "next" : used.includes(c) ? "used" : ""}`} onClick={() => run(c)}>{c}</button>
          ))}
        </div>

        <form className="flex h-12 items-center gap-1 rounded-2xl border border-[var(--line)] bg-[var(--card)] pl-2 pr-1.5 shadow-[var(--shadow)]" onSubmit={(e) => { e.preventDefault(); run(input); }}>
          <button type="button" className="ib" title="History" onClick={() => setShowLog((v) => !v)}><MessageSquare size={16} /></button>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={listening ? "Listening…" : "Ask hux, or say where to put something"} className="h-full min-w-0 flex-1 px-1 text-[14.5px] placeholder:text-[var(--faint)]" />
          <button type="button" className={`grid h-9 w-9 place-items-center rounded-xl ${listening ? "listening bg-[var(--accent)] text-[var(--card)]" : "text-[var(--muted)] hover:bg-[var(--card2)]"}`} title="Talk" onClick={voice}><Mic size={17} /></button>
          <button type="submit" className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--text)] text-[var(--bg)] disabled:opacity-30" disabled={!input.trim()} title="Send"><ArrowUp size={17} /></button>
        </form>
      </div>

      {panel && (
        <aside className={`sheet absolute bottom-0 right-0 top-12 z-40 flex flex-col ${stacked ? "left-0" : "w-[420px]"}`}>
          <div className="flex h-12 flex-none items-center justify-between border-b border-[var(--line)] px-4">
            <span className="text-[15px] font-semibold">{panel === "schedule" ? "Schedule" : "Settings"}</span>
            <button className="ib" onClick={() => setPanel(null)} title="Close"><X size={16} /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {panel === "schedule" ? <ScheduleBody expert={expert} on={routinesOn} toggle={(id) => setRoutinesOn((r) => ({ ...r, [id]: !r[id] }))} />
              : <SettingsBody expert={expert} ask={(g) => { setPanel(null); setInput(`Change ${g.toLowerCase()}: `); setTimeout(() => inputRef.current?.focus(), 50); }} />}
          </div>
        </aside>
      )}
    </div>
  );
}

// ---------- widget bodies ----------

const weatherCard = conversation.find((m) => m.card?.type === "weather")!.card as Extract<NonNullable<(typeof conversation)[number]["card"]>, { type: "weather" }>;
const recipeCard = conversation.find((m) => m.card?.type === "recipe")!.card as Extract<NonNullable<(typeof conversation)[number]["card"]>, { type: "recipe" }>;
const emailCard = conversation.find((m) => m.card?.type === "emailDraft")!.card as Extract<NonNullable<(typeof conversation)[number]["card"]>, { type: "emailDraft" }>;

function WeatherBody({ compact }: { compact: boolean }) {
  const c = weatherCard;
  if (compact) return <div className="flex items-baseline gap-2"><span className="text-[26px] font-semibold leading-none">{c.temp}°</span><span className="text-[12px] text-[var(--muted)]">{c.now}</span></div>;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline gap-2">
        <span className="text-[34px] font-semibold leading-none">{c.temp}°</span>
        <span className="text-[13px] text-[var(--muted)]">{c.now} · {c.place}</span>
      </div>
      <div className="mt-1 text-[12px] text-[var(--muted)]">Tomorrow {c.high}° / {c.low}°, rain from 17:00</div>
      <div className="mt-auto grid grid-cols-5 gap-1 pt-2">
        {c.hourly.map((h) => (
          <div key={h.time} className="flex flex-col items-center gap-0.5 text-[11px]">
            <span className="text-[var(--faint)]">{h.time}:00</span>
            <span className="font-medium">{h.temp}°</span>
            <span className="h-1 w-full rounded-full bg-[var(--card2)]"><span className="block h-1 rounded-full bg-[var(--accent)]" style={{ width: `${h.rain}%` }} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TodayBody() {
  return (
    <div className="flex flex-col gap-2 text-[13px]">
      <div><div className="label">Today</div><div className="mt-0.5 text-[var(--muted)]">Nothing else planned</div></div>
      <div>
        <div className="label">Tomorrow</div>
        <div className="mt-0.5 flex gap-2"><span className="w-10 tabular-nums text-[var(--muted)]">{t24(calendar[0].start)}</span>{calendar[0].title}</div>
      </div>
      <div>
        <div className="label">Sunday</div>
        <div className="mt-0.5 flex gap-2"><span className="w-10 tabular-nums text-[var(--muted)]">{t24(calendar[1].start)}</span>{calendar[1].title}</div>
      </div>
    </div>
  );
}

function ShoppingBody({ items, onToggle }: { items: { name: string; done: boolean }[]; onToggle: (i: number) => void }) {
  return (
    <div className="flex flex-col gap-1 text-[13.5px]">
      {items.map((it, i) => (
        <button key={it.name} onClick={() => onToggle(i)} className="flex items-center gap-2 py-0.5 text-left">
          <span className={`grid h-4 w-4 place-items-center rounded-[5px] border ${it.done ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--card)]" : "border-[var(--faint)]"}`}>{it.done && <Check size={11} strokeWidth={3} />}</span>
          <span className={it.done ? "text-[var(--faint)] line-through" : ""}>{it.name}</span>
        </button>
      ))}
      <div className="mt-1 text-[11.5px] text-[var(--faint)]">Also on Alex's phone</div>
    </div>
  );
}

function IdeasBody({ onPick }: { onPick: (cmd: string) => void }) {
  const ideas = [
    { t: "Lemon garlic pasta", d: "15 min · needs lemons" },
    { t: "Vegetable frittata", d: "25 min · you have almost everything", best: true },
    { t: "Chickpea curry", d: "30 min · needs coconut milk" },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      {ideas.map((i) => (
        <button key={i.t} onClick={() => i.best && onPick("Show the frittata recipe on the right and keep it there")} className={`rounded-xl px-3 py-2 text-left ${i.best ? "bg-[var(--accent-soft)]" : "bg-[var(--card2)]"}`}>
          <div className="text-[13.5px] font-semibold">{i.t}</div>
          <div className={`text-[12px] ${i.best ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>{i.d}</div>
        </button>
      ))}
    </div>
  );
}

function RecipeBody({ done, onStep }: { done: number[]; onStep: (i: number) => void }) {
  const r = recipeCard;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-[17px] font-semibold leading-snug">{r.title}</div>
        <div className="text-[12.5px] text-[var(--muted)]">{r.time} · serves {r.serves}</div>
      </div>
      <div>
        <div className="label mb-1">You have</div>
        <div className="flex flex-wrap gap-1">{r.have.map((h) => <span key={h} className="rounded-md bg-[var(--card2)] px-1.5 py-0.5 text-[12px]">{h}</span>)}</div>
      </div>
      <div>
        <div className="label mb-1">Still need</div>
        <div className="flex flex-wrap gap-1">{r.need.map((h) => <span key={h} className="rounded-md bg-[var(--warn-soft)] px-1.5 py-0.5 text-[12px] text-[var(--warn)]">{h}</span>)}</div>
      </div>
      <ol className="flex flex-col gap-1.5">
        {r.steps.map((s, i) => (
          <li key={i}>
            <button onClick={() => onStep(i)} className={`flex gap-2 text-left text-[13.5px] leading-snug ${done.includes(i) ? "text-[var(--faint)]" : ""}`}>
              <span className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full text-[11px] font-semibold ${done.includes(i) ? "bg-[var(--accent)] text-[var(--card)]" : "bg-[var(--card2)] text-[var(--muted)]"}`}>{done.includes(i) ? <Check size={11} strokeWidth={3} /> : i + 1}</span>
              <span>{s}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TimerBody({ left, total, running, endsAt, compact, onToggle, onReset }: { left: number; total: number; running: boolean; endsAt: string; compact: boolean; onToggle: () => void; onReset: () => void }) {
  const p = total ? left / total : 0;
  const R = compact ? 26 : 34, C = 2 * Math.PI * R;
  return (
    <div className="flex h-full items-center gap-3">
      <svg width={R * 2 + 8} height={R * 2 + 8} className="flex-none -rotate-90">
        <circle cx={R + 4} cy={R + 4} r={R} fill="none" stroke="var(--card2)" strokeWidth="5" />
        <circle cx={R + 4} cy={R + 4} r={R} fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p)} style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <div className="min-w-0">
        <div className={`${compact ? "text-[22px]" : "text-[30px]"} font-semibold tabular-nums leading-none`}>{left === 0 ? "Done" : mmss(left)}</div>
        <div className="mt-1 text-[12px] text-[var(--muted)]">{left === 0 ? "Frittata" : running ? `Frittata · ends ${endsAt}` : "Frittata · paused"}</div>
        <div className="mt-2 flex gap-1">
          <button className="ib" style={{ background: "var(--card2)" }} onClick={onToggle} title={running ? "Pause" : "Start"}>{running ? <Pause size={13} /> : <Play size={13} />}</button>
          <button className="ib" style={{ background: "var(--card2)" }} onClick={onReset} title="Reset"><RotateCcw size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function EmailBody({ body, setBody, approved, onApprove }: { body: string; setBody: (s: string) => void; approved: boolean; onApprove: () => void }) {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="grid grid-cols-[64px_1fr] gap-y-1 border-b border-[var(--line)] pb-2 text-[13px]">
        <span className="text-[var(--faint)]">To</span><span>{emailCard.to}</span>
        <span className="text-[var(--faint)]">Subject</span><span className="font-semibold">{emailCard.subject}</span>
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[120px] flex-1 text-[13.5px] leading-relaxed" />
      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-2">
        {approved ? (
          <span className="flex items-center gap-1.5 text-[13px] text-[var(--accent)]"><Check size={14} />Approved · goes out Mon 12 Oct, 7:30</span>
        ) : (
          <>
            <span className="flex-1 text-[12.5px] text-[var(--muted)]">Goes out Mon 12 Oct, 7:30, after you approve</span>
            <button className="btn primary" onClick={onApprove}>Approve</button>
          </>
        )}
      </div>
    </div>
  );
}

const WEEK = [
  { key: "2026-10-10", label: "Sat 10" }, { key: "2026-10-11", label: "Sun 11" }, { key: "2026-10-12", label: "Mon 12" },
  { key: "2026-10-13", label: "Tue 13" }, { key: "2026-10-14", label: "Wed 14" }, { key: "2026-10-15", label: "Thu 15" }, { key: "2026-10-16", label: "Fri 16" },
];
const CAL_COLOR: Record<string, string> = { Family: "#81B29A", Work: "#3D7EA6", Personal: "#E07A5F" };

function WeekBody({ narrow }: { narrow: boolean }) {
  const extra = reminders.filter((r) => r.id === "r2" || r.id === "r4");
  if (narrow) {
    return (
      <div className="flex flex-col gap-1.5 text-[13px]">
        {calendar.map((e) => (
          <div key={e.id} className="flex items-center gap-2">
            <span className="h-2 w-2 flex-none rounded-full" style={{ background: CAL_COLOR[e.calendar] }} />
            <span className="w-24 flex-none text-[var(--muted)]">{WEEK.find((d) => d.key === e.start.slice(0, 10))?.label} · {t24(e.start)}</span>
            <span className="truncate">{e.title}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid h-full grid-cols-7 gap-1.5">
      {WEEK.map((d) => {
        const evs = calendar.filter((e) => e.start.startsWith(d.key));
        return (
          <div key={d.key} className="flex min-w-0 flex-col gap-1 rounded-xl bg-[var(--card2)] p-2">
            <span className={`text-[11.5px] font-semibold ${d.key.endsWith("12") ? "" : "text-[var(--muted)]"}`}>{d.label}</span>
            {evs.map((e) => (
              <div key={e.id} className="rounded-md bg-[var(--card)] px-1.5 py-1 text-[11.5px] leading-tight" style={{ borderLeft: `3px solid ${CAL_COLOR[e.calendar]}` }}>
                <div className="tabular-nums text-[var(--muted)]">{t24(e.start)}</div>
                <div className="truncate">{e.title}</div>
              </div>
            ))}
            {d.key === "2026-10-16" && extra[0] && <div className="truncate text-[11px] text-[var(--faint)]">9:00 Follow up with Todd</div>}
          </div>
        );
      })}
    </div>
  );
}

// ---------- the two predesigned screens ----------

function ScheduleBody({ expert, on, toggle }: { expert: boolean; on: Record<string, boolean>; toggle: (id: string) => void }) {
  const who = (id?: string) => household.members.find((m) => m.id === id);
  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="label mb-2">Reminders</div>
        <div className="flex flex-col gap-2">
          {reminders.map((r) => {
            const m = who(r.for);
            return (
              <div key={r.id} className="flex items-start gap-2.5 text-[13.5px]">
                <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: m?.color }}>{m?.initials}</span>
                <div><div>{r.title}</div><div className="text-[12px] text-[var(--muted)]">{r.when}{expert ? ` · ${r.whenKind}` : ""}</div></div>
              </div>
            );
          })}
        </div>
      </section>
      <section>
        <div className="label mb-2">Calendar</div>
        <div className="flex flex-col gap-1.5">
          {calendar.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-[13.5px]">
              <span className="h-2 w-2 flex-none rounded-full" style={{ background: CAL_COLOR[e.calendar] }} />
              <span className="w-28 flex-none text-[var(--muted)]">{WEEK.find((d) => d.key === e.start.slice(0, 10))?.label} · {t24(e.start)}</span>
              <span>{e.title}</span>
              {expert && <span className="ml-auto text-[11px] text-[var(--faint)]">{e.calendar}</span>}
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className="label mb-2">Routines</div>
        <div className="flex flex-col gap-3">
          {routines.map((r) => (
            <div key={r.id} className="flex items-start gap-3">
              <div className="min-w-0 flex-1 text-[13.5px]">
                <div className="font-medium">{r.title}</div>
                <div className="text-[12px] text-[var(--muted)]">{r.when}</div>
                {expert && <div className="mono mt-0.5 text-[var(--faint)]">{r.where} · last {r.lastRun} · next {r.nextRun}</div>}
              </div>
              <button className={`toggle mt-1 ${on[r.id] ? "on" : ""}`} onClick={() => toggle(r.id)} aria-label={`${r.title} ${on[r.id] ? "on" : "off"}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SettingsBody({ expert, ask }: { expert: boolean; ask: (group: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="flex flex-col">
      {settingsGroups.map((g) => (
        <div key={g.id} className="border-b border-[var(--line)]">
          <button className="flex w-full items-center gap-2 py-3 text-left" onClick={() => setOpen(open === g.id ? null : g.id)}>
            <span className="flex-1 text-[14px] font-medium">{g.title}</span>
            <span className="text-[12px] text-[var(--muted)]">{g.summary}</span>
            <ChevronDown size={14} className={`text-[var(--faint)] transition-transform ${open === g.id ? "rotate-180" : ""}`} />
          </button>
          {open === g.id && (
            <div className="flex flex-col gap-1 pb-3">
              {g.simple.map((s) => <div key={s} className="rounded-lg bg-[var(--card2)] px-3 py-2 text-[13px]">{s}</div>)}
              {expert && g.expert.map((s) => <div key={s} className="rounded-lg border border-dashed border-[var(--line)] px-3 py-2 text-[13px] text-[var(--muted)]">{s}</div>)}
              {expert && g.id === "helpers" && <div className="mono mt-1 text-[var(--faint)]">{helpers.map((h) => `${h.name}: ${h.model}`).join(" · ")}</div>}
              <button className="mt-1 self-start text-[12.5px] font-semibold text-[var(--accent)]" onClick={() => ask(g.title)}>Ask hux to change this</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
