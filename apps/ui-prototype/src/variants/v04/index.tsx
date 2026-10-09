// PROTOTYPE concept 04: "Household board". A shared board for the home, with hux in a side panel.
import { useState } from "react";
import { BookOpen, CalendarDays, Ellipsis, House, Moon, StickyNote, Sun } from "lucide-react";
import "./styles.css";
import { Board } from "./board";
import { TalkPanel } from "./conversation";
import { Handbook } from "./handbook";
import { HouseDrawer } from "./house";
import { Plans } from "./plans";
import { HuxProvider, useHux, type View } from "./state";
import { Avatar, Logo, Switch, cx } from "./ui";

export const name = "Household board";

export default function Variant() {
  return (
    <HuxProvider>
      <Shell />
    </HuxProvider>
  );
}

const nav: { id: View; label: string; icon: typeof StickyNote }[] = [
  { id: "board", label: "Board", icon: StickyNote },
  { id: "plans", label: "Plans", icon: CalendarDays },
  { id: "handbook", label: "Handbook", icon: BookOpen },
];

function Shell() {
  const s = useHux();
  return (
    <div className={cx("v04 flex h-full flex-col overflow-hidden", s.dark && "dark")}>
      <Header />
      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">
        <main className="h-full min-h-0 min-w-0">
          {s.view === "board" && <Board />}
          {s.view === "plans" && <Plans />}
          {s.view === "handbook" && <Handbook />}
        </main>
        <TalkPanel />
      </div>
      <HouseDrawer />
    </div>
  );
}

function Header() {
  const s = useHux();
  const [menu, setMenu] = useState(false);
  const go = (v: View) => {
    s.setView(v);
    s.setSheetOpen(false);
  };
  return (
    <header className="relative z-[45] flex h-14 flex-none items-center gap-2 border-b border-[var(--line)] bg-[var(--panel)] px-3 sm:gap-4 sm:px-5 lg:h-16">
      <Logo />
      <nav className="ml-1 flex flex-1 items-center gap-0.5 sm:ml-4 sm:flex-none sm:gap-1">
        {nav.map((n) => {
          const active = s.view === n.id;
          const Icon = n.icon;
          return (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              aria-current={active ? "page" : undefined}
              className={cx(
                "relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-semibold transition sm:px-3.5 sm:py-2 sm:text-sm",
                active ? "bg-[var(--paper)] text-[var(--ink)] shadow-[var(--shadow)]" : "text-[var(--ink-2)] hover:text-[var(--ink)]",
              )}
            >
              <Icon size={16} className="hidden sm:block" />
              {n.label}
              {n.id === "board" && s.approval === "pending" && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--honey)]" title="Something is waiting for you" />}
            </button>
          );
        })}
      </nav>

      <div className="ml-auto hidden items-center gap-3 md:flex">
        <button
          onClick={() => s.openHouse("home")}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--ink-2)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
        >
          <House size={16} /> House
        </button>
        <ModeToggle />
        <button
          onClick={() => s.setDark(!s.dark)}
          aria-label={s.dark ? "Use light mode" : "Use dark mode"}
          className="grid h-9 w-9 place-items-center rounded-full text-[var(--ink-2)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
        >
          {s.dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Avatar id="alex" size={32} />
      </div>

      <div className="relative md:hidden">
        <button
          onClick={() => setMenu(!menu)}
          aria-label="More"
          aria-expanded={menu}
          className="grid h-9 w-9 place-items-center rounded-full text-[var(--ink-2)] hover:bg-[var(--paper-2)]"
        >
          <Ellipsis size={20} />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setMenu(false)} />
            <div className="v4-paper absolute right-0 top-11 z-[61] w-60 p-2">
              <button
                onClick={() => {
                  setMenu(false);
                  s.openHouse("home");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium hover:bg-[var(--paper-2)]"
              >
                <House size={17} /> House
              </button>
              <div className="flex items-center justify-between px-3 py-2.5 text-[15px] font-medium">
                Expert mode <Switch on={s.expert} onChange={() => s.setExpert(!s.expert)} label="Expert mode" />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 text-[15px] font-medium">
                Dark mode <Switch on={s.dark} onChange={() => s.setDark(!s.dark)} label="Dark mode" />
              </div>
              <div className="mt-1 flex items-center gap-2.5 border-t border-[var(--line)] px-3 pb-1 pt-3 text-sm text-[var(--ink-2)]">
                <Avatar id="alex" size={24} /> Alex · Owner
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function ModeToggle() {
  const s = useHux();
  return (
    <div className="flex rounded-full border border-[var(--line-strong)] bg-[var(--paper-2)] p-0.5 text-[13px] font-semibold" role="group" aria-label="Detail level">
      {(["Simple", "Expert"] as const).map((m) => {
        const on = (m === "Expert") === s.expert;
        return (
          <button
            key={m}
            onClick={() => s.setExpert(m === "Expert")}
            aria-pressed={on}
            className={cx("rounded-full px-3 py-1.5 transition", on ? "bg-[var(--paper)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-3)] hover:text-[var(--ink)]")}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}
