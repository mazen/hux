// PROTOTYPE concept 03 - Home (devices, home devices, helpers), Memory, Activity.
import { useState } from "react";
import { Check } from "lucide-react";
import { activity, devices, helpers, home } from "../../fixtures";
import { useHux } from "./store";
import { Btn, Label, PageTitle, SectionHead, Switch } from "./ui";
import { memberName } from "./data";

/* ---------- Home ---------- */

export function HomePage() {
  const { homeState, toggleHome, expert } = useHux();
  const places = Array.from(new Set(home.map((h) => h.place)));
  const onCount = home.filter((h) => h.kind !== "car" && homeState[h.id]).length;
  const online = devices.filter((d) => d.online).length;

  return (
    <div>
      <PageTitle kicker="03" title="Home" />

      <div className="grid gap-14 xl:grid-cols-12 xl:gap-10">
        <section className="xl:col-span-7">
          <SectionHead n="3.1" title="In your home" right={<span className="t-meta">{onCount} on right now</span>} />
          {places.map((p) => (
            <div key={p} className="grid grid-cols-1 border-b py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
              <Label className="c-mute pt-2.5">{p}</Label>
              <ul>
                {home.filter((h) => h.place === p).map((h) => {
                  const on = homeState[h.id];
                  const state = h.kind === "car" ? h.state : on ? (h.state.startsWith("On") ? h.state : "On") : "Off";
                  return (
                    <li key={h.id} className="flex items-center justify-between gap-4 py-2">
                      <div className="min-w-0">
                        <div className="text-[16px] font-semibold">{h.name}</div>
                        <div className="text-[13px] c-mute">
                          {state}
                          {expert && ` · ${h.kind === "light" ? (h.id === "h4" ? "Govee" : "Zigbee") : h.kind === "plug" ? "Meross" : "Home Assistant"}`}
                        </div>
                      </div>
                      {h.kind === "car" ? (
                        <div className="text-right">
                          <div className="t-num text-[32px]">64%</div>
                          <div className="t-meta mt-1">Full by 23:10</div>
                        </div>
                      ) : (
                        <Switch on={on} onChange={() => toggleHome(h.id)} label={h.name} />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>

        <section className="xl:col-span-5">
          <SectionHead n="3.2" title="Where hux runs" right={<span className="t-meta">{online} of {devices.length} awake</span>} />
          <ul>
            {devices.map((d) => (
              <li key={d.id} className="grid grid-cols-[1fr_auto] gap-x-4 border-b py-3">
                <div>
                  <div className="text-[16px] font-semibold">
                    {d.name}
                    {d.note === "You're here" && <span className="t-label ml-2 align-middle">You're here</span>}
                  </div>
                  <div className="text-[13px] c-mute">{d.place}{d.online ? "" : ` · ${d.note}`}</div>
                  {expert && <div className="t-meta mt-0.5">{d.abilities.join(", ")}{d.screens ? ` · ${d.screens} screen${d.screens > 1 ? "s" : ""}` : ""} · node {d.id}</div>}
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="h-2 w-2" style={{ background: d.online ? "var(--ink)" : "transparent", border: "1px solid var(--ink)" }} />
                  {d.online ? "Awake" : "Asleep"}
                </div>
              </li>
            ))}
          </ul>

          <SectionHead n="3.3" title="Helpers" className="mt-14" />
          <ul>
            {helpers.map((h) => (
              <li key={h.id} className="border-b py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-[16px] font-semibold">{h.name}</div>
                  {expert && <div className="t-meta">{h.model}</div>}
                </div>
                <div className="text-[14px] c-ink2">{h.does}</div>
                {expert && <div className="t-meta mt-1">{h.canDo.join(" · ")}</div>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* ---------- Memory ---------- */

export function MemoryPage() {
  const { memories, editMemory, forgetMemory, askAbout, expert } = useHux();
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [forgot, setForgot] = useState<string | null>(null);

  return (
    <div>
      <PageTitle kicker={`04 · ${memories.length} things`} title="Memory" />
      {forgot && (
        <p className="m-in mb-4 flex items-center gap-2 text-[14px]"><Check size={14} /> Forgotten: "{forgot}"</p>
      )}
      <ol className="border-t b-ink">
        {memories.map((m, i) => (
          <li key={m.id} className="grid grid-cols-[3rem_1fr] gap-x-3 border-b py-4 sm:grid-cols-[4rem_1fr_auto]">
            <span className="t-num text-[28px] c-mute">{String(i + 1).padStart(2, "0")}</span>
            <div className="min-w-0">
              {editing === m.id ? (
                <form onSubmit={(e) => { e.preventDefault(); editMemory(m.id, text); setEditing(null); }} className="flex flex-wrap items-center gap-2">
                  <input autoFocus value={text} onChange={(e) => setText(e.target.value)} className="h-10 min-w-0 flex-1 border-b b-ink bg-transparent text-[18px] outline-none" />
                  <Btn tone="ink" type="submit">Save</Btn>
                  <Btn tone="plain" onClick={() => setEditing(null)}>Cancel</Btn>
                </form>
              ) : (
                <div className="text-[18px] leading-snug">{m.text}</div>
              )}
              <div className="t-meta mt-1">
                {m.learned}
                {m.about ? ` · about ${memberName(m.about)}` : " · the whole household"}
                {expert && ` · id ${m.id} · kept until removed`}
              </div>
            </div>
            {editing !== m.id && (
              <div className="col-start-2 mt-2 flex gap-4 sm:col-start-3 sm:mt-0 sm:pt-1">
                <Btn tone="plain" className="text-[14px]" onClick={() => { setEditing(m.id); setText(m.text); }}>Change</Btn>
                <Btn tone="plain" className="text-[14px]" onClick={() => { setForgot(m.text); forgetMemory(m.id); }}>Forget</Btn>
              </div>
            )}
          </li>
        ))}
      </ol>
      {memories.length === 0 && <p className="mt-6 text-[16px] c-ink2">hux doesn't remember anything right now.</p>}
      <Btn tone="plain" className="mt-6 text-[15px]" onClick={() => askAbout("Remember that ")}>Tell hux something to remember</Btn>
    </div>
  );
}

/* ---------- Activity ---------- */

export function ActivityPage() {
  const { approval, setApproval, show, expert } = useHux();
  const pending = approval === "pending";
  return (
    <div>
      <PageTitle kicker="05 · Friday 9 October" title="Activity" />

      {pending && (
        <section className="m-in mb-12 border-l-4 b-sig bg-sigsoft p-5 sm:p-6">
          <Label className="c-sig">Needs your OK</Label>
          <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <h2 className="t-display text-[28px] sm:text-[36px]">Send email to Todd Becker</h2>
              <p className="mt-2 text-[15px] c-ink2">"Home battery options for the garage", 98 words. Monday 12 Oct at 7:30.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn tone="signal" onClick={() => setApproval("approved")}><Check size={15} strokeWidth={2.5} /> Approve</Btn>
              <Btn onClick={() => show("m8")}>Read it first</Btn>
            </div>
          </div>
        </section>
      )}

      <ol className="border-t b-ink">
        {activity.map((a) => {
          const alert = a.needsYou && pending;
          return (
            <li key={a.id} className="grid grid-cols-[4.5rem_1fr] gap-x-4 border-b py-4 sm:grid-cols-[7rem_1fr_10rem]">
              <span className={`t-num text-[24px] sm:text-[32px] ${alert ? "c-sig" : ""}`}>{a.at}</span>
              <div>
                <div className="text-[17px] leading-snug">{a.text}</div>
                {a.needsYou && (
                  <div className={`mt-1 text-[13px] font-semibold ${alert ? "c-sig" : "c-mute"}`}>
                    {pending ? "Waiting for your OK" : approval === "approved" ? "You approved this" : "On hold"}
                  </div>
                )}
                {expert && (
                  <div className="t-meta mt-1">
                    {a.id === "a4" ? "Researcher, cloud (public info only)" : a.id === "a5" ? "Home helper, routine" : a.id === "a6" ? "Chief, routine" : a.id === "a1" ? "Writer, Desk PC" : "Chief, Kitchen tablet"}
                  </div>
                )}
              </div>
              <span className="t-meta col-start-2 sm:col-start-3 sm:pt-1.5 sm:text-right">{a.who ? `Asked by ${memberName(a.who)}` : "On its own"}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
