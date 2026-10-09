// PROTOTYPE - concept 06 "Canvas": the content of every window.
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight, Car, Check, ChevronDown, CircleCheck, Clock, Droplets, Laptop, Lightbulb, MapPin, MessageSquare,
  Pause, Pencil, Play, Plug, Plus, Repeat, RotateCcw, Search, Server, ShieldCheck, Smartphone, Speaker, Tablet, Trash2,
} from "lucide-react";
import {
  activity, calendar, conversation, devices, helpers, home, portfolioBriefing, reminders, settingsGroups,
  type Card,
} from "../../fixtures";
import { askExamples, cx, dayLabel, emailBody, hhmm, memberName, settingLinks, useHux, type WinKind } from "./model";
import { Btn, ExpertLine, Label, Switch, Tag } from "./ui";

const recipe = conversation.find((m) => m.card?.type === "recipe")!.card as Extract<Card, { type: "recipe" }>;
const email = conversation.find((m) => m.card?.type === "emailDraft")!.card as Extract<Card, { type: "emailDraft" }>;
const weather = conversation.find((m) => m.card?.type === "weather")!.card as Extract<Card, { type: "weather" }>;
const approvalCard = conversation.find((m) => m.card?.type === "approval")!.card as Extract<Card, { type: "approval" }>;
const thread = conversation.find((m) => m.thread)!.thread!;
const portfolio = portfolioBriefing as Extract<Card, { type: "portfolio" }>;

const Pad = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx("px-4 py-4", className)}>{children}</div>
);

