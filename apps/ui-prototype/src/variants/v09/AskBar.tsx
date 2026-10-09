// PROTOTYPE - concept 09 "Grove": the ask bar. One field to talk, find a setting, switch a light or jump anywhere.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp, Bell, BookMarked, Brain, CalendarDays, Car, CornerDownLeft, HandHelping, House, Lightbulb, Link, MessageCircle, Mic,
  MonitorSmartphone, Plug, Puzzle, Repeat, RotateCcw, Search, Settings2, ShieldCheck, Sparkle, Users, X, type LucideIcon,
} from "lucide-react";
import { calendar, devices, helpers, reminders, routines, settingsGroups, suggestions } from "../../fixtures";
import { groupKw, homeKw, itemInfo, routineKw } from "./data";
import { thingState, useGrove, type Focus, type SheetKind, type View } from "./store";
import { RingMark, Toggle, shortcutLabel } from "./ui";

export const groupIcon: Record<string, LucideIcon> = {
  people: Users, devices: MonitorSmartphone, home: House, ai: Brain, helpers: HandHelping, privacy: ShieldCheck,
  connections: Link, addons: Puzzle, notifications: Bell, system: Settings2,
};

type Result =
  | { kind: "ask"; id: string; text: string; hint?: string }
  | { kind: "thing"; id: string; thingId: string }
  | { kind: "setting"; id: string; group: string; item: string; expertOnly: boolean }
  | { kind: "group"; id: string; group: string }
  | { kind: "routine"; id: string; routineId: string }
  | { kind: "plan"; id: string; planId: string; title: string; sub: string; icon: LucideIcon }
  | { kind: "go"; id: string; title: string; sub: string; icon: LucideIcon; view?: View; focus?: Focus; sheet?: SheetKind };

type Section = { title: string; items: Result[] };

const STOP = new Set(["the", "a", "an", "to", "my", "me", "of", "in", "for", "and", "is", "it", "what", "whats", "how", "can", "you", "i", "please", "hux", "do", "does", "set", "change", "make", "show", "with", "at", "be", "are"]);

function tokens(q: string) {
  return q.toLowerCase().replace(/[^a-z0-9äöüß\s]/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t));
}

function score(qt: string[], hay: string) {
  if (!qt.length) return 0;
  const h = hay.toLowerCase();
  const words = h.split(/[^a-z0-9äöüß]+/);
  let hit = 0;
  for (const t of qt) {
    if (words.some((w) => w.startsWith(t)) || (t.length >= 4 && h.includes(t))) hit++;
  }
  return hit / qt.length >= 0.5 ? hit / qt.length : 0;
}

const pages: { id: string; title: string; sub: string; icon: LucideIcon; kw: string; view?: View; sheet?: SheetKind }[] = [
  { id: "p-home", title: "Conversation", sub: "", icon: MessageCircle, kw: "home conversation chat talk", view: "home" },
  { id: "p-plans", title: "Plans", sub: "4 reminders · 5 events · 5 routines", icon: CalendarDays, kw: "plans reminders calendar routines schedule agenda week", view: "plans" },
  { id: "p-house", title: "Household", sub: "3 people · 5 devices · 6 things at home", icon: House, kw: "household home devices helpers people lights", view: "household" },
  { id: "p-settings", title: "Settings", sub: "10 groups", icon: Settings2, kw: "settings preferences options", view: "settings" },
  { id: "p-memory", title: "What hux remembers", sub: "", icon: BookMarked, kw: "memory memories remember forget know", sheet: "memory" },
  { id: "p-activity", title: "Recent activity", sub: "6 things today", icon: RotateCcw, kw: "activity history recent done log today", sheet: "activity" },
];

