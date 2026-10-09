// PROTOTYPE - concept 08 settings: big group tiles that open into plain lists.
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, BellRing, Brain, ChevronDown, HandHelping, House, Link2, MessageCircle, MonitorSmartphone, Puzzle, Search, Settings2, ShieldCheck, Users, Wrench, X,
} from "lucide-react";
import { settingsGroups } from "../../fixtures";
import { useStore, type View } from "./store";
import { Btn, Switch, cx } from "./ui";

type Group = (typeof settingsGroups)[number];

const icons: Record<string, React.ReactNode> = {
  people: <Users size={26} strokeWidth={2.5} />,
  devices: <MonitorSmartphone size={26} strokeWidth={2.5} />,
  home: <House size={26} strokeWidth={2.5} />,
  ai: <Brain size={26} strokeWidth={2.5} />,
  helpers: <HandHelping size={26} strokeWidth={2.5} />,
  privacy: <ShieldCheck size={26} strokeWidth={2.5} />,
  connections: <Link2 size={26} strokeWidth={2.5} />,
  addons: <Puzzle size={26} strokeWidth={2.5} />,
  notifications: <BellRing size={26} strokeWidth={2.5} />,
  system: <Settings2 size={26} strokeWidth={2.5} />,
};
const tones = ["bg-sun", "bg-coral", "bg-mint", "bg-sky", "bg-lilac"];
const toneFor = (i: number) => tones[i % tones.length];

/** Current values for some items, so lists read like a real product. */
const values: Record<string, string> = {
  "Who lives here": "Alex, Sam and Mia",
  "What each person can ask for": "Mia: no shopping or email",
  "Which device speaks up": "The one nearest to you",
  "Rename or move a device": "5 devices",
  Rooms: "Office, Kitchen, Living room, Driveway",
  "Lights, plugs and the car": "6 things",
  "Which AI hux uses": "The one here at home",
  "What may leave your home": "Only public web searches",
  "What each helper does": "Chief, Researcher, Writer, Home",
  "What hux may do on its own": "Asks before sending or paying",
  "What hux remembers": "5 things",
  "Activity history": "Kept for 30 days",
  "Connect email": "Connected",
  "Connect calendar": "Connected",
  "Connect bank": "Read only",
  "Quiet hours": "22:30 to 7:00",
  "How urgent things reach you": "Phone first, then the speaker",
  Backup: "Last night at 3:00",
  Updates: "Up to date",
  "Language and region": "English, Berlin",
  "Voice recognition per person": "Trained for Alex and Sam",
  "Model endpoints and trust levels": "2 local, 1 cloud",
  "Usage and cost": "€0.42 this month",
  "Gateway address and remote access": "hux.local:8443 · remote off",
  "Stored keys": "4 keys",
  "Tool servers": "3 MCP servers",
  "Update policy": "Install security fixes automatically",
};
const switches: Record<string, boolean> = { "Kids mode for Mia": true, "Lottery checker": true, Recipes: true };
const links: Record<string, View> = { "What hux remembers": "house", "Activity history": "house", "Rename or move a device": "house", "Lights, plugs and the car": "house", "What each helper does": "house" };
const actions = new Set(["Add a device", "Find new devices", "Add a helper", "Browse more", "Install from file", "Move to another computer"]);

const askExamples: Record<string, string> = {
  people: "Let Mia ask for music in her room",
  devices: "Let the kitchen tablet answer when I'm in the kitchen",
  home: "Add the garden lights to the living room",
  ai: "Never send anything about money outside the house",
  helpers: "Let the Writer draft replies to the school",
  privacy: "Ask me before turning off the lights",
  connections: "Connect Sam's calendar too",
  addons: "Check the lottery on Wednesdays as well",
  notifications: "Start quiet hours at 22:00 on weekdays",
  system: "Back up every night to the build box",
};

