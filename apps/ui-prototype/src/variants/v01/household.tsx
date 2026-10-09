// PROTOTYPE - Household: approvals, the house, devices, helpers, memory and the day's log. Concept 01 "Paper".
import { useState } from "react";
import { activity, devices, helpers, home } from "../../fixtures";
import { memberById, useStore } from "./store";
import { PageHeader, Switch } from "./ui";

const sections = [
  { id: "waiting", title: "Awaiting you" },
  { id: "house", title: "Lights, plugs and the car" },
  { id: "memory", title: "What hux remembers" },
  { id: "log", title: "Activity today" },
  { id: "devices", title: "Devices" },
  { id: "helpers", title: "Helpers" },
];

function Section({ id, n, title, dek, children }: { id: string; n: number; title: string; dek?: string; children: React.ReactNode }) {
  return (
    <section id={`v01-h-${id}`} className="scroll-mt-6 border-t border-(--rule) py-9">
      <div className="flex items-baseline gap-4">
        <span className="display lining text-[1.5rem] text-(--accent)">{n}</span>
        <div>
          <h2 className="display text-[1.8rem] leading-tight">{title}</h2>
          {dek && <p className="mt-0.5 italic text-(--ink-soft)">{dek}</p>}
        </div>
      </div>
      <div className="mt-5 sm:ml-9">{children}</div>
    </section>
  );
}

