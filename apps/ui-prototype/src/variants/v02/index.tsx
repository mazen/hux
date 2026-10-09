// PROTOTYPE - Concept 02 "Tiles": the Surface is a tiling tree. Nothing overlaps; asking splits space, removing gives it back.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown, ArrowUp, CalendarClock, Lock, GripVertical, Mic, Moon, MonitorSmartphone, Pin, PinOff, Send, Settings2, Sun, X, CornerDownLeft,
} from "lucide-react";
import { conversation, devices, household, routines } from "../../fixtures";
import {
  findKind, frames, insertAtEdge, insertBeside, keepOnly, leaf, leaves, move, normalize, open, patchLeaf, placeInOpen,
  remove, scale, setSizes, swap, type Kind, type Leaf, type Node, type Side, type Split, type Zone,
} from "./tree";
import { Body, approval, clock, emailCard, mmss, shoppingCard, titles, type Shared, type Size, type Timer } from "./widgets";
import "./styles.css";

export const name = "Tiles";

// ---------- starting Surface: Alex's Friday evening ----------
const friday = (): Node =>
  normalize({
    t: "split", id: "root", dir: "row", sizes: [0.3, 0.7],
    kids: [
      { t: "split", id: "left", dir: "col", sizes: [0.24, 0.42, 0.34], kids: [leaf("weather", "Thu 21:10"), leaf("today", "Thu 21:10"), leaf("shopping", "Thu 21:10")] },
      open(),
    ],
  });

type Passing = { kind: Kind } | { peek: string } | null;
type Away = { kind: Kind; to: string; at: string };
type Drag = { src: string; kind: Kind; x: number; y: number; x0: number; y0: number; live: boolean };
type Hint = { target: string; zone: Zone } | { surface: string } | { passing: true } | null;

// Only Alex may see these; shared Surfaces with nobody identified can't show them.
const PRIVATE: Kind[] = ["email"];
const SHARED = ["kitchen", "speaker"];
const LARGE: Kind[] =["email", "schedule", "settings", "history", "week", "recipe"];
const PASSING_ID = "__passing";

const script = [
  "What could I cook tonight?",
  "Show the frittata recipe on the right and keep it there",
  "Start a 25 minute timer next to it",
  "Show me the email to Todd",
  "Put my calendar for next week along the bottom",
  "Make the weather smaller",
  "Remove the shopping list",
  "Move the recipe to the kitchen tablet",
  "Move the timer to the kitchen tablet",
  "Show me the timer from the kitchen",
  "Move the email to the kitchen tablet",
  "Bring the recipe back",
  "Clear everything except the timer",
  "Save this as my cooking screen",
  "Show my Friday evening screen",
  "Show my cooking screen",
  "Show my schedule",
  "Open settings",
];

const deviceOf = (t: string) =>
  /kitchen|tablet/.test(t) ? "kitchen" : /phone/.test(t) ? "phone" : /speaker|living room/.test(t) ? "speaker" : /desk|pc|computer/.test(t) ? "desk" : null;

function kindOf(t: string): Kind | null {
  if (/week/.test(t) && /calendar|week/.test(t)) return "week";
  if (/schedule|reminder|routine/.test(t)) return "schedule";
  if (/setting/.test(t)) return "settings";
  if (/recipe|frittata/.test(t)) return "recipe";
  if (/timer/.test(t)) return "timer";
  if (/email|todd|draft/.test(t)) return "email";
  if (/weather/.test(t)) return "weather";
  if (/shopping|\blist\b/.test(t)) return "shopping";
  if (/calendar|today/.test(t)) return "today";
  if (/idea|cook/.test(t)) return "ideas";
  if (/history|conversation/.test(t)) return "history";
  return null;
}
const allKindsIn = (t: string): Kind[] =>
  (["week", "schedule", "settings", "recipe", "timer", "email", "weather", "shopping", "today"] as Kind[]).filter((k) =>
    kindOf(t.replace(/.*except|.*but/, "")) === k ||
    new RegExp({ week: "next week", schedule: "schedule", settings: "setting", recipe: "recipe|frittata", timer: "timer", email: "email|todd", weather: "weather", shopping: "shopping", today: "calendar" }[k as string] ?? "^$").test(t.replace(/.*(except|but)/, "")),
  );
const sideOf = (t: string): Side | null =>
  /\bright\b/.test(t) ? "right" : /\bleft\b/.test(t) ? "left" : /bottom|underneath|below/.test(t) ? "bottom" : /\btop\b|above/.test(t) ? "top" : null;
const lower = (k: Kind) => (k === "recipe" ? "recipe" : titles[k].toLowerCase());