function Row({ item, expertItem }: { item: string; expertItem?: boolean }) {
  const { askAbout, go } = useStore();
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState(switches[item]);
  const hasSwitch = item in switches;
  const value = values[item];

  if (hasSwitch)
    return (
      <li className="flex min-h-16 items-center gap-4 px-4 py-3 md:px-5">
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold leading-snug">{item}</div>
          <div className="text-[15px] text-muted">{on ? "On" : "Off"}</div>
        </div>
        <Switch on={on} onChange={setOn} label={item} />
      </li>
    );

  return (
    <li>
      <button
        type="button"
        onClick={() => (links[item] ? go(links[item]) : actions.has(item) ? askAbout(item) : setOpen(!open))}
        aria-expanded={links[item] || actions.has(item) ? undefined : open}
        className="flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left md:px-5"
      >
        <div className="min-w-0 flex-1">
          <div className={cx("text-lg font-bold leading-snug", expertItem && "font-semibold")}>{item}</div>
          {value && <div className={cx("text-[15px] text-muted", expertItem && "font-mono text-[13px]")}>{value}</div>}
        </div>
        {links[item] ? (
          <ArrowRight size={22} strokeWidth={2.75} />
        ) : actions.has(item) ? (
          <span className="bx grid size-9 place-items-center rounded-lg bg-sun text-[#161310]" style={{ borderWidth: 2.5 }}>
            <ArrowRight size={18} strokeWidth={3} />
          </span>
        ) : (
          <ChevronDown size={22} strokeWidth={2.75} className={cx("transition-transform", open && "rotate-180")} />
        )}
      </button>
      {open && (
        <div className="pop mx-4 mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-sunk p-3 md:mx-5">
          <Btn
            size="sm"
            tone="ink"
            icon={<MessageCircle size={16} strokeWidth={2.75} />}
            onClick={() => askAbout(`Change ${item.charAt(0).toLowerCase() + item.slice(1)} to `)}
          >
            Ask hux to change this
          </Btn>
        </div>
      )}
    </li>
  );
}

