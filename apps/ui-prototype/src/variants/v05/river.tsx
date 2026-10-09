// PROTOTYPE concept 05 "River": the timeline itself.
import { useState, type ReactNode, type RefObject } from "react";
import { ArrowUp, Brain, ChevronDown, CloudRain, MapPin, Mic, MoonStar, Square } from "lucide-react";
import { devices, reminders, routines, suggestions, type MemberId } from "../../fixtures";
import { CardView, Thread, type ApprovalState } from "./cards";
import { helperFor, memberName, routineById, time, timeSecs, type Day, type Entry } from "./data";
import { Avatar, Dot, Eyebrow, Meta, Switch } from "./ui";

export type Ctx = {
  expert: boolean;
  enabled: Record<string, boolean>;
  setEnabled: (id: string, v: boolean) => void;
  approval: ApprovalState;
  setApproval: (s: ApprovalState) => void;
  emailBody: string;
  onSend: (text: string) => void;
  prefill: (text: string) => void;
  openMemory: () => void;
  reviewApproval: () => void;
};

const deviceName = (id: string) => devices.find((d) => d.id === id)?.name ?? id;

export const COLS = "grid grid-cols-[2.6rem_1.5rem_minmax(0,1fr)] sm:grid-cols-[4.25rem_2.5rem_minmax(0,1fr)]";