function useResults(query: string, onHome: boolean) {
  const { expert, things, memories } = useGrove();
  return useMemo(() => {
    const q = query.trim();
    const sections: Section[] = [];
    let hiddenExpert = 0;

    if (!q) {
      if (!onHome) sections.push({ title: "Try asking", items: suggestions.slice(0, 3).map((s) => ({ kind: "ask", id: `s-${s}`, text: s })) });
      sections.push({ title: "Go to", items: pages.map((p) => ({ kind: "go", id: p.id, title: p.title, sub: p.sub, icon: p.icon, view: p.view, sheet: p.sheet })) });
      return { sections, hiddenExpert };
    }

    const qt = tokens(q);
    sections.push({ title: "", items: [{ kind: "ask", id: "ask", text: q }] });

    const thingHits = things
      .map((t) => ({ t, s: score(qt, `${t.name} ${t.place} ${homeKw[t.kind] ?? ""}`) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 4);
    if (thingHits.length) sections.push({ title: "At home", items: thingHits.map(({ t }) => ({ kind: "thing", id: `t-${t.id}`, thingId: t.id })) });

    const settingHits: { r: Result; s: number }[] = [];
    for (const g of settingsGroups) {
      const gs = score(qt, `${g.title} ${groupKw[g.id] ?? ""}`);
      if (gs >= 1) settingHits.push({ r: { kind: "group", id: `g-${g.id}`, group: g.id }, s: gs + 0.01 });
      const all = [...g.simple.map((i) => ({ i, x: false })), ...g.expert.map((i) => ({ i, x: true }))];
      for (const { i, x } of all) {
        const s = score(qt, `${i} ${g.title} ${itemInfo[i]?.kw ?? ""}`);
        if (!s) continue;
        if (x && !expert) {
          hiddenExpert++;
          continue;
        }
        settingHits.push({ r: { kind: "setting", id: `i-${g.id}-${i}`, group: g.id, item: i, expertOnly: x }, s: s + (x ? 0 : 0.05) });
      }
    }
    if (settingHits.length)
      sections.push({ title: "Settings", items: settingHits.sort((a, b) => b.s - a.s).slice(0, 5).map((h) => h.r) });

    const plan: { r: Result; s: number }[] = [];
    for (const r of routines) {
      const s = score(qt, `${r.title} ${r.detail} ${routineKw[r.id] ?? ""}`);
      if (s) plan.push({ r: { kind: "routine", id: `r-${r.id}`, routineId: r.id }, s });
    }
    for (const r of reminders) {
      const s = score(qt, `${r.title} reminder ${r.source ?? ""}`);
      if (s) plan.push({ r: { kind: "plan", id: `pr-${r.id}`, planId: r.id, title: r.title, sub: `Reminder · ${r.when}`, icon: Bell }, s });
    }
    for (const c of calendar) {
      const s = score(qt, `${c.title} ${c.calendar} calendar`);
      const d = new Date(c.start);
      const when = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Berlin" });
      const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
      if (s) plan.push({ r: { kind: "plan", id: `pc-${c.id}`, planId: c.id, title: c.title, sub: `${when}, ${time}`, icon: CalendarDays }, s });
    }
    if (plan.length) sections.push({ title: "Plans", items: plan.sort((a, b) => b.s - a.s).slice(0, 4).map((p) => p.r) });

    const more: { r: Result; s: number }[] = [];
    for (const m of memories) {
      const s = score(qt, `${m.text} remember memory`);
      if (s) more.push({ r: { kind: "go", id: `m-${m.id}`, title: m.text, sub: "hux remembers", icon: BookMarked, sheet: "memory" }, s });
    }
    for (const d of devices) {
      const s = score(qt, `${d.name} ${d.place} ${d.kind} device`);
      if (s) more.push({ r: { kind: "go", id: `d-${d.id}`, title: d.name, sub: `Device · ${d.online ? d.place : "Asleep"}`, icon: MonitorSmartphone, view: "household", focus: { kind: "device", id: d.id } }, s });
    }
    for (const h of helpers) {
      const s = score(qt, `${h.name} ${h.does} helper`);
      if (s) more.push({ r: { kind: "go", id: `h-${h.id}`, title: `${h.name} (helper)`, sub: h.does, icon: HandHelping, view: "household", focus: { kind: "helper", id: h.id } }, s });
    }
    for (const p of pages) {
      const s = score(qt, `${p.title} ${p.kw}`);
      if (s) more.push({ r: { kind: "go", id: p.id, title: p.title, sub: p.sub, icon: p.icon, view: p.view, sheet: p.sheet }, s: s - 0.01 });
    }
    if (more.length) sections.push({ title: "Elsewhere", items: more.sort((a, b) => b.s - a.s).slice(0, 4).map((p) => p.r) });

    return { sections, hiddenExpert };
  }, [query, onHome, expert, things, memories]);
}

const thingIcon: Record<string, LucideIcon> = { light: Lightbulb, plug: Plug, car: Car };

function Row({ r, active, onPick, onHover }: { r: Result; active: boolean; onPick: () => void; onHover: () => void }) {
  const g = useGrove();
  let icon: LucideIcon = Search;
  let title = "";
  let sub = "";
  let tone = "bg-(--sunk) text-(--ink-2)";
  let trailing: React.ReactNode = null;

  if (r.kind === "ask") {
    icon = Sparkle;
    tone = "bg-(--moss) text-(--moss-ink)";
    title = r.id === "ask" ? `Ask hux “${r.text}”` : r.text;
    sub = r.id === "ask" ? "hux answers in the conversation" : "";
  } else if (r.kind === "thing") {
    const t = g.things.find((x) => x.id === r.thingId)!;
    icon = thingIcon[t.kind] ?? Lightbulb;
    tone = t.on ? "bg-(--ochre-soft) text-(--ochre)" : "bg-(--sunk) text-(--ink-3)";
    title = t.name;
    sub = `${t.place} · ${thingState(t)}`;
    trailing = t.switchable ? <Toggle size="sm" on={t.on} onChange={() => g.toggleThing(t.id)} label={`${t.name} on or off`} /> : null;
  } else if (r.kind === "setting") {
    const grp = settingsGroups.find((x) => x.id === r.group)!;
    icon = groupIcon[r.group] ?? Settings2;
    tone = "bg-(--moss-soft) text-(--moss-text)";
    title = r.item;
    sub = `Settings · ${grp.title}${r.expertOnly ? " · Expert" : ""}`;
  } else if (r.kind === "group") {
    const grp = settingsGroups.find((x) => x.id === r.group)!;
    icon = groupIcon[r.group] ?? Settings2;
    tone = "bg-(--moss-soft) text-(--moss-text)";
    title = grp.title;
    sub = `Settings · ${grp.summary}`;
  } else if (r.kind === "routine") {
    const rt = routines.find((x) => x.id === r.routineId)!;
    icon = Repeat;
    tone = "bg-(--rain-soft) text-(--rain)";
    title = rt.title;
    sub = `On its own · ${rt.when}`;
    trailing = <Toggle size="sm" on={g.routineOn[rt.id]} onChange={() => g.toggleRoutine(rt.id)} label={`${rt.title} on or off`} />;
  } else if (r.kind === "plan") {
    icon = r.icon;
    tone = "bg-(--rain-soft) text-(--rain)";
    title = r.title;
    sub = r.sub;
  } else {
    icon = r.icon;
    title = r.title;
    sub = r.sub;
  }
  const Icon = icon;

  return (
    <div
      role="option"
      aria-selected={active}
      onMouseMove={onHover}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      className={`flex cursor-pointer items-center gap-3 rounded-[16px] px-2.5 py-2 transition-colors ${active ? "bg-(--sunk)" : ""}`}
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-[12px] ${tone}`}>
        <Icon size={17} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px] font-semibold text-(--ink)">{title}</span>
        {sub && <span className="block truncate text-[13px] text-(--ink-3)">{sub}</span>}
      </span>
      {trailing}
      {active && !trailing && (
        <span className="hidden items-center gap-1 text-[12px] text-(--ink-3) sm:flex">
          <CornerDownLeft size={13} />
        </span>
      )}
    </div>
  );
}

/**
 * The bar itself. `lifted` = opened with the shortcut: floats in the centre and lists results downwards.
 * Docked = sits at the bottom of the page and lists results upwards, closest match next to your thumb.
 */
export function AskBar({ lifted = false, placeholder }: { lifted?: boolean; placeholder?: string }) {
  const g = useGrove();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(lifted);
  const [sel, setSel] = useState(0);
  const onHome = g.view === "home" && !lifted;
  const { sections, hiddenExpert } = useResults(g.query, onHome);
  const flat = sections.flatMap((s) => s.items);
  const showTray = open && !g.listening && flat.length > 0 && (lifted || g.query.trim() !== "" || !onHome);

  useEffect(() => setSel(0), [g.query]);
  useEffect(() => {
    if (lifted) inputRef.current?.focus();
  }, [lifted]);
  useEffect(() => {
    if (lifted) return;
    const down = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [lifted]);

  const close = () => {
    setOpen(false);
    if (lifted) g.setLifted(false);
  };

  const pick = (r: Result) => {
    switch (r.kind) {
      case "ask":
        g.send(r.text);
        setOpen(false);
        return;
      case "thing":
        g.toggleThing(r.thingId);
        return;
      case "setting":
        g.go("settings", { kind: "setting", group: r.group, item: r.item });
        break;
      case "group":
        g.go("settings", { kind: "setting", group: r.group });
        break;
      case "routine":
        g.go("plans", { kind: "plan", id: r.routineId });
        break;
      case "plan":
        g.go("plans", { kind: "plan", id: r.planId });
        break;
      case "go":
        if (r.view) g.go(r.view, r.focus);
        if (r.sheet) g.setSheet(r.sheet);
        break;
    }
    g.setQuery("");
    close();
    inputRef.current?.blur();
  };

  const onKey = (e: React.KeyboardEvent) => {
    const next = lifted ? "ArrowDown" : "ArrowUp";
    const prev = lifted ? "ArrowUp" : "ArrowDown";
    if (e.key === "Escape") {
      if (g.query) g.setQuery("");
      else close();
      return;
    }
    if (!showTray) {
      if (e.key === "Enter") g.send(g.query);
      return;
    }
    if (e.key === next) {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, flat.length - 1));
    } else if (e.key === prev) {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = flat[sel];
      if (r) pick(r);
      else g.send(g.query);
    }
  };

  // Index map so docked mode can render bottom-up while keeping the "Ask" row closest to the field.
  let idx = 0;
  const indexed = sections.map((s) => ({ ...s, items: s.items.map((r) => ({ r, i: idx++ })) }));
  const ordered = lifted ? indexed : [...indexed].reverse().map((s) => ({ ...s, items: [...s.items].reverse() }));

  const tray = showTray && (
    <div
      role="listbox"
      aria-label="Results"
      className={`g-scroll overflow-y-auto p-2 ${lifted ? "max-h-[min(60vh,520px)] border-t border-(--line)" : "g-rise absolute right-0 bottom-full left-0 mb-2 max-h-[min(58vh,480px)] rounded-[24px] border border-(--line) bg-(--raised) shadow-(--shadow-lift)"}`}
    >
      {ordered.map((s, si) => (
        <div key={s.title + si} className={si ? "mt-1.5" : ""}>
          {s.title && lifted && <div className="px-3 pt-2 pb-1 text-[12px] font-semibold tracking-[0.06em] text-(--ink-3) uppercase">{s.title}</div>}
          {s.items.map(({ r, i }) => (
            <Row key={r.id} r={r} active={i === sel} onPick={() => pick(r)} onHover={() => setSel(i)} />
          ))}
          {s.title && !lifted && <div className="px-3 pt-1 pb-1.5 text-[12px] font-semibold tracking-[0.06em] text-(--ink-3) uppercase">{s.title}</div>}
        </div>
      ))}
      {hiddenExpert > 0 && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => g.setExpert(true)}
          className="mt-1 w-full rounded-[14px] px-3 py-2 text-left text-[13px] text-(--ink-3) hover:bg-(--sunk)"
        >
          {hiddenExpert} more {hiddenExpert === 1 ? "match" : "matches"} in expert settings. <span className="font-semibold text-(--moss-text)">Show expert mode</span>
        </button>
      )}
    </div>
  );

  const field = (
    <div className={`flex items-center gap-2 ${lifted ? "px-4 py-3" : "px-2 py-2"}`}>
      <span className={`grid shrink-0 place-items-center text-(--moss) ${lifted ? "size-9" : "size-10"}`}>
        {g.listening ? <span className="size-2.5 rounded-full bg-(--clay)" /> : lifted ? <Search size={20} strokeWidth={2} /> : <RingMark size={24} />}
      </span>
      <input
        ref={inputRef}
        value={g.query}
        onChange={(e) => {
          g.setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder={g.listening ? "Listening…" : placeholder ?? "Ask hux, or find anything"}
        aria-label="Ask hux, or find a setting, a plan or a light"
        className={`min-w-0 flex-1 bg-transparent text-(--ink) outline-none placeholder:text-(--ink-3) ${lifted ? "text-[19px]" : "text-[16.5px]"}`}
      />
      {!lifted && !g.query && (
        <kbd className="hidden shrink-0 rounded-[8px] border border-(--line) px-1.5 py-0.5 text-[12px] font-semibold text-(--ink-3) lg:block">{shortcutLabel}</kbd>
      )}
      {lifted && (
        <button onClick={close} aria-label="Close" className="grid size-9 place-items-center rounded-full text-(--ink-3) hover:bg-(--sunk) md:hidden">
          <X size={18} />
        </button>
      )}
      <button
        onClick={g.listen}
        aria-label={g.listening ? "Stop listening" : "Talk to hux"}
        className={`relative grid size-10 shrink-0 place-items-center rounded-full transition ${g.listening ? "bg-(--clay) text-white" : "text-(--ink-2) hover:bg-(--sunk)"}`}
      >
        {g.listening && (
          <>
            <span className="g-ring absolute inset-0 rounded-full border-2 border-(--clay)" />
            <span className="g-ring g-ring-2 absolute inset-0 rounded-full border-2 border-(--clay)" />
            <span className="g-ring g-ring-3 absolute inset-0 rounded-full border-2 border-(--clay)" />
          </>
        )}
        <Mic size={19} strokeWidth={2} className="relative" />
      </button>
      {g.query.trim() && !g.listening && (
        <button
          onClick={() => g.send(g.query)}
          aria-label="Send to hux"
          className="g-fade grid size-10 shrink-0 place-items-center rounded-full bg-(--moss) text-(--moss-ink) hover:bg-(--moss-hover)"
        >
          <ArrowUp size={19} strokeWidth={2.3} />
        </button>
      )}
    </div>
  );

  if (lifted) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center px-3 pt-3 md:px-4 md:pt-[12vh]">
        <button aria-label="Close" className="g-fade absolute inset-0 bg-(--scrim) backdrop-blur-[3px]" onClick={close} />
        <div ref={wrapRef} className="g-lift relative h-fit w-full max-w-[680px] overflow-hidden rounded-[28px] border border-(--line) bg-(--raised) shadow-(--shadow-lift)">
          {field}
          {tray}
          <div className="hidden items-center gap-4 border-t border-(--line) bg-(--surface) px-5 py-2.5 text-[12.5px] text-(--ink-3) md:flex">
            <span>Enter to choose</span>
            <span>↑ ↓ to move</span>
            <span>Esc to close</span>
            <span className="ml-auto">Anything else, hux will answer</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      {tray}
      <div
        className={`rounded-[26px] border bg-(--raised) shadow-(--shadow) transition-[border-color,box-shadow] ${open ? "border-(--moss) ring-4 ring-(--moss-soft)" : "border-(--line)"}`}
      >
        {field}
      </div>
    </div>
  );
}
