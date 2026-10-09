// PROTOTYPE - concept 10 "Instrument": the central display with the conversation.
import { useEffect, useRef, type RefObject } from "react";
import { ArrowUp, Keyboard, Mic, Square } from "lucide-react";
import type { Message } from "../../fixtures";
import { ApprovalCard, EmailCard, RecipeCard, ShoppingCard, ThreadCard, WeatherCard } from "./cards";
import { deviceName, hhmm, hhmmss, member, msgMeta } from "./data";
import { Key, Label, Led, cx, useInstrument } from "./ui";

export type Msg = Message & { fresh?: boolean };

function ExpertPlate({ m }: { m: Msg }) {
  const meta = msgMeta[m.id];
  if (!meta) {
    return (
      <div className="mono mt-2 text-[10.5px] text-[var(--faint)]">
        {hhmmss(m.at)} · {deviceName(m.device)} · Chief · qwen3-32b-q4 · Home
      </div>
    );
  }
  if (m.from === "member") return null;
  return (
    <div className="fade well mt-2.5 grid max-w-[560px] grid-cols-2 gap-x-4 gap-y-1 rounded-lg px-3 py-2 sm:grid-cols-4">
      <Cell k="Helpers" v={meta.chain?.join(" → ")} />
      <Cell k="Model" v={meta.model} />
      <Cell k="Runs on" v={meta.runsOn} />
      <Cell k="Trust" v={meta.trust} />
      <Cell k="Answered" v={`${hhmmss(m.at)} · ${((meta.ms ?? 0) / 1000).toFixed(2)} s`} />
      <Cell k="Tokens" v={meta.tokens?.toLocaleString("en-GB")} />
      {meta.tools && <Cell k="Tools" v={meta.tools.join(", ")} wide />}
    </div>
  );
}

function Cell({ k, v, wide }: { k: string; v?: string; wide?: boolean }) {
  return (
    <div className={cx("min-w-0", wide && "col-span-2")}>
      <div className="lbl !text-[8.5px]">{k}</div>
      <div className="mono truncate text-[11px] text-[var(--ink-2)]" title={v}>{v ?? "—"}</div>
    </div>
  );
}

function MemberLine({ m }: { m: Msg }) {
  const { expert } = useInstrument();
  const meta = msgMeta[m.id];
  const who = member(m.member);
  return (
    <div className={cx("flex flex-col items-end", m.fresh && "rise")}>
      <div className="mb-1 flex items-center gap-2 text-[11px] text-[var(--muted)]">
        {expert ? (
          <span className="mono text-[10.5px] text-[var(--faint)]">
            {deviceName(m.device)} · {meta?.input ?? "Typed"}
            {meta?.voiceMatch ? ` · ${meta.voiceMatch}` : ""} · {hhmmss(m.at)}
          </span>
        ) : (
          <>
            <span>{who?.name}</span>
            <span className="mono">{hhmm(m.at)}</span>
          </>
        )}
      </div>
      <div className="max-w-[min(520px,88%)] rounded-[14px] rounded-tr-[4px] border hairline bg-[var(--raised)] px-3.5 py-2.5 text-[15px] leading-snug shadow-[0_1px_0_var(--line)]">
        {m.text}
      </div>
    </div>
  );
}

function AssistantLine({
  m,
  approved,
  onApprove,
  onTimer,
  ask,
}: {
  m: Msg;
  approved: boolean;
  onApprove: () => void;
  onTimer: () => void;
  ask: (t: string) => void;
}) {
  const { expert } = useInstrument();
  const c = m.card;
  return (
    <div className={cx("relative pl-5", m.fresh && "rise")}>
      <span className="absolute top-[9px] left-0 h-[2px] w-[10px] rounded bg-[var(--signal)]" aria-hidden />
      <div className="mb-1 flex items-center gap-2 text-[11px] text-[var(--muted)]">
        <span className="font-semibold text-[var(--ink-2)]">hux</span>
        {!expert && <span className="mono">{hhmm(m.at)}</span>}
      </div>
      <p className="max-w-[600px] text-[16px] leading-[1.5] tracking-[-0.005em]">{m.text}</p>
      {m.thread && <ThreadCard thread={m.thread} />}
      {c?.type === "recipe" && <RecipeCard card={c} onTimer={onTimer} />}
      {c?.type === "shoppingList" && <ShoppingCard card={c} />}
      {c?.type === "emailDraft" && <EmailCard card={c} />}
      {c?.type === "approval" && <ApprovalCard card={c} approved={approved} onApprove={onApprove} onChange={() => ask("For the email to Todd: ")} />}
      {c?.type === "weather" && <WeatherCard card={c} />}
      {expert && <ExpertPlate m={m} />}
    </div>
  );
}