function useSize<T extends HTMLElement>(): [React.RefObject<T | null>, Size] {
  const ref = useRef<T>(null);
  const [size, set] = useState<Size>({ w: 400, h: 300 });
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => set({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

function useMedia(q: string) {
  const [m, set] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const mq = matchMedia(q);
    const f = () => set(mq.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [q]);
  return m;
}

export default function Variant() {
  const phone = useMedia("(max-width: 640px)");
  const [dark, setDark] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  const [expert, setExpert] = useState(false);

  const [root, setRoot] = useState<Node>(friday);
  const [layouts, setLayouts] = useState<Record<string, Node>>(() => ({ "Friday evening": friday() }));
  const [active, setActive] = useState<{ name: string; changed: boolean } | null>({ name: "Friday evening", changed: false });
  const [passing, setPassing] = useState<Passing>(null);
  const [away, setAway] = useState<Away[]>([]);
  const [reply, setReply] = useState("Friday evening is up. The email to Todd still needs your OK.");
  const [history, setHistory] = useState(() =>
    conversation.slice(-6).map((m) => ({
      who: m.from === "assistant" ? "hux" : household.members.find((x) => x.id === m.member)!.name,
      text: m.text,
      at: new Date(m.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }),
    })),
  );
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [lastPlaced, setLastPlaced] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hint, setHint] = useState<Hint>(null);
  const [resizing, setResizing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // widget state lives here, so a tile keeps its state wherever it goes
  const [timer, setTimer] = useState<Timer>({ total: 1500, left: 1500, running: false });
  const [shop, setShop] = useState(shoppingCard.items);
  const [step, setStep] = useState(0);
  const [mail, setMailState] = useState({ subject: emailCard.subject, body: emailCard.body, approved: false });
  const [routinesOn, setRoutinesOn] = useState(() => Object.fromEntries(routines.map((r) => [r.id, r.enabled])));
  const [, tick] = useState(0);

  useEffect(() => {
    if (!timer.running) return;
    const i = setInterval(() => setTimer((t) => (t.left <= 1 ? { ...t, left: 0, running: false } : { ...t, left: t.left - 1 })), 1000);
    return () => clearInterval(i);
  }, [timer.running]);
  useEffect(() => {
    const i = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    if (!flash) return;
    document.querySelector(`[data-leaf="${flash}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const t = setTimeout(() => setFlash(null), 1400);
    return () => clearTimeout(t);
  }, [flash]);

  const commit = useCallback((next: Node, placed?: string) => {
    setRoot(next);
    setActive((a) => (a ? { ...a, changed: true } : a));
    if (placed) { setLastPlaced(placed); setFlash(placed); }
  }, []);

  const say = (text: string) => {
    setReply(text);
    setHistory((h) => [...h, { who: "hux", text, at: clock() }]);
  };

  // ---------- placement primitives ----------
  const keepPassing = (r: Node = root, at?: { target: string; zone: Zone }) => {
    if (!passing || !("kind" in passing)) return r;
    const l = leaf(passing.kind, clock());
    let next: Node;
    if (at && at.zone !== "center") next = insertBeside(r, at.target, l, at.zone, 0.5);
    else if (at) {
      const t = leaves(r).find((x) => x.id === at.target);
      next = t?.kind === "open" ? normalize(patchLeaf(r, at.target, { kind: passing.kind, keptAt: clock() })) : insertBeside(r, at.target, l, "right", 0.5);
    } else next = placeInOpen(r, l, LARGE.includes(passing.kind));
    setPassing(null);
    commit(next, l.id);
    return next;
  };

  const unkeep = (id: string) => {
    const l = leaves(root).find((x) => x.id === id);
    if (!l || l.kind === "open") return;
    commit(remove(root, id));
    setPassing({ kind: l.kind });
  };

  const close = (id: string) => commit(remove(root, id));

  const moveAway = (kind: Kind, to: string, r: Node = root, confirmed = false) => {
    const dev = devices.find((d) => d.id === to)!;
    if (to === here.id) { say(`The ${lower(kind)} is already here.`); return; }
    if (dev.screens === 0 && kind !== "timer") {
      say(`The ${dev.name.toLowerCase()} has no screen. It can only take the timer.`);
      return;
    }
    if (PRIVATE.includes(kind) && SHARED.includes(to) && !confirmed) {
      setConfirm({ kind, to });
      say("That's private. Confirm on your phone to show it there.");
      return;
    }
    setConfirm(null);
    const l = findKind(r, kind);
    if (l) commit(remove(r, l.id));
    if (passing && "kind" in passing && passing.kind === kind) setPassing(null);
    setAway((a) => [...a.filter((x) => x.kind !== kind), { kind, to, at: clock() }]);
    setFlashSurface(to);
    say(
      kind === "timer" && dev.screens === 0
        ? `The ${dev.name.toLowerCase()} will call out when the timer ends.${timer.running ? ` ${mmss(timer.left)} left.` : ""}`
        : `The ${lower(kind)} is on the ${dev.name.toLowerCase()} now${kind === "timer" && timer.running ? `, still running` : ""}.`,
    );
  };
  const [flashSurface, setFlashSurface] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: Kind; to: string } | null>(null);

  /** Pull: "Show me the timer from the kitchen". Takes it from that Surface and gives it a place here. */
  const pull = (kind: Kind, from: string) => {
    const dev = devices.find((d) => d.id === from)!;
    if (from === here.id) { say(`This is the ${dev.name.toLowerCase()}.`); return; }
    if (away.some((a) => a.kind === kind && a.to === from)) { bringBack(kind); return; }
    if (findKind(root, kind)) { setFlash(findKind(root, kind)!.id); say(`The ${lower(kind)} is already here.`); return; }
    if (from !== "desk") { say(`The ${dev.name.toLowerCase()} isn't showing the ${lower(kind)}.`); return; }
    // From the phone, the desk's tiles can be pulled over; this phone is Alex's, so private things are fine.
    const l = leaf(kind, clock());
    commit(placeInOpen(root, l, LARGE.includes(kind)), l.id);
    say(`The ${lower(kind)} from the desk PC is here now.`);
  };
  useEffect(() => {
    if (!flashSurface) return;
    const t = setTimeout(() => setFlashSurface(null), 1600);
    return () => clearTimeout(t);
  }, [flashSurface]);

  const bringBack = (kind: Kind) => {
    const a = away.find((x) => x.kind === kind);
    if (!a) return false;
    setAway((xs) => xs.filter((x) => x.kind !== kind));
    const l = leaf(kind, clock());
    commit(placeInOpen(root, l, LARGE.includes(kind)), l.id);
    if (passing && "peek" in passing) setPassing(null);
    say(`The ${lower(kind)} is back here.`);
    return true;
  };

  // ---------- the command line (keyword matching; a mock of what hux would interpret) ----------
  const run = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setHistory((h) => [...h, { who: household.members[0].name, text, at: clock() }]);
    setInput("");
    const t = text.toLowerCase();
    const kind = kindOf(t);
    const side = sideOf(t);

    if (/(except|all but|keep only)/.test(t) && /clear|remove|close|keep only/.test(t)) {
      const keep = allKindsIn(t);
      commit(keepOnly(root, keep));
      setPassing(null);
      return say(keep.length ? `Cleared. Only the ${keep.map(lower).join(" and ")} stayed.` : "Cleared.");
    }
    if (/clear (everything|all|the screen)/.test(t)) {
      commit(open());
      setPassing(null);
      return say("Cleared.");
    }
    const save = t.match(/(?:save|set) (?:this|it)(?: up)? as (?:my |the )?(.+?) (?:screen|layout)/);
    if (save) {
      const nm = save[1].replace(/^./, (c) => c.toUpperCase());
      setLayouts((l) => ({ ...l, [nm]: structuredClone(root) }));
      setActive({ name: nm, changed: false });
      return say(`Saved as ${nm}. Say “show my ${save[1]} screen” to bring it back.`);
    }
    const recall = t.match(/(?:show|bring up|open|switch to|go to)(?: me)?(?: my| the)? (.+?) (?:screen|layout)/);
    if (recall) {
      const nm = Object.keys(layouts).find((k) => k.toLowerCase() === recall[1]);
      if (!nm) return say(`There's no ${recall[1]} screen yet. Arrange things, then say “save this as my ${recall[1]} screen”.`);
      return recallLayout(nm);
    }
    const dev = deviceOf(t);
    const from = t.match(/\bfrom (?:the |my )?(kitchen|tablet|phone|desk|pc|speaker|living room)/);
    if (from && kind) return pull(kind, deviceOf(from[1])!);
    if (/confirm/.test(t) && confirm) return moveAway(confirm.kind, confirm.to, root, true);
    if (dev && /\b(send|move|put|take|show)\b/.test(t) && /\b(to|on|over to)\b/.test(t)) {
      const k = kind ?? (/\b(this|it)\b/.test(t) ? currentFocus() : null);
      if (!k) return say("Which one should go there?");
      return moveAway(k, dev);
    }
    if (/\bback\b/.test(t) && kind && away.some((a) => a.kind === kind)) { bringBack(kind); return; }
    if (/approve/.test(t)) return approve();
    if (/\bkeep (this|it)\b/.test(t) && !kind) {
      if (!passing || !("kind" in passing)) return say("There's nothing passing to keep.");
      keepPassing();
      return say("Kept.");
    }
    if (/\b(remove|get rid|close|hide|take away|drop)\b/.test(t) && kind) {
      if (passing && "kind" in passing && passing.kind === kind) { setPassing(null); return say("Done."); }
      const l = findKind(root, kind);
      if (!l) return say(`The ${lower(kind)} isn't on this screen.`);
      commit(remove(root, l.id));
      return say(`Removed the ${lower(kind)}. The tiles next to it took the space.`);
    }
    if (/(smaller|bigger|larger)/.test(t) && kind) {
      const l = findKind(root, kind);
      if (!l) return say(`The ${lower(kind)} isn't on this screen.`);
      const smaller = /smaller/.test(t);
      commit(patchLeaf(scale(root, l.id, smaller ? 0.6 : 1.6), l.id, { compact: smaller }), l.id);
      return say(smaller ? `Made the ${lower(kind)} smaller.` : `Made the ${lower(kind)} bigger.`);
    }
    if (kind === "timer") {
      const min = Number(t.match(/(\d+)\s*(?:min|minute)/)?.[1] ?? 25);
      setTimer({ total: min * 60, left: min * 60, running: true });
      const there = away.find((a) => a.kind === "timer");
      if (there) return say(`Restarted the timer on the ${devices.find((d) => d.id === there.to)!.name.toLowerCase()}: ${min} minutes.`);
      if (findKind(root, "timer")) return say(`Restarted: ${min} minutes.`);
      const l = leaf("timer", clock());
      let next: Node;
      const ref = (lastPlaced && leaves(root).find((x) => x.id === lastPlaced && x.kind !== "open")) || findKind(root, "recipe");
      if (/next to|beside|under|below/.test(t) && ref) {
        const f = frames(root).find((x) => x.id === ref.id)!;
        next = insertBeside(root, ref.id, l, f.w * 1.6 < f.h ? "bottom" : "right", 0.32);
      } else if (side) next = insertAtEdge(root, l, side, 0.25);
      else next = placeInOpen(root, l);
      commit(next, l.id);
      return say(`${min} minutes, running. Ends at ${endClock(min * 60)}.`);
    }
    if (kind) {
      if (kind === "ideas") {
        setPassing({ kind });
        return say("Three quick ones. The frittata uses what's in your fridge.");
      }
      if (away.some((a) => a.kind === kind) && !side) { bringBack(kind); return; }
      if (passing && "kind" in passing && passing.kind === "ideas") setPassing(null);
      const existing = findKind(root, kind);
      if (side || /\bkeep\b/.test(t)) {
        const base = existing ? remove(root, existing.id) : root;
        const l = leaf(kind, clock());
        const share = side === "bottom" || side === "top" ? 0.3 : 0.34;
        const next = side ? insertAtEdge(base, l, side, share) : placeInOpen(base, l, LARGE.includes(kind));
        if (passing && "kind" in passing && passing.kind === kind) setPassing(null);
        commit(next, l.id);
        return say(
          kind === "week" ? "Next week is along the bottom. Mostly quiet: stand-up Monday, coffee with Todd Tuesday, dentist Wednesday." :
          `The ${lower(kind)} stays ${side ? `on the ${side}` : "here"} until you remove it.`,
        );
      }
      if (existing) { setFlash(existing.id); return say(`The ${lower(kind)} is already here.`); }
      setPassing({ kind });
      return say(
        kind === "email" ? "Here's the draft. Edit it if you like, then approve." :
        kind === "schedule" ? "Your schedule. Say “keep this” to give it a place." :
        kind === "settings" ? "Settings." : `Here's the ${lower(kind)}.`,
      );
    }
    if (/what('s| is) (this|here)|which screen/.test(t)) return say(`This is the ${here.name.toLowerCase()}.`);
    say("I didn't catch that. Name a thing and a place, like “the weather on the left”.");
  };

  const approve = () => {
    setMailState((m) => ({ ...m, approved: true }));
    say(`Approved. It goes out ${approval.when}.`);
    // Done with it: a passing draft steps aside on its own.
    setTimeout(() => setPassing((p) => (p && "kind" in p && p.kind === "email" ? null : p)), 1600);
  };

  const currentFocus = (): Kind | null => {
    if (passing && "kind" in passing) return passing.kind;
    const l = lastPlaced && leaves(root).find((x) => x.id === lastPlaced);
    return l && l.kind !== "open" ? l.kind : null;
  };

  const recallLayout = (nm: string) => {
    setRoot(structuredClone(layouts[nm]));
    setActive({ name: nm, changed: false });
    setPassing(null);
    // Whatever was sent elsewhere stays there unless the layout needs it.
    const need = leaves(layouts[nm]).map((l) => l.kind);
    setAway((a) => a.filter((x) => !need.includes(x.kind)));
    const timerHidden = timer.running && !need.includes("timer") && !away.some((a) => a.kind === "timer");
    say(`${nm} is back.${timerHidden ? ` The timer is still running: ${mmss(timer.left)} left.` : ""}`);
  };

  const endClock = (s: number) => {
    const [h, m] = clock().split(":").map(Number);
    const total = h * 60 + m + Math.round(s / 60);
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

  // ---------- drag to rearrange (desktop) ----------
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const live = drag.live || Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 5;
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY, live } : d));
      if (!live) return;
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const surf = el?.closest<HTMLElement>("[data-surface]");
      if (surf) return setHint({ surface: surf.dataset.surface! });
      if (el?.closest("[data-passing]") && drag.src !== PASSING_ID) return setHint({ passing: true });
      const tile = el?.closest<HTMLElement>("[data-leaf]");
      if (!tile || tile.dataset.leaf === drag.src) return setHint(null);
      const r = tile.getBoundingClientRect();
      const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
      const d = { left: fx, right: 1 - fx, top: fy, bottom: 1 - fy };
      const [nearest, dist] = (Object.entries(d) as [Side, number][]).sort((a, b) => a[1] - b[1])[0];
      setHint({ target: tile.dataset.leaf!, zone: dist < 0.28 ? nearest : "center" });
    };
    const onUp = () => {
      const h = hint;
      if (drag.live && h) {
        if ("surface" in h) moveAway(drag.kind, h.surface);
        else if ("passing" in h) unkeep(drag.src);
        else if (drag.src === PASSING_ID) keepPassing(root, h);
        else commit(move(root, drag.src, h.target, h.zone), drag.src);
      }
      setDrag(null);
      setHint(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  });

  const startDrag = (e: React.PointerEvent, src: string, kind: Kind) => {
    if (phone || (e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    setDrag({ src, kind, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, live: false });
  };

  // ---------- phone: up/down swaps neighbours in reading order ----------
  const nudge = (id: string, dir: -1 | 1) => {
    const ls = leaves(root).filter((l) => l.kind !== "open");
    const i = ls.findIndex((l) => l.id === id);
    const j = i + dir;
    if (j < 0 || j >= ls.length) return;
    commit(swap(root, id, ls[j].id));
  };

  const shared: Shared = {
    timer, setTimer, shop, toggleShop: (i) => setShop((s) => s.map((x, k) => (k === i ? { ...x, done: !x.done } : x))),
    step, setStep, mail, setMail: (m) => (m.approved ? approve() : setMailState((x) => ({ ...x, ...m }))),
    routinesOn, toggleRoutine: (id) => setRoutinesOn((r) => ({ ...r, [id]: !r[id] })),
    expert, history, ask: run, prefill: (s) => { setInput(s); inputRef.current?.focus(); },
  };

  const here = phone ? devices.find((d) => d.id === "phone")! : devices.find((d) => d.id === "desk")!;
  const others = devices.filter((d) => d.id !== here.id && d.online && d.id !== "buildbox");
  const hereLabel = phone ? (expert ? "Alex's phone · portrait" : "Alex's phone") : expert ? "Desk PC · left screen" : "Desk PC";
  const frameMap = useMemo(() => new Map(frames(root).map((f) => [f.id, f])), [root]);

  const tileProps = { shared, expert, phone, flash, hint, drag, frameMap, onUnkeep: unkeep, onClose: close, onDragStart: startDrag, onNudge: nudge, onSend: moveAway, others };

  return (
    <div className={`v02 ${dark ? "dark" : ""} ${drag?.live ? "dragging" : ""} ${resizing ? "resizing" : ""} flex h-full flex-col`}>
      {/* quiet top line */}
      <header className="flex h-11 shrink-0 items-center justify-between gap-3 px-4">
        <div className="flex items-baseline gap-3">
          <span className="v02-word">hux</span>
          <span className="v02-mute text-sm">{phone ? clock() : `Fri 9 Oct · ${clock()}`}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="v02-icon" onClick={() => run("Show my schedule")} aria-label="Schedule" title="Schedule"><CalendarClock size={16} /></button>
          <button className="v02-icon" onClick={() => run("Open settings")} aria-label="Settings" title="Settings"><Settings2 size={16} /></button>
          <div className="v02-seg ml-2" role="group" aria-label="Detail">
            <button className={!expert ? "on" : ""} onClick={() => setExpert(false)}>Simple</button>
            <button className={expert ? "on" : ""} onClick={() => setExpert(true)}>Expert</button>
          </div>
          <button className="v02-icon" onClick={() => setDark((d) => !d)} aria-label={dark ? "Light mode" : "Dark mode"}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
        </div>
      </header>

      {/* the Surface */}
      <main className={`min-h-0 flex-1 px-3 ${phone ? "overflow-y-auto" : ""}`}>
        {phone ? (
          <div className="flex flex-col gap-2 pb-2">
            {leaves(root).filter((l) => l.kind !== "open").map((l, i, arr) => (
              <Tile key={l.id} leaf={l} first={i === 0} last={i === arr.length - 1} {...tileProps} />
            ))}
            {leaves(root).every((l) => l.kind === "open") && <div className="v02-open h-24" />}
          </div>
        ) : (
          <div className="h-full"><TreeView node={root} tileProps={tileProps} onSizes={(id, s) => commit(setSizes(root, id, s))} setResizing={setResizing} /></div>
        )}
      </main>

      {/* the passing slot: one place for transient things, part of the layout */}
      {passing && (
        <section
          data-passing
          className={`v02-passing mx-3 mt-2 flex shrink-0 flex-col ${"kind" in passing && LARGE.includes(passing.kind) ? (phone ? "max-h-[48vh]" : "h-[38vh]") : phone ? "max-h-[40vh]" : "max-h-[34vh]"} ${hint && "passing" in hint ? "hinted" : ""}`}
        >
          {"kind" in passing ? (
            <>
              <div className="v02-head" onPointerDown={(e) => startDrag(e, PASSING_ID, passing.kind)}>
                {!phone && <GripVertical size={14} className="v02-mute shrink-0" />}
                <span className="truncate font-medium">{titles[passing.kind]}</span>
                {PRIVATE.includes(passing.kind) && <Private />}
                {expert && !phone && <span className="v02-meta">passing · {passing.kind === "email" ? "Writer" : "Chief"} · {clock()}</span>}
                <span className="flex-1" />
                <button className="v02-btn" onClick={() => { keepPassing(); say("Kept."); }}><Pin size={13} />Keep this</button>
                <button className="v02-icon" onClick={() => setPassing(null)} aria-label="Dismiss"><X size={15} /></button>
              </div>
              <PassingBody kind={passing.kind} shared={shared} />
            </>
          ) : (
            <Peek id={passing.peek} away={away} timer={timer} expert={expert} onBack={bringBack} onClose={() => setPassing(null)} />
          )}
        </section>
      )}

      {/* dock: needs-you, reply, input, chips */}
      <div className="shrink-0 px-3 pt-2">
        {confirm && (
          <div className="v02-needs mb-2">
            <Lock size={13} className="v02-mute shrink-0" />
            <span className="min-w-0 truncate">Waiting for your phone: show the {lower(confirm.kind)} on the {devices.find((d) => d.id === confirm.to)!.name.toLowerCase()}</span>
            <button className="v02-link shrink-0" onClick={() => moveAway(confirm.kind, confirm.to, root, true)} title="Stands in for the tap on Alex's phone">Confirmed on phone</button>
            <button className="v02-link shrink-0" onClick={() => { setConfirm(null); say("Kept it here."); }}>Cancel</button>
          </div>
        )}
        {!mail.approved && !(passing && "kind" in passing && passing.kind === "email") && !findKind(root, "email") && (
          <div className="v02-needs mb-2">
            <span className="v02-dot" />
            <span className="min-w-0 truncate"><b className="font-medium">Needs you:</b> {approval.action}, {approval.when}</span>
            <button className="v02-link shrink-0" onClick={() => run("Show me the email to Todd")}>Review</button>
          </div>
        )}
        <div className="mb-1.5 flex items-baseline gap-3 px-1 text-sm">
          <span className="min-w-0 flex-1 truncate">{reply}</span>
          {expert && !phone && <span className="v02-meta shrink-0">Chief · on this network</span>}
          <button className="v02-link shrink-0" onClick={() => setPassing({ kind: "history" })}>History</button>
        </div>
        <form className="v02-input" onSubmit={(e) => { e.preventDefault(); run(input); }}>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={listening ? "Listening…" : "Ask hux, or say where to put something"} aria-label="Ask hux" />
          <button type="button" className={`v02-icon ${listening ? "v02-listening" : ""}`} onClick={() => setListening((l) => !l)} aria-label={listening ? "Stop listening" : "Speak"}><Mic size={17} /></button>
          <button type="submit" className="v02-icon" aria-label="Send"><CornerDownLeft size={16} /></button>
        </form>
        <div className="v02-chips mt-2">
          {script.map((c) => <button key={c} onClick={() => run(c)}>{c}</button>)}
        </div>
        {phone && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <Surfaces here={hereLabel} others={others} away={away} timer={timer} hint={hint} flash={flashSurface} onPeek={(id) => setPassing({ peek: id })} />
          </div>
        )}
      </div>

      {/* bottom line: this Surface and the others on the left, layouts on the right; the centre stays free */}
      <footer className="flex h-[60px] shrink-0 items-center justify-between gap-4 px-4">
        {!phone ? (
          <>
            <Surfaces here={hereLabel} others={others} away={away} timer={timer} hint={hint} flash={flashSurface} onPeek={(id) => setPassing({ peek: id })} />
            <Layouts layouts={layouts} active={active} onRecall={recallLayout} />
          </>
        ) : (
          <Layouts layouts={layouts} active={active} onRecall={recallLayout} />
        )}
      </footer>

      {drag?.live && (
        <div className="v02-ghost" style={{ left: drag.x + 12, top: drag.y + 12 }}>{titles[drag.kind]}</div>
      )}
    </div>
  );
}

// ---------- tree rendering ----------
type TileProps = {
  shared: Shared; expert: boolean; phone: boolean; flash: string | null; hint: Hint; drag: Drag | null;
  frameMap: Map<string, { w: number; h: number }>;
  onUnkeep: (id: string) => void; onClose: (id: string) => void;
  onDragStart: (e: React.PointerEvent, id: string, kind: Kind) => void;
  onNudge: (id: string, d: -1 | 1) => void; onSend: (kind: Kind, to: string) => void;
  others: typeof devices;
};

function TreeView({ node, tileProps, onSizes, setResizing }: { node: Node; tileProps: TileProps; onSizes: (id: string, s: number[]) => void; setResizing: (b: boolean) => void }) {
  if (node.t === "leaf") return <Tile leaf={node} {...tileProps} />;
  return (
    <div className={`flex h-full w-full ${node.dir === "row" ? "flex-row" : "flex-col"}`}>
      {node.kids.map((k, i) => (
        <SplitChild key={k.id} node={node} i={i} tileProps={tileProps} onSizes={onSizes} setResizing={setResizing}>
          <TreeView node={k} tileProps={tileProps} onSizes={onSizes} setResizing={setResizing} />
        </SplitChild>
      ))}
    </div>
  );
}

function SplitChild({ node, i, children, onSizes, setResizing }: { node: Split; i: number; children: ReactNode; tileProps: TileProps; onSizes: (id: string, s: number[]) => void; setResizing: (b: boolean) => void }) {
  return (
    <>
      <div className="v02-cell flex min-h-0 min-w-0" style={{ flex: `${node.sizes[i]} 1 0px` }}>{children}</div>
      {i < node.kids.length - 1 && <Gutter node={node} i={i} onSizes={onSizes} setResizing={setResizing} />}
    </>
  );
}

function Gutter({ node, i, onSizes, setResizing }: { node: Split; i: number; onSizes: (id: string, s: number[]) => void; setResizing: (b: boolean) => void }) {
  const row = node.dir === "row";
  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const box = el.parentElement!.getBoundingClientRect();
    const total = (row ? box.width : box.height) - (node.kids.length - 1) * 10;
    const start = row ? e.clientX : e.clientY;
    const s0 = [...node.sizes];
    try { el.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    setResizing(true);
    const mv = (ev: PointerEvent) => {
      const d = ((row ? ev.clientX : ev.clientY) - start) / total;
      const pair = s0[i] + s0[i + 1];
      const a = Math.min(pair - 0.06, Math.max(0.06, s0[i] + d));
      const s = [...s0];
      s[i] = a;
      s[i + 1] = pair - a;
      onSizes(node.id, s);
    };
    const up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); setResizing(false); };
    el.addEventListener("pointermove", mv);
    el.addEventListener("pointerup", up);
  };
  return <div className={`v02-gutter ${row ? "row" : "col"}`} onPointerDown={down} role="separator" aria-orientation={row ? "vertical" : "horizontal"} />;
}

function Tile({ leaf: l, shared, expert, phone, flash, hint, drag, frameMap, onUnkeep, onClose, onDragStart, onNudge, onSend, others, first, last }: TileProps & { leaf: Leaf; first?: boolean; last?: boolean }) {
  const [ref, size] = useSize<HTMLDivElement>();
  const [sending, setSending] = useState(false);
  const f = frameMap.get(l.id);
  const h = hint && "target" in hint && hint.target === l.id ? hint.zone : null;
  const overlay = h && <div className={`v02-drop z-${h}`}>{h === "center" ? (l.kind === "open" ? "Place here" : "Swap") : ""}</div>;

  if (l.kind === "open")
    return (
      <div data-leaf={l.id} className="v02-open relative h-full w-full">
        {expert && f && <span className="v02-meta absolute left-3 top-2">open · {Math.round(f.w * 100)}% × {Math.round(f.h * 100)}%</span>}
        {overlay}
      </div>
    );

  const kind = l.kind;
  return (
    <div
      data-leaf={l.id}
      className={`v02-tile relative flex w-full flex-col ${phone ? "" : "h-full"} ${flash === l.id ? "flash" : ""} ${drag?.live && drag.src === l.id ? "lifted" : ""}`}
    >
      <div className="v02-head" onPointerDown={(e) => onDragStart(e, l.id, kind)}>
        {!phone && <GripVertical size={14} className="v02-mute shrink-0" />}
        {sending ? (
          <>
            <span className="v02-mute shrink-0 text-sm">Move to</span>
            {others.map((d) => (
              <button key={d.id} className="v02-btn" disabled={d.screens === 0 && kind !== "timer"} onClick={() => { setSending(false); onSend(kind, d.id); }}>{d.name}</button>
            ))}
            <span className="flex-1" />
            <button className="v02-icon" onClick={() => setSending(false)} aria-label="Cancel"><X size={15} /></button>
          </>
        ) : (
          <>
            <span className="truncate font-medium">{titles[kind]}</span>
            {PRIVATE.includes(kind) && <Private />}
            {expert && f && !phone && <span className="v02-meta truncate">{Math.round(f.w * 100)}% × {Math.round(f.h * 100)}% · kept {l.keptAt}</span>}
            <span className="flex-1" />
            {phone && !first && <button className="v02-icon" onClick={() => onNudge(l.id, -1)} aria-label="Move up"><ArrowUp size={15} /></button>}
            {phone && !last && <button className="v02-icon" onClick={() => onNudge(l.id, 1)} aria-label="Move down"><ArrowDown size={15} /></button>}
            <button className="v02-icon quiet" onClick={() => setSending(true)} aria-label="Move to another screen" title="Move to another screen"><Send size={14} /></button>
            <button className="v02-icon quiet" onClick={() => onUnkeep(l.id)} aria-label="Stop keeping" title="Stop keeping"><PinOff size={14} /></button>
            <button className="v02-icon quiet" onClick={() => onClose(l.id)} aria-label="Remove" title="Remove"><X size={15} /></button>
          </>
        )}
      </div>
      <div ref={ref} className={`v02-body ${phone ? "" : "min-h-0 flex-1 overflow-auto"}`}>
        <Body kind={kind} size={phone ? { w: size.w, h: 400 } : size} compact={l.compact} s={shared} />
      </div>
      {overlay}
    </div>
  );
}

function PassingBody({ kind, shared }: { kind: Kind; shared: Shared }) {
  const [ref, size] = useSize<HTMLDivElement>();
  return <div ref={ref} className="v02-body min-h-0 flex-1 overflow-auto"><Body kind={kind} size={{ w: size.w, h: Math.max(size.h, 300) }} s={shared} /></div>;
}

// ---------- the household's other Surfaces ----------
function Surfaces({ here, others, away, timer, hint, flash, onPeek }: { here: string; others: typeof devices; away: Away[]; timer: Timer; hint: Hint; flash: string | null; onPeek: (id: string) => void }) {
  return (
    <div className="flex min-w-0 items-center gap-3 overflow-x-auto">
      <span className="flex items-center gap-1.5 whitespace-nowrap text-sm"><MonitorSmartphone size={14} className="v02-mute" />{here}</span>
      <span className="v02-rule" />
      {others.map((d) => {
        const there = away.filter((a) => a.to === d.id);
        return (
          <button
            key={d.id}
            data-surface={d.id}
            onClick={() => onPeek(d.id)}
            className={`v02-surface ${hint && "surface" in hint && hint.surface === d.id ? "hinted" : ""} ${flash === d.id ? "flash" : ""}`}
            title={d.name}
          >
            <span className={`v02-mini ${d.kind}`}>
              {there.map((a) => <i key={a.kind} />)}
            </span>
            <span className="text-xs">
              {d.kind === "tablet" ? "Kitchen" : d.kind === "phone" ? "Phone" : d.kind === "desktop" ? "Desk" : "Speaker"}
              {there.some((a) => a.kind === "timer") && <span className="v02-num v02-accent"> {timer.left ? mmss(timer.left) : "done"}</span>}
              {there.length > 0 && !there.some((a) => a.kind === "timer") && <span className="v02-mute"> · {there.length}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Peek({ id, away, timer, expert, onBack, onClose }: { id: string; away: Away[]; timer: Timer; expert: boolean; onBack: (k: Kind) => void; onClose: () => void }) {
  const d = devices.find((x) => x.id === id)!;
  const there = away.filter((a) => a.to === id);
  return (
    <>
      <div className="v02-head">
        <span className="font-medium">{d.name}</span>
        <span className="v02-mute text-sm">{d.place}</span>
        {expert && <span className="v02-meta">{d.id} · {d.screens} screen{d.screens === 1 ? "" : "s"} · online</span>}
        <span className="flex-1" />
        <button className="v02-icon" onClick={onClose} aria-label="Close"><X size={15} /></button>
      </div>
      <div className="v02-body">
        {there.length === 0 ? (
          <div className="v02-mute text-sm">Nothing from this screen is there. Drag a tile onto it to move it.</div>
        ) : (
          <ul className="v02-rows">
            {there.map((a) => (
              <li key={a.kind} className="justify-between">
                <span>
                  {titles[a.kind]}
                  <span className="v02-mute"> · {a.kind === "timer" ? (timer.left ? `${mmss(timer.left)} left${timer.running ? "" : ", paused"}` : "done") : `since ${a.at}`}</span>
                </span>
                <button className="v02-btn" onClick={() => onBack(a.kind)}>Bring back</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function Layouts({ layouts, active, onRecall }: { layouts: Record<string, Node>; active: { name: string; changed: boolean } | null; onRecall: (n: string) => void }) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      {Object.keys(layouts).map((n) => (
        <button key={n} className={`v02-layout ${active?.name === n ? "on" : ""}`} onClick={() => onRecall(n)}>
          {n}{active?.name === n && active.changed && <span className="v02-mute"> · changed</span>}
        </button>
      ))}
    </div>
  );
}

function Private() {
  return <span className="v02-private" title="Private to Alex"><Lock size={11} />Only Alex</span>;
}
