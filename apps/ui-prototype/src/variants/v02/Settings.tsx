// PROTOTYPE - concept 02 "Hearth": Settings sheet. Vast underneath, simple on top.
import { useState } from "react";
import {
  ArrowUp,
  BellRing,
  Blocks,
  ChevronDown,
  ChevronRight,
  Cpu,
  HardDrive,
  House,
  Link2,
  MessageCircle,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { settingsGroups } from "../../fixtures";
import { askExamples, settingValues, toggleSettings } from "./data";
import { Switch } from "./Sheet";

const icons: Record<string, React.ReactNode> = {
  people: <Users size={18} />,
  devices: <MonitorSmartphone size={18} />,
  home: <House size={18} />,
  ai: <Cpu size={18} />,
  helpers: <Sparkles size={18} />,
  privacy: <ShieldCheck size={18} />,
  connections: <Link2 size={18} />,
  addons: <Blocks size={18} />,
  notifications: <BellRing size={18} />,
  system: <HardDrive size={18} />,
};

/** Items that jump somewhere real instead of opening a sub-page. */
const jumps: Record<string, "memory" | "devices" | "helpers" | "activity" | "things"> = {
  "What hux remembers": "memory",
  "Activity history": "activity",
  "Rename or move a device": "devices",
  "Add a device": "devices",
  "What each helper does": "helpers",
  "Lights, plugs and the car": "things",
};

export function SettingsBody({
  expert,
  setExpert,
  onSay,
  onAsk,
  onJump,
  quietHours,
}: {
  expert: boolean;
  setExpert: (v: boolean) => void;
  onSay: (text: string) => void;
  onAsk: (prefill: string) => void;
  onJump: (to: "memory" | "devices" | "helpers" | "activity" | "things") => void;
  quietHours: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const [toggles, setToggles] = useState(toggleSettings);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (said.trim()) onSay(said.trim());
          setSaid("");
        }}
        className="rounded-[26px] bg-[color-mix(in_srgb,var(--ember)_10%,var(--surface-solid))] p-4 ring-1 ring-[color-mix(in_srgb,var(--ember)_25%,transparent)]"
      >
        <label htmlFor="v02-settings-ask" className="flex items-center gap-2 text-[15px] font-semibold">
          <MessageCircle size={16} className="text-[var(--accent-ink)]" />
          Tell hux what to change
        </label>
        <div className="mt-3 flex items-center gap-2 rounded-full bg-[var(--surface-solid)] py-1.5 pr-1.5 pl-4 ring-1 ring-[var(--line)]">
          <input
            id="v02-settings-ask"
            value={said}
            onChange={(e) => setSaid(e.target.value)}
            placeholder="Start quiet hours at 22:00"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[16px] outline-none placeholder:text-[var(--ink-3)]"
          />
          <button type="submit" aria-label="Ask hux" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--ember)] text-[var(--on-accent)] disabled:opacity-40" disabled={!said.trim()}>
            <ArrowUp size={18} />
          </button>
        </div>
      </form>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-[22px] bg-[var(--surface-sunk)] px-4 py-3">
        <div>
          <p className="text-[15px] font-semibold">Expert details</p>
        </div>
        <Switch on={expert} onChange={() => setExpert(!expert)} label="Expert details" />
      </div>

      <ul className="mt-5 space-y-2">
        {settingsGroups.map((g) => {
          const isOpen = open === g.id;
          const summary = g.id === "notifications" ? `Quiet ${quietHours}` : g.summary;
          return (
            <li key={g.id} className={`overflow-hidden rounded-[22px] transition-colors ${isOpen ? "bg-[var(--surface-sunk)]" : ""}`}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : g.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 rounded-[22px] px-3 py-3 text-left hover:bg-[var(--surface-sunk)]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--surface-sunk)] text-[var(--accent-ink)]">{icons[g.id]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-medium">{g.title}</span>
                  <span className="block truncate text-sm text-[var(--ink-2)]">{summary}</span>
                </span>
                <ChevronDown size={18} className={`shrink-0 text-[var(--ink-3)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="v02-rise-in px-3 pb-4">
                  <ul className="ml-[52px] divide-y divide-[var(--line)]">
                    {g.simple.map((item) => (
                      <SettingRow key={item} item={item} toggles={toggles} setToggles={setToggles} onJump={onJump} quietHours={quietHours} />
                    ))}
                    {expert &&
                      g.expert.map((item) => (
                        <SettingRow key={item} item={item} expertItem toggles={toggles} setToggles={setToggles} onJump={onJump} quietHours={quietHours} />
                      ))}
                  </ul>
                  {!expert && g.expert.length > 0 && (
                    <button type="button" onClick={() => setExpert(true)} className="mt-2 ml-[52px] text-sm text-[var(--ink-3)] underline-offset-4 hover:underline">
                      {g.expert.length} more in expert details
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onAsk(askExamples[g.id])}
                    className="mt-3 ml-[52px] flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-solid)] px-4 py-2 text-left text-sm font-semibold text-[var(--accent-ink)] hover:border-[var(--ember)]"
                  >
                    <MessageCircle size={15} className="shrink-0" />
                    <span>
                      Ask hux to change this <span className="font-normal text-[var(--ink-2)]">· "{askExamples[g.id]}"</span>
                    </span>
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-center text-sm text-[var(--ink-3)]">hux 1.4 · up to date</p>
    </div>
  );
}

function SettingRow({
  item,
  expertItem,
  toggles,
  setToggles,
  onJump,
  quietHours,
}: {
  item: string;
  expertItem?: boolean;
  toggles: Record<string, boolean>;
  setToggles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onJump: (to: "memory" | "devices" | "helpers" | "activity" | "things") => void;
  quietHours: string;
}) {
  const value = item === "Quiet hours" ? quietHours : settingValues[item];
  if (item in toggles) {
    return (
      <li className="flex items-center gap-3 py-3">
        <span className="flex-1 text-[15px]">{item}</span>
        <Switch on={toggles[item]} onChange={() => setToggles((t) => ({ ...t, [item]: !t[item] }))} label={item} />
      </li>
    );
  }
  const jump = jumps[item];
  return (
    <li>
      <button type="button" onClick={() => jump && onJump(jump)} className="flex w-full items-center gap-3 py-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-[15px]">
            {item}
            {expertItem && <span className="ml-2 rounded-full bg-[var(--line)] px-2 py-0.5 align-middle text-[11px] font-semibold tracking-wide text-[var(--ink-2)] uppercase">Expert</span>}
          </span>
          {value && <span className="block text-sm text-[var(--ink-2)]">{value}</span>}
        </span>
        <ChevronRight size={16} className="shrink-0 text-[var(--ink-3)]" />
      </button>
    </li>
  );
}
