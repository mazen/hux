// PROTOTYPE - concept 10 "Instrument": status modules that flank the display.
import { useState } from "react";
import { Car, Check, Lightbulb, Monitor, Pencil, Plug, Server, Smartphone, Speaker, Tablet, Trash2, Undo2, X } from "lucide-react";
import { devices, helpers, household, type MemberId } from "../../fixtures";
import { deviceMeta, helperMeta, homeMeta, member } from "./data";
import { Key, Label, Led, Meter, Module, Spec, Switch, cx, useInstrument } from "./ui";

export type HomeItem = { id: string; name: string; place: string; kind: string; on: boolean; level?: string; state: string };
export type Memory = { id: string; text: string; learned: string; about?: MemberId };
export type ActivityItem = { id: string; at: string; text: string; who?: MemberId; needsYou?: boolean };

function Avatar({ id, size = 18 }: { id?: MemberId; size?: number }) {
  const m = member(id);
  if (!m) return <span className="lbl !text-[9px]">hux</span>;
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
      style={{ width: size, height: size, background: m.color }}
      title={m.name}
    >
      {m.initials}
    </span>
  );
}

export function NowModule({ clock }: { clock: string }) {
  return (
    <Module title="Now" code="LOC BER · UTC+2">
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-end justify-between">
          <div className="mono text-[44px] leading-none font-medium tracking-[-0.05em]">{clock}</div>
          <div className="pb-1 text-right text-[12px] leading-tight text-[var(--muted)]">
            Friday
            <br />9 October
          </div>
        </div>
        <div className="ticks mt-3" />
        <div className="mt-3 flex items-center justify-between text-[13px]">
          <span className="text-[var(--ink-2)]">Berlin, partly cloudy</span>
          <span className="mono">13°</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {household.members.map((m) => (
            <span key={m.id} className="flex items-center gap-1.5 rounded-full border hairline bg-[var(--raised)] py-[3px] pr-2.5 pl-[3px] text-[12px]">
              <Avatar id={m.id} />
              {m.name}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-[var(--muted)]">Everyone is home.</p>
      </div>
    </Module>
  );
}

export function NeedsYouModule({ approved, onApprove }: { approved: boolean; onApprove: () => void }) {
  return (
    <Module title="Needs you" led={approved ? "off" : "pulse"} code="APPROVALS">
      {approved ? (
        <p className="px-4 py-3 text-[13px] text-[var(--muted)]">Nothing waiting for you.</p>
      ) : (
        <div className="px-4 py-3">
          <div className="text-[14px] font-semibold">Send email to Todd Becker</div>
          <div className="mono mt-0.5 text-[12px] text-[var(--muted)]">Mon 12 Oct, 07:30</div>
          <div className="mt-3 flex gap-2">
            <Key size="sm" tone="signal" onClick={onApprove}><Check size={13} /> Approve</Key>
          </div>
        </div>
      )}
    </Module>
  );
}

export function TimerModule({ remaining, onStop }: { remaining: number; onStop: () => void }) {
  const total = 25 * 60;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const pct = 1 - remaining / total;
  const R = 34;
  const C = 2 * Math.PI * R;
  return (
    <Module title="Frittata timer" led="pulse" code="KITCHEN TABLET">
      <div className="flex items-center gap-4 px-4 py-3">
        <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden>
          <circle cx="42" cy="42" r={R} fill="none" stroke="var(--inset)" strokeWidth="7" />
          <circle
            cx="42" cy="42" r={R} fill="none" stroke="var(--signal)" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 42 42)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
          {Array.from({ length: 25 }, (_, i) => {
            const a = (i / 25) * Math.PI * 2 - Math.PI / 2;
            return <line key={i} x1={42 + Math.cos(a) * 24} y1={42 + Math.sin(a) * 24} x2={42 + Math.cos(a) * 26.5} y2={42 + Math.sin(a) * 26.5} stroke="var(--line-strong)" strokeWidth="1" />;
          })}
        </svg>
        <div className="flex-1">
          <div className="mono text-[30px] leading-none font-medium tracking-[-0.04em]">
            {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[12px] text-[var(--muted)]">Rings on the kitchen tablet</div>
          <Key size="sm" className="mt-2" onClick={onStop}>Stop</Key>
        </div>
      </div>
    </Module>
  );
}

const homeIcon = { light: Lightbulb, plug: Plug, car: Car } as Record<string, typeof Lightbulb>;

export function HomeModule({ items, onToggle }: { items: HomeItem[]; onToggle: (id: string) => void }) {
  const { expert } = useInstrument();
  const onCount = items.filter((i) => i.kind !== "car" && i.on).length;
  return (
    <Module title="Home" code="6 ENTITIES" right={<span className="mono text-[11px] text-[var(--muted)]">{onCount} on</span>}>
      <ul className="divide-y divide-[var(--line)]">
        {items.map((h) => {
          const Icon = homeIcon[h.kind] ?? Lightbulb;
          return (
            <li key={h.id} className="flex items-center gap-3 px-4 py-2">
              <Icon size={15} className={cx(h.on ? "text-[var(--ink)]" : "text-[var(--faint)]")} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{h.name}</div>
                <div className="mono truncate text-[10.5px] text-[var(--muted)]">
                  {h.state}
                  {expert && <span className="text-[var(--faint)]"> · {h.place} · {homeMeta[h.id]}</span>}
                </div>
              </div>
              {h.kind === "car" ? <Led state="on" /> : <Switch on={h.on} onChange={() => onToggle(h.id)} label={`${h.name} ${h.on ? "on" : "off"}`} />}
            </li>
          );
        })}
      </ul>
    </Module>
  );
}

const deviceIcon = { desktop: Monitor, tablet: Tablet, phone: Smartphone, speaker: Speaker, server: Server } as Record<string, typeof Monitor>;

export function DevicesModule({ heardOn }: { heardOn: string }) {
  const { expert } = useInstrument();
  return (
    <Module title="Devices" code="5 NODES">
      <ul className="divide-y divide-[var(--line)]">
        {devices.map((d) => {
          const Icon = deviceIcon[d.kind] ?? Monitor;
          const heard = d.id === heardOn;
          return (
            <li key={d.id} className="px-4 py-2">
              <div className="flex items-center gap-3">
                <Icon size={15} className={d.online ? "text-[var(--ink)]" : "text-[var(--faint)]"} />
                <div className="min-w-0 flex-1">
                  <div className={cx("truncate text-[13px] font-medium", !d.online && "text-[var(--muted)]")}>{d.name}</div>
                  <div className="truncate text-[11px] text-[var(--muted)]">{d.note ?? d.place}</div>
                </div>
                {heard && <span className="lbl !text-[9px] !text-[var(--signal-ink)]">Heard you</span>}
                <Led state={heard ? "signal" : d.online ? "on" : "off"} />
              </div>
              {expert && (
                <div className="fade mt-1.5 ml-[27px] space-y-0.5">
                  <div className="mono text-[10.5px] text-[var(--faint)]">{d.abilities.join(" · ")}</div>
                  <div className="mono text-[10.5px] text-[var(--faint)]">
                    {deviceMeta[d.id]?.detail}
                    {deviceMeta[d.id]?.lastHeard && ` · last heard ${deviceMeta[d.id]?.lastHeard}`}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Module>
  );
}

export function HelpersModule() {
  const { expert } = useInstrument();
  return (
    <Module title="Helpers" code="ROLES">
      <ul className="divide-y divide-[var(--line)]">
        {helpers.map((h) => {
          const meta = helperMeta[h.id];
          return (
            <li key={h.id} className="px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold">{h.name}</span>
                <span className="flex-1" />
                {expert ? (
                  <span className="flex items-center gap-1.5" title={`Trust: ${meta.trust}`}>
                    <span className="lbl !text-[9px]">Trust</span>
                    <Meter level={meta.level} />
                  </span>
                ) : (
                  <span className="text-[11px] text-[var(--muted)]">{h.model}</span>
                )}
              </div>
              <div className="mt-0.5 text-[12px] text-[var(--muted)]">{h.does}</div>
              {expert && (
                <div className="fade well mt-2 rounded-lg px-2.5 py-1.5">
                  <Spec k="Model" v={meta.model} />
                  <Spec k="Trust" v={meta.trust} />
                  <Spec k="May" v={h.canDo.join(", ")} />
                  <Spec k="Last job" v={meta.lastJob} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Module>
  );
}

export function MemoryModule({ items, setItems }: { items: Memory[]; setItems: (m: Memory[]) => void }) {
  const { expert } = useInstrument();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [removed, setRemoved] = useState<{ item: Memory; index: number } | null>(null);
  const save = (id: string) => {
    const t = draft.trim();
    if (t) setItems(items.map((m) => (m.id === id ? { ...m, text: t, learned: "You edited this" } : m)));
    setEditing(null);
  };
  return (
    <Module title="What hux remembers" code={`${items.length} ITEMS`}>
      <ul className="divide-y divide-[var(--line)]">
        {items.map((m, index) => (
          <li key={m.id} className="group px-4 py-2.5">
            {editing === m.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  save(m.id);
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                  className="well min-w-0 flex-1 rounded-md px-2 py-1.5 text-[13px] outline-none"
                  aria-label="Edit memory"
                />
                <Key size="sm" tone="ink" type="submit" aria-label="Save"><Check size={13} /></Key>
                <Key size="sm" tone="flat" onClick={() => setEditing(null)} aria-label="Cancel"><X size={13} /></Key>
              </form>
            ) : (
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] leading-snug">{m.text}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                    {m.about && <Avatar id={m.about} size={14} />}
                    {m.learned}
                    {expert && <span className="mono text-[var(--faint)]">· {m.id} · label {m.about ? "Private" : "Family"}</span>}
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <Key size="sm" tone="flat" className="!px-1.5" aria-label={`Edit: ${m.text}`} onClick={() => { setEditing(m.id); setDraft(m.text); }}>
                    <Pencil size={13} />
                  </Key>
                  <Key
                    size="sm" tone="flat" className="!px-1.5" aria-label={`Forget: ${m.text}`}
                    onClick={() => { setRemoved({ item: m, index }); setItems(items.filter((x) => x.id !== m.id)); }}
                  >
                    <Trash2 size={13} />
                  </Key>
                </div>
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="px-4 py-3 text-[13px] text-[var(--muted)]">Nothing remembered right now.</li>}
      </ul>
      {removed && (
        <div className="fade flex items-center gap-2 border-t hairline bg-[var(--inset)]/50 px-4 py-2 text-[12px]">
          <span className="flex-1 text-[var(--muted)]">Forgotten.</span>
          <Key
            size="sm" tone="flat"
            onClick={() => {
              const next = [...items];
              next.splice(removed.index, 0, removed.item);
              setItems(next);
              setRemoved(null);
            }}
          >
            <Undo2 size={13} /> Undo
          </Key>
        </div>
      )}
    </Module>
  );
}

export function ActivityModule({ items }: { items: ActivityItem[] }) {
  const { expert } = useInstrument();
  return (
    <Module title="Recent activity" code="LOG · TODAY">
      <ol className="px-4 py-2">
        {items.map((a) => (
          <li key={a.id} className="flex gap-3 py-1.5">
            <span className={cx("mono w-[38px] shrink-0 pt-[1px] text-[11px]", a.needsYou ? "text-[var(--signal-ink)]" : "text-[var(--muted)]")}>{a.at}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] leading-snug">{a.text}</div>
              {(expert || a.needsYou) && (
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                  {a.needsYou && <span className="text-[var(--signal-ink)]">Waiting for your OK</span>}
                  {expert && <span className="mono text-[var(--faint)]">{a.who ? `asked by ${member(a.who)?.name}` : "on its own"}</span>}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Module>
  );
}

export function TrustModule() {
  return (
    <Module title="Trust and models" code="EXPERT">
      <div className="space-y-2 px-4 py-3">
        {[
          { k: "Home", d: "Runs on Desk PC. Nothing leaves the house.", lvl: 3, share: 92 },
          { k: "Public", d: "Cloud, only for public web searches.", lvl: 1, share: 8 },
        ].map((t) => (
          <div key={t.k}>
            <div className="flex items-center gap-2 text-[12px]">
              <Meter level={t.lvl} />
              <span className="font-semibold">{t.k}</span>
              <span className="mono ml-auto text-[11px] text-[var(--muted)]">{t.share}% of answers</span>
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--muted)]">{t.d}</div>
          </div>
        ))}
        <div className="well mt-2 rounded-lg px-2.5 py-1.5">
          <Spec k="Today" v="38 answers · 14,210 tok" />
          <Spec k="Cloud cost" v="€0.06 today · €1.84 Oct" />
          <Spec k="Gateway" v="hux.local:7420 · ok" />
        </div>
      </div>
    </Module>
  );
}

export { Avatar, Label };
