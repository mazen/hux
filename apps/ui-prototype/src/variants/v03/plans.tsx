// PROTOTYPE concept 03 - Plans: reminders, calendar, routines.
import { MapPin } from "lucide-react";
import { calendar, reminders } from "../../fixtures";
import { useHux } from "./store";
import { Btn, Label, PageTitle, SectionHead, Switch } from "./ui";
import { memberName } from "./data";

const dayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "Europe/Berlin" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });

function Big({ n, unit }: { n: number | string; unit: string }) {
  return (
    <div className="border-t b-ink pt-3">
      <div className="t-num text-[56px] lg:text-[80px]">{n}</div>
      <div className="t-meta mt-2">{unit}</div>
    </div>
  );
}

export function Plans() {
  const { routines, toggleRoutine, expert, show, askAbout, approval } = useHux();
  const on = routines.filter((r) => r.enabled).length;

  const byDay = calendar.reduce<Record<string, typeof calendar>>((acc, e) => {
    const d = e.start.slice(0, 10);
    (acc[d] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div>
      <PageTitle kicker="02" title="Plans" />

      <div className="mb-14 grid grid-cols-3 gap-4 sm:gap-8">
        <Big n={reminders.length} unit="reminders" />
        <Big n={calendar.length} unit="events in the next 5 days" />
        <Big n={`${on}/${routines.length}`} unit="routines running" />
      </div>

      <div className="grid gap-14 xl:grid-cols-12 xl:gap-10">
        {/* Reminders */}
        <section className="xl:col-span-4">
          <SectionHead n="2.1" title="Reminders" />
          <ul>
            {reminders.map((r) => (
              <li key={r.id} className="border-b py-4">
                <div className="text-[17px] font-semibold leading-snug">{r.title}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[14px] c-ink2">
                  {r.whenKind === "place" && <MapPin size={13} />}
                  {r.when}
                </div>
                <div className="t-meta mt-1">
                  For {memberName(r.for)}
                  {expert && r.source && ` · from ${r.source}`}
                  {expert && ` · ${r.whenKind === "place" ? "location, Alex's phone" : "time"}`}
                </div>
              </li>
            ))}
          </ul>
          <Btn tone="plain" className="mt-4 text-[14px]" onClick={() => askAbout("Remind me to ")}>Ask hux for a reminder</Btn>
        </section>

        {/* Calendar */}
        <section className="xl:col-span-4">
          <SectionHead n="2.2" title="Calendar" right={<span className="t-meta">Family, Work, Personal</span>} />
          <ol>
            {Object.entries(byDay).map(([d, evs]) => (
              <li key={d} className="grid grid-cols-[4.5rem_1fr] gap-3 border-b py-4">
                <div>
                  <div className="t-num text-[40px]">{Number(d.slice(8, 10))}</div>
                  <div className="t-label c-mute mt-1.5">{dayFmt.format(new Date(evs[0].start))}</div>
                </div>
                <ul className="space-y-2 pt-0.5">
                  {evs.map((e) => (
                    <li key={e.id}>
                      <div className="text-[16px] font-semibold leading-snug">{e.title}</div>
                      <div className="text-[14px] c-ink2 tabular-nums">
                        {timeFmt.format(new Date(e.start))} to {timeFmt.format(new Date(e.end))}
                        {expert && <span className="c-mute"> · {e.calendar}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        {/* Routines */}
        <section className="xl:col-span-4">
          <SectionHead n="2.3" title="Routines" />
          <ul>
            {routines.map((r) => (
              <li key={r.id} className="border-b py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className={`min-w-0 transition-opacity ${r.enabled ? "" : "opacity-45"}`}>
                    <div className="text-[17px] font-semibold leading-snug">{r.title}</div>
                    <div className="mt-1 text-[14px] c-ink2">{r.when}</div>
                    <div className="mt-1 text-[14px] c-mute leading-snug">{r.detail}</div>
                  </div>
                  <Switch on={r.enabled} onChange={() => toggleRoutine(r.id)} label={r.title} />
                </div>
                {expert && (
                  <dl className="mt-3 grid grid-cols-3 gap-2 border-t pt-2 text-[12px]">
                    <div><dt className="t-label c-mute">Where</dt><dd>{r.where}</dd></div>
                    <div><dt className="t-label c-mute">Last</dt><dd>{r.lastRun}</dd></div>
                    <div><dt className="t-label c-mute">Next</dt><dd>{r.enabled ? r.nextRun : "Paused"}</dd></div>
                  </dl>
                )}
                {r.id === "j1" && (
                  <Btn tone="plain" className="mt-2 text-[13px]" onClick={() => show("briefing")}>See this morning's briefing</Btn>
                )}
                {r.id === "j4" && approval === "pending" && (
                  <Btn tone="plain" className="mt-2 text-[13px]" onClick={() => show("m10")}>Waiting for your OK</Btn>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Label className="c-mute mb-1">New routine</Label>
            <Btn tone="plain" className="text-[14px]" onClick={() => askAbout("Every Sunday evening, ")}>Describe it to hux, for example "every Sunday evening, plan the week's dinners"</Btn>
          </div>
        </section>
      </div>
    </div>
  );
}
