// PROTOTYPE concept 03 "Raster": International Typographic Style. Navigation | conversation as text | stage.
import "./styles.css";
import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { household } from "../../fixtures";
import { HuxProvider, useHux, type View } from "./store";
import { Composer, Conversation, MobileDeck, NeedsYou, Stage } from "./assistant";
import { Plans } from "./plans";
import { Settings } from "./settings";
import { ActivityPage, HomePage, MemoryPage } from "./pages";
import { Label, Wordmark } from "./ui";

export const name = "Raster";

const nav: { id: View; label: string }[] = [
  { id: "assistant", label: "Assistant" },
  { id: "plans", label: "Plans" },
  { id: "home", label: "Home" },
  { id: "memory", label: "Memory" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" },
];

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: React.ReactNode; aria?: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid border b-ink" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          aria-label={o.aria}
          onClick={() => onChange(o.v)}
          className={`flex h-8 items-center justify-center gap-1.5 px-2 text-[12px] font-semibold transition-colors ${value === o.v ? "bg-ink" : "hover:bg-[var(--paper-2)]"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ModeToggles({ compact }: { compact?: boolean }) {
  const { expert, setExpert, dark, setDark } = useHux();
  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-2"}>
      <Segmented
        label="Detail"
        value={expert ? "e" : "s"}
        onChange={(v) => setExpert(v === "e")}
        options={[{ v: "s", label: "Simple" }, { v: "e", label: "Expert" }]}
      />
      <Segmented
        label="Appearance"
        value={dark ? "d" : "l"}
        onChange={(v) => setDark(v === "d")}
        options={[
          { v: "l", label: compact ? <Sun size={14} /> : <><Sun size={13} /> Light</>, aria: "Light" },
          { v: "d", label: compact ? <Moon size={14} /> : <><Moon size={13} /> Dark</>, aria: "Dark" },
        ]}
      />
    </div>
  );
}

function SideNav() {
  const { view, setView, approval, expert, show } = useHux();
  const pending = approval === "pending";
  const me = household.members.find((m) => m.id === household.currentMember)!;
  return (
    <aside className="flex h-full min-h-0 flex-col justify-between px-6 pb-6 pt-9">
      <div>
        <Wordmark alert={pending} size={34} />
        <div className="t-meta mt-2">{household.name} · {me.name}</div>

        <nav className="mt-14" aria-label="Main">
          <ol className="border-t b-ink">
            {nav.map((n, i) => {
              const active = view === n.id;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => setView(n.id)}
                    aria-current={active ? "page" : undefined}
                    className="grid w-full grid-cols-[1.75rem_1fr_auto] items-baseline border-b py-2.5 text-left hover:bg-[var(--paper-2)]"
                  >
                    <span className={`text-[11px] font-semibold tabular-nums ${active ? "" : "c-mute"}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={`text-[16px] ${active ? "font-bold" : "font-medium c-ink2"}`}>{n.label}</span>
                    {n.id === "activity" && pending && <span className="h-2 w-2 self-center" style={{ background: "var(--signal)" }} aria-label="1 needs you" />}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {pending && (
          <button onClick={() => show("m10")} className="m-in mt-8 block w-full text-left">
            <Label className="c-sig">Needs your OK</Label>
            <div className="t-num mt-2 text-[56px] c-sig">1</div>
            <div className="mt-2 text-[14px] leading-snug">Email to Todd, Monday 7:30</div>
          </button>
        )}
      </div>

      <div>
        <ModeToggles />
        {expert && <div className="t-meta mt-3">Desk PC · gateway hux.local · build 0.9.3</div>}
      </div>
    </aside>
  );
}

function PageScroll({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <div key={id} className="scroll h-full overflow-y-auto">
      <div className="m-in mx-auto max-w-[1180px] px-4 pb-24 pt-6 sm:px-8 lg:px-12 lg:pt-12">{children}</div>
    </div>
  );
}

function Page() {
  const { view } = useHux();
  switch (view) {
    case "plans": return <Plans />;
    case "home": return <HomePage />;
    case "memory": return <MemoryPage />;
    case "activity": return <ActivityPage />;
    case "settings": return <Settings />;
    default: return null;
  }
}

function MobileTop() {
  const { view, setView, approval } = useHux();
  const pending = approval === "pending";
  return (
    <header className="shrink-0 border-b b-ink bg-paper lg:hidden">
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <Wordmark alert={pending} size={26} />
        <ModeToggles compact />
      </div>
      <nav className="noscroll flex gap-4 overflow-x-auto px-4" aria-label="Main">
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`relative shrink-0 pb-2 pt-1 text-[14px] ${view === n.id ? "font-bold" : "font-medium c-mute"}`}
          >
            {n.label}
            {n.id === "activity" && pending && <span className="absolute -right-2 top-1.5 h-1.5 w-1.5" style={{ background: "var(--signal)" }} />}
            {view === n.id && <span className="m-wipe absolute inset-x-0 bottom-0 h-[3px]" style={{ background: "var(--ink)" }} />}
          </button>
        ))}
      </nav>
    </header>
  );
}

function Shell() {
  const { dark, view, setDark } = useHux();

  // Follow the system until the person picks.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [setDark]);

  const isAssistant = view === "assistant";

  return (
    <div className={`v03 ${dark ? "dark" : ""} h-full overflow-hidden`}>
      <div className="flex h-full flex-col lg:grid lg:grid-cols-[232px_minmax(380px,1fr)_minmax(0,1.15fr)]">
        {/* Desktop navigation */}
        <div className="hidden min-h-0 border-r b-ink lg:block">
          <SideNav />
        </div>

        <MobileTop />

        {isAssistant ? (
          <>
            <main className="flex min-h-0 flex-1 flex-col lg:col-span-1">
              <div className="min-h-0 flex-1"><Conversation /></div>
              <div className="lg:hidden">
                <NeedsYou compact className="px-4 pt-2" />
                <MobileDeck />
              </div>
              <Composer />
            </main>
            <div className="hidden min-h-0 lg:block">
              <Stage />
            </div>
          </>
        ) : (
          <main className="min-h-0 flex-1 lg:col-span-2">
            <PageScroll id={view}><Page /></PageScroll>
          </main>
        )}
      </div>
    </div>
  );
}

export default function Variant() {
  return (
    <HuxProvider>
      <Shell />
    </HuxProvider>
  );
}
