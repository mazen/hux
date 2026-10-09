// PROTOTYPE - concept 09 "Grove": Settings. Mostly reached through the ask bar; this is the browse fallback.
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUp, Check, ChevronRight, Search, Sparkle } from "lucide-react";
import { household, settingsGroups } from "../../fixtures";
import { groupIcon } from "./AskBar";
import { itemInfo } from "./data";
import { useGrove } from "./store";
import { Avatar, Button, Eyebrow, Segmented, Toggle, shortcutLabel, useFlash } from "./ui";

type Group = (typeof settingsGroups)[number];

function Choice({ options, initial }: { options: string[]; initial: number }) {
  const [v, setV] = useState(initial);
  return (
    <div className="space-y-1.5">
      {options.map((o, i) => (
        <button
          key={o}
          onClick={() => setV(i)}
          className={`flex w-full items-center gap-3 rounded-[14px] border px-3.5 py-2.5 text-left text-[15px] transition ${v === i ? "border-(--moss) bg-(--moss-soft)/60" : "border-(--line) hover:bg-(--sunk)"}`}
        >
          <span className={`grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] ${v === i ? "border-(--moss) bg-(--moss)" : "border-(--line-strong)"}`}>
            {v === i && <span className="size-1.5 rounded-full bg-(--moss-ink)" />}
          </span>
          {o}
        </button>
      ))}
    </div>
  );
}

function SwitchRow({ label, initial, sub }: { label: string; initial: boolean; sub?: string }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-(--surface) px-3.5 py-2.5">
      <span className="flex-1">
        <span className="block text-[15px] font-semibold">{label}</span>
        {sub && <span className="block text-[13px] text-(--ink-3)">{sub}</span>}
      </span>
      <Toggle on={on} onChange={() => setOn(!on)} label={label} />
    </div>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-(--line) rounded-[14px] bg-(--surface)">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[15px]">
          <dt>{k}</dt>
          <dd className="text-right font-semibold text-(--ink-2)">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A real control for the settings people touch most. Everything else: description + ask. */
function Control({ item }: { item: string }) {
  const g = useGrove();
  const [backedUp, setBackedUp] = useState(false);
  switch (item) {
    case "Who lives here":
      return (
        <ul className="divide-y divide-(--line) rounded-[14px] bg-(--surface)">
          {household.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-3.5 py-2.5">
              <Avatar id={m.id} size={28} />
              <span className="flex-1 text-[15px] font-semibold">{m.name}</span>
              <span className="text-[13.5px] text-(--ink-3)">{m.role === "Owner" ? "Owner (you)" : m.role}</span>
            </li>
          ))}
        </ul>
      );
    case "Kids mode for Mia":
      return <SwitchRow label="Kids mode" sub="On for Mia" initial />;
    case "Which device speaks up":
      return <Choice options={["The one nearest to you", "Always the kitchen tablet", "Always the living room speaker"]} initial={0} />;
    case "Which AI hux uses":
      return <Choice options={["Only at home", "At home, and online for public web searches", "Online, for the best answers"]} initial={1} />;
    case "What may leave your home":
      return <Choice options={["Nothing", "Public questions only", "Anything, if I approve it first"]} initial={1} />;
    case "What hux may do on its own":
      return (
        <Rows rows={[["Switch lights and plugs", "On its own"], ["Make reminders", "On its own"], ["Send emails and messages", "Asks first"], ["Pay for things", "Never"]]} />
      );
    case "What hux remembers":
      return <Button small kind="line" onClick={() => g.setSheet("memory")}>See {g.memories.length} things</Button>;
    case "Activity history":
      return <Button small kind="line" onClick={() => g.setSheet("activity")}>See today</Button>;
    case "Lights, plugs and the car":
      return <Button small kind="line" onClick={() => g.go("household", { kind: "thing", id: "h1" })}>Open the 6 things</Button>;
    case "Rooms":
      return <Rows rows={[["Office", "Lights"], ["Kitchen", "Lights, coffee machine"], ["Living room", "Lamp, LED strip"], ["Driveway", "Car"]]} />;
    case "Quiet hours":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="g-display g-num rounded-[12px] bg-(--surface) px-4 py-2 text-[22px] font-bold">22:30</span>
            <span className="text-(--ink-3)">to</span>
            <span className="g-display g-num rounded-[12px] bg-(--surface) px-4 py-2 text-[22px] font-bold">7:00</span>
          </div>
          <SwitchRow label="Let urgent things through" initial />
        </div>
      );
    case "How urgent things reach you":
      return <Choice options={["Phone first, then the speaker", "Phone only", "Every device at once"]} initial={0} />;
    case "Connect email":
    case "Connect calendar":
      return <Rows rows={[[item === "Connect email" ? "Email" : "Calendar", "Connected"]]} />;
    case "Connect bank":
      return <Rows rows={[["Bank", "Connected · read only"]]} />;
    case "Lottery checker":
    case "Recipes":
      return <SwitchRow label={item} sub="Installed" initial />;
    case "Backup":
      return (
        <Button small kind={backedUp ? "soft" : "line"} icon={backedUp ? Check : undefined} onClick={() => setBackedUp(true)}>
          {backedUp ? "Backed up at 18:41" : "Back up now"}
        </Button>
      );
    case "Updates":
      return <SwitchRow label="Install updates at night" initial />;
    case "Language and region":
      return <Rows rows={[["Language", "English"], ["Time zone", "Berlin"], ["Clock", "24-hour"]]} />;
    default:
      return null;
  }
}

