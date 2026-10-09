// PROTOTYPE - concept 02 "Hearth": around the home. Things, devices, helpers, memory, activity.
import { useState } from "react";
import {
  Car,
  Check,
  Coffee,
  Laptop,
  Lightbulb,
  Moon,
  Pencil,
  Server,
  Smartphone,
  Speaker,
  Tablet,
  Trash2,
  Undo2,
} from "lucide-react";
import { activity, conversation, devices, helpers, type Card, type MemberId } from "../../fixtures";
import { member } from "./data";
import { CardView, type ApprovalStatus } from "./Cards";
import { Segments, Switch } from "./Sheet";

export type HomeTab = "things" | "devices" | "helpers" | "memory" | "activity";
export type HomeThing = { id: string; name: string; place: string; kind: string; state: string };
export type Memory = { id: string; text: string; learned: string; about?: MemberId };

const approvalCard = conversation.find((m) => m.card?.type === "approval")!.card as Extract<Card, { type: "approval" }>;

export function isOn(t: HomeThing) {
  return t.kind === "car" || t.state.startsWith("On");
}

export function HouseholdBody(p: {
  tab: HomeTab;
  setTab: (t: HomeTab) => void;
  things: HomeThing[];
  toggleThing: (id: string) => void;
  memories: Memory[];
  setMemories: React.Dispatch<React.SetStateAction<Memory[]>>;
  approval: ApprovalStatus;
  onApproval: (s: ApprovalStatus) => void;
  expert: boolean;
  onAsk: (prefill: string) => void;
}) {
  return (
    <div>
      {p.approval === "pending" && (
        <div className="mb-4">
          <CardView card={approvalCard} expert={p.expert} approval={p.approval} onApproval={p.onApproval} onAsk={p.onAsk} />
        </div>
      )}
      <div className="sticky top-0 z-10 -mx-5 bg-[var(--surface-solid)] px-5 pb-3 sm:-mx-8 sm:px-8">
        <Segments
          value={p.tab}
          onChange={p.setTab}
          options={[
            { id: "things", label: "Lights and things" },
            { id: "devices", label: "Where hux lives" },
            { id: "memory", label: "What hux remembers", count: p.memories.length },
            { id: "helpers", label: "Helpers" },
            { id: "activity", label: "Recently" },
          ]}
        />
      </div>
      {p.tab === "things" && <Things things={p.things} toggle={p.toggleThing} expert={p.expert} />}
      {p.tab === "devices" && <Devices expert={p.expert} />}
      {p.tab === "memory" && <Memories memories={p.memories} setMemories={p.setMemories} expert={p.expert} />}
      {p.tab === "helpers" && <Helpers expert={p.expert} />}
      {p.tab === "activity" && <Activity expert={p.expert} approval={p.approval} />}
    </div>
  );
}

function thingIcon(kind: string) {
  if (kind === "plug") return <Coffee size={18} />;
  if (kind === "car") return <Car size={18} />;
  return <Lightbulb size={18} />;
}

