// PROTOTYPE - concept 07 "Glass": Settings as a grouped list with search.
import { useMemo, useState } from "react";
import {
  Bell, ChevronLeft, ChevronRight, Cpu, Handshake, House, Link2, MessageCircle, MonitorSmartphone, Puzzle, Search, Settings2, Shield, Users, X,
} from "lucide-react";
import { household, settingsGroups } from "../../fixtures";
import { useApp } from "./state";
import { Avatar, Meta, Toggle } from "./ui";

type Group = (typeof settingsGroups)[number];

const look: Record<string, { icon: typeof Bell; tint: string }> = {
  people: { icon: Users, tint: "linear-gradient(135deg,#f29a7c,#d9654a)" },
  devices: { icon: MonitorSmartphone, tint: "linear-gradient(135deg,#6fa8d6,#3d6fa6)" },
  home: { icon: House, tint: "linear-gradient(135deg,#f3c06a,#e0903a)" },
  ai: { icon: Cpu, tint: "linear-gradient(135deg,#9d8cff,#5a44d0)" },
  helpers: { icon: Handshake, tint: "linear-gradient(135deg,#7fcaa4,#3f8f6a)" },
  privacy: { icon: Shield, tint: "linear-gradient(135deg,#7c7f99,#4b4e68)" },
  connections: { icon: Link2, tint: "linear-gradient(135deg,#68c3d0,#2f8798)" },
  addons: { icon: Puzzle, tint: "linear-gradient(135deg,#e889b5,#bf4f86)" },
  notifications: { icon: Bell, tint: "linear-gradient(135deg,#ff8f7a,#e5484d)" },
  system: { icon: Settings2, tint: "linear-gradient(135deg,#9aa0ad,#5f6573)" },
};

const sections: { title: string; ids: string[] }[] = [
  { title: "Your household", ids: ["people", "devices", "home"] },
  { title: "How hux works", ids: ["ai", "helpers", "privacy", "connections", "addons"] },
  { title: "This hux", ids: ["notifications", "system"] },
];

type Row = { value?: string; toggle?: boolean; action?: boolean };
const rows: Record<string, Row> = {
  "Who lives here": { value: "3 people" },
  "What each person can ask for": { value: "Mia: limited" },
  "Kids mode for Mia": { toggle: true },
  "Voice recognition per person": { toggle: true },
  "Approval rules per person": { value: "Adults approve" },
  "Add a device": { action: true },
  "Which device speaks up": { value: "Nearest to you" },
  "Device keys and pairing history": { value: "5 devices" },
  "Forwarded AI models": { value: "1 from Desk PC" },
  "Rooms": { value: "4" },
  "Lights, plugs and the car": { value: "6" },
  "Find new devices": { action: true },
  "Presence sources": { value: "Phones, Wi-Fi" },
  "Which AI hux uses": { value: "At home" },
  "What may leave your home": { value: "Public searches only" },
  "Model endpoints and trust levels": { value: "3 endpoints" },
  "Sampler presets": { value: "Balanced" },
  "Usage and cost": { value: "€0.84 this month" },
  "Add a helper": { action: true },
  "Teams": { value: "1" },
  "What hux may do on its own": { value: "Asks before sending or paying" },
  "What hux remembers": { value: "5 things" },
  "Activity history": { value: "Kept 30 days" },
  "Custom rules": { value: "2" },
  "Audit log export": { action: true },
  "Connect email": { value: "Connected" },
  "Connect calendar": { value: "Connected" },
  "Connect bank": { value: "Read only" },
  "Stored keys": { value: "6" },
  "Tool servers": { value: "2 MCP servers" },
  "Lottery checker": { toggle: true },
  "Recipes": { toggle: true },
  "Browse more": { action: true },
  "Install from file": { action: true },
  "Update policy": { value: "Ask first" },
  "Quiet hours": { value: "22:30 – 7:00" },
  "How urgent things reach you": { value: "Phone, then speaker" },
  "Escalation steps": { value: "3 steps" },
  "Backup": { value: "Last night, 3:00" },
  "Updates": { value: "Up to date" },
  "Language and region": { value: "English · Berlin" },
  "Gateway address and remote access": { value: "hux.local:7443" },
  "Logs": { value: "Info" },
  "Developer options": { toggle: false },
};

