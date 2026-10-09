// PROTOTYPE concept 04: Settings as a household handbook.
import { useState, type ReactNode } from "react";
import { Bell, Bot, ChevronLeft, ChevronRight, Cpu, House, Link2, MessageCircle, MonitorSmartphone, Puzzle, Search, Shield, Users, Wrench } from "lucide-react";
import { settingsGroups } from "../../fixtures";
import { useHux, type HouseTab } from "./state";
import { ExpertTag, Label, Magnet, Switch, cx } from "./ui";

type Group = (typeof settingsGroups)[number];

const icons: Record<string, ReactNode> = {
  people: <Users size={22} />,
  devices: <MonitorSmartphone size={22} />,
  home: <House size={22} />,
  ai: <Cpu size={22} />,
  helpers: <Bot size={22} />,
  privacy: <Shield size={22} />,
  connections: <Link2 size={22} />,
  addons: <Puzzle size={22} />,
  notifications: <Bell size={22} />,
  system: <Wrench size={22} />,
};

const values: Record<string, string> = {
  "Who lives here": "Alex, Sam, Mia",
  "What each person can ask for": "Mia: no shopping or email",
  "Voice recognition per person": "Alex and Sam trained",
  "Approval rules per person": "Adults approve, Mia asks a parent",
  "Rename or move a device": "5 devices",
  "Which device speaks up": "The one nearest you",
  "Device keys and pairing history": "5 paired · last on 2 Oct",
  "What each device may do": "Set per device",
  "Forwarded AI models": "Desk PC shares 1 model",
  Rooms: "Office, kitchen, living room, driveway",
  "Find new devices": "Last looked on Tuesday",
  "Connections: Matter, Zigbee, Home Assistant, Meross, Govee": "5 active",
  "Presence sources": "Phones, kitchen tablet",
  "Which AI hux uses": "Runs at home",
  "What may leave your home": "Public web searches only",
  "Model endpoints and trust levels": "2 local (trusted), 1 cloud (public only)",
  "Per-helper model choice": "Researcher uses cloud",
  "Sampler presets": "Balanced",
  "Usage and cost": "€0.42 this month",
  "Add a helper": "4 helpers",
  "Helper personalities": "Calm and brief",
  "Tools and data each helper may use": "Set per helper",
  Teams: "1 team",
  "What hux may do on its own": "Asks before sending or paying",
  "Action tiers per app": "4 apps",
  "Custom rules": "2 rules",
  "Data labels": "Private, family, public",
  "Audit log export": "CSV or JSON",
  "Connect email": "Connected",
  "Connect calendar": "Connected",
  "Connect bank": "Read only",
  "Allowed websites per service": "12 sites",
  "Stored keys": "3, encrypted",
  "Tool servers": "2 running",
  "Browse more": "12 available",
  "Permissions per extra": "Set per extra",
  "Install from file": "",
  "Update policy": "Automatic, stable only",
  "Quiet hours": "22:30 to 7:00",
  "How urgent things reach you": "Phone, then speaker",
  "Escalation steps": "3 steps",
  "Per-device notification rules": "2 rules",
  Backup: "Last night, 3:00",
  Updates: "Up to date",
  "Language and region": "English · Berlin",
  "Gateway address and remote access": "hux.local · remote access off",
  Logs: "Kept 7 days",
  "Move to another computer": "",
  "Developer options": "Off",
};

const links: Record<string, HouseTab> = {
  "Add a device": "devices",
  "Lights, plugs and the car": "home",
  "What each helper does": "helpers",
  "What hux remembers": "memory",
  "Activity history": "activity",
};

const toggleDefaults: Record<string, boolean> = { "Kids mode for Mia": true, "Lottery checker": true, Recipes: true };

