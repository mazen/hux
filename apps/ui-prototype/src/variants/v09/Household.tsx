// PROTOTYPE - concept 09 "Grove": Household (people, things at home, devices, helpers) plus the memory and activity sheets.
import { useRef, useState } from "react";
import {
  ArrowRight, BookMarked, Car, Check, Laptop, Lightbulb, Pencil, Plug, RotateCcw, Server, Smartphone, Speaker, Tablet, Trash2, Undo2, type LucideIcon,
} from "lucide-react";
import { activity, devices, helpers, household, memories as memoriesFixture } from "../../fixtures";
import { ApprovalCard } from "./Conversation";
import { memberById } from "./data";
import { useGrove, thingState, type Thing } from "./store";
import { Avatar, Button, Eyebrow, ExpertNote, Sheet, Toggle, useFlash } from "./ui";
import { conversation } from "../../fixtures";

const deviceIcon: Record<string, LucideIcon> = { desktop: Laptop, tablet: Tablet, phone: Smartphone, speaker: Speaker, server: Server };
const thingIcon: Record<string, LucideIcon> = { light: Lightbulb, plug: Plug, car: Car };

function ThingTile({ t }: { t: Thing }) {
  const g = useGrove();
  const ref = useRef<HTMLDivElement>(null);
  useFlash(g.focus?.kind === "thing" && g.focus.id === t.id, g.focus?.nonce, ref);
  const Icon = thingIcon[t.kind] ?? Lightbulb;
  const lit = t.on && t.kind !== "car";
  return (
    <div
      ref={ref}
      onClick={() => t.switchable && g.toggleThing(t.id)}
      className={`flex cursor-pointer flex-col gap-3 rounded-[22px] border p-4 transition-colors ${lit ? "border-(--ochre)/40 bg-(--ochre-soft)" : "border-(--line) bg-(--raised)"} ${t.switchable ? "" : "cursor-default"}`}
    >
      <div className="flex items-center justify-between">
        <span className={`grid size-10 place-items-center rounded-[14px] ${lit ? "bg-(--raised) text-(--ochre)" : t.kind === "car" ? "bg-(--moss-soft) text-(--moss-text)" : "bg-(--sunk) text-(--ink-3)"}`}>
          <Icon size={20} strokeWidth={1.8} />
        </span>
        {t.switchable && <Toggle on={t.on} onChange={() => g.toggleThing(t.id)} label={`${t.name} on or off`} />}
      </div>
      <div>
        <div className="text-[15.5px] leading-tight font-semibold">{t.name}</div>
        <div className="text-[13.5px] text-(--ink-2)">{t.place} · {thingState(t)}</div>
        {t.kind === "car" && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-(--sunk)">
            <div className="h-full w-[64%] rounded-full bg-(--moss)" />
          </div>
        )}
        {g.expert && <ExpertNote className="mt-1">{t.kind === "car" ? "via vendor cloud · polled 5 min" : t.kind === "plug" ? "Meross · local LAN" : t.id === "h4" ? "Govee · LAN API" : "Zigbee · via Home Assistant"}</ExpertNote>}
      </div>
    </div>
  );
}

function DeviceRow({ d }: { d: (typeof devices)[number] }) {
  const g = useGrove();
  const ref = useRef<HTMLLIElement>(null);
  useFlash(g.focus?.kind === "device" && g.focus.id === d.id, g.focus?.nonce, ref);
  const Icon = deviceIcon[d.kind] ?? Laptop;
  return (
    <li ref={ref} className="flex items-start gap-3 rounded-[18px] px-3 py-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-(--sunk) text-(--ink-2)">
        <Icon size={19} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[15.5px] font-semibold">
          {d.name}
          <span className={`size-2 rounded-full ${d.online ? "bg-(--moss)" : "bg-(--line-strong)"}`} title={d.online ? "Online" : "Asleep"} />
        </span>
        <span className="block text-[13.5px] text-(--ink-2)">
          {d.place}
          {d.note && ` · ${d.note}`}
        </span>
        {g.expert && (
          <ExpertNote className="mt-1">
            node:{d.id} · {d.abilities.join(", ")} · {d.screens} screen{d.screens === 1 ? "" : "s"}
          </ExpertNote>
        )}
      </span>
    </li>
  );
}