function Things({ things, toggle, expert }: { things: HomeThing[]; toggle: (id: string) => void; expert: boolean }) {
  const rooms = Array.from(new Set(things.map((t) => t.place)));
  return (
    <div className="space-y-5">
      {rooms.map((room) => (
        <section key={room}>
          <h3 className="mb-2 text-[13px] font-semibold tracking-[0.08em] text-[var(--ink-3)] uppercase">{room}</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {things
              .filter((t) => t.place === room)
              .map((t) => {
                const on = isOn(t);
                return (
                  <li key={t.id} className={`flex items-center gap-3 rounded-[22px] px-4 py-3.5 transition-colors ${on ? "bg-[color-mix(in_srgb,var(--amber)_16%,var(--surface-sunk))]" : "bg-[var(--surface-sunk)]"}`}>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${on ? "bg-[var(--amber)] text-[#3a2312]" : "bg-[var(--surface-solid)] text-[var(--ink-3)]"}`}>
                      {thingIcon(t.kind)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium">{t.name}</p>
                      <p className="text-sm text-[var(--ink-2)]">
                        {t.state}
                        {expert && <span className="text-[var(--ink-3)]"> · {t.kind === "light" ? "Zigbee" : t.kind === "plug" ? "Meross" : "Home Assistant"}</span>}
                      </p>
                    </div>
                    {t.kind !== "car" && <Switch on={on} onChange={() => toggle(t.id)} label={`${t.name}: ${on ? "on" : "off"}`} />}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function deviceIcon(kind: string) {
  if (kind === "desktop") return <Laptop size={18} />;
  if (kind === "tablet") return <Tablet size={18} />;
  if (kind === "phone") return <Smartphone size={18} />;
  if (kind === "speaker") return <Speaker size={18} />;
  return <Server size={18} />;
}

const abilityWords: Record<string, string> = {
  screen: "shows things",
  keyboard: "typing",
  microphone: "listens",
  speaker: "speaks",
  touch: "touch",
  notifications: "notifications",
  location: "knows where Alex is",
  workspace: "long jobs",
};

function Devices({ expert }: { expert: boolean }) {
  return (
    <div>
      <ul className="space-y-2">
        {devices.map((d) => (
          <li key={d.id} className={`flex items-start gap-3 rounded-[22px] bg-[var(--surface-sunk)] px-4 py-3.5 ${d.online ? "" : "opacity-75"}`}>
            <span className="relative mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--surface-solid)] text-[var(--accent-ink)]">
              {deviceIcon(d.kind)}
              <span className={`absolute right-0 bottom-0 h-3 w-3 rounded-full ring-2 ring-[var(--surface-solid)] ${d.online ? "bg-[var(--ok)]" : "bg-[var(--ink-3)]"}`} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">
                {d.name}
                {d.note && <span className="ml-2 text-sm font-normal text-[var(--ink-2)]">{d.online ? `· ${d.note}` : ""}</span>}
              </p>
              <p className="text-sm text-[var(--ink-2)]">
                {d.place} · {d.online ? d.abilities.map((a) => abilityWords[a] ?? a).join(", ") : <span className="inline-flex items-center gap-1"><Moon size={12} /> {d.note}</span>}
              </p>
              {expert && (
                <p className="mt-1 text-[13px] text-[var(--ink-3)]">
                  Node {d.id} · {d.kind} · {d.screens} screen{d.screens === 1 ? "" : "s"} · abilities: {d.abilities.join(", ")}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Memories({ memories, setMemories, expert }: { memories: Memory[]; setMemories: React.Dispatch<React.SetStateAction<Memory[]>>; expert: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [removed, setRemoved] = useState<{ m: Memory; i: number } | null>(null);

  return (
    <div>
      {removed && (
        <div className="v02-rise-in mb-3 flex items-center justify-between gap-3 rounded-[22px] bg-[var(--ink)] px-4 py-3 text-[15px] text-[var(--surface-solid)]">
          <span>Forgotten.</span>
          <button
            type="button"
            className="flex items-center gap-1.5 font-semibold"
            onClick={() => {
              setMemories((ms) => {
                const next = [...ms];
                next.splice(removed.i, 0, removed.m);
                return next;
              });
              setRemoved(null);
            }}
          >
            <Undo2 size={15} /> Undo
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {memories.map((m, i) => (
          <li key={m.id} className="rounded-[22px] bg-[var(--surface-sunk)] px-4 py-3.5">
            {editing === m.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setMemories((ms) => ms.map((x) => (x.id === m.id ? { ...x, text: draft, learned: "You corrected this" } : x)));
                  setEditing(null);
                }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  aria-label="Edit memory"
                  className="min-w-0 flex-1 rounded-full bg-[var(--surface-solid)] px-4 py-2 text-[15px] ring-1 ring-[var(--line)] outline-none focus:ring-[var(--ember)]"
                />
                <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--ember)] text-[var(--on-accent)]" aria-label="Save">
                  <Check size={16} />
                </button>
              </form>
            ) : (
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[17px] leading-snug">{m.text}</p>
                  <p className="mt-1 text-sm text-[var(--ink-2)]">
                    {m.learned}
                    {m.about && member(m.about) && m.about !== "alex" && <span> · about {member(m.about)?.name}</span>}
                    {!m.about && <span> · shared with everyone at home</span>}
                  </p>
                  {expert && <p className="mt-1 text-[13px] text-[var(--ink-3)]">Memory {m.id} · scope: {m.about ?? "household"} · used in 3 answers</p>}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(m.id);
                    setDraft(m.text);
                  }}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--ink-2)] hover:bg-[var(--surface-solid)]"
                  aria-label={`Change: ${m.text}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRemoved({ m, i });
                    setMemories((ms) => ms.filter((x) => x.id !== m.id));
                  }}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--ink-2)] hover:bg-[var(--surface-solid)]"
                  aria-label={`Forget: ${m.text}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Helpers({ expert }: { expert: boolean }) {
  return (
    <div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {helpers.map((h) => (
          <li key={h.id} className="rounded-[22px] bg-[var(--surface-sunk)] px-4 py-4">
            <p className="font-display text-xl">{h.name}</p>
            <p className="mt-0.5 text-[15px] text-[var(--ink-2)]">{h.does}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {h.canDo.map((c) => (
                <li key={c} className="rounded-full bg-[var(--surface-solid)] px-2.5 py-1 text-[13px] text-[var(--ink-2)]">{c}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-[var(--ink-3)]">{h.model}</p>
            {expert && (
              <p className="mt-1 text-[13px] text-[var(--ink-3)]">
                Role {h.id} · model {h.model.startsWith("Cloud") ? "cloud endpoint (trust: public data)" : "local endpoint on Desk PC (trust: full)"}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Activity({ expert, approval }: { expert: boolean; approval: ApprovalStatus }) {
  return (
    <ol className="relative space-y-1 border-l border-[var(--line)] pl-5">
      {activity.map((a) => {
        const who = member(a.who);
        const needs = a.needsYou && approval === "pending";
        return (
          <li key={a.id} className="relative py-2">
            <span className={`absolute top-[15px] -left-[24.5px] h-2 w-2 rounded-full ${needs ? "bg-[var(--ember)] ring-4 ring-[color-mix(in_srgb,var(--ember)_25%,transparent)]" : "bg-[var(--amber)]"}`} />
            <p className="text-[15px]">
              <span className="font-display mr-2 text-[var(--ink-2)]">{a.at}</span>
              {a.text}
            </p>
            {needs && <p className="text-sm font-medium text-[var(--accent-ink)]">Waiting for your OK, above</p>}
            {expert && (
              <p className="text-[13px] text-[var(--ink-3)]">
                {who ? `Asked by ${who.name}` : "On its own (routine)"} · event {a.id}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
