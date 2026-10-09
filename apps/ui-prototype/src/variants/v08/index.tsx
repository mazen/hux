// PROTOTYPE - concept 08 "Bold & friendly": chunky outlines, flat colour blocks, the input as hero.
import { useEffect, useRef } from "react";
import { CalendarCheck, House, MessageCircle, Moon, SlidersHorizontal, Sun } from "lucide-react";
import "./styles.css";
import { StoreProvider, useStore, type View } from "./store";
import { AssistantView } from "./assistant";
import { PlansView } from "./plans";
import { HouseView } from "./house";
import { SettingsView } from "./settings";
import { Avatar, cx } from "./ui";

export const name = "Bold & friendly";

const nav: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "talk", label: "Talk", icon: <MessageCircle size={24} strokeWidth={2.75} /> },
  { id: "plans", label: "Plans", icon: <CalendarCheck size={24} strokeWidth={2.75} /> },
  { id: "house", label: "House", icon: <House size={24} strokeWidth={2.75} /> },
  { id: "settings", label: "Settings", icon: <SlidersHorizontal size={24} strokeWidth={2.75} /> },
];

function Wordmark({ onRail }: { onRail?: boolean }) {
  return (
    <span
      className={cx(
        "logo-tilt inline-flex items-baseline rounded-xl border-[3px] px-3 pb-1.5 font-display text-[34px] font-extrabold leading-none",
        onRail ? "border-[#161310] bg-[#fffbf4] text-[#161310] shadow-[4px_4px_0_0_#161310]" : "bx sh-sm bg-sun",
      )}
      aria-label="hux"
    >
      hux
      <span className="ml-0.5 inline-block size-[0.22em] rounded-[2px] bg-coral" aria-hidden />
    </span>
  );
}

function ModeSwitch({ compact }: { compact?: boolean }) {
  const { expert, setExpert } = useStore();
  return (
    <div role="radiogroup" aria-label="Detail level" className={cx("flex rounded-xl border-[3px] border-[#161310] bg-[#fffbf4] p-1 text-[#161310]", compact && "sh-sm border-line p-0.5")}>
      {[
        { v: false, l: "Simple" },
        { v: true, l: "Expert" },
      ].map((o) => (
        <button
          key={o.l}
          type="button"
          role="radio"
          aria-checked={expert === o.v}
          onClick={() => setExpert(o.v)}
          className={cx(
            "flex-1 rounded-lg font-bold transition-colors",
            compact ? "min-h-9 px-2.5 text-sm" : "min-h-10 px-3 text-[15px]",
            expert === o.v ? "bg-[#161310] text-[#fff4e2]" : "hover:bg-black/5",
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function ThemeButton({ onRail }: { onRail?: boolean }) {
  const { dark, setDark } = useStore();
  return (
    <button
      type="button"
      onClick={() => setDark(!dark)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cx(
        "press grid size-11 shrink-0 place-items-center rounded-xl",
        onRail ? "border-[3px] border-[#161310] bg-[#fffbf4] text-[#161310]" : "bx sh-sm bg-surface",
      )}
    >
      {dark ? <Sun size={22} strokeWidth={2.75} /> : <Moon size={22} strokeWidth={2.75} />}
    </button>
  );
}

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="grid size-6 place-items-center rounded-full border-[2.5px] border-[#161310] bg-coral text-xs font-extrabold text-[#161310]" aria-label={`${n} needs you`}>
      {n}
    </span>
  );
}

function Rail() {
  const { view, go, approval } = useStore();
  return (
    <nav aria-label="Main" className="hidden w-[232px] shrink-0 flex-col border-r-[3px] border-line bg-sun px-5 pb-6 pt-7 text-[#161310] md:flex">
      <div className="px-1">
        <Wordmark onRail />
      </div>
      <ul className="mt-10 space-y-3">
        {nav.map((n) => {
          const active = view === n.id;
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => go(n.id)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-16 w-full items-center gap-3 rounded-2xl border-[3px] px-4 text-left font-display text-xl font-extrabold transition-[transform,box-shadow,background-color] duration-150",
                  active
                    ? "border-[#161310] bg-[#161310] text-[#ffc83d] shadow-[4px_4px_0_0_#fffbf4]"
                    : "border-transparent hover:-translate-y-px hover:border-[#161310] hover:bg-[#fffbf4] hover:shadow-[4px_4px_0_0_#161310]",
                )}
              >
                {n.icon}
                <span className="flex-1">{n.label}</span>
                {n.id === "house" && <Badge n={approval === "pending" ? 1 : 0} />}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto space-y-4">
        <ModeSwitch />
        <div className="flex items-center gap-3">
          <Avatar id="alex" size={44} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="font-bold">Alex</div>
            <div className="text-sm opacity-70">Desk PC</div>
          </div>
          <ThemeButton onRail />
        </div>
      </div>
    </nav>
  );
}

function MobileTop() {
  const { view, go, approval } = useStore();
  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 md:hidden">
        <Wordmark />
        <div className="flex items-center gap-2">
          <ModeSwitch compact />
          <ThemeButton />
        </div>
      </div>
      <nav aria-label="Main" className="sticky top-0 z-20 border-b-[3px] border-line bg-paper px-3 py-3 md:hidden">
        <ul className="grid grid-cols-4 gap-2">
          {nav.map((n, i) => {
            const active = view === n.id;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => go(n.id)}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "press bx relative flex min-h-[68px] w-full flex-col items-center justify-center gap-1 rounded-2xl text-[13px] font-extrabold",
                    active ? cx("sh-sm", ["bg-sun", "bg-mint", "bg-sky", "bg-lilac"][i]) : "bg-surface",
                  )}
                >
                  {n.icon}
                  {n.label}
                  {n.id === "house" && approval === "pending" && (
                    <span className="absolute -right-1.5 -top-1.5">
                      <Badge n={1} />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function Shell() {
  const { dark, view } = useStore();
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [view]);

  return (
    <div className={cx("v08 flex h-full overflow-hidden", dark && "dark")} style={{ colorScheme: dark ? "dark" : "light" }}>
      <Rail />
      <div ref={scroller} className="scroll-thin min-w-0 flex-1 overflow-y-auto">
        <MobileTop />
        <main>
          {view === "talk" && <AssistantView />}
          {view === "plans" && <PlansView />}
          {view === "house" && <HouseView />}
          {view === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

export default function Variant() {
  const initialDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return (
    <StoreProvider initialDark={!!initialDark}>
      <Shell />
    </StoreProvider>
  );
}
