// PROTOTYPE concept 05 "River": the one thing outside the river. Settings and the household's quieter corners.
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Car, Check, ChevronDown, Lightbulb, Monitor, Pencil, Plug, Server, Smartphone, Speaker, Tablet, Trash2, Undo2, X } from "lucide-react";
import { activity, devices, helpers, settingsGroups, type MemberId } from "../../fixtures";
import { memberName } from "./data";
import { Avatar, Switch } from "./ui";

export type Tab = "settings" | "memory" | "devices" | "home" | "helpers" | "activity";
export type Memory = { id: string; text: string; learned: string; about?: MemberId };
export type HomeThing = { id: string; name: string; place: string; kind: string; state: string };

const TABS: { id: Tab; label: string }[] = [
  { id: "settings", label: "Settings" },
  { id: "memory", label: "What hux remembers" },
  { id: "devices", label: "Devices" },
  { id: "home", label: "Home" },
  { id: "helpers", label: "Helpers" },
  { id: "activity", label: "Activity" },
];

// What each everyday setting is currently set to.
const VALUES: Record<string, string> = {
  "Who lives here": "Alex, Sam and Mia",
  "What each person can ask for": "Mia: no shopping or email",
  "Which device speaks up": "The one nearest you",
  "Rooms": "Office, Kitchen, Living room, Driveway",
  "Lights, plugs and the car": "6 things",
  "Which AI hux uses": "The one at home",
  "What may leave your home": "Public web searches only",
  "What each helper does": "4 helpers",
  "What hux may do on its own": "Asks before sending or paying",
  "What hux remembers": "5 things",
  "Activity history": "Kept for 30 days",
  "Connect email": "Connected",
  "Connect calendar": "Family, Work, Personal",
  "Connect bank": "Read only",
  "Lottery checker": "On",
  "Recipes": "On",
  "How urgent things reach you": "Phone, then speaker",
  "Backup": "Last night, 3:00",
  "Updates": "Up to date",
  "Language and region": "English · Berlin",
};
const SWITCHES = new Set(["Kids mode for Mia"]);

const ASK: Record<string, string> = {
  people: "Let Mia ask for music in her room",
  devices: "Let the kitchen tablet speak up first",
  home: "Turn off the office lights",
  ai: "Keep everything on this network",
  helpers: "Have the Writer sign emails with just my name",
  privacy: "Forget what's in the fridge tomorrow",
  connections: "Connect Sam's calendar too",
  addons: "Check the lottery on Saturdays too",
  notifications: "Make quiet hours start at 22:00",
  system: "Back up every night at 2:00",
};

const deviceIcon = (k: string) => (k === "desktop" ? Monitor : k === "tablet" ? Tablet : k === "phone" ? Smartphone : k === "speaker" ? Speaker : Server);
const homeIcon = (k: string) => (k === "light" ? Lightbulb : k === "plug" ? Plug : Car);

export function Overlay(props: {
  tab: Tab; setTab: (t: Tab) => void; expert: boolean; onClose: () => void; onAsk: (text: string) => void;
  memories: Memory[]; setMemories: (m: Memory[]) => void; homeThings: HomeThing[]; setHomeThings: (h: HomeThing[]) => void;
  quietStart: string;
}) {
  const { tab, setTab, expert, onClose } = props;
  const [ask, setAsk] = useState("");
  const askRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const suggestAsk = (text: string) => {
    setAsk(text);
    askRef.current?.focus();
    askRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  return (
    <div className="absolute inset-0 z-40 flex justify-end">
      <div className="fade-in absolute inset-0 bg-[color-mix(in_srgb,var(--bg)_55%,transparent)] backdrop-blur-[3px]" onClick={onClose} />
      <aside className="sheet-in relative flex h-full w-full flex-col border-l border-[var(--line)] bg-[var(--bg)] shadow-2xl sm:w-[560px]">
        <header className="flex items-center justify-between px-5 pt-5 pb-3 sm:px-7">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.03em]">{TABS.find((t) => t.id === tab)!.label}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full hover:bg-[var(--surface-2)]"><X size={19} /></button>
        </header>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-[var(--line)] px-4 sm:px-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative shrink-0 px-2.5 pt-1 pb-3 text-[13.5px] transition ${tab === t.id ? "font-medium text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
            >
              {t.id === "memory" ? "Remembers" : t.label}
              {tab === t.id && <span className="absolute inset-x-2.5 -bottom-px h-[2px] rounded-full bg-[var(--ink)]" />}
            </button>
          ))}
        </nav>

        <div className="river-scroll flex-1 overflow-y-auto px-4 pt-5 pb-24 sm:px-7">
          {/* Asking is always the shortest way to change something. */}
          <form
            onSubmit={(e) => { e.preventDefault(); if (ask.trim()) props.onAsk(ask.trim()); }}
            className="mb-6 flex items-center gap-2 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-1.5 pl-4 focus-within:border-[var(--ink-2)]"
          >
            <input
              ref={askRef}
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              placeholder="Ask hux to change a setting"
              className="h-10 min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-[var(--muted)]"
            />
            <button type="submit" disabled={!ask.trim()} aria-label="Ask hux" className="grid size-10 place-items-center rounded-xl bg-[var(--ink)] text-[var(--bg)] disabled:opacity-25"><ArrowUp size={18} /></button>
          </form>

          {tab === "settings" && <SettingsList expert={expert} onAsk={suggestAsk} quietStart={props.quietStart} />}
          {tab === "memory" && <Memories memories={props.memories} setMemories={props.setMemories} expert={expert} />}
          {tab === "devices" && <Devices expert={expert} />}
          {tab === "home" && <HomeList things={props.homeThings} setThings={props.setHomeThings} expert={expert} />}
          {tab === "helpers" && <Helpers expert={expert} />}
          {tab === "activity" && <Activity expert={expert} />}
        </div>
      </aside>
    </div>
  );
}