// ---------------------------------------------------------------- recipe
function RecipeBody() {
  const { open, startTimer, timer } = useHux();
  const [step, setStep] = useState(0);
  return (
    <Pad className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        <Tag><Clock size={12} /> {recipe.time}</Tag>
        <Tag>Serves {recipe.serves}</Tag>
        <Tag tone="green">Vegetarian</Tag>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-2">You have</Label>
          <ul className="space-y-1 text-[13px]">
            {recipe.have.map((h) => (
              <li key={h} className="flex items-start gap-1.5"><Check size={13} className="mt-[3px] shrink-0 text-(--green)" />{h}</li>
            ))}
          </ul>
        </div>
        <div>
          <Label className="mb-2">Still need</Label>
          <ul className="space-y-1.5 text-[13px]">
            {recipe.need.map((h) => (
              <li key={h}>
                <div>{h}</div>
                <button onClick={() => open("shopping")} className="text-[11px] text-(--accent) hover:underline">On your shopping list</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <Label className="mb-2">Steps</Label>
        <ol className="space-y-1">
          {recipe.steps.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => setStep(i)}
                className={cx(
                  "flex w-full gap-3 rounded-[10px] px-2.5 py-2 text-left text-[13px] leading-[1.45] transition-colors",
                  i === step ? "bg-(--accent-soft) text-(--ink)" : i < step ? "text-(--ink-3)" : "text-(--ink-2) hover:bg-(--hover)",
                )}
              >
                <span className={cx("v6-mono mt-[1px] grid size-5 shrink-0 place-items-center rounded-full text-[11px]", i === step ? "bg-(--accent) text-(--accent-ink)" : "bg-(--sunk)")}>
                  {i < step ? <Check size={11} /> : i + 1}
                </span>
                {s}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex gap-2">
        <Btn kind="primary" onClick={() => { if (!timer.end) startTimer(); open("timer"); }}>
          <Clock size={14} /> {timer.end ? "Show timer" : "Start 25 min timer"}
        </Btn>
        <Btn kind="soft" onClick={() => setStep((s) => Math.min(s + 1, recipe.steps.length - 1))}>Next step</Btn>
      </div>
    </Pad>
  );
}

// ---------------------------------------------------------------- shopping
function ShoppingBody() {
  const { shopping, toggleItem, addItem, expert } = useHux();
  const [v, setV] = useState("");
  return (
    <Pad className="flex h-full flex-col">
      <ul className="space-y-0.5">
        {shopping.map((it, i) => (
          <li key={it.name + i}>
            <button onClick={() => toggleItem(i)} className="flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left hover:bg-(--hover)">
              <span className={cx("grid size-[18px] place-items-center rounded-[6px] border transition-colors", it.done ? "border-(--accent) bg-(--accent) text-(--accent-ink)" : "border-(--line-2)")}>
                {it.done && <Check size={12} strokeWidth={3} />}
              </span>
              <span className={cx("text-[14px]", it.done && "text-(--ink-3) line-through")}>{it.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => { e.preventDefault(); if (v.trim()) { addItem(v.trim()); setV(""); } }}
        className="mt-1 flex items-center gap-2.5 rounded-[9px] px-2 py-1.5"
      >
        <Plus size={16} className="text-(--ink-3)" />
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Add an item" className="w-full bg-transparent text-[14px] outline-none" />
      </form>
      <div className="mt-auto flex items-center gap-1.5 pt-3 text-[12px] text-(--ink-3)">
        <Smartphone size={13} /> On Alex's phone. Reminds you at the supermarket.
      </div>
      {expert && <ExpertLine className="mt-1">synced 18:06 · trigger: geofence "REWE Kastanienallee"</ExpertLine>}
    </Pad>
  );
}

// ---------------------------------------------------------------- approval block (email window + chat)
export function ApprovalBlock({ compact }: { compact?: boolean }) {
  const { approval, setApproval, toast, expert } = useHux();
  if (approval === "approved")
    return (
      <div className="flex items-start gap-2.5 rounded-[12px] bg-(--green-soft) px-3 py-2.5 text-[13px]">
        <CircleCheck size={16} className="mt-[1px] shrink-0 text-(--green)" />
        <div className="flex-1">
          <div className="font-medium">Approved. Goes out {approvalCard.when}.</div>
          <div className="text-(--ink-2)">hux won't ask again for this email.</div>
        </div>
        <button onClick={() => setApproval("pending")} className="text-[12px] text-(--ink-2) hover:text-(--ink)">Undo</button>
      </div>
    );
  return (
    <div className={cx("rounded-[12px] border border-(--amber-soft)", compact ? "p-3" : "p-3.5")}
      style={{ background: "color-mix(in srgb, var(--amber-soft) 55%, transparent)" }}>
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-(--amber)">
        <ShieldCheck size={14} /> {approval === "later" ? "Still waiting for your OK" : "Needs your OK"}
      </div>
      <div className="mt-1.5 text-[14px] font-medium">{approvalCard.action}</div>
      <div className="text-[13px] text-(--ink-2)">{approvalCard.detail}</div>
      <div className="mt-0.5 text-[13px] text-(--ink-2)">Sends {approvalCard.when}</div>
      {expert && <ExpertLine className="mt-1.5">tier: send-external · helper: Writer · once per exact content (sha 4f1c…e2)</ExpertLine>}
      <div className="mt-3 flex gap-2">
        <Btn kind="primary" onClick={() => setApproval("approved")}><Check size={14} /> Approve</Btn>
        <Btn kind="ghost" onClick={() => { setApproval("later"); toast("Okay. I'll ask again on Sunday evening."); }}>Not now</Btn>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- email
function EmailBody() {
  const { approval, expert, open } = useHux();
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-(--line) px-4 py-2.5 text-[13px]">
        <div className="flex gap-2 py-1"><span className="w-14 text-(--ink-3)">To</span><span className="font-medium">{email.to}</span></div>
        <div className="flex gap-2 py-1"><span className="w-14 text-(--ink-3)">Subject</span><span className="font-medium">{email.subject}</span></div>
        <div className="flex items-center gap-2 py-1">
          <span className="w-14 text-(--ink-3)">Status</span>
          {approval === "approved" ? <Tag tone="green">Scheduled · Mon 7:30</Tag> : <Tag tone="amber">Draft · waiting for you</Tag>}
        </div>
      </div>
      <div className="flex-1 px-4 py-4 text-[14px] leading-[1.6] whitespace-pre-wrap">{emailBody(email.body)}</div>
      <div className="space-y-2 px-4 pb-4">
        <button onClick={() => open("research")} className="flex items-center gap-1 text-[12px] text-(--ink-2) hover:text-(--ink)">
          Based on: Research: home batteries <ArrowUpRight size={12} />
        </button>
        {expert && <ExpertLine>98 words · Writer · model: on this network · edited 18:31 on Desk PC</ExpertLine>}
        <ApprovalBlock />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- weather
export function HourlyRain({ small }: { small?: boolean }) {
  const max = Math.max(...weather.hourly.map((h) => h.temp));
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {weather.hourly.map((h) => (
        <div key={h.time} className="flex flex-col items-center gap-1">
          <span className="v6-mono text-[12px]">{h.temp}°</span>
          <div className={cx("relative w-full overflow-hidden rounded-[6px] bg-(--sunk)", small ? "h-8" : "h-14")}>
            <div className="absolute inset-x-0 bottom-0 bg-(--rain)/70 transition-all" style={{ height: `${h.rain}%`, background: "var(--rain)", opacity: 0.55 }} />
            <div className="absolute inset-x-1 h-[2px] rounded bg-(--ink-2)" style={{ bottom: `${(h.temp / max) * 80}%` }} />
          </div>
          <span className="v6-mono text-[11px] text-(--ink-3)">{h.time.padStart(2, "0")}:00</span>
        </div>
      ))}
    </div>
  );
}

function WeatherBody() {
  const { expert } = useHux();
  return (
    <Pad className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[12px] text-(--ink-3)">{weather.place} · Saturday 10 Oct</div>
          <div className="mt-0.5 text-[44px] leading-none font-light tracking-[-0.04em]">{weather.high}°</div>
          <div className="mt-1 text-[13px] text-(--ink-2)">{weather.now} · low {weather.low}°</div>
        </div>
        <div className="text-right text-[12px] text-(--ink-2)">
          <Droplets size={14} className="mb-0.5 ml-auto text-(--rain)" />Rain from 17:00
        </div>
      </div>
      <HourlyRain />
      <p className="text-[13px] text-(--ink-2)">Dry until mid-afternoon, then light rain. Good morning for a bike ride.</p>
      {expert && <ExpertLine>source: DWD open data · fetched 18:38 · station Berlin-Tempelhof</ExpertLine>}
    </Pad>
  );
}

// ---------------------------------------------------------------- research
function ResearchBody() {
  const { open, expert } = useHux();
  return (
    <Pad className="space-y-4">
      <div className="flex items-center gap-2"><Tag tone="green"><Check size={12} /> Done</Tag><span className="text-[12px] text-(--ink-3)">This afternoon, 15:10</span></div>
      <ol className="relative space-y-3 pl-6">
        <span className="absolute top-2 bottom-2 left-[8px] w-px bg-(--line-2)" />
        {thread.steps.map((s) => (
          <li key={s} className="relative text-[13px]">
            <span className="absolute top-[2px] -left-6 grid size-[17px] place-items-center rounded-full bg-(--green) text-white"><Check size={10} strokeWidth={3} /></span>
            {s}
          </li>
        ))}
      </ol>
      <div className="rounded-[12px] bg-(--sunk) p-3 text-[13px] leading-[1.5] text-(--ink-2)">
        Two systems fit your roof and budget: a 10 kWh battery for the existing inverter, or a modular 7.5 kWh one you can extend later.
      </div>
      <Btn kind="soft" onClick={() => open("email")}>Open the email to Todd <ArrowUpRight size={14} /></Btn>
      {expert && <ExpertLine>helper: Researcher · model: cloud (public info only) · 9 sources · 41 s · no personal data sent</ExpertLine>}
    </Pad>
  );
}

// ---------------------------------------------------------------- briefing
function BriefingBody() {
  const { expert } = useHux();
  return (
    <Pad className="space-y-4">
      <div className="text-[12px] text-(--ink-3)">Monday 12 Oct, 7:00 · kitchen tablet and phone</div>
      <div className="space-y-1.5">
        <Label>Today</Label>
        <div className="text-[13px]">Team stand-up at 9:30. Email to Todd goes out at 7:30.</div>
      </div>
      <div className="rounded-[14px] border border-(--line-2) p-3.5">
        <div className="flex items-baseline justify-between">
          <Label>Your money · {portfolio.date}</Label>
          <span className="text-[12px] text-(--green)">{portfolio.change} ({portfolio.changePct})</span>
        </div>
        <div className="mt-1 text-[26px] font-medium tracking-[-0.03em]">{portfolio.total}</div>
        <div className="mt-2 divide-y divide-(--line)">
          {portfolio.lines.map((l) => (
            <div key={l.name} className="flex justify-between py-1.5 text-[13px]">
              <span className="text-(--ink-2)">{l.name}</span>
              <span className="v6-mono">{l.value} <span className="ml-1 text-(--ink-3)">{l.change}</span></span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[12px] text-(--ink-3)">{portfolio.note}</div>
      </div>
      {expert && <ExpertLine>bank connection: read only · last sync 06:58</ExpertLine>}
    </Pad>
  );
}

// ---------------------------------------------------------------- timer
function TimerBody() {
  const { timer, startTimer, pauseTimer, resetTimer } = useHux();
  const [, tick] = useState(0);
  useEffect(() => {
    if (!timer.end) return;
    const t = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [timer.end]);
  const left = timer.end ? Math.max(0, timer.end - Date.now()) : timer.left;
  const total = 25 * 60 * 1000;
  const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
  return (
    <Pad className="flex h-full flex-col items-center justify-center gap-3">
      <div className="v6-mono text-[46px] leading-none tracking-[-0.03em]">{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-(--sunk)">
        <div className="h-full rounded-full bg-(--accent) transition-[width] duration-300" style={{ width: `${(1 - left / total) * 100}%` }} />
      </div>
      <div className="text-[12px] text-(--ink-3)">{left === 0 ? "Done. Take it out from under the grill." : "Calls you on the kitchen tablet when done"}</div>
      <div className="flex gap-2">
        {timer.end ? <Btn kind="soft" onClick={pauseTimer}><Pause size={14} /> Pause</Btn> : <Btn kind="primary" onClick={startTimer}><Play size={14} /> {timer.left < total ? "Resume" : "Start"}</Btn>}
        <Btn kind="ghost" onClick={resetTimer}><RotateCcw size={14} /> Reset</Btn>
      </div>
    </Pad>
  );
}

// ---------------------------------------------------------------- plans
function PlansBody() {
  const { routines, toggleRoutine, expert, open } = useHux();
  const [tab, setTab] = useState<"reminders" | "calendar" | "routines">("reminders");
  const days = [...new Set(calendar.map((c) => dayLabel(c.start)))];
  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex gap-1 border-b border-(--line) bg-(--win) px-3 py-2">
        {([["reminders", "Reminders"], ["calendar", "Calendar"], ["routines", "Routines"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={cx("h-7 rounded-[8px] px-2.5 text-[13px] font-medium transition-colors", tab === k ? "bg-(--sunk) text-(--ink)" : "text-(--ink-3) hover:text-(--ink)")}>
            {l}
            {k === "routines" && <span className="ml-1.5 text-(--ink-3)">{routines.filter((r) => r.enabled).length}</span>}
          </button>
        ))}
      </div>

      {tab === "reminders" && (
        <div className="divide-y divide-(--line) px-4">
          {reminders.map((r) => (
            <div key={r.id} className="flex items-start gap-3 py-3">
              <span className="mt-[2px] grid size-7 shrink-0 place-items-center rounded-[9px] bg-(--sunk) text-(--ink-2)">
                {r.whenKind === "place" ? <MapPin size={14} /> : <Clock size={14} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium">{r.title}</div>
                <div className="text-[13px] text-(--ink-2)">{r.when}</div>
                {expert && <ExpertLine className="mt-0.5">for {memberName(r.for)} · {r.whenKind} trigger{r.source ? ` · from ${r.source}` : ""}</ExpertLine>}
              </div>
              <span className="text-[12px] text-(--ink-3)">{memberName(r.for)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "calendar" && (
        <div className="px-4 py-2">
          {days.map((d) => (
            <div key={d} className="py-2">
              <Label className="mb-1.5">{d}</Label>
              {calendar.filter((c) => dayLabel(c.start) === d).map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-[10px] px-2 py-2 hover:bg-(--hover)">
                  <span className={cx("h-8 w-[3px] rounded-full", c.calendar === "Family" ? "bg-(--accent)" : c.calendar === "Work" ? "bg-(--ink-3)" : "bg-(--green)")} />
                  <div className="v6-mono w-[88px] text-[12px] text-(--ink-2)">{hhmm(c.start)}–{hhmm(c.end)}</div>
                  <div className="flex-1 text-[14px]">{c.title}</div>
                  {expert && <span className="text-[11px] text-(--ink-3)">{c.calendar}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === "routines" && (
        <div className="space-y-2 px-3 py-3">
          {routines.map((r) => (
            <div key={r.id} className={cx("rounded-[12px] border border-(--line-2) p-3 transition-opacity", !r.enabled && "opacity-60")}>
              <div className="flex items-start gap-3">
                <span className="mt-[1px] grid size-7 shrink-0 place-items-center rounded-[9px] bg-(--sunk) text-(--ink-2)">
                  {r.oneOff ? <Clock size={14} /> : <Repeat size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium">{r.title}</div>
                  <div className="text-[13px] text-(--ink-2)">{r.when}</div>
                  <div className="mt-0.5 text-[12px] text-(--ink-3)">{r.detail}</div>
                </div>
                <Switch on={r.enabled} onChange={() => toggleRoutine(r.id)} label={r.title} />
              </div>
              {(expert || r.id === "j1") && (
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-10">
                  {expert && <ExpertLine>last {r.lastRun} · next {r.enabled ? r.nextRun : "paused"} · {r.where}</ExpertLine>}
                  {r.id === "j1" && <button onClick={() => open("briefing")} className="text-[12px] font-medium text-(--accent) hover:underline">Preview Monday's briefing</button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- settings
function SettingsBody() {
  const { expert, settingsFocus, setSettingsFocus, settingVals, toggleSetting, askAbout, open } = useHux();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(settingsFocus ?? "notifications");
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!settingsFocus) return;
    setOpenId(settingsFocus);
    setQ("");
    requestAnimationFrame(() => refs.current[settingsFocus]?.scrollIntoView({ block: "start", behavior: "smooth" }));
    setSettingsFocus(null);
  }, [settingsFocus, setSettingsFocus]);

  const needle = q.trim().toLowerCase();
  const groups = settingsGroups
    .map((g) => {
      const items = [...g.simple.map((n) => ({ n, ex: false })), ...(expert ? g.expert.map((n) => ({ n, ex: true })) : [])];
      const hit = !needle || g.title.toLowerCase().includes(needle);
      return { g, items: hit ? items : items.filter((i) => i.n.toLowerCase().includes(needle)), hit };
    })
    .filter((x) => x.hit || x.items.length);
  const totalSimple = settingsGroups.reduce((a, g) => a + g.simple.length, 0);
  const totalExpert = settingsGroups.reduce((a, g) => a + g.expert.length, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 space-y-2 border-b border-(--line) bg-(--win) px-3 py-2.5">
        <label className="flex h-9 items-center gap-2 rounded-[10px] bg-(--sunk) px-3">
          <Search size={15} className="text-(--ink-3)" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a setting" className="w-full bg-transparent text-[14px] outline-none" />
        </label>
        <button onClick={() => askAbout("Make quiet hours start at 23:00")}
          className="flex w-full items-center gap-2 rounded-[10px] px-1 text-left text-[12px] text-(--ink-2) hover:text-(--ink)">
          <MessageSquare size={13} className="shrink-0 text-(--accent)" />
          <span>Or just ask: <span className="text-(--ink)">"Make quiet hours start at 23:00"</span></span>
        </button>
      </div>
      <div className="flex-1 px-2 py-2">
        {groups.length === 0 && (
          <div className="px-3 py-8 text-center text-[13px] text-(--ink-2)">
            Nothing called "{q}".
            <div className="mt-3"><Btn kind="soft" onClick={() => askAbout(q)}>Ask hux about "{q}"</Btn></div>
          </div>
        )}
        {groups.map(({ g, items }) => {
          const isOpen = !!needle || openId === g.id;
          return (
            <div key={g.id} ref={(el) => { refs.current[g.id] = el; }} className={cx("rounded-[12px] transition-colors", false)}
              style={isOpen ? { background: "color-mix(in srgb, var(--sunk) 70%, transparent)" } : undefined}>
              <button onClick={() => setOpenId(isOpen && !needle ? null : g.id)} className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left hover:bg-(--hover)">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium">{g.title}</div>
                  <div className="truncate text-[12px] text-(--ink-3)">{g.summary}</div>
                </div>
                <ChevronDown size={16} className={cx("text-(--ink-3) transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="v6-fade px-1.5 pb-2">
                  {items.map(({ n, ex }) => {
                    const val = settingVals[n];
                    const link = settingLinks[n];
                    return (
                      <div key={n} className="flex min-h-10 items-center gap-3 rounded-[9px] px-2 py-1.5 hover:bg-(--hover)">
                        <div className="min-w-0 flex-1 text-[13px]">
                          {n} {ex && <span className="ml-1 align-middle"><Tag tone="expert">Expert</Tag></span>}
                        </div>
                        {typeof val === "boolean" ? (
                          <Switch on={val} onChange={() => toggleSetting(n)} label={n} />
                        ) : link ? (
                          <button onClick={() => open(link)} className="flex items-center gap-1 text-[12px] text-(--accent) hover:underline">{val || "Open"} <ArrowUpRight size={12} /></button>
                        ) : val ? (
                          <span className="max-w-[48%] truncate text-right text-[12px] text-(--ink-2)">{val}</span>
                        ) : (
                          <ChevronDown size={14} className="-rotate-90 text-(--ink-3)" />
                        )}
                      </div>
                    );
                  })}
                  {!expert && !needle && (
                    <div className="px-2 pt-1 text-[11px] text-(--ink-3)">{g.expert.length} more in expert mode</div>
                  )}
                  <button onClick={() => askAbout(askExamples[g.id] ?? "")}
                    className="mt-1.5 flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[12px] font-medium text-(--accent) hover:bg-(--accent-soft)">
                    <MessageSquare size={13} /> Ask hux to change this
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div className="px-3 pt-3 pb-2 text-[11px] text-(--ink-3)">
          {expert ? `${totalSimple + totalExpert} settings in ${settingsGroups.length} groups` : `${totalSimple} everyday settings. Expert mode shows ${totalExpert} more.`}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- home
const homeIcon = { light: Lightbulb, plug: Plug, car: Car } as const;
function HomeBody() {
  const { homeState, toggleHome, expert } = useHux();
  const rooms = [...new Set(home.map((h) => h.place))];
  const onCount = home.filter((h) => homeState[h.id]?.on && h.kind !== "car").length;
  return (
    <Pad className="space-y-4">
      <div className="text-[13px] text-(--ink-2)">{onCount === 0 ? "Everything is off." : `${onCount} ${onCount === 1 ? "thing is" : "things are"} on.`} Everyone is home.</div>
      {rooms.map((room) => (
        <div key={room}>
          <Label className="mb-1.5">{room}</Label>
          <div className="space-y-1">
            {home.filter((h) => h.place === room).map((h) => {
              const I = homeIcon[h.kind as keyof typeof homeIcon] ?? Lightbulb;
              const st = homeState[h.id];
              return (
                <div key={h.id} className="flex items-center gap-3 rounded-[10px] px-2 py-1.5 hover:bg-(--hover)">
                  <span className={cx("grid size-8 place-items-center rounded-[10px] transition-colors", st.on ? "bg-(--amber-soft) text-(--amber)" : "bg-(--sunk) text-(--ink-3)")}><I size={15} /></span>
                  <div className="flex-1">
                    <div className="text-[14px]">{h.name}</div>
                    <div className="text-[12px] text-(--ink-3)">{st.state}{expert && ` · ${h.kind} · ${h.kind === "car" ? "via car app" : "Zigbee"}`}</div>
                  </div>
                  {h.kind !== "car" && <Switch on={st.on} onChange={() => toggleHome(h.id)} label={h.name} />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </Pad>
  );
}

// ---------------------------------------------------------------- devices
const devIcon = { desktop: Laptop, tablet: Tablet, phone: Smartphone, speaker: Speaker, server: Server } as const;
function DevicesBody() {
  const { expert, toast } = useHux();
  return (
    <Pad className="space-y-2">
      {devices.map((d) => {
        const I = devIcon[d.kind as keyof typeof devIcon] ?? Laptop;
        return (
          <div key={d.id} className="flex items-start gap-3 rounded-[12px] border border-(--line-2) p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-(--sunk) text-(--ink-2)"><I size={17} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[14px] font-medium">
                {d.name}
                <span className={cx("size-1.5 rounded-full", d.online ? "bg-(--green)" : "bg-(--ink-3)")} />
              </div>
              <div className="text-[12px] text-(--ink-3)">{d.place}{d.note ? ` · ${d.note}` : ""}</div>
              {expert && <ExpertLine className="mt-1">node:{d.id} · {d.abilities.join(", ")}{d.screens ? ` · ${d.screens} screen${d.screens > 1 ? "s" : ""}` : ""}</ExpertLine>}
            </div>
            {!d.online && <Btn kind="soft" className="h-7 px-2.5 text-[12px]" onClick={() => toast("Waking the build box. It takes about a minute.")}>Wake</Btn>}
          </div>
        );
      })}
    </Pad>
  );
}

// ---------------------------------------------------------------- memory
function MemoryBody() {
  const { mems, editMem, removeMem, expert } = useHux();
  const [editing, setEditing] = useState<string | null>(null);
  const [val, setVal] = useState("");
  return (
    <Pad className="space-y-1">
      {mems.length === 0 && <div className="py-6 text-center text-[13px] text-(--ink-3)">hux doesn't remember anything right now.</div>}
      {mems.map((m) => (
        <div key={m.id} className="group flex items-start gap-3 rounded-[10px] px-2 py-2 hover:bg-(--hover)">
          <div className="min-w-0 flex-1">
            {editing === m.id ? (
              <form onSubmit={(e) => { e.preventDefault(); editMem(m.id, val); setEditing(null); }}>
                <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => { editMem(m.id, val); setEditing(null); }}
                  className="w-full rounded-[7px] bg-(--win) px-2 py-1 text-[14px] outline-none ring-1 ring-(--accent)" />
              </form>
            ) : (
              <div className="text-[14px] leading-[1.45]">{m.text}</div>
            )}
            <div className="mt-0.5 text-[12px] text-(--ink-3)">
              {m.learned}{m.about ? ` · about ${memberName(m.about)}` : " · whole household"}
            </div>
            {expert && <ExpertLine className="mt-0.5">id {m.id} · label: household-private · never leaves home</ExpertLine>}
          </div>
          <div className="flex gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
            <button aria-label="Edit" onClick={() => { setEditing(m.id); setVal(m.text); }} className="grid size-7 place-items-center rounded-[8px] text-(--ink-2) hover:bg-(--sunk)"><Pencil size={13} /></button>
            <button aria-label="Forget" onClick={() => removeMem(m.id)} className="grid size-7 place-items-center rounded-[8px] text-(--ink-2) hover:bg-(--sunk)"><Trash2 size={13} /></button>
          </div>
        </div>
      ))}
    </Pad>
  );
}

// ---------------------------------------------------------------- activity
function ActivityBody() {
  const { expert, open, approval } = useHux();
  return (
    <Pad>
      <ol className="relative space-y-4 pl-5">
        <span className="absolute top-1.5 bottom-1.5 left-[4px] w-px bg-(--line-2)" />
        {activity.map((a) => (
          <li key={a.id} className="relative">
            <span className={cx("absolute top-[6px] -left-5 size-[9px] rounded-full border-2 border-(--win)", a.needsYou && approval !== "approved" ? "bg-(--amber)" : "bg-(--ink-3)")} />
            <div className="v6-mono text-[11px] text-(--ink-3)">{a.at}</div>
            <div className="text-[14px] leading-[1.45]">{a.text}</div>
            {expert && <ExpertLine>{a.who ? `asked by ${memberName(a.who)}` : "on its own (routine)"}</ExpertLine>}
            {a.needsYou && approval !== "approved" && (
              <button onClick={() => open("email")} className="mt-1 text-[12px] font-medium text-(--amber) hover:underline">Waiting for your OK</button>
            )}
          </li>
        ))}
      </ol>
    </Pad>
  );
}

// ---------------------------------------------------------------- helpers
function HelpersBody() {
  const { expert } = useHux();
  return (
    <Pad className="space-y-2">
      {helpers.map((h) => (
        <div key={h.id} className="rounded-[12px] border border-(--line-2) p-3">
          <div className="flex items-baseline justify-between">
            <div className="text-[14px] font-medium">{h.name}</div>
            {expert && <span className="text-[11px] text-(--ink-3)">{h.model}</span>}
          </div>
          <div className="text-[13px] text-(--ink-2)">{h.does}</div>
          <div className="mt-2 flex flex-wrap gap-1">{h.canDo.map((c) => <Tag key={c}>{c}</Tag>)}</div>
        </div>
      ))}
    </Pad>
  );
}

export const BODIES: Record<WinKind, () => ReactNode> = {
  recipe: RecipeBody,
  shopping: ShoppingBody,
  email: EmailBody,
  weather: WeatherBody,
  research: ResearchBody,
  briefing: BriefingBody,
  timer: TimerBody,
  plans: PlansBody,
  settings: SettingsBody,
  home: HomeBody,
  devices: DevicesBody,
  memory: MemoryBody,
  activity: ActivityBody,
  helpers: HelpersBody,
};

export { recipe, email, weather, thread };
