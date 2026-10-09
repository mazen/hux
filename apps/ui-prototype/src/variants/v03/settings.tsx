// PROTOTYPE concept 03 - Settings as a two-level index: groups left, items right.
import { useState } from "react";
import { ArrowLeft, ArrowRight, MessageSquare, Search, X } from "lucide-react";
import { settingsGroups } from "../../fixtures";
import { useHux, type View } from "./store";
import { Btn, Label, PageTitle, Switch } from "./ui";
import { settingValues } from "./data";

type Group = (typeof settingsGroups)[number];

const links: Record<string, { view: View; label: string }> = {
  "What hux remembers": { view: "memory", label: "Open what hux remembers" },
  "Activity history": { view: "activity", label: "Open recent activity" },
  "Rename or move a device": { view: "home", label: "Open devices" },
  "Lights, plugs and the car": { view: "home", label: "Open home" },
  "What each helper does": { view: "home", label: "Open helpers" },
};

const pad = (n: number) => String(n).padStart(2, "0");

function Item({ name, num, expertItem, open, onOpen }: { name: string; num: string; expertItem?: boolean; open: boolean; onOpen: () => void }) {
  const { askAbout, setView } = useHux();
  const v = settingValues[name] ?? { value: "" };
  const [on, setOn] = useState(v.on ?? false);
  const value = v.toggle ? (on ? (v.value === "Off" || v.value === "Not allowed" ? "On" : v.value) : "Off") : v.value;
  const link = links[name];
  return (
    <li className="border-b">
      <button onClick={onOpen} className="grid w-full grid-cols-[2.75rem_1fr] items-baseline gap-x-2 py-3 text-left hover:bg-[var(--paper-2)] sm:grid-cols-[2.75rem_1fr_auto]" aria-expanded={open}>
        <span className="t-meta tabular-nums">{num}</span>
        <span className={`text-[16px] leading-snug ${open ? "font-semibold" : ""}`}>
          {name}
          {expertItem && <span className="t-label c-mute ml-2 align-middle text-[10px]">Expert</span>}
        </span>
        <span className="col-start-2 text-[14px] c-mute sm:col-start-3 sm:max-w-[16rem] sm:truncate sm:text-right">{value}</span>
      </button>
      {open && (
        <div className="m-in grid grid-cols-[2.75rem_1fr] gap-x-2 pb-5">
          <span />
          <div>
            {v.hint && <p className="max-w-[36rem] text-[15px] leading-normal c-ink2">{v.hint}</p>}
            {v.toggle && (
              <div className="mt-3 flex items-center gap-3">
                <Switch on={on} onChange={() => setOn(!on)} label={name} />
                <span className="text-[14px] font-semibold">{on ? "On" : "Off"}</span>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Btn onClick={() => askAbout(`Change "${name}": `)}>
                <MessageSquare size={14} /> Ask hux to change this
              </Btn>
              {link && <Btn tone="plain" className="text-[14px]" onClick={() => setView(link.view)}>{link.label}</Btn>}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function GroupItems({ g, gi, query }: { g: Group; gi: number; query: string }) {
  const { expert } = useHux();
  const [open, setOpen] = useState<string | null>(null);
  const q = query.toLowerCase();
  const match = (s: string) => !q || s.toLowerCase().includes(q);
  const simple = g.simple.filter(match);
  const exp = expert ? g.expert.filter(match) : [];
  return (
    <div>
      <ol>
        {simple.map((s, i) => (
          <Item key={s} name={s} num={`${gi + 1}.${g.simple.indexOf(s) + 1 || i + 1}`} open={open === s} onOpen={() => setOpen(open === s ? null : s)} />
        ))}
      </ol>
      {exp.length > 0 && (
        <>
          <Label className="c-mute mb-0 mt-6 border-b b-ink pb-2">Expert</Label>
          <ol>
            {exp.map((s) => (
              <Item key={s} name={s} expertItem num={`${gi + 1}.${g.simple.length + g.expert.indexOf(s) + 1}`} open={open === s} onOpen={() => setOpen(open === s ? null : s)} />
            ))}
          </ol>
        </>
      )}
      {!expert && !q && (
        <p className="t-meta mt-3">{g.expert.length} more in Expert mode</p>
      )}
    </div>
  );
}

export function Settings() {
  const { expert, askAbout } = useHux();
  const [sel, setSel] = useState<string | null>("people");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  const total = settingsGroups.reduce((n, g) => n + g.simple.length + (expert ? g.expert.length : 0), 0);
  const q = query.toLowerCase();
  const hits = (g: Group) => (q ? [...g.simple, ...(expert ? g.expert : [])].filter((s) => s.toLowerCase().includes(q)).length : 0);
  const gi = settingsGroups.findIndex((g) => g.id === sel);
  const group = settingsGroups[gi];

  return (
    <div>
      <PageTitle kicker={`06 · ${total} settings in ${settingsGroups.length} groups`} title="Settings" />

      <div className="mb-10 grid gap-6 border-t b-ink pt-4 lg:grid-cols-12 lg:gap-10">
        <label className="flex items-center gap-3 border-b b-ink pb-2 lg:col-span-5">
          <Search size={18} className="c-mute" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a setting"
            className="h-9 min-w-0 flex-1 bg-transparent text-[17px] outline-none"
          />
          {query && <button onClick={() => setQuery("")} aria-label="Clear"><X size={16} /></button>}
        </label>
        <button
          onClick={() => askAbout("")}
          className="group flex items-start gap-3 text-left lg:col-span-7"
        >
          <MessageSquare size={18} className="mt-0.5 shrink-0" />
          <span className="text-[15px] leading-snug">
            <span className="font-semibold">Ask hux to change any setting</span>{" "}
            <span className="c-ink2">"Make the kitchen tablet quieter after nine"</span>
            <ArrowRight size={14} className="ml-1 inline transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>

      {q ? (
        <div className="grid gap-10 lg:grid-cols-2">
          {settingsGroups.filter((g) => hits(g) > 0).map((g) => (
            <section key={g.id}>
              <div className="flex items-baseline gap-3 border-b b-ink pb-2">
                <span className="t-num text-[20px] c-mute">{pad(settingsGroups.indexOf(g) + 1)}</span>
                <h2 className="t-head text-[18px]">{g.title}</h2>
              </div>
              <GroupItems g={g} gi={settingsGroups.indexOf(g)} query={query} />
            </section>
          ))}
          {settingsGroups.every((g) => hits(g) === 0) && (
            <p className="text-[16px] c-ink2">Nothing called "{query}". Ask hux instead; it knows where everything is.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Level 1: groups */}
          <nav className={`lg:col-span-5 ${mobileOpen ? "hidden lg:block" : ""}`} aria-label="Settings groups">
            <ol className="border-t b-ink">
              {settingsGroups.map((g, i) => {
                const active = g.id === sel;
                return (
                  <li key={g.id}>
                    <button
                      onClick={() => { setSel(g.id); setMobileOpen(true); }}
                      className="grid w-full grid-cols-[3rem_1fr_auto] items-baseline gap-x-3 border-b py-3.5 text-left hover:bg-[var(--paper-2)]"
                      style={active ? { boxShadow: "inset 3px 0 0 var(--ink)" } : undefined}
                    >
                      <span className={`t-num pl-2 text-[22px] ${active ? "" : "c-mute"}`}>{pad(i + 1)}</span>
                      <span>
                        <span className={`block text-[17px] leading-tight ${active ? "font-bold" : "font-medium"}`}>{g.title}</span>
                        <span className="t-meta mt-0.5 block">{g.summary}</span>
                      </span>
                      <span className="t-meta tabular-nums">{g.simple.length + (expert ? g.expert.length : 0)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Level 2: items */}
          {group && (
            <section key={group.id} className={`m-in lg:sticky lg:top-0 lg:col-span-7 lg:self-start ${mobileOpen ? "" : "hidden lg:block"}`}>
              <button onClick={() => setMobileOpen(false)} className="mb-4 flex items-center gap-2 text-[14px] font-semibold lg:hidden">
                <ArrowLeft size={15} /> All settings
              </button>
              <div className="flex items-end gap-4 border-b b-ink pb-3">
                <span className="t-num text-[64px] lg:text-[96px]">{pad(gi + 1)}</span>
                <div className="pb-1">
                  <h2 className="t-display text-[28px] lg:text-[36px]">{group.title}</h2>
                  <p className="t-meta mt-1">{group.summary}</p>
                </div>
              </div>
              <GroupItems g={group} gi={gi} query="" />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