function SettingsList({ expert, onAsk, quietStart }: { expert: boolean; onAsk: (s: string) => void; quietStart: string }) {
  const [open, setOpen] = useState<string | null>("notifications");
  const [switches, setSwitches] = useState<Record<string, boolean>>({ "Kids mode for Mia": true });
  return (
    <div className="space-y-2">
      {settingsGroups.map((g) => {
        const isOpen = open === g.id;
        const summary = g.id === "notifications" ? `Quiet ${quietStart} to 7:00` : g.summary;
        return (
          <section key={g.id} className={`overflow-hidden rounded-2xl border transition ${isOpen ? "border-[var(--line-strong)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--surface)]"}`}>
            <button onClick={() => setOpen(isOpen ? null : g.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-medium">{g.title}</div>
                <div className="truncate text-[13px] text-[var(--muted)]">{summary}</div>
              </div>
              {expert && <span className="mono text-[11px] text-[var(--muted)]">{g.simple.length + g.expert.length}</span>}
              <ChevronDown size={16} className={`text-[var(--muted)] transition ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="rise border-t border-[var(--line)]">
                <ul className="divide-y divide-[var(--line)]">
                  {g.simple.map((item) => (
                    <li key={item} className="flex items-center gap-3 px-4 py-3 text-[14px]">
                      <span className="flex-1">{item}</span>
                      {SWITCHES.has(item) ? (
                        <Switch on={!!switches[item]} onChange={(v) => setSwitches({ ...switches, [item]: v })} label={item} />
                      ) : (
                        <span className="text-right text-[13px] text-[var(--muted)]">
                          {item === "Quiet hours" ? `${quietStart} to 7:00` : (VALUES[item] ?? "")}
                        </span>
                      )}
                    </li>
                  ))}
                  {expert && g.expert.map((item) => (
                    <li key={item} className="flex items-center gap-3 bg-[var(--surface-2)]/50 px-4 py-3 text-[14px]">
                      <span className="flex-1 text-[var(--ink-2)]">{item}</span>
                      <span className="mono rounded-md border border-[var(--line)] px-1.5 py-0.5 text-[10.5px] text-[var(--muted)] uppercase">expert</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => onAsk(ASK[g.id])} className="flex w-full items-center gap-2 border-t border-[var(--line)] px-4 py-3 text-left text-[13px] text-[var(--talk)] hover:bg-[var(--surface-2)]">
                  <span className="font-medium">Ask hux to change this</span>
                  <span className="truncate text-[var(--muted)]">“{ASK[g.id]}”</span>
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Memories({ memories, setMemories, expert }: { memories: Memory[]; setMemories: (m: Memory[]) => void; expert: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [removed, setRemoved] = useState<{ m: Memory; i: number } | null>(null);
  return (
    <div>
      {removed && (
        <div className="rise mb-3 flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-3.5 py-2.5 text-[13.5px]">
          <span className="flex-1">Forgotten.</span>
          <button onClick={() => { const next = [...memories]; next.splice(removed.i, 0, removed.m); setMemories(next); setRemoved(null); }} className="flex items-center gap-1 font-medium"><Undo2 size={13} />Undo</button>
        </div>
      )}
      <ul className="space-y-2">
        {memories.map((m, i) => (
          <li key={m.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            {editing === m.id ? (
              <form onSubmit={(e) => { e.preventDefault(); setMemories(memories.map((x) => (x.id === m.id ? { ...x, text: draft } : x))); setEditing(null); }} className="flex items-center gap-2">
                <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--line-strong)] bg-[var(--bg)] px-2.5 text-[14px] outline-none" />
                <button type="submit" aria-label="Save" className="grid size-9 place-items-center rounded-lg bg-[var(--ink)] text-[var(--bg)]"><Check size={16} /></button>
                <button type="button" onClick={() => setEditing(null)} aria-label="Cancel" className="grid size-9 place-items-center rounded-lg hover:bg-[var(--surface-2)]"><X size={16} /></button>
              </form>
            ) : (
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] leading-snug">{m.text}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[var(--muted)]">
                    {m.about && <Avatar id={m.about} size={15} />}
                    {m.about ? `About ${memberName(m.about)} · ` : "Household · "}{m.learned}
                  </div>
                  {expert && <div className="mono mt-1 text-[11px] text-[var(--muted)]">id {m.id} · stored on this network · used by Chief</div>}
                </div>
                <button onClick={() => { setEditing(m.id); setDraft(m.text); }} aria-label="Edit" className="grid size-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"><Pencil size={15} /></button>
                <button onClick={() => { setRemoved({ m, i }); setMemories(memories.filter((x) => x.id !== m.id)); }} aria-label="Forget" className="grid size-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--now)]"><Trash2 size={15} /></button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Devices({ expert }: { expert: boolean }) {
  return (
    <ul className="space-y-2">
      {devices.map((d) => {
        const Icon = deviceIcon(d.kind);
        return (
          <li key={d.id} className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--ink-2)]"><Icon size={17} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-medium">{d.name}</div>
              <div className="text-[12.5px] text-[var(--muted)]">{d.place}{d.note ? ` · ${d.note}` : ""}</div>
              {expert && <div className="mono mt-1 text-[11px] text-[var(--muted)]">{d.abilities.join(", ")} · {d.screens} screen{d.screens === 1 ? "" : "s"} · node {d.id}</div>}
            </div>
            <span className={`mt-1 flex items-center gap-1.5 text-[12.5px] ${d.online ? "text-[var(--rout)]" : "text-[var(--muted)]"}`}>
              <span className={`size-1.5 rounded-full ${d.online ? "bg-[var(--rout)]" : "bg-[var(--line-strong)]"}`} />{d.online ? "On" : "Asleep"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function HomeList({ things, setThings, expert }: { things: HomeThing[]; setThings: (h: HomeThing[]) => void; expert: boolean }) {
  return (
    <ul className="space-y-2">
      {things.map((h) => {
        const Icon = homeIcon(h.kind);
        const on = !h.state.startsWith("Off");
        const canSwitch = h.kind !== "car";
        return (
          <li key={h.id} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            <span className={`grid size-9 place-items-center rounded-xl ${on && canSwitch ? "bg-[color-mix(in_srgb,var(--rem)_18%,transparent)] text-[var(--rem)]" : "bg-[var(--surface-2)] text-[var(--ink-2)]"}`}><Icon size={17} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-medium">{h.name}</div>
              <div className="text-[12.5px] text-[var(--muted)]">{h.place} · {h.state}</div>
              {expert && <div className="mono mt-1 text-[11px] text-[var(--muted)]">{h.kind === "light" ? "Zigbee" : h.kind === "plug" ? "Meross" : "Home Assistant"} · controlled by Home helper</div>}
            </div>
            {canSwitch && (
              <Switch on={on} label={h.name} onChange={(v) => setThings(things.map((x) => (x.id === h.id ? { ...x, state: v ? "On" : "Off" } : x)))} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Helpers({ expert }: { expert: boolean }) {
  return (
    <div>
      <ul className="space-y-2">
        {helpers.map((h) => (
          <li key={h.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            <div className="text-[14.5px] font-medium">{h.name}</div>
            <div className="text-[13px] text-[var(--ink-2)]">{h.does}</div>
            {expert && (
              <div className="mt-2 space-y-1">
                <div className="mono text-[11px] text-[var(--muted)]">model: {h.model}</div>
                <div className="flex flex-wrap gap-1">
                  {h.canDo.map((c) => <span key={c} className="rounded-md bg-[var(--surface-2)] px-1.5 py-0.5 text-[11.5px] text-[var(--ink-2)]">{c}</span>)}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Activity({ expert }: { expert: boolean }) {
  return (
    <div>
      <ul className="relative space-y-4 border-l border-[var(--line-strong)] pl-5">
        {activity.map((a) => (
          <li key={a.id} className="relative">
            <span className={`absolute top-[7px] -left-[24px] size-[7px] rounded-full ring-4 ring-[var(--bg)] ${a.needsYou ? "bg-[var(--now)]" : "bg-[var(--line-strong)]"}`} />
            <div className="mono text-[11.5px] text-[var(--muted)]">{a.at}</div>
            <div className="text-[14.5px]">{a.text}</div>
            {a.needsYou && <div className="text-[12.5px] font-medium text-[var(--now)]">Needs your OK</div>}
            {expert && <div className="mono text-[11px] text-[var(--muted)]">{a.who ? `asked by ${memberName(a.who)}` : "on its own"}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
