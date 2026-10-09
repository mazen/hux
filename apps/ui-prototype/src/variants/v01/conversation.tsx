// PROTOTYPE - the Conversation as a typeset journal, concept 01 "Paper".
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, Mic } from "lucide-react";
import { suggestions } from "../../fixtures";
import { CardView, ThreadNote } from "./cards";
import { deviceName, fmtTime, memberById, useStore, type Entry } from "./store";

const GAP_MINUTES = 12;

export function Conversation() {
  const { messages, writing, expert, send } = useStore();
  const scroller = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: first.current ? "auto" : "smooth" });
    first.current = false;
  }, [messages.length, writing]);

  return (
    <div className="flex h-full flex-col">
      <div ref={scroller} className="thin-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[40rem] px-5 pb-10 pt-10 sm:px-8 sm:pt-16">
          <header className="fade-slow mb-12 text-center">
            <div className="caps text-(--faint)">Friday, 9 October 2026</div>
            <h1 className="display mt-3 text-[2.3rem] italic leading-none sm:text-[2.8rem]">This evening</h1>
            <div className="mx-auto mt-5 h-px w-12 bg-(--rule-strong)" />
          </header>

          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const gap = prev ? (new Date(m.at).getTime() - new Date(prev.at).getTime()) / 60000 : 0;
            return (
              <div key={m.id}>
                {gap >= GAP_MINUTES && <Ornament label={expert ? fmtTime(m.at) : undefined} />}
                <EntryView m={m} />
              </div>
            );
          })}

          {writing && (
            <div className="fade-in mt-8 flex items-center gap-2 italic text-(--faint)">
              hux is writing
              <span className="dots inline-flex gap-0.5 not-italic">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </div>
          )}

          {!writing && (
            <nav className="fade-slow mt-14 border-t border-(--rule) pt-5" aria-label="Suggestions">
              <div className="caps text-(--faint)">Perhaps next</div>
              <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-2 text-[1.05rem] italic">
                {suggestions.map((s, i) => (
                  <li key={s} className="flex items-baseline gap-2">
                    <button onClick={() => send(s)} className="link text-left">
                      {s}
                    </button>
                    {i < suggestions.length - 1 && <span className="not-italic text-(--rule-strong)">&middot;</span>}
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
      <Composer />
    </div>
  );
}

function Ornament({ label }: { label?: string }) {
  return (
    <div className="my-12 flex items-center justify-center gap-4 text-(--rule-strong)" aria-hidden>
      <span className="h-px w-10 bg-(--rule)" />
      <span className="text-[1.1rem] tracking-[0.5em]">&#8258;</span>
      {label && <span className="sans lining text-[11px] text-(--faint)">{label}</span>}
      <span className="h-px w-10 bg-(--rule)" />
    </div>
  );
}

function MarginNote({ m }: { m: Entry }) {
  const { expert } = useStore();
  if (!expert) return null;
  const lines = [fmtTime(m.at), deviceName(m.device)];
  if (m.from === "assistant") lines.push(m.helper ?? "Chief", m.helper?.includes("Researcher") ? "Cloud for search, home for writing" : "Model at home · trusted");
  return (
    <>
      <div className="sans lining mb-2 text-[11.5px] text-(--faint) lg:hidden">{lines.join(" · ")}</div>
      <div className="sans lining absolute right-full top-1 mr-10 hidden w-44 text-right text-[11.5px] leading-[1.55] text-(--faint) lg:block">
        {lines.map((l, i) => (
          <div key={i} className={i === 0 ? "text-(--ink-soft)" : ""}>
            {l}
          </div>
        ))}
      </div>
    </>
  );
}

function EntryView({ m }: { m: Entry }) {
  const fade = m.fresh ? "fade-in" : "";
  if (m.from === "member") {
    const who = memberById(m.member);
    return (
      <div className={`relative my-9 ${fade}`}>
        <MarginNote m={m} />
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full" style={{ background: who?.color }} />
          <span className="caps text-(--ink-soft)">{who?.name}</span>
        </div>
        <p className="mt-2 border-l border-(--rule-strong) pl-5 text-[1.18rem] italic leading-[1.55] text-(--ink-soft) sm:ml-1">
          {m.text}
        </p>
      </div>
    );
  }
  return (
    <div className={`relative my-9 ${fade}`}>
      <MarginNote m={m} />
      <p className={"text-[1.2rem] leading-[1.65] sm:text-[1.26rem]" + (m.id === "m2" ? " dropcap" : "")}>{m.text}</p>
      {m.thread && (
        <div className="mt-6">
          <ThreadNote thread={m.thread} />
        </div>
      )}
      {m.card && (
        <div className="mt-7 sm:-mx-6">
          <CardView card={m.card} />
        </div>
      )}
    </div>
  );
}

function Composer() {
  const { draft, setDraft, draftNonce, send, expert } = useStore();
  const [listening, setListening] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (draftNonce > 0) {
      const el = field.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }
  }, [draftNonce]);

  useEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [draft]);

  useEffect(() => {
    if (!listening) return;
    const words = "What's on tomorrow?".split(" ");
    let i = 0;
    setDraft("");
    const t = window.setInterval(() => {
      i += 1;
      setDraft(words.slice(0, i).join(" "));
      if (i >= words.length) {
        window.clearInterval(t);
        window.setTimeout(() => setListening(false), 500);
      }
    }, 420);
    return () => window.clearInterval(t);
  }, [listening, setDraft]);

  const submit = () => {
    send(draft);
    setListening(false);
  };

  return (
    <div className="relative shrink-0 bg-(--paper) pb-16">
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-linear-to-t from-(--paper) to-transparent" />
      <div className="mx-auto w-full max-w-[40rem] px-5 sm:px-8">
        <div
          className={
            "flex items-end gap-3 border-b pb-2 pt-3 transition-colors " +
            (listening ? "border-(--accent)" : "border-(--rule-strong) focus-within:border-(--ink)")
          }
        >
          <textarea
            ref={field}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={listening ? "Listening" : "Write or speak to hux"}
            aria-label="Message to hux"
            className="min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[1.15rem] leading-snug outline-none placeholder:italic placeholder:text-(--faint)"
          />
          <button
            onClick={() => setListening((l) => !l)}
            aria-label={listening ? "Stop listening" : "Speak to hux"}
            aria-pressed={listening}
            className={
              "relative grid size-10 shrink-0 place-items-center rounded-full border transition-colors " +
              (listening ? "border-(--accent) bg-(--accent) text-(--accent-ink)" : "border-(--rule-strong) text-(--ink-soft) hover:border-(--ink) hover:text-(--ink)")
            }
          >
            {listening && <span className="breathe absolute -inset-1.5 rounded-full border border-(--accent)" />}
            <Mic size={17} strokeWidth={1.6} />
          </button>
          {draft.trim() && (
            <button
              onClick={submit}
              aria-label="Send"
              className="fade-in grid size-10 shrink-0 place-items-center rounded-full bg-(--ink) text-(--paper) transition-colors hover:bg-(--accent) hover:text-(--accent-ink)"
            >
              <ArrowUp size={17} strokeWidth={1.8} />
            </button>
          )}
        </div>
        <div className="sans mt-2 flex justify-between text-[11.5px] text-(--faint)">
          <span>{listening ? "Listening on the Desk PC. Tap again to stop." : <span className="hidden sm:inline">Enter to send, Shift and Enter for a new line</span>}</span>
          {expert && <span className="lining">Desk PC &middot; Chief &middot; model at home</span>}
        </div>
      </div>
    </div>
  );
}
