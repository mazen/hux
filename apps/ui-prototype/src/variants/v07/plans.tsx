// PROTOTYPE - concept 07 "Glass": Plans (reminders, calendar, routines).
import { useState } from "react";
import { Bell, Check, ChevronDown, Clock, MapPin, MessageCircle, Repeat } from "lucide-react";
import { calendar, portfolioBriefing, reminders, routines, type Card } from "../../fixtures";
import { PortfolioCard } from "./cards";
import { useApp } from "./state";
import { Avatar, Meta, PageHeader, PanelTitle, Toggle, memberName } from "./ui";

const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dayLabel(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const wd = weekday[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const rel = d === 10 ? "Tomorrow" : null;
  return { rel, full: `${wd} ${d} ${month[m - 1]}` };
}
const calTint: Record<string, string> = { Family: "#81B29A", Work: "#3D7EA6", Personal: "#E07A5F" };

function Reminders() {
  const { remindersDone, toggleReminder, expert } = useApp();
  return (
    <section className="glass rounded-[26px] pb-2">
      <PanelTitle aside={<span className="text-[13px] ink-3">{reminders.filter((r) => !remindersDone[r.id]).length} open</span>}>Reminders</PanelTitle>
      <ul className="px-2">
        {reminders.map((r) => {
          const done = remindersDone[r.id];
          return (
            <li key={r.id}>
              <button onClick={() => toggleReminder(r.id)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-[var(--fill-2)]">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${done ? "btn-accent border-transparent" : "border-[var(--ink-3)]"}`}>
                  {done && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[15px] font-semibold ${done ? "line-through ink-3" : ""}`}>{r.title}</span>
                  <span className="flex items-center gap-1 text-[13px] ink-3">
                    {r.whenKind === "place" ? <MapPin size={13} /> : <Clock size={13} />}
                    {r.when}
                    {r.for !== "alex" && <> · for {memberName(r.for)}</>}
                  </span>
                  {expert && <Meta>id {r.id} · {r.source ? `from ${r.source}` : "set by voice"} · delivers to {r.for === "alex" ? "Alex's phone" : "Kitchen tablet"}</Meta>}
                </span>
                <Avatar id={r.for} size={24} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Agenda() {
  const { expert } = useApp();
  const days: Record<string, typeof calendar> = {};
  calendar.forEach((c) => (days[c.start.slice(0, 10)] ??= []).push(c));
  return (
    <section className="glass rounded-[26px] pb-3">
      <PanelTitle aside={<span className="text-[13px] ink-3">Family, Work, Personal</span>}>Calendar</PanelTitle>
      <div className="space-y-1 px-5">
        {Object.entries(days).map(([d, items]) => {
          const l = dayLabel(d);
          return (
            <div key={d} className="flex gap-4 border-t line py-3 first:border-t-0">
              <div className="w-20 shrink-0">
                <div className="text-[14px] font-bold">{l.rel ?? l.full.split(" ")[0]}</div>
                <div className="text-[12.5px] ink-3">{l.rel ? l.full : l.full.split(" ").slice(1).join(" ")}</div>
              </div>
              <ul className="min-w-0 flex-1 space-y-2">
                {items.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <span className="w-1 shrink-0 rounded-full" style={{ background: calTint[c.calendar] }} />
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold">{c.title}</span>
                      <span className="block text-[13px] ink-3 tabular">
                        {c.start.slice(11, 16)}–{c.end.slice(11, 16)}
                        {expert && <> · {c.calendar} calendar · read via CalDAV</>}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Routines() {
  const { routineOn, toggleRoutine, expert } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="glass rounded-[26px] pb-2">
      <PanelTitle aside={<span className="text-[13px] ink-3">{Object.values(routineOn).filter(Boolean).length} on</span>}>Routines</PanelTitle>
      <ul className="px-2">
        {routines.map((r) => {
          const on = routineOn[r.id];
          const isOpen = open === r.id;
          return (
            <li key={r.id} className={`rounded-2xl transition-colors ${isOpen ? "pane" : ""}`}>
              <div className="flex items-center gap-3 px-3 py-3">
                <button onClick={() => setOpen(isOpen ? null : r.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={isOpen}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${on ? "accent-soft accent" : "fill-2 ink-3"}`}>
                    {"oneOff" in r && r.oneOff ? <Bell size={18} /> : <Repeat size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[15px] font-semibold ${on ? "" : "ink-2"}`}>{r.title}</span>
                    <span className="block text-[13px] ink-3">{on ? r.when : "Paused"}</span>
                  </span>
                  <ChevronDown size={16} className={`ink-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <Toggle on={on} onChange={() => toggleRoutine(r.id)} label={r.title} />
              </div>
              {isOpen && (
                <div className="rise space-y-3 px-4 pb-4 text-[14px]">
                  <p className="ink-2">{r.detail}</p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13.5px]">
                    <dt className="ink-3">When</dt><dd>{r.when}</dd>
                    <dt className="ink-3">Where</dt><dd>{r.where}</dd>
                    <dt className="ink-3">Last time</dt><dd>{r.lastRun}</dd>
                    <dt className="ink-3">Next</dt><dd>{on ? r.nextRun : "Paused"}</dd>
                  </dl>
                  {r.id === "j1" && <PortfolioCard c={portfolioBriefing as Extract<Card, { type: "portfolio" }>} />}
                  {expert && <Meta>job {r.id} · helper: {r.id === "j3" ? "Home" : r.id === "j4" ? "Writer" : "Chief"} · runs on Desk PC · retries 3× · logs kept 30 days</Meta>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function PlansView() {
  const { askHux } = useApp();
  return (
    <div className="scroll-soft fade-top h-full overflow-y-auto">
      <div className="mx-auto max-w-[1180px] px-4 pt-6 pb-28 sm:px-6 md:pt-10">
        <PageHeader
          title="Plans"
          aside={
            <button onClick={() => askHux("Remind me to ")} className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold">
              <MessageCircle size={16} className="accent" /> Ask hux to plan something
            </button>
          }
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <Reminders />
            <Agenda />
          </div>
          <div className="space-y-5">
            <Routines />
          </div>
        </div>
      </div>
    </div>
  );
}