export function Household() {
  const { approval, setApproval, homeState, toggleHome, memories, updateMemory, forgetMemory, expert, go } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const places = [...new Set(home.map((h) => h.place))];

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-5 pb-28 pt-10 sm:px-8 sm:pt-16">
        <PageHeader kicker="Home · Alex, Sam and Mia" title="Household">
          <nav className="sans mt-6 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-(--ink-soft)">
            {sections.map((s) => (
              <button key={s.id} onClick={() => document.getElementById(`v01-h-${s.id}`)?.scrollIntoView({ behavior: "smooth" })} className="link">
                {s.title}
              </button>
            ))}
          </nav>
        </PageHeader>

        <div className="fade-slow mt-10">
          <Section id="waiting" n={1} title="Awaiting you">
            {approval === "pending" ? (
              <div className="flex flex-wrap items-center justify-between gap-4 border-l-2 border-(--accent) pl-4">
                <div>
                  <p className="text-[1.1rem]">Send email to Todd Becker</p>
                  <p className="italic text-(--ink-soft)">"Home battery options for the garage", Monday 12 Oct at 7:30</p>
                </div>
                <div className="sans flex gap-2 text-[13px]">
                  <button onClick={() => setApproval("approved")} className="rounded-full bg-(--ink) px-4 py-2 font-medium text-(--paper) hover:bg-(--accent)">
                    Approve
                  </button>
                  <button onClick={() => go("conversation")} className="rounded-full border border-(--rule-strong) px-4 py-2 hover:border-(--ink)">
                    Read it first
                  </button>
                </div>
              </div>
            ) : (
              <p className="italic text-(--ink-soft)">
                Nothing. {approval === "approved" ? "The email to Todd goes out Monday at 7:30." : "The email to Todd is held back until you say so."}
              </p>
            )}
          </Section>

          <Section id="house" n={2} title="Lights, plugs and the car">
            <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {places.map((p) => (
                <div key={p}>
                  <div className="caps text-(--faint)">{p}</div>
                  <ul className="mt-2">
                    {home
                      .filter((h) => h.place === p)
                      .map((h) => {
                        const state = homeState[h.id];
                        const switchable = h.kind === "light" || h.kind === "plug";
                        return (
                          <li key={h.id} className="flex items-center justify-between gap-3 border-b border-dotted border-(--rule-strong) py-2.5">
                            <div>
                              <div className="text-[1.05rem]">{h.name}</div>
                              {(!switchable || expert) && (
                                <div className="sans text-[12px] text-(--faint)">
                                  {state}
                                  {expert && ` · ${h.kind === "car" ? "via car account" : h.kind === "plug" ? "Meross" : "Zigbee"}`}
                                </div>
                              )}
                            </div>
                            {switchable && <Switch on={!state.startsWith("Off")} onChange={() => toggleHome(h.id)} label={h.name} offLabel="Off" />}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section id="memory" n={3} title="What hux remembers">
            {memories.length === 0 && <p className="italic text-(--ink-soft)">Nothing at the moment.</p>}
            <ul>
              {memories.map((m) => {
                const about = memberById(m.about);
                return (
                  <li key={m.id} className="border-b border-dotted border-(--rule-strong) py-3">
                    {editing === m.id ? (
                      <form
                        className="flex flex-wrap items-center gap-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (text.trim()) updateMemory(m.id, text.trim());
                          setEditing(null);
                        }}
                      >
                        <input
                          autoFocus
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          className="min-w-0 flex-1 border-b border-(--ink) bg-transparent py-1 text-[1.05rem] outline-none"
                        />
                        <button type="submit" className="sans text-[13px] font-medium text-(--accent)">
                          Save
                        </button>
                        <button type="button" onClick={() => setEditing(null)} className="sans text-[13px] text-(--faint)">
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <div className="min-w-0">
                          <p className="text-[1.05rem]">{m.text}</p>
                          <p className="sans text-[12px] text-(--faint)">
                            {m.learned}
                            {about ? ` · about ${about.name}` : " · everyone"}
                            {expert && ` · id ${m.id} · stored on this network`}
                          </p>
                        </div>
                        <div className="sans flex gap-4 text-[12.5px]">
                          <button
                            onClick={() => {
                              setEditing(m.id);
                              setText(m.text);
                            }}
                            className="link text-(--ink-soft)"
                          >
                            Change
                          </button>
                          <button onClick={() => forgetMemory(m.id)} className="link text-(--ink-soft)">
                            Forget
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section id="log" n={4} title="Activity today">
            <ol>
              {activity.map((a) => {
                const who = memberById(a.who);
                return (
                  <li key={a.id} className="grid grid-cols-[3.4rem_1fr] gap-3 py-1.5">
                    <span className="sans lining pt-[3px] text-[13px] text-(--faint)">{a.at}</span>
                    <span className="text-[1.05rem] leading-snug">
                      {a.text}
                      {a.needsYou && approval === "pending" && <span className="caps ml-2 text-(--accent)">needs you</span>}
                      {expert && <span className="sans block text-[11.5px] text-(--faint)">{who ? `Asked by ${who.name}` : "On its own (routine)"}</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Section>

          <Section id="devices" n={5} title="Devices">
            <ul>
              {devices.map((d) => (
                <li key={d.id} className="flex items-baseline justify-between gap-4 border-b border-dotted border-(--rule-strong) py-2.5">
                  <div className="min-w-0">
                    <span className="text-[1.05rem]">{d.name}</span>
                    <span className="ml-2 italic text-(--ink-soft)">{d.place}</span>
                    {expert && (
                      <div className="sans text-[11.5px] text-(--faint)">
                        {d.kind} · {d.abilities.join(", ")}
                        {d.screens > 0 ? ` · ${d.screens} screen${d.screens > 1 ? "s" : ""}` : ""}
                      </div>
                    )}
                  </div>
                  <span className="sans shrink-0 text-[12.5px] text-(--faint)">
                    <span className={"mr-1.5 inline-block size-1.5 rounded-full " + (d.online ? "bg-(--ink-soft)" : "border border-(--faint)")} />
                    {d.note ?? (d.online ? "Ready" : "Asleep")}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="helpers" n={6} title="Helpers">
            <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {helpers.map((h) => (
                <div key={h.id}>
                  <dt className="text-[1.1rem]">{h.name}</dt>
                  <dd className="italic text-(--ink-soft)">{h.does}</dd>
                  {expert && (
                    <dd className="sans mt-1 text-[11.5px] leading-relaxed text-(--faint)">
                      Model: {h.model}
                      <br />
                      May: {h.canDo.join(", ")}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}
