// PROTOTYPE - concept 01 "Paper": hux as a typeset journal.
import { Moon, Sun } from "lucide-react";
import "./styles.css";
import { Conversation } from "./conversation";
import { Household } from "./household";
import { Plans } from "./plans";
import { Settings } from "./settings";
import { StoreProvider, useStore, type Page } from "./store";

export const name = "Paper";

export default function Variant() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

const pages: { id: Page; label: string }[] = [
  { id: "conversation", label: "Conversation" },
  { id: "plans", label: "Plans" },
  { id: "household", label: "Household" },
  { id: "settings", label: "Settings" },
];

function Wordmark() {
  return (
    <span className="display select-none text-[1.75rem] font-medium italic leading-none tracking-[-0.03em]" aria-label="hux">
      hux<span className="not-italic text-(--accent)">.</span>
    </span>
  );
}

function Shell() {
  const { page, go, dark, toggleDark, expert, setExpert, approval } = useStore();

  const modeToggle = (
    <button
      onClick={() => setExpert(!expert)}
      className="sans text-[12.5px] text-(--ink-soft) hover:text-(--ink)"
      aria-pressed={expert}
      title="Expert shows which device, which helper, and other detail"
    >
      <span className={expert ? "text-(--faint)" : "text-(--ink) underline decoration-(--accent) underline-offset-4"}>Simple</span>
      <span className="mx-1.5 text-(--rule-strong)">/</span>
      <span className={expert ? "text-(--ink) underline decoration-(--accent) underline-offset-4" : "text-(--faint)"}>Expert</span>
    </button>
  );

  const themeToggle = (
    <button
      onClick={toggleDark}
      aria-label={dark ? "Switch to light pages" : "Switch to dark pages"}
      className="grid size-8 place-items-center rounded-full text-(--ink-soft) transition-colors hover:bg-(--paper-edge) hover:text-(--ink)"
    >
      {dark ? <Sun size={16} strokeWidth={1.6} /> : <Moon size={16} strokeWidth={1.6} />}
    </button>
  );

  const waiting = approval === "pending" && (
    <button
      onClick={() => {
        go("conversation");
        window.setTimeout(() => document.getElementById("v01-approval")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
      }}
      className="sans flex items-center gap-1.5 text-[12.5px] text-(--accent)"
    >
      <span className="size-1.5 rounded-full bg-(--accent)" />1 awaits you
    </button>
  );

  return (
    <div className={"v01 h-full" + (dark ? " dark" : "")}>
      <div className="grain flex h-full flex-col bg-(--paper) text-(--ink)">
        <header className="shrink-0 border-b border-(--rule)">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 pb-0 pt-4 sm:px-8 md:py-4">
            <button onClick={() => go("conversation")} aria-label="hux, back to the conversation">
              <Wordmark />
            </button>
            <nav className="mx-auto hidden md:block" aria-label="Main">
              <ul className="flex gap-8">
                {pages.map((p) => (
                  <li key={p.id}>
                    <NavLink active={page === p.id} onClick={() => go(p.id)}>
                      {p.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="ml-auto flex items-center gap-4 md:ml-0">
              <span className="hidden sm:block">{waiting}</span>
              {modeToggle}
              {themeToggle}
            </div>
          </div>
          {/* Phone navigation */}
          <nav className="no-scrollbar mx-auto flex max-w-6xl items-center justify-between gap-4 overflow-x-auto px-5 pt-3 md:hidden" aria-label="Main">
            {pages.map((p) => (
              <NavLink key={p.id} active={page === p.id} onClick={() => go(p.id)}>
                {p.label}
                {p.id === "household" && approval === "pending" && <span className="ml-1 inline-block size-1.5 -translate-y-2 rounded-full bg-(--accent)" />}
              </NavLink>
            ))}
          </nav>
        </header>

        <main key={page} className="fade-in min-h-0 flex-1">
          {page === "conversation" && <Conversation />}
          {page === "plans" && <Plans />}
          {page === "household" && <Household />}
          {page === "settings" && <Settings />}
        </main>
      </div>
    </div>
  );
}

function NavLink({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        "relative shrink-0 whitespace-nowrap pb-3 text-[1.02rem] transition-colors md:pb-0 " +
        (active ? "italic text-(--ink)" : "text-(--ink-soft) hover:text-(--ink)")
      }
    >
      {children}
      {active && <span className="absolute inset-x-0 -bottom-px h-px bg-(--ink) md:-bottom-[17px]" />}
    </button>
  );
}
