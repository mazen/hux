// PROTOTYPE - concept 08 "House": needs-you, home devices, hux's devices, helpers, memory, activity.
import { useState } from "react";
import {
  BatteryCharging, Car, Check, Coffee, Laptop, Lightbulb, Monitor, Pencil, Server, Smartphone, Speaker, Tablet, Trash2, X, History, Brain, HandHelping,
} from "lucide-react";
import { activity, devices, helpers, home } from "../../fixtures";
import { useStore } from "./store";
import { ApprovalCard } from "./cards";
import { Avatar, Btn, ExpertTag, Switch, cx, memberName } from "./ui";

const deviceIcon: Record<string, React.ReactNode> = {
  desktop: <Monitor size={22} strokeWidth={2.5} />,
  tablet: <Tablet size={22} strokeWidth={2.5} />,
  phone: <Smartphone size={22} strokeWidth={2.5} />,
  speaker: <Speaker size={22} strokeWidth={2.5} />,
  server: <Server size={22} strokeWidth={2.5} />,
  laptop: <Laptop size={22} strokeWidth={2.5} />,
};
const abilityWords: Record<string, string> = {
  screen: "screen", keyboard: "keyboard", microphone: "listens", speaker: "speaks", touch: "touch", notifications: "notifications", location: "location", workspace: "long jobs",
};

function H({ children, tone, icon, note }: { children: React.ReactNode; tone: string; icon: React.ReactNode; note?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className={cx("bx grid size-11 shrink-0 place-items-center rounded-xl text-[#161310]", tone)}>{icon}</span>
      <div className="min-w-0">
        <h2 className="font-display text-3xl font-extrabold leading-none">{children}</h2>
        {note && <p className="mt-1 text-[15px] text-muted">{note}</p>}
      </div>
    </div>
  );
}