function AskInline({ group, item }: { group: string; item: string }) {
  const g = useGrove();
  const example = itemInfo[item]?.ask ?? `Change ${item.toLowerCase()}`;
  const [text, setText] = useState("");
  return (
    <div className="rounded-[16px] border border-dashed border-(--moss)/50 bg-(--moss-soft)/40 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-(--moss-text)">
        <Sparkle size={14} /> Ask hux to change this
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          g.send(text || example, { group, item });
        }}
        className="flex items-center gap-2 rounded-full border border-(--line) bg-(--raised) py-1 pr-1 pl-4"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`“${example}”`}
          aria-label={`Ask hux about ${item}`}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-(--ink-3)"
        />
        <button type="submit" aria-label="Send" className="grid size-8 shrink-0 place-items-center rounded-full bg-(--moss) text-(--moss-ink)">
          <ArrowUp size={16} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
}

function ItemRow({ group, item, expertOnly, open, onToggle }: { group: string; item: string; expertOnly: boolean; open: boolean; onToggle: () => void }) {
  const g = useGrove();
  const ref = useRef<HTMLLIElement>(null);
  useFlash(g.focus?.kind === "setting" && g.focus.group === group && g.focus.item === item, g.focus?.nonce, ref);
  const info = itemInfo[item];
  return (
    <li ref={ref} className="rounded-[18px]">
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3.5 text-left hover:bg-(--surface)">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[16px] font-semibold">
            {item}
            {expertOnly && <span className="rounded-full bg-(--sunk) px-2 py-px text-[11px] font-semibold tracking-wide text-(--ink-3) uppercase">Expert</span>}
          </span>
          {!open && info && <span className="mt-0.5 block truncate text-[13.5px] text-(--ink-3)">{info.desc}</span>}
        </span>
        <ChevronRight size={18} className={`shrink-0 text-(--ink-3) transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="g-rise space-y-3 px-4 pb-4">
          {info && <p className="text-[15px] leading-snug text-(--ink-2)">{info.desc}</p>}
          <Control item={item} />
          <AskInline group={group} item={item} />
        </div>
      )}
    </li>
  );
}

function GroupDetail({ grp, onBack }: { grp: Group; onBack: () => void }) {
  const g = useGrove();
  const [openItem, setOpenItem] = useState<string | null>(g.focus?.kind === "setting" && g.focus.group === grp.id ? g.focus.item ?? null : null);
  useEffect(() => {
    if (g.focus?.kind === "setting" && g.focus.group === grp.id && g.focus.item) setOpenItem(g.focus.item);
  }, [g.focus, grp.id]);
  const Icon = groupIcon[grp.id];
  return (
    <div className="g-rise">
      <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-[14px] font-semibold text-(--ink-2) hover:text-(--ink) lg:hidden">
        <ArrowLeft size={16} /> All settings
      </button>
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-[16px] bg-(--moss-soft) text-(--moss-text)">
          <Icon size={24} strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="g-display text-[28px] leading-tight font-bold">{grp.title}</h2>
          <p className="text-[15px] text-(--ink-2)">{grp.summary}</p>
        </div>
      </div>
      <ul className="mt-5 divide-y divide-(--line) rounded-[24px] border border-(--line) bg-(--raised) p-1">
        {grp.simple.map((i) => (
          <ItemRow key={i} group={grp.id} item={i} expertOnly={false} open={openItem === i} onToggle={() => setOpenItem(openItem === i ? null : i)} />
        ))}
      </ul>
      {g.expert ? (
        <>
          <Eyebrow className="mt-6 mb-2 px-2">Expert</Eyebrow>
          <ul className="g-fade divide-y divide-(--line) rounded-[24px] border border-(--line) bg-(--raised) p-1">
            {grp.expert.map((i) => (
              <ItemRow key={i} group={grp.id} item={i} expertOnly open={openItem === i} onToggle={() => setOpenItem(openItem === i ? null : i)} />
            ))}
          </ul>
        </>
      ) : (
        <button onClick={() => g.setExpert(true)} className="mt-3 px-3 text-[13.5px] text-(--ink-3) hover:text-(--ink-2)">
          {grp.expert.length} more in expert mode
        </button>
      )}
    </div>
  );
}

export function Settings() {
  const g = useGrove();
  const [sel, setSel] = useState<string | null>(g.focus?.kind === "setting" ? g.focus.group : null);
  useEffect(() => {
    if (g.focus?.kind === "setting") setSel(g.focus.group);
  }, [g.focus]);
  const grp = settingsGroups.find((x) => x.id === sel);

  const finder = (
    <button
      onClick={() => { g.setQuery(""); g.setLifted(true); }}
      className="flex w-full items-center gap-3 rounded-[20px] border border-(--line) bg-(--raised) px-4 py-3 text-left shadow-(--shadow) hover:border-(--line-strong)"
    >
      <Search size={18} className="text-(--moss)" />
      <span className="flex-1 truncate text-[15.5px] text-(--ink-3)">“Make the kitchen tablet quieter at night”</span>
      <kbd className="hidden rounded-[8px] border border-(--line) px-1.5 py-0.5 text-[12px] font-semibold text-(--ink-3) sm:block">{shortcutLabel}</kbd>
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pt-6 pb-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="g-display text-[36px] leading-none font-bold">Settings</h1>
        <Segmented
          label="Detail level"
          value={g.expert ? "expert" : "simple"}
          onChange={(v) => g.setExpert(v === "expert")}
          options={[{ id: "simple", label: "Simple" }, { id: "expert", label: "Expert" }]}
        />
      </div>
      <div className="mt-5 max-w-[560px]">{finder}</div>

      <div className="mt-7 lg:grid lg:grid-cols-[320px_1fr] lg:gap-10">
        <nav aria-label="Setting groups" className={grp ? "hidden lg:block" : ""}>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 lg:gap-0.5">
            {settingsGroups.map((s) => {
              const Icon = groupIcon[s.id];
              const active = s.id === sel;
              const count = s.simple.length + (g.expert ? s.expert.length : 0);
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setSel(s.id)}
                    className={`flex w-full items-center gap-3 rounded-[18px] px-3 py-2.5 text-left transition ${active ? "bg-(--raised) shadow-(--shadow)" : "border border-(--line) bg-(--raised) hover:bg-(--surface) lg:border-transparent lg:bg-transparent"}`}
                  >
                    <span className={`grid size-9 shrink-0 place-items-center rounded-[12px] ${active ? "bg-(--moss) text-(--moss-ink)" : "bg-(--sunk) text-(--ink-2)"}`}>
                      <Icon size={18} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15.5px] font-semibold">{s.title}</span>
                      <span className="block truncate text-[13px] text-(--ink-3)">{s.summary}</span>
                    </span>
                    {g.expert && <span className="g-mono text-(--ink-3)">{count}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className={grp ? "" : "hidden lg:block"}>
          {grp ? (
            <GroupDetail key={grp.id} grp={grp} onBack={() => setSel(null)} />
          ) : (
            <div className="grid h-full min-h-[320px] place-items-center rounded-[28px] border border-dashed border-(--line-strong) p-8 text-center">
              <div className="max-w-[340px]">
                <p className="g-display text-[22px] leading-snug font-bold">Pick a group, or just say what you want changed.</p>
                <div className="mt-4 flex flex-col gap-2">
                  {([
                    ["Start quiet hours at 22:00 on weekdays", "notifications", "Quiet hours"],
                    ["Let Sam approve emails too", "people", "What each person can ask for"],
                    ["Never send anything about money outside our home", "ai", "What may leave your home"],
                  ] as const).map(([s, group, item]) => (
                    <button key={s} onClick={() => g.send(s, { group, item })} className="rounded-full border border-(--line) bg-(--raised) px-4 py-2 text-[14px] text-(--ink-2) hover:border-(--moss) hover:text-(--ink)">
                      “{s}”
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
