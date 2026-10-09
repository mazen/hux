// PROTOTYPE - concept 06 "Canvas": windows, dock, screen map and the quick-ask palette.
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { ArrowUp, Cast, CornerDownLeft, LayoutGrid, Maximize2, MessageSquare, Minimize2, Minus, Search, Settings2, X } from "lucide-react";
import { devices, settingsGroups, suggestions } from "../../fixtures";
import { BODIES } from "./bodies";
import { cx, LAUNCHERS, META, useHux, type Win, type WinKind } from "./model";
import type { LucideIcon } from "lucide-react";

export const CANVAS_PAD = { left: 76, top: 64, right: 12, bottom: 12 };

// ---------------------------------------------------------------- window frame
export function WinFrame({ win, mode }: { win: Win; mode: "canvas" | "card" }) {
  const h = useHux();
  const meta = META[win.id];
  const Body = BODIES[win.id];
  const Icon = meta.icon;
  const [drag, setDrag] = useState(false);
  const [menu, setMenu] = useState(false);
  const focused = mode === "card" || h.focused === win.id;
  const canvas = mode === "canvas";

  const track = (e: RPointerEvent<HTMLElement>, onMove: (dx: number, dy: number) => void) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const sx = e.clientX, sy = e.clientY;
    setDrag(true);
    const mv = (ev: PointerEvent) => onMove(ev.clientX - sx, ev.clientY - sy);
    const up = () => {
      setDrag(false);
      el.removeEventListener("pointermove", mv);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", mv);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  const onTitleDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (!canvas || e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    h.focus(win.id);
    if (win.max) return;
    const ox = win.x, oy = win.y;
    track(e, (dx, dy) => h.move(win.id, ox + dx, oy + dy));
  };
  const onResizeDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    h.focus(win.id);
    const ow = win.w, oh = win.h;
    track(e, (dx, dy) => h.resize(win.id, ow + dx, oh + dy));
  };

  const style = !canvas
    ? undefined
    : win.max
      ? { left: CANVAS_PAD.left, top: CANVAS_PAD.top, right: CANVAS_PAD.right, bottom: CANVAS_PAD.bottom, zIndex: win.z }
      : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  const targets = devices.filter((d) => d.screens > 0 && d.id !== (h.isDesk ? "desk" : "phone") && d.online);

  return (
    <section
      aria-label={meta.title}
      onPointerDown={() => canvas && !focused && h.focus(win.id)}
      style={style}
      className={cx(
        "v6-win flex flex-col overflow-hidden rounded-[16px] bg-(--win)",
        canvas ? "v6-open absolute" : "h-full w-full",
        focused && "is-focus",
        drag && "is-drag select-none",
      )}
    >
      <div
        onPointerDown={onTitleDown}
        onDoubleClick={(e) => canvas && !(e.target as HTMLElement).closest("button") && h.toggleMax(win.id)}
        className={cx(
          "relative flex h-11 shrink-0 items-center gap-2.5 border-b border-(--line) pr-1.5 pl-3.5",
          canvas && (drag ? "cursor-grabbing" : "cursor-grab"),
        )}
        style={{ touchAction: canvas ? "none" : undefined }}
      >
        <span className={cx("grid size-6 place-items-center rounded-[7px] transition-colors", focused ? "bg-(--accent-soft) text-(--accent)" : "bg-(--sunk) text-(--ink-3)")}>
          <Icon size={14} />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className={cx("truncate text-[13px] font-medium", focused ? "text-(--ink)" : "text-(--ink-2)")}>{meta.title}</div>
          {h.expert && (
            <div className="v6-mono truncate text-[10px] text-(--ink-3)">
              {meta.helper} · {h.isDesk ? `Desk PC, screen ${h.screenOf(win.id)}` : "Alex's phone"}
            </div>
          )}
        </div>
        <div className="flex items-center">
          <TitleBtn label="Show on another device" icon={Cast} onClick={() => setMenu((m) => !m)} />
          {canvas && <TitleBtn label={win.max ? "Restore" : "Fill the canvas"} icon={win.max ? Minimize2 : Maximize2} onClick={() => h.toggleMax(win.id)} />}
          <TitleBtn label="Minimise" icon={Minus} onClick={() => h.minimise(win.id)} />
          <TitleBtn label="Close" icon={X} onClick={() => h.close(win.id)} />
        </div>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onPointerDown={(e) => { e.stopPropagation(); setMenu(false); }} />
            <div className="v6-float v6-drop absolute top-10 right-2 z-20 w-56 rounded-[12px] p-1.5">
              <div className="px-2.5 pt-1 pb-1.5 text-[11px] text-(--ink-3)">Show this on</div>
              {targets.map((d) => (
                <button key={d.id} onClick={() => { setMenu(false); h.sendTo(win.id, d.name); }}
                  className="flex w-full items-center justify-between rounded-[8px] px-2.5 py-1.5 text-left text-[13px] hover:bg-(--hover)">
                  {d.name}<span className="text-[11px] text-(--ink-3)">{d.place}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="v6-scroll min-h-0 flex-1 overflow-auto">
        <Body />
      </div>
      {canvas && !win.max && (
        <div onPointerDown={onResizeDown} style={{ touchAction: "none" }} aria-hidden
          className="absolute right-0 bottom-0 size-4 cursor-nwse-resize">
          <svg viewBox="0 0 16 16" className="size-4 text-(--ink-3) opacity-50"><path d="M12 6v6H6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
        </div>
      )}
    </section>
  );
}

function TitleBtn({ label, icon: I, onClick }: { label: string; icon: LucideIcon; onClick: () => void }) {
  return (
    <button title={label} aria-label={label} onClick={onClick}
      className="grid size-7 place-items-center rounded-[8px] text-(--ink-3) transition-colors hover:bg-(--hover) hover:text-(--ink)">
      <I size={14} />
    </button>
  );
}

// ---------------------------------------------------------------- dock
export function Dock() {
  const h = useHux();
  const mins = h.wins.filter((w) => w.min && !LAUNCHERS.includes(w.id));
  const state = (k: WinKind) => {
    const w = h.wins.find((x) => x.id === k);
    return !w ? "closed" : w.min ? "min" : "open";
  };
  const item = (k: WinKind, extra?: boolean) => {
    const m = META[k];
    const I = m.icon;
    const s = state(k);
    return (
      <button key={k} onClick={() => h.open(k)} aria-label={m.title}
        className={cx(
          "group relative grid size-10 place-items-center rounded-[11px] transition-colors",
          h.focused === k && s === "open" ? "bg-(--accent-soft) text-(--accent)" : "text-(--ink-2) hover:bg-(--hover) hover:text-(--ink)",
        )}>
        <I size={18} strokeWidth={1.75} />
        {s !== "closed" && <span className={cx("absolute top-1/2 -left-[5px] h-1.5 w-[3px] -translate-y-1/2 rounded-full", s === "min" ? "bg-(--ink-3)" : "bg-(--ink)", h.focused === k && s === "open" && "h-3 bg-(--accent)")} />}
        {extra && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-(--accent)" />}
        <span className="pointer-events-none absolute left-[calc(100%+10px)] z-50 rounded-[7px] bg-(--ink) px-2 py-1 text-[12px] font-medium whitespace-nowrap text-(--panel) opacity-0 transition-opacity group-hover:opacity-100">
          {m.title}{s === "min" ? " (minimised)" : ""}
        </span>
      </button>
    );
  };
  return (
    <nav aria-label="Open" className="v6-float absolute top-1/2 left-3 z-[900] flex -translate-y-1/2 flex-col items-center gap-0.5 rounded-[15px] p-1">
      {LAUNCHERS.map((k) => item(k))}
      {mins.length > 0 && <div className="my-1 h-px w-6 bg-(--line-2)" />}
      {mins.map((w) => item(w.id, true))}
    </nav>
  );
}

// ---------------------------------------------------------------- screen map
export function ScreenMap({ size }: { size: { w: number; h: number } }) {
  const h = useHux();
  if (!size.w) return null;
  const W = 138, s = W / size.w, H = Math.round(size.h * s);
  const vis = h.wins.filter((w) => !w.min);
  return (
    <div className="v6-float absolute right-3 bottom-3 z-[900] rounded-[12px] p-2">
      <div className="mb-1.5 flex items-center justify-between px-0.5 text-[10.5px] text-(--ink-3)">
        <span>Desk PC · 3 screens</span>
        <button onClick={h.tidy} title="Tidy up windows" aria-label="Tidy up windows" className="grid size-5 place-items-center rounded-[5px] hover:bg-(--hover) hover:text-(--ink)"><LayoutGrid size={12} /></button>
      </div>
      <div className="relative overflow-hidden rounded-[6px]" style={{ width: W, height: H }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="absolute top-0 bottom-0 rounded-[4px] bg-(--sunk) ring-1 ring-(--line-2) ring-inset" style={{ left: (i * W) / 3 + (i ? 1.5 : 0), width: W / 3 - 1.5 - (i === 1 ? 1.5 : 0) }} />
        ))}
        {vis.map((w) => {
          const max = w.max;
          return (
            <button key={w.id} onClick={() => h.focus(w.id)} title={META[w.id].title}
              className={cx("absolute rounded-[2px] transition-colors", h.focused === w.id ? "bg-(--accent)" : "bg-(--ink-3)/50")}
              style={{
                left: (max ? CANVAS_PAD.left : w.x) * s, top: (max ? CANVAS_PAD.top : w.y) * s,
                width: (max ? size.w - CANVAS_PAD.left - CANVAS_PAD.right : w.w) * s,
                height: (max ? size.h - CANVAS_PAD.top - CANVAS_PAD.bottom : w.h) * s,
                zIndex: w.z, opacity: h.focused === w.id ? 0.9 : 0.45,
                background: h.focused === w.id ? "var(--accent)" : "var(--ink-3)",
              }} />
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- quick ask
type PItem = { id: string; label: string; hint?: string; icon: LucideIcon; run: () => void; group: string };

export function QuickAsk({ onClose }: { onClose: () => void }) {
  const h = useHux();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const needle = q.trim().toLowerCase();

  const items = useMemo<PItem[]>(() => {
    const out: PItem[] = [];
    const run = (f: () => void) => () => { f(); onClose(); };
    if (needle) out.push({ id: "ask", group: "Ask hux", label: q.trim(), hint: "Send", icon: ArrowUp, run: run(() => h.send(q)) });
    const kinds = Object.keys(META) as WinKind[];
    kinds
      .filter((k) => !needle || META[k].title.toLowerCase().includes(needle) || META[k].short.toLowerCase().includes(needle))
      .filter((k) => needle || LAUNCHERS.includes(k) || h.wins.some((w) => w.id === k))
      .forEach((k) => {
        const w = h.wins.find((x) => x.id === k);
        out.push({ id: "w-" + k, group: "Open", label: META[k].title, hint: w ? (w.min ? "Minimised" : "On the canvas") : undefined, icon: META[k].icon, run: run(() => h.open(k)) });
      });
    if (needle) {
      settingsGroups.forEach((g) => {
        const names = [...g.simple, ...(h.expert ? g.expert : [])];
        const hits = names.filter((n) => n.toLowerCase().includes(needle));
        if (g.title.toLowerCase().includes(needle) && !hits.length) hits.push(g.simple[0]);
        hits.slice(0, 3).forEach((n) =>
          out.push({ id: `s-${g.id}-${n}`, group: "Settings", label: n, hint: g.title, icon: Settings2, run: run(() => { h.setSettingsFocus(g.id); h.open("settings"); }) }),
        );
      });
    }
    suggestions
      .filter((s) => !needle || s.toLowerCase().includes(needle))
      .forEach((s) => out.push({ id: "g-" + s, group: needle ? "Suggestions" : "Try", label: s, icon: MessageSquare, run: run(() => h.send(s)) }));
    return out.slice(0, 14);
  }, [needle, q, h, onClose]);

  useEffect(() => setSel(0), [needle]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); items[sel]?.run(); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center bg-black/15 px-4 pt-[12vh] backdrop-blur-[2px] v6-fade" onPointerDown={onClose}>
      <div onPointerDown={(e) => e.stopPropagation()} className="v6-drop w-full max-w-[560px] overflow-hidden rounded-[18px] bg-(--win) shadow-[0_0_0_1px_var(--line-2),var(--sh-2)]">
        <div className="flex items-center gap-3 border-b border-(--line) px-4">
          <Search size={17} className="text-(--ink-3)" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Ask hux, or open anything" className="h-14 w-full bg-transparent text-[16px] outline-none" />
          <kbd className="v6-mono rounded-[6px] border border-(--line-2) px-1.5 py-0.5 text-[11px] text-(--ink-3)">Esc</kbd>
        </div>
        <div ref={listRef} className="v6-scroll max-h-[min(420px,55vh)] overflow-auto p-1.5">
          {items.map((it, i) => {
            const head = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            const I = it.icon;
            return (
              <div key={it.id}>
                {head && <div className="px-3 pt-2.5 pb-1 text-[11px] font-medium text-(--ink-3)">{head}</div>}
                <button data-i={i} onMouseMove={() => setSel(i)} onClick={it.run}
                  className={cx("flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left", sel === i && "bg-(--sunk)")}>
                  <span className={cx("grid size-7 shrink-0 place-items-center rounded-[8px]", it.id === "ask" ? "bg-(--accent) text-(--accent-ink)" : "bg-(--sunk) text-(--ink-2)")}><I size={14} /></span>
                  <span className="min-w-0 flex-1 truncate text-[14px]">{it.label}</span>
                  {it.hint && <span className="shrink-0 text-[12px] text-(--ink-3)">{it.hint}</span>}
                  {sel === i && <CornerDownLeft size={13} className="shrink-0 text-(--ink-3)" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