function HomeThings() {
  const { homeState, toggleHome, expert } = useStore();
  return (
    <section>
      <H tone="bg-sun" icon={<Lightbulb size={22} strokeWidth={2.5} />}>Home</H>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {home.map((h) => {
          const state = homeState[h.id];
          const switchable = h.kind === "light" || h.kind === "plug";
          const on = state.startsWith("On") || state.startsWith("Charging");
          const icon = h.kind === "car" ? <Car size={24} strokeWidth={2.5} /> : h.kind === "plug" ? <Coffee size={24} strokeWidth={2.5} /> : <Lightbulb size={24} strokeWidth={2.5} />;
          const body = (
            <>
              <span className="flex w-full items-start justify-between">
                <span className={cx("grid size-11 place-items-center rounded-xl border-[2.5px]", on ? "border-[#161310] bg-[#fffbf4] text-[#161310]" : "border-line bg-surface")}>{icon}</span>
                {h.kind === "car" && <BatteryCharging size={22} strokeWidth={2.5} />}
              </span>
              <span className="mt-4 block text-lg font-bold leading-tight">{h.name}</span>
              <span className={cx("block text-[15px] font-semibold", on ? "on-block-muted" : "text-muted")}>{state}</span>
              {expert && <span className="mt-1 block font-mono text-[11px] font-semibold">{h.place} · {h.kind === "light" ? "Zigbee" : h.kind === "plug" ? "Meross" : "Home Assistant"}</span>}
            </>
          );
          return (
            <li key={h.id}>
              {switchable ? (
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleHome(h.id)}
                  className={cx("press bx sh-sm flex h-full min-h-36 w-full flex-col items-start rounded-2xl p-4 text-left", on ? "bg-sun" : "bg-surface")}
                >
                  {body}
                </button>
              ) : (
                <div className={cx("bx flex h-full min-h-36 w-full flex-col items-start rounded-2xl p-4", on ? "bg-mint" : "bg-surface")}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Devices() {
  const { expert } = useStore();
  return (
    <section>
      <H tone="bg-sky" icon={<Monitor size={22} strokeWidth={2.5} />}>Devices</H>
      <ul className="bx sh divide-line rounded-2xl bg-surface">
        {devices.map((d) => (
          <li key={d.id} className="flex items-center gap-4 p-4">
            <span className={cx("grid size-11 shrink-0 place-items-center rounded-xl border-[2.5px] border-line", d.online ? "bg-sky text-[#161310]" : "bg-sunk")}>{deviceIcon[d.kind]}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold leading-tight">{d.name}</span>
                {d.note === "You're here" && <span className="rounded-md bg-ink px-1.5 py-0.5 text-xs font-bold">You're here</span>}
              </div>
              <div className="text-[15px] text-muted">
                {d.place}
                {d.online ? "" : ` · ${d.note}`}
              </div>
              {expert && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {d.abilities.map((a) => <ExpertTag key={a}>{abilityWords[a] ?? a}</ExpertTag>)}
                  {d.screens > 1 && <ExpertTag>{d.screens} screens</ExpertTag>}
                  <ExpertTag>node: {d.id}</ExpertTag>
                </div>
              )}
            </div>
            <span className="flex items-center gap-1.5 text-sm font-bold">
              <span className={cx("size-3 rounded-full border-2 border-line", d.online ? "bg-mint" : "bg-sunk")} />
              {d.online ? "On" : "Asleep"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Helpers() {
  const { expert } = useStore();
  return (
    <section>
      <H tone="bg-lilac" icon={<HandHelping size={22} strokeWidth={2.5} />}>Helpers</H>
      <ul className="grid gap-3 sm:grid-cols-2">
        {helpers.map((h) => (
          <li key={h.id} className="bx sh-sm rounded-2xl bg-surface p-4">
            <div className="font-display text-xl font-extrabold">{h.name}</div>
            <p className="mt-1 text-[15px] leading-snug">{h.does}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {h.canDo.map((c) => (
                <span key={c} className="rounded-md bg-sunk px-2 py-1 text-[13px] font-semibold">{c}</span>
              ))}
            </div>
            {expert && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <ExpertTag>model: {h.model}</ExpertTag>
                <ExpertTag>trust: {h.id === "research" ? "public only" : "household"}</ExpertTag>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Memories() {
  const { memories, editMemory, forgetMemory, expert } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  return (
    <section>
      <H tone="bg-mint" icon={<Brain size={22} strokeWidth={2.5} />}>What hux remembers</H>
      {memories.length === 0 ? (
        <div className="bx rounded-2xl bg-surface p-5 text-muted">Nothing right now. hux will learn again as you talk.</div>
      ) : (
        <ul className="bx sh divide-line rounded-2xl bg-surface">
          {memories.map((m) => (
            <li key={m.id} className="p-4">
              {editing === m.id ? (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (text.trim()) editMemory(m.id, text.trim());
                    setEditing(null);
                  }}
                >
                  <label htmlFor={`v08-mem-${m.id}`} className="sr-only">Edit memory</label>
                  <input
                    id={`v08-mem-${m.id}`}
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-12 min-w-0 flex-1 basis-56 rounded-xl border-[3px] border-line bg-paper px-3 text-[17px] font-semibold outline-none"
                  />
                  <Btn type="submit" tone="mint" icon={<Check size={18} strokeWidth={3} />}>Save</Btn>
                  <Btn onClick={() => setEditing(null)} aria-label="Cancel" icon={<X size={18} strokeWidth={3} />} />
                </form>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-semibold leading-snug">{m.text}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {m.learned}
                      {m.about ? ` · about ${memberName(m.about)}` : " · the whole household"}
                    </p>
                    {expert && <div className="mt-1.5"><ExpertTag>id: {m.id} · scope: {m.about ?? "household"}</ExpertTag></div>}
                  </div>
                  <button type="button" aria-label={`Edit “${m.text}”`} onClick={() => { setEditing(m.id); setText(m.text); }} className="press bx sh-sm grid size-11 shrink-0 place-items-center rounded-xl bg-surface">
                    <Pencil size={18} strokeWidth={2.75} />
                  </button>
                  <button type="button" aria-label={`Forget “${m.text}”`} onClick={() => forgetMemory(m.id)} className="press bx sh-sm grid size-11 shrink-0 place-items-center rounded-xl bg-coral">
                    <Trash2 size={18} strokeWidth={2.75} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Activity() {
  const { expert, approval } = useStore();
  return (
    <section>
      <H tone="bg-coral" icon={<History size={22} strokeWidth={2.5} />}>Recent activity</H>
      <ol className="relative space-y-3 pl-6 before:absolute before:bottom-2 before:left-[9px] before:top-2 before:w-[3px] before:bg-[var(--line)]">
        {activity.map((a) => {
          const needs = a.needsYou && approval === "pending";
          return (
            <li key={a.id} className="relative">
              <span className={cx("absolute -left-6 top-3.5 size-[21px] rounded-full border-[3px] border-line", needs ? "bg-coral" : a.who ? "bg-sun" : "bg-mint")} />
              <div className={cx("bx rounded-xl px-4 py-3", needs ? "on-block bg-coral" : "bg-surface")}>
                <div className="flex items-start gap-3">
                  <span className="w-12 shrink-0 font-display text-lg font-extrabold leading-snug">{a.at}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-semibold leading-snug">{a.text}</p>
                    <p className={cx("text-sm", needs ? "on-block-muted" : "text-muted")}>
                      {a.who ? `Asked by ${memberName(a.who)}` : "On its own"}
                      {needs && " · waiting for your OK"}
                    </p>
                  </div>
                  {a.who && <Avatar id={a.who} size={28} />}
                </div>
                {expert && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <ExpertTag>{a.id === "a5" ? "routine j3 · Home helper" : a.id === "a6" ? "routine j1 · Chief" : a.id === "a4" ? "Researcher · 9 web pages" : "Chief"}</ExpertTag>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function HouseView() {
  const { approval, messages } = useStore();
  const approvalMsg = messages.find((m) => m.card?.type === "approval");
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-6 md:px-10 md:pt-12">
      <h1 className="font-display text-6xl font-extrabold leading-[0.9] md:text-8xl">House</h1>

      {approvalMsg?.card?.type === "approval" && (
        <div className="mt-8 max-w-2xl">
          <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-muted">
            {approval === "pending" ? "Needs you" : "Decided"}
          </div>
          <ApprovalCard card={approvalMsg.card} />
        </div>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-12">
          <HomeThings />
          <Memories />
          <Helpers />
        </div>
        <div className="space-y-12">
          <Activity />
          <Devices />
        </div>
      </div>
    </div>
  );
}