function GroupDetail({ group, index, onBack }: { group: Group; index: number; onBack: () => void }) {
  const { expert, setExpert, askAbout } = useStore();
  return (
    <div className="pop">
      <Btn size="sm" icon={<ArrowLeft size={18} strokeWidth={2.75} />} onClick={onBack}>All settings</Btn>
      <div className={cx("bx sh-lg on-block mt-5 flex items-center gap-4 rounded-2xl p-5 md:p-7", toneFor(index))}>
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl border-[3px] border-[#161310] bg-[#fffbf4] md:size-20">{icons[group.id]}</span>
        <div className="min-w-0">
          <h2 className="font-display text-4xl font-extrabold leading-none md:text-6xl">{group.title}</h2>
          <p className="mt-2 text-lg font-semibold on-block-muted">{group.summary}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <ul className="bx sh divide-line rounded-2xl bg-surface">
            {group.simple.map((it) => (
              <Row key={it} item={it} />
            ))}
          </ul>
          {expert ? (
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-muted">
                <Wrench size={14} strokeWidth={2.75} /> Expert
              </div>
              <ul className="divide-line rounded-2xl border-[3px] border-dashed border-line bg-sunk">
                {group.expert.map((it) => (
                  <Row key={it} item={it} expertItem />
                ))}
              </ul>
            </div>
          ) : (
            <button type="button" onClick={() => setExpert(true)} className="flex w-full items-center gap-3 rounded-2xl border-[3px] border-dashed border-line px-4 py-4 text-left text-[15px] font-semibold text-muted md:px-5">
              <Wrench size={18} strokeWidth={2.5} />
              <span className="flex-1">{group.expert.length} more settings for experts</span>
              <span className="font-bold text-ink">Show</span>
            </button>
          )}
        </div>
        <aside className="bx sh h-fit rounded-2xl bg-ink p-5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] opacity-75">
            <MessageCircle size={15} strokeWidth={2.75} /> Easier: just ask
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold leading-tight">“{askExamples[group.id]}”</p>
          <Btn className="mt-4 w-full" tone="sun" onClick={() => askAbout(askExamples[group.id])} icon={<MessageCircle size={18} strokeWidth={2.75} />}>
            Ask hux to change this
          </Btn>
        </aside>
      </div>
    </div>
  );
}

export function SettingsView() {
  const { expert, setExpert, askAbout } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [ask, setAsk] = useState("");

  const idx = settingsGroups.findIndex((g) => g.id === openId);
  const query = q.trim().toLowerCase();
  const hits = query
    ? settingsGroups.flatMap((g, gi) =>
        [...g.simple.map((s) => ({ s, ex: false })), ...g.expert.map((s) => ({ s, ex: true }))]
          .filter((x) => x.s.toLowerCase().includes(query) || g.title.toLowerCase().includes(query))
          .map((x) => ({ ...x, g, gi })),
      )
    : [];
  const visibleHits = hits.filter((h) => expert || !h.ex);
  const hiddenHits = hits.length - visibleHits.length;

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-6 md:px-10 md:pt-12">
      {idx >= 0 ? (
        <GroupDetail group={settingsGroups[idx]} index={idx} onBack={() => setOpenId(null)} />
      ) : (
        <>
          <h1 className="font-display text-6xl font-extrabold leading-[0.9] md:text-8xl">Settings</h1>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <form
              className="bx sh rounded-2xl bg-ink p-4 md:p-5"
              onSubmit={(e) => {
                e.preventDefault();
                askAbout(ask.trim() || askExamples.notifications);
                setAsk("");
              }}
            >
              <label htmlFor="v08-settings-ask" className="font-display text-2xl font-extrabold leading-tight md:text-3xl">Or just ask hux to change it.</label>
              <div className="mt-3 flex gap-2">
                <input
                  id="v08-settings-ask"
                  value={ask}
                  onChange={(e) => setAsk(e.target.value)}
                  placeholder={askExamples.notifications}
                  className="min-h-14 min-w-0 flex-1 rounded-xl border-[3px] border-[var(--paper)] bg-transparent px-4 text-lg font-semibold outline-none placeholder:!text-[color:var(--paper)] placeholder:opacity-60"
                />
                <button type="submit" aria-label="Ask hux" className="press grid size-14 shrink-0 place-items-center rounded-xl border-[3px] border-[var(--paper)] bg-sun">
                  <ArrowRight size={24} strokeWidth={3} />
                </button>
              </div>
            </form>
            <div className="bx sh flex items-center gap-3 rounded-2xl bg-surface px-4">
              <Search size={24} strokeWidth={2.75} className="shrink-0" />
              <label htmlFor="v08-settings-search" className="sr-only">Find a setting</label>
              <input
                id="v08-settings-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Find a setting"
                className="min-h-16 min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none"
              />
              {q && (
                <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="grid size-10 place-items-center rounded-lg">
                  <X size={20} strokeWidth={2.75} />
                </button>
              )}
            </div>
          </div>

          {query ? (
            <div className="mt-8">
              {visibleHits.length === 0 && hiddenHits === 0 && (
                <div className="bx rounded-2xl bg-surface p-6">
                  <p className="font-display text-2xl font-extrabold">Nothing called “{q}”.</p>
                  <Btn className="mt-4" tone="sun" icon={<MessageCircle size={18} strokeWidth={2.75} />} onClick={() => askAbout(q)}>Ask hux about “{q}”</Btn>
                </div>
              )}
              {visibleHits.length > 0 && (
                <ul className="bx sh divide-line rounded-2xl bg-surface">
                  {visibleHits.map((h) => (
                    <li key={h.g.id + h.s}>
                      <button type="button" onClick={() => { setOpenId(h.g.id); setQ(""); }} className="flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left md:px-5">
                        <span className={cx("bx grid size-10 shrink-0 place-items-center rounded-xl text-[#161310] [&_svg]:size-5", toneFor(h.gi))} style={{ borderWidth: 2.5 }}>{icons[h.g.id]}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-lg font-bold leading-snug">{h.s}</span>
                          <span className="block text-[15px] text-muted">{h.g.title}{h.ex ? " · expert" : ""}</span>
                        </span>
                        <ArrowRight size={20} strokeWidth={2.75} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {hiddenHits > 0 && (
                <button type="button" onClick={() => setExpert(true)} className="mt-4 flex w-full items-center gap-3 rounded-2xl border-[3px] border-dashed border-line px-4 py-4 text-left font-semibold text-muted">
                  <Wrench size={18} strokeWidth={2.5} />
                  <span className="flex-1">{hiddenHits} more in expert mode</span>
                  <span className="font-bold text-ink">Show</span>
                </button>
              )}
            </div>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-5">
              {settingsGroups.map((g, i) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(g.id)}
                    className={cx("press bx sh on-block flex h-full min-h-44 w-full flex-col items-start rounded-2xl p-4 text-left md:min-h-52 md:p-5", toneFor(i))}
                  >
                    <span className="grid size-12 place-items-center rounded-xl border-[2.5px] border-[#161310] bg-[#fffbf4] md:size-14">{icons[g.id]}</span>
                    <span className="mt-auto pt-4 font-display text-xl font-extrabold leading-[1.05] md:text-2xl">{g.title}</span>
                    <span className="mt-1 text-sm font-semibold leading-snug on-block-muted md:text-[15px]">{g.summary}</span>
                    {expert && <span className="mt-2 font-mono text-[11px] font-bold">{g.simple.length} + {g.expert.length} expert</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