function HelperRow({ h }: { h: (typeof helpers)[number] }) {
  const g = useGrove();
  const ref = useRef<HTMLLIElement>(null);
  useFlash(g.focus?.kind === "helper" && g.focus.id === h.id, g.focus?.nonce, ref);
  return (
    <li ref={ref} className="rounded-[18px] px-3 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="g-display text-[18px] font-bold">{h.name}</span>
        {g.expert && <span className="g-mono text-(--ink-3)">{h.model}</span>}
      </div>
      <p className="text-[14.5px] text-(--ink-2)">{h.does}</p>
      {g.expert && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {h.canDo.map((c) => (
            <span key={c} className="rounded-full bg-(--sunk) px-2.5 py-0.5 text-[12.5px] text-(--ink-2)">{c}</span>
          ))}
        </div>
      )}
    </li>
  );
}

export function Household() {
  const g = useGrove();
  const onCount = g.things.filter((t) => t.switchable && t.on).length;
  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pt-6 pb-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="g-display text-[36px] leading-none font-bold">Household</h1>
        <div className="flex items-center gap-2">
          {household.members.map((m) => (
            <span key={m.id} className="flex items-center gap-2 rounded-full border border-(--line) bg-(--raised) py-1 pr-3 pl-1 text-[14px] font-semibold">
              <Avatar id={m.id} size={24} /> {m.name}
              {g.expert && <span className="font-normal text-(--ink-3)">{m.role}</span>}
            </span>
          ))}
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between px-1">
          <Eyebrow>At home</Eyebrow>
          <span className="text-[13.5px] text-(--ink-3)">{onCount ? `${onCount} on` : "All off"}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {g.things.map((t) => (
            <ThingTile key={t.id} t={t} />
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <Eyebrow className="mb-3 px-1">Where hux runs</Eyebrow>
          <ul className="divide-y divide-(--line) rounded-[24px] border border-(--line) bg-(--raised) p-1">
            {devices.map((d) => (
              <DeviceRow key={d.id} d={d} />
            ))}
          </ul>
        </section>
        <section>
          <Eyebrow className="mb-3 px-1">Helpers</Eyebrow>
          <ul className="divide-y divide-(--line) rounded-[24px] border border-(--line) bg-(--raised) p-1">
            {helpers.map((h) => (
              <HelperRow key={h.id} h={h} />
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => g.setSheet("memory")} className="flex flex-col gap-2 rounded-[22px] border border-(--line) bg-(--raised) p-4 text-left hover:bg-(--surface)">
              <BookMarked size={20} className="text-(--moss)" />
              <span className="text-[15.5px] font-semibold">What hux remembers</span>
              <span className="flex items-center gap-1 text-[13.5px] text-(--ink-3)">{g.memories.length} things <ArrowRight size={13} /></span>
            </button>
            <button onClick={() => g.setSheet("activity")} className="flex flex-col gap-2 rounded-[22px] border border-(--line) bg-(--raised) p-4 text-left hover:bg-(--surface)">
              <RotateCcw size={20} className="text-(--moss)" />
              <span className="text-[15.5px] font-semibold">Recent activity</span>
              <span className="flex items-center gap-1 text-[13.5px] text-(--ink-3)">{activity.length} things today <ArrowRight size={13} /></span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

type Mem = (typeof memoriesFixture)[number];

function MemoryRow({ m, index }: { m: Mem; index: number }) {
  const g = useGrove();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(m.text);
  const about = memberById(m.about);
  return (
    <li className="group rounded-[18px] border border-(--line) bg-(--raised) p-3.5">
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) g.editMemory(m.id, text.trim());
            setEditing(false);
          }}
          className="space-y-2"
        >
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="block w-full resize-none rounded-[12px] border border-(--moss) bg-(--surface) p-2.5 text-[15px] outline-none"
          />
          <div className="flex gap-2">
            <button type="submit" className="inline-flex h-8 items-center gap-1 rounded-full bg-(--moss) px-3 text-[13px] font-semibold text-(--moss-ink)">
              <Check size={14} /> Save
            </button>
            <Button small kind="ghost" onClick={() => { setText(m.text); setEditing(false); }}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15.5px] leading-snug">{m.text}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-(--ink-3)">
              {about ? <Avatar id={m.about} size={16} /> : null}
              {about ? `About ${about.id === "alex" ? "you" : about.name}` : "Household"} · {m.learned}
            </p>
            {g.expert && <ExpertNote className="mt-1">memory:{m.id} · scope {m.about ?? "household"} · label {m.id === "k3" ? "Work" : "Family"}</ExpertNote>}
          </div>
          <div className="flex shrink-0 gap-0.5">
            <button onClick={() => setEditing(true)} aria-label={`Change “${m.text}”`} className="grid size-8 place-items-center rounded-full text-(--ink-3) hover:bg-(--sunk) hover:text-(--ink)">
              <Pencil size={15} />
            </button>
            <button onClick={() => g.removeMemory(m.id)} data-index={index} aria-label={`Forget “${m.text}”`} className="grid size-8 place-items-center rounded-full text-(--ink-3) hover:bg-(--clay-soft) hover:text-(--clay)">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export function MemorySheet() {
  const g = useGrove();
  const [forgotten, setForgotten] = useState<{ m: Mem; index: number } | null>(null);
  return (
    <Sheet
      title="What hux remembers"
      subtitle={`${g.memories.length} things. Only your household can see them.`}
      onClose={() => g.setSheet(null)}
      footer={
        <p className="text-[14px] text-(--ink-2)">
          To add something, tell hux. <span className="text-(--ink-3)">“Remember that Sam doesn't eat mushrooms.”</span>
        </p>
      }
    >
      {forgotten && (
        <div className="g-rise mb-3 flex items-center gap-3 rounded-[16px] bg-(--sunk) px-4 py-2.5 text-[14px]">
          <span className="flex-1">Forgotten.</span>
          <Button small kind="ghost" icon={Undo2} onClick={() => { g.restoreMemory(forgotten.m, forgotten.index); setForgotten(null); }}>Undo</Button>
        </div>
      )}
      <ul
        className="space-y-2"
        onClickCapture={(e) => {
          const btn = (e.target as HTMLElement).closest("[data-index]") as HTMLElement | null;
          if (!btn) return;
          const i = Number(btn.dataset.index);
          const m = g.memories[i];
          if (m) setForgotten({ m, index: i });
        }}
      >
        {g.memories.map((m, i) => (
          <MemoryRow key={m.id} m={m} index={i} />
        ))}
      </ul>
      {g.memories.length === 0 && <p className="py-8 text-center text-[15px] text-(--ink-3)">hux doesn't remember anything about your household.</p>}
    </Sheet>
  );
}

const approvalCard = (() => {
  const c = conversation.find((m) => m.card?.type === "approval")?.card;
  return c && c.type === "approval" ? c : null;
})();

export function ActivitySheet() {
  const g = useGrove();
  return (
    <Sheet title="Recent activity" subtitle="Today" onClose={() => g.setSheet(null)}>
      {approvalCard && g.approval === "pending" && (
        <div className="mb-5">
          <ApprovalCard c={approvalCard} compact />
        </div>
      )}
      <ol className="relative ml-[46px] border-l-[1.5px] border-(--line)">
        {activity.map((a) => {
          const who = memberById(a.who);
          return (
            <li key={a.id} className="relative pb-5 pl-5 last:pb-0">
              <span className="g-num absolute top-0 -left-[52px] w-10 text-right text-[13px] font-semibold text-(--ink-3)">{a.at}</span>
              <span className={`absolute top-[6px] -left-[5px] size-2.5 rounded-full ring-4 ring-(--surface) ${a.needsYou && g.approval === "pending" ? "bg-(--ochre)" : "bg-(--moss)"}`} />
              <p className="text-[15.5px] leading-snug">{a.text}</p>
              <p className="mt-0.5 text-[13px] text-(--ink-3)">
                {who ? `Asked by ${who.id === "alex" ? "you" : who.name}` : "On its own"}
                {a.needsYou && g.approval === "pending" && <span className="font-semibold text-(--ochre)"> · needs your OK</span>}
              </p>
              {g.expert && <ExpertNote className="mt-0.5">{a.who ? "Chief → " : "routine → "}{a.id === "a4" ? "Researcher" : a.id === "a1" ? "Writer" : a.id === "a5" ? "Home" : "Chief"} · act:{a.id}</ExpertNote>}
            </li>
          );
        })}
      </ol>
    </Sheet>
  );
}
