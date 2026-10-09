// PROTOTYPE - concept 02 "Hearth": hux's presence and identity mark.
import type { HearthState } from "./data";

const stateLabel: Record<HearthState, string> = {
  idle: "Tap to talk",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

export function Hearth({ state, onClick, small }: { state: HearthState; onClick: () => void; small?: boolean }) {
  const aria =
    state === "idle" ? "Talk to hux" : state === "listening" ? "hux is listening. Tap when you're done." : state === "thinking" ? "hux is thinking" : "hux is speaking. Tap to stop.";
  return (
    <button type="button" className={`hearth ${small ? "is-small" : ""}`} data-state={state} onClick={onClick} aria-label={aria}>
      <span className="h-halo" />
      <span className="h-ring" />
      <span className="h-ring" />
      <span className="h-ring" />
      <span className="h-body" />
      <span className="h-swirl" />
      <span className="h-core" />
      <span className="h-spark" />
      <span className="h-spark" />
      <span className="h-spark" />
      <span className="h-spark" />
      <span className="h-spark" />
    </button>
  );
}

export function HearthLabel({ state, caption }: { state: HearthState; caption?: string }) {
  return (
    <div className="flex min-h-[2.75rem] flex-col items-center justify-start gap-1 text-center" aria-live="polite">
      <span className="text-[13px] font-medium tracking-[0.08em] text-[var(--ink-3)] uppercase">{stateLabel[state]}</span>
      {state === "listening" && (
        <span className="font-display v02-caret text-lg text-[var(--ink-2)] italic">{caption || " "}</span>
      )}
    </div>
  );
}

/** The hux mark: an ember sitting in a soft rounded hearth. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <radialGradient id="v02-mark-glow" cx="50%" cy="62%" r="55%">
          <stop offset="0%" stopColor="#FFF1D6" />
          <stop offset="45%" stopColor="#F6A55C" />
          <stop offset="100%" stopColor="#D0582B" />
        </radialGradient>
      </defs>
      <path d="M4 18c0-7 5.4-13 12-13s12 6 12 13c0 5.2-3.6 9-12 9S4 23.2 4 18Z" fill="url(#v02-mark-glow)" />
      <path d="M16 11c2.6 2.6 4 4.8 4 7.2A4 4 0 0 1 16 22a4 4 0 0 1-4-3.8c0-2.4 1.4-4.6 4-7.2Z" fill="#FFF8EA" opacity=".9" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <Mark />
      <span className="font-display text-[26px] leading-none font-medium tracking-tight text-[var(--ink)]">hux</span>
    </span>
  );
}
