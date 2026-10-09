// PROTOTYPE concept 04: the House drawer. Home devices, hux's devices, helpers, memory and today's activity.
import { useState } from "react";
import { Car, Laptop, Lightbulb, Pencil, Plug, Server, Smartphone, Speaker, Tablet, Trash2, X } from "lucide-react";
import { activity, devices, helpers } from "../../fixtures";
import { isOn, useHux, type HouseTab } from "./state";
import { Avatar, Label, Switch, cx, member } from "./ui";

const tabs: { id: HouseTab; label: string }[] = [
  { id: "home", label: "Lights and plugs" },
  { id: "devices", label: "hux's devices" },
  { id: "helpers", label: "Helpers" },
  { id: "memory", label: "Remembers" },
  { id: "activity", label: "Today" },
];

const connection: Record<string, string> = { h1: "Zigbee", h2: "Matter", h3: "Zigbee", h4: "Govee", h5: "Meross", h6: "Home Assistant" };

export function HouseDrawer() {
  const s = useHux();
  const open = s.house !== null;
  return (
    <>
      <div
        className={cx("fixed inset-0 z-50 bg-[rgba(30,20,10,.3)] transition-opacity duration-300", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => s.openHouse(null)}
      />
      <aside
        aria-label="House"
        aria-hidden={!open}
        className={cx(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-[var(--panel)] shadow-2xl transition-transform duration-300 ease-out sm:w-[460px]",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <header className="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 className="v4-serif text-2xl font-semibold">House</h2>
          <button onClick={() => s.openHouse(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--paper-2)]">
            <X size={19} />
          </button>
        </header>
        <nav className="v4-scroll flex flex-none gap-1.5 overflow-x-auto border-b border-[var(--line)] px-5 pb-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => s.openHouse(t.id)}
              className={cx(
                "flex-none rounded-full px-3 py-1.5 text-sm font-semibold transition",
                s.house === t.id ? "bg-[var(--btn)] text-[var(--btn-ink)]" : "text-[var(--ink-2)] hover:bg-[var(--paper-2)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="v4-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {s.house === "home" && <HomeTab />}
          {s.house === "devices" && <DevicesTab />}
          {s.house === "helpers" && <HelpersTab />}
          {s.house === "memory" && <MemoryTab />}
          {s.house === "activity" && <ActivityTab />}
        </div>
      </aside>
    </>
  );
}

function HomeTab() {
  const s = useHux();
  const places = [...new Set(s.homeThings.map((h) => h.place))];
  return (
    <div className="space-y-5">
      {places.map((p) => (
        <section key={p}>
          <Label className="mb-2">{p}</Label>
          <div className="v4-paper divide-y divide-[var(--line)]">
            {s.homeThings
              .filter((h) => h.place === p)
              .map((h) => {
                const on = isOn(h.state);
                const Icon = h.kind === "light" ? Lightbulb : h.kind === "plug" ? Plug : Car;
                return (
                  <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={cx(
                        "grid h-9 w-9 place-items-center rounded-lg",
                        on ? "bg-[var(--honey-soft)] text-[var(--honey-ink)]" : "bg-[var(--paper-2)] text-[var(--ink-3)]",
                      )}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{h.name}</span>
                      <span className="text-xs text-[var(--ink-2)]">
                        {h.state}
                        {s.expert && ` · ${connection[h.id]}`}
                      </span>
                    </span>
                    {h.kind !== "car" && <Switch on={on} onChange={() => s.toggleHome(h.id)} label={h.name} />}
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

const kindIcon = { desktop: Laptop, tablet: Tablet, phone: Smartphone, speaker: Speaker, server: Server } as const;

function DevicesTab() {
  const { expert } = useHux();
  return (
    <div className="v4-paper divide-y divide-[var(--line)]">
      {devices.map((d) => {
        const Icon = kindIcon[d.kind as keyof typeof kindIcon] ?? Laptop;
        return (
          <div key={d.id} className="flex gap-3 px-4 py-3.5">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-[var(--paper-2)] text-[var(--ink-2)]">
              <Icon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-medium">
                {d.name}
                <span className={cx("h-2 w-2 rounded-full", d.online ? "bg-[#5aa469]" : "bg-[var(--ink-3)]")} />
              </span>
              <span className="block text-xs text-[var(--ink-2)]">
                {d.place}
                {d.note && ` · ${d.note}`}
              </span>
              {expert && (
                <span className="mt-1 block text-[11px] text-[var(--ink-3)]">
                  Node {d.id} · {d.abilities.join(", ")}
                  {d.screens > 1 && ` · ${d.screens} screens`}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HelpersTab() {
  const { expert } = useHux();
  return (
    <div className="space-y-3">
      {helpers.map((h) => (
        <div key={h.id} className="v4-paper px-4 py-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="v4-serif text-lg font-semibold">{h.name}</span>
            {expert && <span className="text-[11px] text-[var(--ink-3)]">Model: {h.model}</span>}
          </div>
          <p className="text-sm text-[var(--ink-2)]">{h.does}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {h.canDo.map((c) => (
              <span key={c} className="rounded-full bg-[var(--paper-2)] px-2.5 py-1 text-xs text-[var(--ink-2)]">
                {c}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MemoryTab() {
  const s = useHux();
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  return (
    <div>
      {s.lastForgotten && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-[var(--paper-2)] px-4 py-2.5 text-sm">
          <span className="text-[var(--ink-2)]">Forgotten.</span>
          <button className="font-semibold underline underline-offset-2" onClick={s.undoForget}>
            Undo
          </button>
        </div>
      )}
      <div className="v4-paper divide-y divide-[var(--line)]">
        {s.memories.length === 0 && <div className="px-4 py-6 text-sm text-[var(--ink-2)]">hux doesn't remember anything about you.</div>}
        {s.memories.map((m) => (
          <div key={m.id} className="px-4 py-3.5">
            {editing === m.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (text.trim()) s.editMemory(m.id, text.trim());
                  setEditing(null);
                }}
              >
                <textarea
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[var(--line-strong)] bg-[var(--paper-2)] px-3 py-2 text-[15px] outline-none focus:border-[var(--ink-3)]"
                />
                <div className="mt-2 flex gap-2">
                  <button type="submit" className="rounded-full bg-[var(--btn)] px-3.5 py-1.5 text-sm font-semibold text-[var(--btn-ink)]">
                    Save
                  </button>
                  <button type="button" className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-[var(--ink-2)]" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start gap-3">
                {m.about ? <Avatar id={m.about} size={24} /> : <span className="mt-0.5 h-6 w-6 flex-none rounded-full border border-dashed border-[var(--line-strong)]" title="Everyone" />}
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px]">{m.text}</span>
                  <span className="text-xs text-[var(--ink-3)]">
                    {m.learned}
                    {m.about ? ` · about ${member(m.about)?.name}` : " · for everyone"}
                  </span>
                </span>
                <button
                  aria-label="Edit"
                  className="grid h-8 w-8 place-items-center rounded-full text-[var(--ink-3)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
                  onClick={() => {
                    setEditing(m.id);
                    setText(m.text);
                  }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  aria-label="Forget"
                  className="grid h-8 w-8 place-items-center rounded-full text-[var(--ink-3)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
                  onClick={() => s.forgetMemory(m.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityTab() {
  const s = useHux();
  return (
    <ol className="relative space-y-4 border-l-2 border-[var(--line)] pl-5">
      {activity.map((a) => {
        const waiting = a.needsYou && s.approval === "pending";
        return (
          <li key={a.id} className="relative">
            <span className={cx("absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-[var(--panel)]", waiting ? "bg-[var(--honey)]" : "bg-[var(--line-strong)]")} />
            <div className="text-xs tabular-nums text-[var(--ink-3)]">{a.at}</div>
            <div className="text-[15px]">{a.text}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {s.expert && <span className="text-[11px] text-[var(--ink-3)]">{a.who ? `Asked by ${member(a.who)?.name}` : "Routine, on its own"}</span>}
              {waiting && (
                <button
                  onClick={() => {
                    s.openHouse(null);
                    s.showOnBoard("approval");
                  }}
                  className="rounded-full bg-[var(--honey-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--honey-ink)]"
                >
                  Needs your okay
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
