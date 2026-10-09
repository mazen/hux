// PROTOTYPE - Settings as a calm, indexed document, concept 01 "Paper".
import { useMemo, useRef, useState } from "react";
import { MessageSquareText, Search } from "lucide-react";
import { settingsGroups } from "../../fixtures";
import { useStore } from "./store";
import { PageHeader } from "./ui";

// Current values, so a reader sees how things stand without opening anything.
const values: Record<string, string> = {
  "Who lives here": "Alex, Sam and Mia",
  "Kids mode for Mia": "On",
  "Which device speaks up": "The one nearest you",
  Rooms: "Office, kitchen, living room, driveway",
  "Lights, plugs and the car": "6 things",
  "Which AI hux uses": "Runs here at home",
  "What may leave your home": "Public questions only",
  "What each helper does": "4 helpers",
  "What hux may do on its own": "Asks before sending or paying",
  "What hux remembers": "5 things about this household",
  "Activity history": "Kept for 30 days",
  "Connect email": "Connected",
  "Connect calendar": "Connected",
  "Connect bank": "Read only",
  "Lottery checker": "On",
  Recipes: "On",
  "Quiet hours": "22:30 to 7:00",
  "How urgent things reach you": "Phone, then speaker",
  Backup: "Every night at 3:00",
  Updates: "Automatic, up to date",
  "Language and region": "English, Berlin",
  "Voice recognition per person": "Alex and Sam",
  "Model endpoints and trust levels": "2 at home (trusted), 1 cloud (public only)",
  "Per-helper model choice": "Researcher uses cloud",
  "Usage and cost": "€0.42 this month",
  "Escalation steps": "Phone, speaker, then Sam",
  "Gateway address and remote access": "hux.local, remote off",
  "Update policy": "Ask before major updates",
};

// A sentence you could say instead of looking for the switch.
const askExamples: Record<string, string> = {
  people: "Let Mia ask for music, but nothing that costs money.",
  devices: "Let the kitchen tablet speak up for reminders.",
  home: "Call the LED strip the shelf light.",
  ai: "Never send anything about money outside our home.",
  helpers: "What does the Researcher actually do?",
  privacy: "Always ask me before you buy anything.",
  connections: "Connect my work calendar too.",
  addons: "Stop checking the lottery for now.",
  notifications: "On Fridays, start quiet hours at 23:00.",
  system: "Back everything up tonight.",
};

