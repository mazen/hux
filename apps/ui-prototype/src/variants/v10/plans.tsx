// PROTOTYPE - concept 10 "Instrument": reminders, calendar and routines.
import { useState } from "react";
import { Bell, CalendarDays, ChevronDown, Clock, MapPin, MessageSquare, Repeat } from "lucide-react";
import { calendar, portfolioBriefing, reminders } from "../../fixtures";
import { PortfolioCard } from "./cards";
import { member, routineMeta, runHistory } from "./data";
import { Avatar } from "./modules";
import { Key, Led, Module, Spec, Switch, cx, useInstrument } from "./ui";

export type Routine = {
  id: string;
  title: string;
  detail: string;
  when: string;
  where: string;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
  oneOff?: boolean;
};

const dayName = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
const dayNum = (d: string) => Number(d.slice(8, 10));

function AskStrip({ example }: { example: string }) {
  const { ask } = useInstrument();
  return (
    <button
      type="button"
      onClick={() => ask(example)}
      className="focusable group flex w-full items-center gap-3 rounded-xl border border-dashed border-[var(--line-strong)] px-3.5 py-2.5 text-left hover:border-[var(--signal-line)] hover:bg-[var(--signal-soft)]"
    >
      <MessageSquare size={15} className="shrink-0 text-[var(--muted)] group-hover:text-[var(--signal-ink)]" />
      <span className="flex-1 text-[13px]">
        <span className="text-[var(--muted)]">Or just ask: </span>“{example}”
      </span>
    </button>
  );
}