const examples: Record<string, string> = {
  people: "Let Mia ask for music in her room, but nothing that costs money.",
  devices: "Call the kitchen tablet “Counter”.",
  home: "Move the LED strip to the bedroom.",
  ai: "Never send anything about money outside our home.",
  helpers: "Ask the Writer to keep my emails shorter.",
  privacy: "Forget what's in the fridge after a week.",
  connections: "Connect Sam's calendar too.",
  addons: "Stop checking the lottery in December.",
  notifications: "Start quiet hours at 23:00 on Fridays.",
  system: "Back up every night to the build box.",
};

function GroupIcon({ id, size = 30 }: { id: string; size?: number }) {
  const L = look[id];
  const Icon = L.icon;
  return (
    <span className="grid shrink-0 place-items-center rounded-[9px] text-white" style={{ width: size, height: size, background: L.tint, boxShadow: "inset 0 1px 0 rgba(255,255,255,.35)" }}>
      <Icon size={size * 0.55} strokeWidth={2.2} />
    </span>
  );
}

function SettingRow({ label, toggles, setToggle, last }: { label: string; toggles: Record<string, boolean>; setToggle: (k: string) => void; last: boolean }) {
  const r = rows[label] ?? {};
  const isToggle = r.toggle !== undefined;
  const inner = (
    <>
      <span className={`min-w-0 flex-1 text-[15px] ${r.action ? "font-semibold accent" : "font-medium"}`}>{label}</span>
      {r.value && <span className="max-w-[45%] truncate text-right text-[14px] ink-3">{r.value}</span>}
      {isToggle ? <Toggle on={toggles[label] ?? r.toggle!} onChange={() => setToggle(label)} label={label} /> : !r.action && <ChevronRight size={17} className="ink-3" />}
    </>
  );
  const cls = `flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left ${last ? "" : "border-b line"}`;
  return isToggle ? <div className={cls}>{inner}</div> : <button className={`${cls} hover:bg-[var(--fill-2)]`}>{inner}</button>;
}

function Detail({ g, onBack }: { g: Group; onBack: () => void }) {
  const { expert, askHux } = useApp();
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const setToggle = (k: string) => setToggles((t) => ({ ...t, [k]: !(t[k] ?? rows[k]?.toggle) }));
  return (
    <div className="rise" key={g.id}>
      <button onClick={onBack} className="mb-3 flex items-center gap-0.5 text-[15px] font-semibold accent md:hidden">
        <ChevronLeft size={20} /> Settings
      </button>
      <div className="mb-5 flex items-center gap-4">
        <GroupIcon id={g.id} size={52} />
        <div>
          <h2 className="serif text-[40px] leading-none">{g.title}</h2>
          <p className="mt-1 text-[15px] ink-2">{g.summary}</p>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-[20px]">
        {g.simple.map((s, i) => (
          <SettingRow key={s} label={s} toggles={toggles} setToggle={setToggle} last={i === g.simple.length - 1} />
        ))}
      </div>

      {expert ? (
        <>
          <div className="mt-6 mb-2 px-4 text-[12.5px] font-bold tracking-wide uppercase ink-3">Advanced</div>
          <div className="glass overflow-hidden rounded-[20px]">
            {g.expert.map((s, i) => (
              <SettingRow key={s} label={s} toggles={toggles} setToggle={setToggle} last={i === g.expert.length - 1} />
            ))}
          </div>
          <div className="mt-2 px-4"><Meta>settings.{g.id} · {g.simple.length + g.expert.length} keys · last changed by Alex, Tue 18:02</Meta></div>
        </>
      ) : (
        <p className="mt-2 px-4 text-[13px] ink-3">{g.expert.length} more in Expert mode.</p>
      )}

      <div className="glass mt-6 flex flex-col gap-3 rounded-[20px] p-4 sm:flex-row sm:items-center">
        <span className="accent-soft accent grid h-10 w-10 shrink-0 place-items-center rounded-full"><MessageCircle size={19} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold">Ask hux to change this</div>
          <div className="text-[14px] ink-2">For example: {"“"}{examples[g.id]}{"”"}</div>
        </div>
        <button onClick={() => askHux(examples[g.id])} className="btn-accent shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold">Ask hux</button>
      </div>
    </div>
  );
}