export function Settings() {
  const { expert, setExpert, go } = useStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      settingsGroups
        .map((g, i) => {
          const items = [...g.simple.map((t) => ({ t, expert: false })), ...(expert ? g.expert.map((t) => ({ t, expert: true })) : [])];
          const matchGroup = !q || g.title.toLowerCase().includes(q);
          return { ...g, n: i + 1, items: matchGroup ? items : items.filter((it) => it.t.toLowerCase().includes(q)) };
        })
        .filter((g) => g.items.length > 0),
    [q, expert],
  );

  const total = settingsGroups.reduce((n, g) => n + g.simple.length + g.expert.length, 0);
  const jump = (id: string) => {
    const el = scroller.current?.querySelector(`#v01-set-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={scroller} className="thin-scroll h-full overflow-y-auto scroll-smooth">
      <div className="mx-auto w-full max-w-6xl px-5 pb-28 pt-10 sm:px-8 sm:pt-16">
        <PageHeader
          kicker={`${settingsGroups.length} chapters · ${expert ? total : settingsGroups.reduce((n, g) => n + g.simple.length, 0)} settings`}
          title="Settings"
          dek="Anything here, you can also just ask hux to change."
        />

        <div className="mt-12 grid gap-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
          {/* Table of contents */}
          <nav className="fade-slow lg:sticky lg:top-6 lg:self-start" aria-label="Contents">
            <label className="flex items-center gap-2 border-b border-(--rule-strong) pb-1.5 focus-within:border-(--ink)">
              <Search size={14} strokeWidth={1.6} className="text-(--faint)" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a setting"
                className="sans min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-(--faint)"
              />
            </label>
            <div className="caps mt-7 text-(--faint)">Contents</div>
            <ol className="mt-3 columns-2 gap-6 sm:columns-3 lg:columns-1">
              {settingsGroups.map((g, i) => (
                <li key={g.id} className="break-inside-avoid">
                  <button onClick={() => jump(g.id)} className="group flex w-full items-baseline gap-3 py-1 text-left">
                    <span className="sans lining w-4 text-[11px] text-(--faint)">{i + 1}</span>
                    <span className="text-[1.02rem] group-hover:text-(--accent)">{g.title}</span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="mt-8 border-t border-(--rule) pt-5">
              <div className="caps text-(--faint)">Detail</div>
              <div className="sans mt-3 inline-flex rounded-full border border-(--rule-strong) p-0.5 text-[12.5px]">
                {[false, true].map((v) => (
                  <button
                    key={String(v)}
                    onClick={() => setExpert(v)}
                    className={"rounded-full px-3 py-1 transition-colors " + (expert === v ? "bg-(--ink) text-(--paper)" : "text-(--ink-soft)")}
                  >
                    {v ? "Expert" : "Simple"}
                  </button>
                ))}
              </div>
              <p className="sans mt-3 text-[12.5px] leading-relaxed text-(--faint)">
                {expert ? "Showing every setting, including technical ones." : `${total - settingsGroups.reduce((n, g) => n + g.simple.length, 0)} technical settings are tucked away.`}
              </p>
            </div>
          </nav>

          {/* The document */}
          <div className="fade-slow min-w-0">
            {groups.length === 0 && (
              <p className="text-[1.1rem] italic text-(--ink-soft)">
                Nothing here called "{query}".{" "}
                <button className="link not-italic" onClick={() => go("conversation", `Help me with "${query}".`)}>
                  Ask hux instead
                </button>
              </p>
            )}
            {groups.map((g) => {
              const hidden = settingsGroups.find((s) => s.id === g.id)!.expert.length;
              return (
                <section key={g.id} id={`v01-set-${g.id}`} className="scroll-mt-6 border-t border-(--rule) pb-12 pt-7 first:border-t-0 first:pt-0">
                  <div className="flex items-baseline gap-4">
                    <span className="display lining text-[1.6rem] text-(--accent)">{g.n}</span>
                    <div className="min-w-0">
                      <h2 className="display text-[1.9rem] leading-tight">{g.title}</h2>
                      <p className="mt-0.5 italic text-(--ink-soft)">{g.summary}</p>
                    </div>
                  </div>

                  <ul className="mt-5 sm:ml-10">
                    {g.items.map((it, idx) => {
                      const key = `${g.id}:${it.t}`;
                      const isOpen = open === key;
                      const firstExpert = it.expert && !g.items[idx - 1]?.expert;
                      return (
                        <li key={key}>
                          {firstExpert && <div className="caps mb-1 mt-5 text-(--faint)">For experts</div>}
                          <button
                            onClick={() => setOpen(isOpen ? null : key)}
                            aria-expanded={isOpen}
                            className="group flex w-full items-baseline gap-4 border-b border-dotted border-(--rule-strong) py-3 text-left"
                          >
                            <span className={"text-[1.08rem] group-hover:text-(--accent) " + (it.expert ? "text-(--ink-soft)" : "")}>{it.t}</span>
                            <span className="flex-1" />
                            <span className="sans text-right text-[13px] text-(--faint)">{values[it.t] ?? ""}</span>
                          </button>
                          {isOpen && (
                            <div className="fade-in flex flex-wrap items-center gap-x-5 gap-y-2 bg-(--paper-edge) px-4 py-3">
                              <span className="sans text-[13px] text-(--ink-soft)">Say what you'd like and hux will show you the change first.</span>
                              <button
                                onClick={() => go("conversation", `Help me with "${it.t}". `)}
                                className="sans inline-flex items-center gap-1.5 text-[13px] font-medium text-(--accent) hover:underline"
                              >
                                <MessageSquareText size={14} strokeWidth={1.7} /> Ask hux to change this
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3 sm:ml-10">
                    <button onClick={() => go("conversation", askExamples[g.id])} className="text-left italic text-(--ink-soft)">
                      Or say: <span className="link">"{askExamples[g.id]}"</span>
                    </button>
                    {!expert && hidden > 0 && !q && (
                      <button onClick={() => setExpert(true)} className="sans text-[12px] text-(--faint) hover:text-(--ink)">
                        {hidden} more in expert mode
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