export function Handbook() {
  const s = useHux();
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [toggles, setToggles] = useState(toggleDefaults);
  const group = settingsGroups.find((g) => g.id === openId);

  const flip = (k: string) => setToggles((t) => ({ ...t, [k]: !t[k] }));

  const query = q.trim().toLowerCase();
  const hits = query
    ? settingsGroups.flatMap((g) =>
        [...g.simple.map((i) => ({ g, i, expert: false })), ...g.expert.map((i) => ({ g, i, expert: true }))].filter(
          (x) => x.i.toLowerCase().includes(query) || x.g.title.toLowerCase().includes(query),
        ),
      )
    : [];
  const visibleHits = hits.filter((h) => s.expert || !h.expert);
  const hiddenHits = hits.length - visibleHits.length;

  return (
    <div className="v4-board v4-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[1180px] px-4 pb-36 pt-6 sm:px-6 lg:px-10 lg:pb-24 lg:pt-9">
        {group ? (
          <GroupPage group={group} toggles={toggles} flip={flip} onBack={() => setOpenId(null)} />
        ) : (
          <>
            <header className="mb-6">
              <Label>Settings</Label>
              <h1 className="v4-serif mt-1.5 text-[30px] font-medium leading-tight sm:text-[38px]">Household handbook</h1>
            </header>

            <div className="mb-7 grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="flex items-center gap-3 rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-4 py-3 shadow-sm focus-within:border-[var(--ink-3)]">
                <Search size={18} className="text-[var(--ink-3)]" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Find a setting, like quiet hours"
                  className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--ink-3)]"
                />
              </label>
              <button
                onClick={() => s.askHux("Start quiet hours at 23:00 on Fridays")}
                className="flex items-center gap-3 rounded-full bg-[var(--btn)] py-2 pl-2 pr-5 text-left text-[var(--btn-ink)] transition hover:opacity-90"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--honey)] text-[#2a2420]">
                  <MessageCircle size={17} />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold">Or just ask hux to change it</span>
                  <span className="block text-xs opacity-70">“Start quiet hours at 23:00 on Fridays”</span>
                </span>
              </button>
            </div>

            {query ? (
              <section className="v4-paper divide-y divide-[var(--line)]">
                {visibleHits.length === 0 && (
                  <div className="px-5 py-6 text-[var(--ink-2)]">
                    Nothing called “{q}”.{" "}
                    <button className="font-semibold underline underline-offset-2" onClick={() => s.askHux(`${q}: `)}>
                      Ask hux instead
                    </button>
                  </div>
                )}
                {visibleHits.map((h) => (
                  <button
                    key={h.g.id + h.i}
                    onClick={() => {
                      setOpenId(h.g.id);
                      setQ("");
                    }}
                    className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-[var(--paper-2)]"
                  >
                    <span className="flex-1">
                      <span className="block text-[15px] font-medium">{h.i}</span>
                      <span className="text-xs text-[var(--ink-3)]">{h.g.title}</span>
                    </span>
                    {h.expert && <ExpertTag />}
                    <ChevronRight size={16} className="text-[var(--ink-3)]" />
                  </button>
                ))}
                {hiddenHits > 0 && (
                  <button className="w-full px-5 py-3 text-left text-sm text-[var(--ink-2)] hover:bg-[var(--paper-2)]" onClick={() => s.setExpert(true)}>
                    {hiddenHits} more in expert mode. <span className="font-semibold underline underline-offset-2">Show them</span>
                  </button>
                )}
              </section>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {settingsGroups.map((g, i) => (
                  <button
                    key={g.id}
                    onClick={() => setOpenId(g.id)}
                    className="v4-paper v4-lift group flex items-start gap-4 p-5 text-left hover:-translate-y-0.5"
                  >
                    <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-[var(--paper-2)] text-[var(--ink-2)] transition group-hover:text-[var(--ink)]">
                      {icons[g.id]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="v4-serif block text-xs font-medium text-[var(--ink-3)]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="v4-serif block text-[20px] font-semibold leading-tight">{g.title}</span>
                      <span className="mt-1 block text-sm text-[var(--ink-2)]">{g.summary}</span>
                      {s.expert && <span className="mt-1.5 block text-[11px] text-[var(--ink-3)]">{g.simple.length + g.expert.length} settings</span>}
                    </span>
                    <ChevronRight size={18} className="mt-1 text-[var(--ink-3)] transition group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GroupPage({ group, toggles, flip, onBack }: { group: Group; toggles: Record<string, boolean>; flip: (k: string) => void; onBack: () => void }) {
  const s = useHux();
  const n = settingsGroups.findIndex((g) => g.id === group.id) + 1;
  return (
    <div className="mx-auto max-w-[760px]">
      <button onClick={onBack} className="mb-5 flex items-center gap-1 text-sm font-semibold text-[var(--ink-2)] hover:text-[var(--ink)]">
        <ChevronLeft size={17} /> Handbook
      </button>
      <header className="mb-6 flex flex-wrap items-start gap-4">
        <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-[var(--paper)] text-[var(--ink-2)] shadow-[var(--shadow)]">{icons[group.id]}</span>
        <div className="min-w-0 flex-1">
          <span className="v4-serif text-sm text-[var(--ink-3)]">{String(n).padStart(2, "0")}</span>
          <h1 className="v4-serif text-[30px] font-medium leading-tight">{group.title}</h1>
          <p className="mt-0.5 text-[15px] text-[var(--ink-2)]">{group.summary}</p>
        </div>
      </header>

      <section className="v4-paper relative divide-y divide-[var(--line)]">
        <Magnet className="absolute -top-[7px] left-6" />
        {group.simple.map((item) => (
          <Row key={item} item={item} toggles={toggles} flip={flip} />
        ))}
      </section>

      {s.expert ? (
        <section className="mt-6">
          <div className="mb-2 flex items-center gap-2 px-1">
            <Label>More detail</Label>
            <ExpertTag />
          </div>
          <div className="v4-paper divide-y divide-[var(--line)]">
            {group.expert.map((item) => (
              <Row key={item} item={item} toggles={toggles} flip={flip} />
            ))}
          </div>
        </section>
      ) : (
        <button onClick={() => s.setExpert(true)} className="mt-3 px-1 text-sm text-[var(--ink-2)] hover:text-[var(--ink)]">
          {group.expert.length} more in expert mode. <span className="font-semibold underline underline-offset-2">Show them</span>
        </button>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-[var(--line-strong)] px-5 py-4">
        <MessageCircle size={18} className="text-[var(--ink-3)]" />
        <span className="flex-1 text-[15px] text-[var(--ink-2)]">{askExample[group.id]}</span>
        <button
          onClick={() => s.askHux(askExample[group.id].replace(/^Try: |[“”]/g, ""))}
          className="rounded-full bg-[var(--btn)] px-4 py-2 text-sm font-semibold text-[var(--btn-ink)] hover:opacity-90"
        >
          Ask hux to change this
        </button>
      </div>
    </div>
  );
}

const askExample: Record<string, string> = {
  people: "Try: “Let Mia add things to the shopping list”",
  devices: "Try: “Call the kitchen tablet Kitchen”",
  home: "Try: “Put the LED strip in Mia's room”",
  ai: "Try: “Never use the cloud for anything about money”",
  helpers: "Try: “Have the Writer sound a bit more formal with Todd”",
  privacy: "Try: “Ask me before turning off the lights”",
  connections: "Try: “Connect Sam's calendar”",
  addons: "Try: “Stop checking the lottery while we're on holiday”",
  notifications: "Try: “Start quiet hours at 23:00 on Fridays”",
  system: "Try: “Back up to the build box every Sunday”",
};

function Row({ item, toggles, flip }: { item: string; toggles: Record<string, boolean>; flip: (k: string) => void }) {
  const s = useHux();
  const link = links[item];
  const toggle = item in toggles;
  const value = link === "memory" ? `${s.memories.length} things` : values[item];
  const base = "flex w-full items-center gap-4 px-5 py-4 text-left";
  if (toggle)
    return (
      <div className={base}>
        <span className="flex-1 text-[16px] font-medium">{item}</span>
        <Switch on={toggles[item]} onChange={() => flip(item)} label={item} />
      </div>
    );
  return (
    <button className={cx(base, "transition hover:bg-[var(--paper-2)]")} onClick={() => (link ? s.openHouse(link) : s.askHux(`${item}: `))}>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-medium">{item}</span>
        {value && <span className="mt-0.5 block text-sm text-[var(--ink-2)] sm:hidden">{value}</span>}
      </span>
      {value && <span className="hidden max-w-[45%] text-right text-sm text-[var(--ink-2)] sm:block">{value}</span>}
      <ChevronRight size={17} className="flex-none text-[var(--ink-3)]" />
    </button>
  );
}
