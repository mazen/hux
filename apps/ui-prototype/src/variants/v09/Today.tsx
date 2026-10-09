// PROTOTYPE - concept 09 "Grove": the quiet "today" column beside the Conversation.
import { ArrowRight, Bell, BookMarked, CalendarDays, Car, CloudSun, Lightbulb, Plug, Repeat, ShieldCheck, Timer } from "lucide-react";
import { conversation, routines } from "../../fixtures";
import { ApprovalCard } from "./Conversation";
import { useGrove, thingState } from "./store";
import { Avatar, Eyebrow, Toggle } from "./ui";

const approvalCard = (() => {
  const c = conversation.find((m) => m.card?.type === "approval")?.card;
  return c && c.type === "approval" ? c : null;
})();

function Block({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <Eyebrow>{title}</Eyebrow>
        {action && (
          <button onClick={onAction} className="flex items-center gap-1 text-[13px] font-semibold text-(--moss-text) hover:underline">
            {action} <ArrowRight size={13} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export function TodayColumn() {
  const g = useGrove();
  const lights = g.things.filter((t) => t.switchable);
  const car = g.things.find((t) => t.kind === "car");
  const lottery = routines.find((r) => r.id === "j2")!;
  const fridge = g.memories.find((m) => m.id === "k4");

  const next = [
    { id: "j2", icon: Repeat, title: "Lottery check", when: "Today 22:00", who: undefined, off: !g.routineOn.j2 },
    { id: "r3", icon: Bell, title: "Mia's swimming bag", when: "Tomorrow 8:15", who: "sam" as const, off: !!g.remindersDone.r3 },
    { id: "c1", icon: CalendarDays, title: "Swimming lesson (Mia)", when: "Tomorrow 9:00", who: "mia" as const, off: false },
  ];

  return (
    <div className="space-y-7 px-5 pt-6 pb-8">
      <div className="px-1">
        <div className="g-display text-[30px] leading-tight font-bold">Friday, 9 October</div>
        <div className="mt-1 flex items-center gap-2 text-[15px] text-(--ink-2)">
          <CloudSun size={17} className="text-(--ochre)" /> 13°, partly cloudy · Berlin
        </div>
      </div>

      {approvalCard && (
        <Block title="Needs you">
          <ApprovalCard c={approvalCard} compact />
        </Block>
      )}

      {g.timerUntil && (
        <div className="g-rise flex items-center gap-3 rounded-[20px] bg-(--clay-soft) px-4 py-3 text-(--clay)">
          <Timer size={20} />
          <span className="flex-1 text-[15px] font-semibold">Frittata</span>
          <span className="g-display g-num text-[22px] font-bold">25:00</span>
        </div>
      )}

      <Block title="Next up" action="Plans" onAction={() => g.go("plans")}>
        <ul className="divide-y divide-(--line) rounded-[20px] border border-(--line) bg-(--raised)">
          {next.map((n) => (
            <li key={n.id}>
              <button onClick={() => g.go("plans", { kind: "plan", id: n.id })} className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-(--surface) ${n.off ? "opacity-50" : ""}`}>
                <n.icon size={17} className="shrink-0 text-(--ink-3)" />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[15px] font-semibold ${n.off ? "line-through" : ""}`}>{n.title}</span>
                  <span className="block text-[13px] text-(--ink-3)">
                    {n.when}
                    {g.expert && n.id === "j2" && ` · ${lottery.where}`}
                  </span>
                </span>
                {n.who && <Avatar id={n.who} size={22} />}
              </button>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="At home" action="Household" onAction={() => g.go("household")}>
        <ul className="space-y-1">
          {lights.slice(0, 4).map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-[16px] px-3 py-2 hover:bg-(--surface)">
              <span className={`grid size-8 place-items-center rounded-[10px] transition-colors ${t.on ? "bg-(--ochre-soft) text-(--ochre)" : "bg-(--sunk) text-(--ink-3)"}`}>
                {t.kind === "plug" ? <Plug size={16} /> : <Lightbulb size={16} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{t.name}</span>
                <span className="block text-[13px] text-(--ink-3)">{thingState(t)}</span>
              </span>
              <Toggle size="sm" on={t.on} onChange={() => g.toggleThing(t.id)} label={`${t.name} on or off`} />
            </li>
          ))}
          {car && (
            <li className="flex items-center gap-3 px-3 py-2">
              <span className="grid size-8 place-items-center rounded-[10px] bg-(--moss-soft) text-(--moss-text)"><Car size={16} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{car.name}</span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-(--sunk)">
                  <span className="block h-full w-[64%] rounded-full bg-(--moss)" />
                </span>
              </span>
              <span className="g-num text-[13px] text-(--ink-2)">64%</span>
            </li>
          )}
        </ul>
      </Block>

      {fridge && (
        <Block title="Remembered today" action="All" onAction={() => g.setSheet("memory")}>
          <button onClick={() => g.setSheet("memory")} className="flex w-full items-start gap-3 rounded-[20px] border border-dashed border-(--line-strong) px-4 py-3 text-left hover:bg-(--surface)">
            <BookMarked size={17} className="mt-0.5 shrink-0 text-(--moss)" />
            <span className="text-[15px] leading-snug">{fridge.text}</span>
          </button>
        </Block>
      )}
    </div>
  );
}

/** Phone: a slim, swipeable strip above the Conversation. */
export function TodayRibbon() {
  const g = useGrove();
  const on = g.things.filter((t) => t.switchable && t.on);
  const chip = "flex shrink-0 items-center gap-2 rounded-full border border-(--line) bg-(--raised) px-3.5 py-2 text-[14px] font-semibold shadow-sm";
  return (
    <div className="g-noscroll flex gap-2 overflow-x-auto px-4 pt-3 pb-1 lg:hidden">
      {g.approval === "pending" && (
        <button onClick={() => document.getElementById("v09-approval")?.scrollIntoView({ behavior: "smooth", block: "center" })} className={`${chip} border-(--ochre)/40 bg-(--ochre-soft) text-(--ink)`}>
          <ShieldCheck size={16} className="text-(--ochre)" /> Email to Todd needs your OK
        </button>
      )}
      <button onClick={() => g.go("plans", { kind: "plan", id: "r3" })} className={chip}>
        <Bell size={15} className="text-(--ink-3)" /> Swimming bag · 8:15
      </button>
      <button onClick={() => g.go("household")} className={chip}>
        <Lightbulb size={15} className={on.length ? "text-(--ochre)" : "text-(--ink-3)"} /> {on.length ? `${on.length} on at home` : "All off at home"}
      </button>
      <button onClick={() => g.setSheet("memory")} className={chip}>
        <BookMarked size={15} className="text-(--ink-3)" /> Remembered
      </button>
    </div>
  );
}