function Reminders() {
  const { expert } = useInstrument();
  const [done, setDone] = useState<string[]>([]);
  return (
    <Module title="Reminders" code={`${reminders.length} ACTIVE`} right={<Bell size={13} className="text-[var(--muted)]" />}>
      <ul className="divide-y divide-[var(--line)]">
        {reminders.map((r) => {
          const isDone = done.includes(r.id);
          return (
            <li key={r.id} className="flex items-start gap-3 px-4 py-3">
              <button
                type="button"
                aria-label={isDone ? `Mark "${r.title}" as not done` : `Mark "${r.title}" as done`}
                onClick={() => setDone(isDone ? done.filter((x) => x !== r.id) : [...done, r.id])}
                className={cx(
                  "focusable mt-[2px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border transition-colors",
                  isDone ? "border-[var(--ink-2)] bg-[var(--ink-2)]" : "border-[var(--line-strong)] bg-[var(--raised)] hover:border-[var(--ink-2)]",
                )}
              >
                {isDone && <span className="h-[6px] w-[6px] rounded-full bg-[var(--panel)]" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={cx("text-[14px] font-medium leading-snug", isDone && "text-[var(--faint)] line-through")}>{r.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--muted)]">
                  {r.whenKind === "place" ? <MapPin size={12} /> : <Clock size={12} />}
                  <span className={r.whenKind === "time" ? "mono text-[11.5px]" : ""}>{r.when}</span>
                  {"source" in r && r.source && <span>· from {r.source}</span>}
                  {expert && <span className="mono text-[10.5px] text-[var(--faint)]">· {r.id} · {r.whenKind === "place" ? "geofence" : "timer"}</span>}
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                <Avatar id={r.for} />
                <span className="hidden sm:inline">{member(r.for)?.name}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Module>
  );
}

function Calendar() {
  const { expert } = useInstrument();
  const days = Array.from(new Set(calendar.map((c) => c.start.slice(0, 10))));
  return (
    <Module title="Calendar · next 5 days" code="CALDAV · 3 CALENDARS" right={<CalendarDays size={13} className="text-[var(--muted)]" />}>
      <div className="px-4 py-2">
        {days.map((d) => (
          <div key={d} className="flex gap-4 border-b hairline py-3 last:border-0">
            <div className="w-[38px] shrink-0 text-center">
              <div className="lbl">{dayName(d)}</div>
              <div className="mono text-[22px] leading-tight font-medium">{dayNum(d)}</div>
            </div>
            <div className="flex-1 space-y-2">
              {calendar
                .filter((c) => c.start.startsWith(d))
                .map((c) => (
                  <div key={c.id} className="relative pl-3">
                    <span className={cx("absolute top-[3px] bottom-[3px] left-0 w-[2px] rounded", c.calendar === "Family" ? "bg-[var(--signal)]" : "bg-[var(--line-strong)]")} />
                    <div className="text-[14px] font-medium leading-snug">{c.title}</div>
                    <div className="mono text-[11.5px] text-[var(--muted)]">
                      {c.start.slice(11, 16)}–{c.end.slice(11, 16)} <span className="font-sans">· {c.calendar}</span>
                      {expert && <span className="text-[var(--faint)]"> · {c.id}</span>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Module>
  );
}

function RunStrip({ id }: { id: string }) {
  const runs = runHistory[id] ?? [];
  const slots = Array.from({ length: 5 }, (_, i) => runs[i]);
  return (
    <span className="inline-flex gap-[3px]" aria-label="Last runs">
      {slots
        .slice()
        .reverse()
        .map((r, i) => (
          <span
            key={i}
            title={r ? `${r.at}: ${r.note}` : "No run"}
            className="h-[10px] w-[10px] rounded-[2px]"
            style={{
              background: !r ? "transparent" : r.result === "ok" ? "var(--ink-2)" : r.result === "fail" ? "var(--signal)" : "var(--line-strong)",
              boxShadow: !r ? "inset 0 0 0 1px var(--line)" : undefined,
            }}
          />
        ))}
    </span>
  );
}

function RoutineCard({ r, onToggle }: { r: Routine; onToggle: () => void }) {
  const { expert } = useInstrument();
  const [open, setOpen] = useState(false);
  const meta = routineMeta[r.id];
  const runs = runHistory[r.id] ?? [];
  return (
    <li className={cx("px-4 py-3.5 transition-opacity", !r.enabled && "opacity-70")}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Led state={r.enabled ? (r.oneOff ? "signal" : "on") : "off"} />
            <span className="text-[14.5px] font-semibold tracking-[-0.01em]">{r.title}</span>
            {r.oneOff && <span className="lbl !text-[9px]">Once</span>}
          </div>
          <p className="mt-1 text-[13px] leading-snug text-[var(--muted)]">{r.detail}</p>
        </div>
        <Switch on={r.enabled} onChange={onToggle} label={`${r.title}: ${r.enabled ? "on" : "off"}`} />
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="well rounded-lg px-2.5 py-1.5">
          <div className="lbl !text-[9px]">When</div>
          <div className="text-[12.5px] leading-snug">{r.when}</div>
        </div>
        <div className="well rounded-lg px-2.5 py-1.5">
          <div className="lbl !text-[9px]">Next</div>
          <div className="mono text-[12px] leading-snug">{r.enabled ? r.nextRun : "Paused"}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[12px] text-[var(--muted)]">
        <span className="flex-1 truncate">On {r.where}</span>
        {expert && <RunStrip id={r.id} />}
        {(expert || r.id === "j1") && (
          <Key size="sm" tone="flat" className="!px-1.5" onClick={() => setOpen(!open)} aria-expanded={open}>
            {expert ? "Runs" : "Today's"}
            <ChevronDown size={13} className={cx("transition-transform", open && "rotate-180")} />
          </Key>
        )}
      </div>
      {open && (
        <div className="fade mt-2 space-y-2">
          {r.id === "j1" && portfolioBriefing.type === "portfolio" && <PortfolioCard card={portfolioBriefing} />}
          {expert && (
            <div className="well rounded-lg px-3 py-2">
              <Spec k="Helper" v={meta.helper} />
              <Spec k="Runs on" v={meta.runsOn} />
              <Spec k="Trigger" v={meta.trigger} />
              <div className="mt-1.5 border-t hairline pt-1.5">
                {runs.length === 0 && <div className="mono text-[11px] text-[var(--faint)]">No runs yet</div>}
                {runs.map((run, i) => (
                  <div key={i} className="mono flex gap-2 py-[2px] text-[11px]">
                    <span className="w-[66px] shrink-0 text-[var(--muted)]">{run.at}</span>
                    <span className={cx("w-[30px] shrink-0 uppercase", run.result === "fail" ? "text-[var(--signal-ink)]" : run.result === "skip" ? "text-[var(--faint)]" : "text-[var(--ink-2)]")}>
                      {run.result}
                    </span>
                    <span className="truncate text-[var(--ink-2)]">{run.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function Plans({ routines, toggle }: { routines: Routine[]; toggle: (id: string) => void }) {
  const on = routines.filter((r) => r.enabled).length;
  return (
    <div className="scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[1320px] px-3 py-4 sm:px-6 sm:py-6">
        <div className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-2">
          <h1 className="text-[26px] font-semibold tracking-[-0.03em] sm:text-[30px]">Plans</h1>
          <div className="mono flex gap-5 pb-1 text-[12px] text-[var(--muted)]">
            <span><span className="text-[var(--ink)]">{reminders.length}</span> reminders</span>
            <span><span className="text-[var(--ink)]">{calendar.length}</span> events</span>
            <span><span className="text-[var(--ink)]">{on}</span>/{routines.length} routines on</span>
          </div>
        </div>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <div className="space-y-4">
            <Reminders />
            <AskStrip example="Remind me to water the plants on Sunday evening" />
          </div>
          <Calendar />
          <div className="space-y-4">
            <Module title="Routines" code="JOBS" right={<Repeat size={13} className="text-[var(--muted)]" />}>
              <ul className="divide-y divide-[var(--line)]">
                {routines.map((r) => (
                  <RoutineCard key={r.id} r={r} onToggle={() => toggle(r.id)} />
                ))}
              </ul>
            </Module>
            <AskStrip example="Every Sunday at 18:00, tell me what's on next week" />
          </div>
        </div>
      </div>
    </div>
  );
}

export { AskStrip };
