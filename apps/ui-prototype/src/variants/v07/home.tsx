// PROTOTYPE - concept 07 "Glass": Home (rooms, people, devices, helpers, memories, activity).
import { useState } from "react";
import {
  Car, Check, Coffee, Laptop, Lightbulb, Monitor, Pencil, Server, Smartphone, Speaker, Tablet, Trash2, X,
} from "lucide-react";
import { activity, conversation, devices, helpers, home, household, type Card } from "../../fixtures";
import { ApprovalCard } from "./cards";
import { useApp } from "./state";
import { Avatar, Meta, PageHeader, PanelTitle, Toggle, memberName } from "./ui";

const approvalCard = conversation.find((m) => m.card?.type === "approval")!.card as Extract<Card, { type: "approval" }>;
const deviceIcon: Record<string, typeof Laptop> = { desktop: Monitor, tablet: Tablet, phone: Smartphone, speaker: Speaker, server: Server };
const homeIcon: Record<string, typeof Laptop> = { light: Lightbulb, plug: Coffee, car: Car };

function Rooms() {
  const { homeState, toggleHome, expert } = useApp();
  const places = [...new Set(home.map((h) => h.place))];
  return (
    <section className="glass rounded-[26px] pb-4">
      <PanelTitle aside={<span className="text-[13px] ink-3">{home.filter((h) => homeState[h.id] !== "Off").length} on</span>}>Around the house</PanelTitle>
      <div className="grid gap-x-4 gap-y-3 px-4 sm:grid-cols-2">
        {places.map((p) => (
          <div key={p}>
            <div className="px-1 pb-1.5 text-[13px] font-semibold ink-2">{p}</div>
            <div className="space-y-2">
              {home.filter((h) => h.place === p).map((h) => {
                const Icon = homeIcon[h.kind] ?? Lightbulb;
                const on = homeState[h.id] !== "Off";
                const switchable = h.kind !== "car";
                return (
                  <div key={h.id} className="pane flex items-center gap-3 rounded-2xl px-3 py-2.5">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${on ? "ember-soft ember" : "fill-2 ink-3"}`}><Icon size={17} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-semibold">{h.name}</span>
                      <span className="block text-[12.5px] ink-3">
                        {homeState[h.id]}
                        {expert && <> · {h.kind === "car" ? "via car API" : h.kind === "plug" ? "Meross plug" : "Zigbee"}</>}
                      </span>
                    </span>
                    {switchable && <Toggle on={on} onChange={() => toggleHome(h.id)} label={h.name} />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function People() {
  const { expert } = useApp();
  const where: Record<string, string> = { alex: "Home · at the desk", sam: "Home", mia: "Home" };
  return (
    <section className="glass rounded-[26px] pb-3">
      <PanelTitle>Who's home</PanelTitle>
      <ul className="flex flex-wrap gap-2 px-4">
        {household.members.map((m) => (
          <li key={m.id} className="pane flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5">
            <Avatar id={m.id} size={32} />
            <span>
              <span className="block text-[14px] font-semibold leading-tight">{m.name}</span>
              <span className="block text-[12px] ink-3">{where[m.id]}{expert && <> · {m.role}</>}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Devices() {
  const { expert } = useApp();
  return (
    <section className="glass rounded-[26px] pb-2">
      <PanelTitle>Where hux lives</PanelTitle>
      <ul className="px-2">
        {devices.map((d) => {
          const Icon = deviceIcon[d.kind] ?? Laptop;
          return (
            <li key={d.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
              <span className="fill-2 relative grid h-10 w-10 place-items-center rounded-xl ink-2">
                <Icon size={18} />
                <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2" style={{ background: d.online ? "var(--ok)" : "var(--ink-3)", borderColor: "var(--glass-strong)" }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold">{d.name}</span>
                <span className="block text-[12.5px] ink-3">{d.note ?? d.place}{!d.online && !d.note ? " · asleep" : ""}</span>
                {expert && <Meta>node {d.id} · {d.abilities.join(", ")}{d.screens ? ` · ${d.screens} screen${d.screens > 1 ? "s" : ""}` : ""}</Meta>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Helpers() {
  const { expert } = useApp();
  return (
    <section className="glass rounded-[26px] pb-3">
      <PanelTitle>Helpers</PanelTitle>
      <ul className="grid gap-2 px-4 sm:grid-cols-2">
        {helpers.map((h) => (
          <li key={h.id} className="pane rounded-2xl p-3.5">
            <div className="text-[15px] font-bold">{h.name}</div>
            <div className="text-[13.5px] ink-2">{h.does}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {h.canDo.map((c) => <span key={c} className="fill-2 rounded-full px-2 py-0.5 text-[12px] ink-2">{c}</span>)}
            </div>
            {expert && <div className="mt-2"><Meta>model: {h.model}</Meta></div>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Memories() {
  const { mems, setMems } = useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  return (
    <section className="glass rounded-[26px] pb-2">
      <PanelTitle aside={<span className="text-[13px] ink-3">{mems.length} things</span>}>What hux remembers</PanelTitle>
      <p className="px-5 pb-2 text-[14px] ink-2">Anything you remove is forgotten for good.</p>
      <ul className="px-2">
        {mems.map((k) => (
          <li key={k.id} className="group flex items-start gap-3 rounded-2xl px-3 py-2.5 hover:bg-[var(--fill-2)]">
            {editing === k.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { setMems(mems.map((m) => (m.id === k.id ? { ...m, text } : m))); setEditing(null); }
                    if (e.key === "Escape") setEditing(null);
                  }}
                  aria-label="Edit memory"
                  className="pane min-w-0 flex-1 rounded-xl px-3 py-2 text-[14.5px] outline-none"
                />
                <button aria-label="Save" onClick={() => { setMems(mems.map((m) => (m.id === k.id ? { ...m, text } : m))); setEditing(null); }} className="btn-accent grid h-9 w-9 place-items-center rounded-full"><Check size={16} /></button>
                <button aria-label="Cancel" onClick={() => setEditing(null)} className="fill-2 grid h-9 w-9 place-items-center rounded-full"><X size={16} /></button>
              </div>
            ) : (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-medium">{k.text}</span>
                  <span className="block text-[12.5px] ink-3">{k.learned}{k.about ? ` · about ${memberName(k.about)}` : " · the household"}</span>
                </span>
                <span className="flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  <button aria-label="Edit" onClick={() => { setEditing(k.id); setText(k.text); }} className="fill-2 grid h-8 w-8 place-items-center rounded-full ink-2"><Pencil size={14} /></button>
                  <button aria-label="Forget" onClick={() => setMems(mems.filter((m) => m.id !== k.id))} className="fill-2 grid h-8 w-8 place-items-center rounded-full ember"><Trash2 size={14} /></button>
                </span>
              </>
            )}
          </li>
        ))}
        {mems.length === 0 && <li className="px-3 py-3 text-[14px] ink-3">Nothing right now.</li>}
      </ul>
    </section>
  );
}

function Activity() {
  const { expert } = useApp();
  return (
    <section className="glass rounded-[26px] pb-3">
      <PanelTitle>Today</PanelTitle>
      <ol className="space-y-3 px-5">
        {activity.map((a) => (
          <li key={a.id} className="flex gap-3 text-[14px]">
            <span className="w-11 shrink-0 font-semibold tabular ink-3">{a.at}</span>
            <span className="min-w-0 flex-1">
              <span className={a.needsYou ? "font-semibold" : "ink-2"}>{a.text}</span>
              {a.needsYou && <span className="accent-soft accent ml-2 rounded-full px-2 py-0.5 text-[11.5px] font-bold">Needs you</span>}
              {expert && <div><Meta>{a.who ? `asked by ${memberName(a.who)}` : "routine"} · {a.id === "a4" ? "Researcher" : a.id === "a5" ? "Home" : a.id === "a1" ? "Writer" : "Chief"}</Meta></div>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function HomeView() {
  const { approval } = useApp();
  return (
    <div className="scroll-soft fade-top h-full overflow-y-auto">
      <div className="mx-auto max-w-[1180px] px-4 pt-6 pb-28 sm:px-6 md:pt-10">
        <PageHeader title="Home" />
        <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-5">
            {approval === "pending" && (
              <div className="glass rounded-[26px] p-2"><ApprovalCard c={approvalCard} compact /></div>
            )}
            <Rooms />
            <Memories />
            <Helpers />
          </div>
          <div className="space-y-5">
            <People />
            <Activity />
            <Devices />
          </div>
        </div>
      </div>
    </div>
  );
}