export function Display({
  messages,
  thinking,
  approved,
  onApprove,
  onTimer,
  draft,
  setDraft,
  send,
  listening,
  heard,
  toggleListening,
  suggestions,
  inputRef,
}: {
  messages: Msg[];
  thinking: boolean;
  approved: boolean;
  onApprove: () => void;
  onTimer: () => void;
  draft: string;
  setDraft: (s: string) => void;
  send: (s: string) => void;
  listening: boolean;
  heard: string;
  toggleListening: () => void;
  suggestions: string[];
  inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const { expert, ask } = useInstrument();
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: messages.length > 12 ? "smooth" : "auto" });
  }, [messages.length, thinking]);

  return (
    <section aria-label="Conversation" className="screen flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b hairline px-4 py-2.5 sm:px-6">
        <Led state={listening ? "pulse" : "on"} />
        <Label className="!text-[var(--ink-2)]">Conversation</Label>
        <span className="flex-1" />
        {expert ? (
          <span className="mono hidden truncate text-[10.5px] text-[var(--faint)] sm:block">
            session 2026-10-09/alex · Chief · qwen3-32b-q4 · ctx 6.2k / 32k
          </span>
        ) : (
          <span className="text-[12px] text-[var(--muted)]">On Desk PC</span>
        )}
      </header>

      <div ref={scroller} className="scroll min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-[760px] flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="rule flex-1" />
            <span className="lbl">Friday 9 October</span>
            <div className="rule flex-1" />
          </div>
          {messages.map((m) =>
            m.from === "member" ? (
              <div key={m.id}>
                <MemberLine m={m} />
              </div>
            ) : (
              <AssistantLine key={m.id} m={m} approved={approved} onApprove={onApprove} onTimer={onTimer} ask={ask} />
            ),
          )}
          {thinking && (
            <div className="fade flex items-center gap-3 pl-5 text-[13px] text-[var(--muted)]">
              <span className="dots flex gap-1"><span /><span /><span /></span>
              {expert ? <span className="mono text-[11px]">Chief · qwen3-32b-q4 · thinking</span> : "Thinking"}
            </div>
          )}
        </div>
      </div>

      <div className="border-t hairline bg-[var(--panel)] px-3 pt-2.5 pb-3 sm:px-5">
        <div className="no-bar mx-auto flex max-w-[760px] gap-2 overflow-x-auto pb-2.5">
          {suggestions.map((s) => (
            <Key key={s} size="sm" className="shrink-0 !rounded-full !px-3 font-normal" onClick={() => send(s)}>
              {s}
            </Key>
          ))}
        </div>
        <form
          className="mx-auto flex max-w-[760px] items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <div className="well flex min-h-[52px] flex-1 items-center rounded-[14px] px-3.5">
            {listening ? (
              <div className="flex w-full items-center gap-3 py-2" aria-live="polite">
                <span className="meter flex h-5 items-center gap-[3px]"><span /><span /><span /><span /><span /></span>
                <span className="flex-1 text-[15px]">{heard || <span className="text-[var(--muted)]">Listening on Desk PC</span>}</span>
              </div>
            ) : (
              <>
                <Keyboard size={15} className="mr-2.5 shrink-0 text-[var(--faint)]" aria-hidden />
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(draft);
                    }
                  }}
                  placeholder="Ask hux anything"
                  aria-label="Message hux"
                  className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent py-3 text-[15px] leading-snug outline-none"
                />
              </>
            )}
          </div>
          {!listening && (
            <Key type="submit" tone="ink" size="lg" className="!h-[52px] !w-[52px] !rounded-[14px] !px-0" aria-label="Send" disabled={!draft.trim()}>
              <ArrowUp size={19} />
            </Key>
          )}
          <button
            type="button"
            onClick={toggleListening}
            aria-label={listening ? "Stop listening" : "Talk to hux"}
            aria-pressed={listening}
            className={cx(
              "key relative !h-[52px] !w-[52px] shrink-0 !rounded-full",
              listening && "key-signal",
            )}
          >
            {!listening && <span className="grille pointer-events-none absolute inset-[7px] rounded-full opacity-40" />}
            {listening ? <Square size={16} fill="currentColor" /> : <Mic size={20} className="relative" />}
          </button>
        </form>
        <div className="mx-auto mt-2 hidden max-w-[760px] justify-between text-[11px] text-[var(--faint)] sm:flex">
          <span>Enter to send · Shift+Enter for a new line</span>
          <span>Or say “hux” near any device</span>
        </div>
      </div>
    </section>
  );
}