export function Row({ label, dot, spine, children, pad = "pb-6", className = "", labelClass = "" }: {
  label?: ReactNode; dot?: ReactNode; spine: "past" | "future" | "split"; children: ReactNode; pad?: string; className?: string; labelClass?: string;
}) {
  return (
    <div className={`${COLS} ${className}`}>
      <div className={`mono pt-[3px] pr-1.5 text-right text-[11px] leading-[18px] text-[var(--muted)] sm:pr-0 sm:text-[12px] ${labelClass}`}>{label}</div>
      <div className="relative flex justify-center">
        {spine === "split" ? (
          <>
            <div className="spine-now-top absolute top-0 left-1/2 h-[12px] w-px -translate-x-1/2" />
            <div className="spine-future absolute top-[12px] bottom-0 left-1/2 w-px -translate-x-1/2" />
          </>
        ) : (
          <div className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 ${spine === "future" ? "spine-future" : "spine-past"}`} />
        )}
        {dot && <div className="relative z-[1] flex h-[24px] items-start pt-[5px]">{dot}</div>}
      </div>
      <div className={`min-w-0 pl-1 ${pad}`}>{children}</div>
    </div>
  );
}

export function DayHeader({ day, future, count }: { day: Day; future: boolean; count: number }) {
  return (
    <div className={`${COLS} sticky top-0 z-[5] bg-[var(--bg-fade)] backdrop-blur-md`}>
      <div />
      <div className="relative">
        <div className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 ${future ? "spine-future" : "spine-past"}`} />
      </div>
      <div className="flex items-baseline gap-2 pt-4 pb-3 pl-1">
        <span className="text-[15px] font-semibold tracking-[-0.01em]">{day.weekday}</span>
        <span className="text-[15px] text-[var(--muted)]">{day.num} {day.month}</span>
        {day.rel && (
          <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${day.rel === "Today" ? "bg-[var(--now)] text-white" : "bg-[var(--surface-2)] text-[var(--ink-2)]"}`}>{day.rel}</span>
        )}
        {count === 0 && <span className="ml-auto pr-1 text-[12.5px] text-[var(--muted)]">Nothing on</span>}
      </div>
    </div>
  );
}

function RoutineDetail({ id, ctx, past }: { id: string; ctx: Ctx; past?: boolean }) {
  const r = routineById(id);
  const on = ctx.enabled[id];
  return (
    <div className="rise mt-2.5 max-w-[540px] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5 text-[13.5px]">
      <p className="leading-relaxed text-[var(--ink-2)]">{r.detail}</p>
      <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
        <dt className="text-[var(--muted)]">When</dt><dd>{r.when}</dd>
        <dt className="text-[var(--muted)]">Where</dt><dd>{r.where}</dd>
        {ctx.expert && (<>
          <dt className="text-[var(--muted)]">Last run</dt><dd className="mono text-[12px]">{r.lastRun}</dd>
          <dt className="text-[var(--muted)]">Next run</dt><dd className="mono text-[12px]">{on ? r.nextRun : "Paused"}</dd>
          <dt className="text-[var(--muted)]">Helper</dt><dd className="mono text-[12px]">{id === "j3" ? "Home" : id === "j4" ? "Writer" : "Chief"}</dd>
        </>)}
      </dl>
      {!("oneOff" in r && r.oneOff) && (
        <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3">
          <span>{on ? "Repeats" : "Paused"}{past && !on ? ". It won't run again until you turn it back on." : ""}</span>
          <Switch on={on} onChange={(v) => ctx.setEnabled(id, v)} label={`${r.title} on or off`} />
        </div>
      )}
    </div>
  );
}

export function EntryView({ e, future, ctx, showTime }: { e: Entry; future: boolean; ctx: Ctx; showTime: boolean }) {
  const [open, setOpen] = useState(false);
  const spine = future ? "future" : "past";
  const label = showTime ? time(e.at) : undefined;

  if (e.type === "message") {
    const m = e.msg;
    if (m.from === "member") {
      const who = m.member as MemberId;
      return (
        <Row spine={spine} label={label} dot={<span className="-mt-[5px] rounded-full ring-4 ring-[var(--bg)]"><Avatar id={who} size={20} /></span>} className="rise">
          <div className="mb-1 text-[12.5px] text-[var(--muted)]">{memberName(who)}{ctx.expert && <span className="mono text-[11px]"> · {deviceName(m.device)} · {timeSecs(e.at)}</span>}</div>
          <div className="inline-block max-w-[560px] rounded-[18px] rounded-tl-[6px] bg-[var(--surface-2)] px-3.5 py-2 text-[15px] leading-snug">{m.text}</div>
        </Row>
      );
    }
    return (
      <Row spine={spine} label={label} dot={<Dot kind="talk" future={false} />} className="rise">
        <p className="max-w-[600px] text-[15.5px] leading-relaxed">{m.text}</p>
        {m.id === "m4" && (
          <button onClick={ctx.openMemory} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[12.5px] text-[var(--ink-2)] hover:text-[var(--ink)]">
            <Brain size={13} /> Remembered what's in your fridge
          </button>
        )}
        {m.thread && <Thread thread={m.thread} expert={ctx.expert} />}
        {m.card && (
          <CardView
            card={m.card} onSend={ctx.onSend} approval={ctx.approval} emailBody={ctx.emailBody}
            onApprove={() => ctx.setApproval("approved")} onDecline={() => ctx.setApproval("declined")}
            onUndo={() => ctx.setApproval("pending")} onChangeEmail={() => ctx.prefill("Change the email to Todd: ")}
          />
        )}
        {ctx.expert && <Meta>{helperFor(m)} · on this network · {deviceName(m.device)} · {timeSecs(e.at)}</Meta>}
      </Row>
    );
  }

  if (e.type === "typing") {
    return (
      <Row spine="past" label={label} dot={<Dot kind="talk" future={false} />}>
        <div className="typing flex h-6 items-center gap-1"><span /><span /><span /></div>
      </Row>
    );
  }

  if (e.type === "done") {
    const canOpen = !!e.routineId;
    return (
      <Row spine={spine} label={label} dot={<Dot kind={e.kind} future={false} />}>
        <button disabled={!canOpen} onClick={() => setOpen(!open)} className="group block text-left">
          <Eyebrow kind={e.kind}>{e.kind === "routine" ? "Routine" : "In the background"}</Eyebrow>
          <div className="flex items-center gap-1.5 text-[15px] font-medium">
            {e.title}
            {canOpen && <ChevronDown size={14} className={`text-[var(--muted)] opacity-0 transition group-hover:opacity-100 ${open ? "rotate-180 opacity-100" : ""}`} />}
          </div>
          {e.detail && <div className="text-[13.5px] text-[var(--muted)]">{e.detail}</div>}
        </button>
        {open && e.routineId && <RoutineDetail id={e.routineId} ctx={ctx} past />}
        {e.card && (
          <CardView card={e.card} onSend={ctx.onSend} approval={ctx.approval} emailBody={ctx.emailBody} onApprove={() => {}} onDecline={() => {}} onUndo={() => {}} onChangeEmail={() => {}} />
        )}
        {ctx.expert && <Meta>{e.helper ?? "Chief"}{e.helper === "Researcher" ? " · cloud, public info only" : " · on this network"}{e.device ? ` · ${e.device}` : ""} · {timeSecs(e.at)}</Meta>}
      </Row>
    );
  }

  if (e.type === "routine") {
    const r = routineById(e.routineId);
    const on = ctx.enabled[e.routineId];
    const isEmail = e.routineId === "j4";
    const cancelled = isEmail && ctx.approval === "declined";
    return (
      <Row spine={spine} label={label} dot={<Dot kind="routine" future />}>
        <div className={!on || cancelled ? "opacity-55" : ""}>
          <button onClick={() => setOpen(!open)} className="group block w-full text-left">
            <Eyebrow kind="routine">{isEmail ? "Scheduled" : "Routine"}{!on && " · paused"}</Eyebrow>
            <div className={`flex items-center gap-1.5 text-[15px] font-medium ${cancelled ? "line-through" : ""}`}>
              {r.title}
              <ChevronDown size={14} className={`text-[var(--muted)] opacity-0 transition group-hover:opacity-100 ${open ? "rotate-180 opacity-100" : ""}`} />
            </div>
            <div className="text-[13.5px] text-[var(--muted)]">{isEmail ? r.detail : r.when}</div>
          </button>
        </div>
        {isEmail && ctx.approval === "pending" && (
          <button onClick={ctx.reviewApproval} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--now)] px-2.5 py-1 text-[12.5px] font-medium text-[var(--now)]">
            Waiting for your OK
          </button>
        )}
        {isEmail && ctx.approval === "approved" && <div className="mt-1.5 text-[12.5px] font-medium text-[var(--rout)]">Approved. Goes out on its own.</div>}
        {cancelled && <div className="mt-1.5 text-[12.5px] text-[var(--muted)]">Not sending</div>}
        {open && <RoutineDetail id={e.routineId} ctx={ctx} />}
      </Row>
    );
  }

  if (e.type === "reminder") {
    return (
      <Row spine={spine} label={label} dot={<Dot kind="reminder" future={future} />}>
        <Eyebrow kind="reminder">Reminder{e.for !== "alex" && ` · for ${memberName(e.for)}`}</Eyebrow>
        <div className="flex items-center gap-2 text-[15px] font-medium">
          {e.title}
          {e.for !== "alex" && <Avatar id={e.for} size={18} />}
        </div>
        {e.source && <div className="text-[13.5px] text-[var(--muted)]">{e.source}</div>}
        {ctx.expert && <Meta>Notifies {e.for === "alex" ? "Alex's phone" : e.for === "sam" ? "Sam's phone, then kitchen tablet" : "Kitchen tablet"}</Meta>}
      </Row>
    );
  }

  if (e.type === "event") {
    return (
      <Row spine={spine} label={label} dot={<Dot kind="calendar" future={future} />}>
        <div
          className="max-w-[540px] rounded-xl border-l-[3px] px-3 py-2"
          style={{ borderColor: "var(--cal)", background: "color-mix(in srgb, var(--cal) 8%, transparent)" }}
        >
          <div className="text-[15px] font-medium">{e.title}</div>
          <div className="text-[13px] text-[var(--ink-2)]">
            <span className="mono text-[12px]">{time(e.at)} – {time(e.end)}</span>
            <span className="text-[var(--muted)]"> · {e.calendar}</span>
          </div>
        </div>
        {ctx.expert && <Meta>From the connected family calendar · read only</Meta>}
      </Row>
    );
  }

  // ambient
  return (
    <Row spine={spine} label={label} dot={<Dot kind="ambient" future />} pad="pb-5">
      <div className="flex items-center gap-1.5 text-[13.5px] text-[var(--muted)]">
        {e.icon === "quiet" ? <MoonStar size={14} /> : <CloudRain size={14} />}
        <span className="font-medium text-[var(--ink-2)]">{e.title}</span>
        {e.detail && <span>· {e.detail}</span>}
      </div>
    </Row>
  );
}

export function Composer({ value, setValue, onSubmit, listening, onMic, inputRef }: {
  value: string; setValue: (s: string) => void; onSubmit: () => void; listening: boolean; onMic: () => void; inputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <form
      onSubmit={(ev) => { ev.preventDefault(); onSubmit(); }}
      className="flex items-center gap-1.5 rounded-[24px] border border-[var(--line-strong)] bg-[var(--surface)] p-1.5 pl-4 shadow-[var(--shadow)] transition focus-within:border-[var(--ink-2)]"
    >
      {listening ? (
        <div className="flex h-11 flex-1 items-center gap-3 text-[15px] text-[var(--ink-2)]">
          <span className="listen flex items-center gap-[3px]"><span /><span /><span /><span /><span /></span>
          Listening…
        </div>
      ) : (
        <input
          ref={inputRef}
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          placeholder="Ask hux something"
          className="h-11 min-w-0 flex-1 bg-transparent text-[15.5px] outline-none placeholder:text-[var(--muted)]"
        />
      )}
      <button
        type="button"
        onClick={onMic}
        aria-label={listening ? "Stop listening" : "Speak to hux"}
        className={`grid size-11 shrink-0 place-items-center rounded-full transition ${listening ? "bg-[var(--now)] text-white" : "bg-[var(--surface-2)] text-[var(--ink)] hover:bg-[var(--line)]"}`}
      >
        {listening ? <Square size={15} fill="currentColor" /> : <Mic size={19} />}
      </button>
      <button
        type="submit"
        disabled={!value.trim() || listening}
        aria-label="Send"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-[var(--bg)] transition disabled:opacity-25"
      >
        <ArrowUp size={19} />
      </button>
    </form>
  );
}

export function NowBlock({ ctx, composer, nowRef }: { ctx: Ctx; composer: ReactNode; nowRef: RefObject<HTMLDivElement | null> }) {
  const r1 = reminders.find((r) => r.id === "r1")!;
  const waiting = routines.filter((r) => r.id === "j3" || r.id === "j5");
  return (
    <div ref={nowRef} className="scroll-mt-24">
      <Row
        spine="split"
        label={<span className="font-semibold text-[var(--now)]">18:40</span>}
        dot={<span className="now-pulse relative -mt-[2px] block size-[13px] rounded-full bg-[var(--now)] ring-4 ring-[var(--bg)]" />}
        pad="pb-8"
      >
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold tracking-[0.16em] text-[var(--now)] uppercase">Now</span>
          <span className="h-px flex-1 bg-gradient-to-r from-[var(--now)] to-transparent opacity-50" />
        </div>

        <div className="mt-4 max-w-[620px]">
          {ctx.approval === "pending" && (
            <button onClick={ctx.reviewApproval} className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--now)_35%,transparent)] bg-[color-mix(in_srgb,var(--now)_7%,transparent)] px-3.5 py-2.5 text-left text-[13.5px]">
              <span className="size-2 shrink-0 rounded-full bg-[var(--now)]" />
              <span className="flex-1"><b className="font-semibold">Needs your OK:</b> send the email to Todd on Monday at 7:30</span>
              <span className="font-medium text-[var(--now)]">Review</span>
            </button>
          )}
          {composer}
          <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap">
            {suggestions.map((s) => (
              <button key={s} onClick={() => ctx.onSend(s)} className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1.5 text-[13.5px] text-[var(--ink-2)] transition hover:border-[var(--line-strong)] hover:text-[var(--ink)]">
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 max-w-[620px]">
          <div className="mb-2 text-[12px] font-medium text-[var(--muted)]">No fixed time</div>
          <ul className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <li className="flex items-center gap-3 px-3.5 py-2.5">
              <Dot kind="reminder" future />
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-medium">{r1.title}</div>
                <div className="flex items-center gap-1 text-[12.5px] text-[var(--muted)]"><MapPin size={12} />{r1.when}</div>
              </div>
            </li>
            {waiting.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <Dot kind="routine" future />
                <div className={`min-w-0 flex-1 ${ctx.enabled[r.id] ? "" : "opacity-55"}`}>
                  <div className="text-[14.5px] font-medium">{r.title}</div>
                  <div className="text-[12.5px] text-[var(--muted)]">{ctx.enabled[r.id] ? r.when : `Paused · ${r.lastRun}`}</div>
                </div>
                <Switch on={ctx.enabled[r.id]} onChange={(v) => ctx.setEnabled(r.id, v)} label={`${r.title} on or off`} />
              </li>
            ))}
          </ul>
        </div>
      </Row>
    </div>
  );
}