export function SettingsView() {
  const { expert, askHux } = useApp();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string>("people");
  const [mobileDetail, setMobileDetail] = useState(false);
  const group = settingsGroups.find((g) => g.id === sel)!;

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const out: { g: Group; item: string }[] = [];
    settingsGroups.forEach((g) => {
      if (g.title.toLowerCase().includes(t)) out.push({ g, item: g.title });
      [...g.simple, ...(expert ? g.expert : [])].forEach((i) => i.toLowerCase().includes(t) && out.push({ g, item: i }));
    });
    return out.slice(0, 12);
  }, [q, expert]);

  const total = settingsGroups.reduce((n, g) => n + g.simple.length + g.expert.length, 0);
  const shown = settingsGroups.reduce((n, g) => n + g.simple.length + (expert ? g.expert.length : 0), 0);
  const me = household.members.find((m) => m.id === household.currentMember)!;

  const open = (id: string) => {
    setSel(id);
    setMobileDetail(true);
    setQ("");
  };

  return (
    <div className="h-full md:flex">
      {/* List column */}
      <div className={`scroll-soft fade-top h-full overflow-y-auto md:block md:w-[400px] md:shrink-0 ${mobileDetail ? "hidden" : "block"}`}>
        <div className="px-4 pt-6 pb-28 sm:px-6 md:pt-10 md:pr-3">
          <h1 className="serif mb-4 text-[44px] leading-none md:text-[56px]">Settings</h1>
          <div className="glass flex items-center gap-2 rounded-full px-4">
            <Search size={17} className="ink-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search, or say what you want"
              aria-label="Search settings"
              className="min-w-0 flex-1 bg-transparent py-3 text-[15.5px] outline-none"
            />
            {q && <button aria-label="Clear" onClick={() => setQ("")} className="fill-2 grid h-6 w-6 place-items-center rounded-full ink-2"><X size={13} /></button>}
          </div>

          {q.trim() ? (
            <div className="rise mt-4">
              {results.length > 0 && (
                <div className="glass overflow-hidden rounded-[20px]">
                  {results.map((r, i) => (
                    <button key={r.g.id + r.item} onClick={() => open(r.g.id)} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--fill-2)] ${i < results.length - 1 ? "border-b line" : ""}`}>
                      <GroupIcon id={r.g.id} size={28} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{r.item}</span>
                        {r.item !== r.g.title && <span className="block text-[12.5px] ink-3">{r.g.title}</span>}
                      </span>
                      <ChevronRight size={16} className="ink-3" />
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => askHux(q.trim())} className="glass mt-3 flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left">
                <span className="accent-soft accent grid h-8 w-8 shrink-0 place-items-center rounded-full"><MessageCircle size={16} /></span>
                <span className="min-w-0 flex-1 text-[14.5px]">
                  {results.length === 0 && <span className="block ink-3">No setting with that name.</span>}
                  <span className="font-semibold">Ask hux: </span>{"“"}{q.trim()}{"”"}
                </span>
              </button>
            </div>
          ) : (
            <>
              <div className="glass mt-5 flex items-center gap-3 rounded-[20px] px-4 py-3.5">
                <Avatar id={me.id} size={46} />
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-bold">{me.name}</div>
                  <div className="text-[13.5px] ink-3">{me.role} of {household.name} · with Sam and Mia</div>
                </div>
              </div>

              {sections.map((s) => (
                <div key={s.title} className="mt-6">
                  <div className="mb-2 px-4 text-[12.5px] font-bold tracking-wide uppercase ink-3">{s.title}</div>
                  <div className="glass overflow-hidden rounded-[20px]">
                    {s.ids.map((id, i) => {
                      const g = settingsGroups.find((x) => x.id === id)!;
                      const active = sel === id;
                      return (
                        <button
                          key={id}
                          onClick={() => open(id)}
                          className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${active ? "md:bg-[var(--accent-soft)]" : "hover:bg-[var(--fill-2)]"}`}
                          aria-current={active}
                        >
                          <GroupIcon id={id} />
                          <span className={`flex min-w-0 flex-1 items-center gap-3 ${i < s.ids.length - 1 ? "" : ""}`}>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[15px] font-semibold">{g.title}</span>
                              <span className="block truncate text-[12.5px] ink-3">{g.summary}</span>
                            </span>
                            <ChevronRight size={17} className="ink-3" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <p className="mt-6 px-4 text-[13px] ink-3">
                {expert ? `Showing all ${total} settings.` : `${shown} of ${total} shown. Expert mode shows the rest.`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Detail column */}
      <div className={`scroll-soft fade-top h-full min-w-0 flex-1 overflow-y-auto md:block ${mobileDetail ? "block" : "hidden"}`}>
        <div className="mx-auto max-w-[680px] px-4 pt-6 pb-28 sm:px-6 md:pt-[104px]">
          <Detail key={group.id} g={group} onBack={() => setMobileDetail(false)} />
        </div>
      </div>
    </div>
  );
}
