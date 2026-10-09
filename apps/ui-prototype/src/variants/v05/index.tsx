// PROTOTYPE concept 05 "River": one timeline. The past flows into Now; the future continues below it.
import "./styles.css";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ListFilter, Moon, SlidersHorizontal, Sun } from "lucide-react";
import { conversation, home, memories as memoryFixtures, routines, type Message } from "../../fixtures";
import type { ApprovalState } from "./cards";
import { buildEntries, dayKey, DAYS, KINDS, replyFor, t, time, TODAY_KEY, type Entry, type Kind } from "./data";
import { Overlay, type HomeThing, type Memory, type Tab } from "./overlay";
import { Composer, DayHeader, EntryView, NowBlock, Row, type Ctx } from "./river";
import { RailScrubber, StripScrubber } from "./scrubber";
import { Avatar, Wordmark } from "./ui";

export const name = "River";

const NOW = t(9, "18:40");
const NOW_ISO = "2026-10-09T18:40:00+02:00";
const emailCard = conversation.find((m) => m.card?.type === "emailDraft")!.card as { body: string };

export default function Variant() {
  const [dark, setDark] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [expert, setExpert] = useState(false);
  const [filter, setFilter] = useState<Kind | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [overlay, setOverlay] = useState<Tab | null>(null);

  const [messages, setMessages] = useState<Message[]>(conversation);
  const [typing, setTyping] = useState(false);
  const [extra, setExtra] = useState<Entry[]>([]);
  const [quietStart, setQuietStart] = useState("22:30");
  const [enabled, setEnabledState] = useState<Record<string, boolean>>(() => Object.fromEntries(routines.map((r) => [r.id, r.enabled])));
  const [approval, setApproval] = useState<ApprovalState>("pending");
  const [memories, setMemories] = useState<Memory[]>(memoryFixtures);
  const [homeThings, setHomeThings] = useState<HomeThing[]>(home);

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const listenTimer = useRef<number | undefined>(undefined);

  const scrollRef = useRef<HTMLDivElement>(null);
  const nowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchors = useRef<Record<string, HTMLDivElement | null>>({});
  const [active, setActive] = useState(TODAY_KEY);
  const [nowDir, setNowDir] = useState<"visible" | "up" | "down">("visible");
  const followNow = useRef(false);

  // ---- scrolling through time ----
  const offsetIn = (el: HTMLElement) => {
    const c = scrollRef.current!;
    return el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop;
  };
  const scrollToNow = useCallback((behavior: ScrollBehavior = "smooth") => {
    const c = scrollRef.current, n = nowRef.current;
    if (!c || !n) return;
    c.scrollTo({ top: offsetIn(n) - Math.max(90, c.clientHeight * 0.36), behavior });
  }, []);
  const jumpDay = (key: string) => {
    const a = anchors.current[key];
    if (a) scrollRef.current?.scrollTo({ top: offsetIn(a), behavior: "smooth" });
  };
  const onScroll = () => {
    const c = scrollRef.current, n = nowRef.current;
    if (!c) return;
    let cur = DAYS[0].key;
    for (const d of DAYS) {
      const a = anchors.current[d.key];
      if (a && offsetIn(a) <= c.scrollTop + 64) cur = d.key;
    }
    setActive(cur);
    if (n) {
      const r = n.getBoundingClientRect(), cr = c.getBoundingClientRect();
      setNowDir(r.top + 150 < cr.top ? "up" : r.top > cr.bottom - 60 ? "down" : "visible");
    }
  };

  useLayoutEffect(() => { scrollToNow("auto"); onScroll(); }, [scrollToNow]);
  useEffect(() => {
    if (followNow.current) scrollToNow("smooth");
  }, [messages, typing, scrollToNow]);

  // ---- talking ----
  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    followNow.current = true;
    setInput("");
    setMessages((m) => [...m, { id: `u${m.length}-${Date.now()}`, from: "member", member: "alex", at: NOW_ISO, device: "desk", text }]);
    setTyping(true);
    window.setTimeout(() => {
      const r = replyFor(text);
      setTyping(false);
      setMessages((m) => [...m, { id: `a${m.length}-${Date.now()}`, from: "assistant", at: NOW_ISO, device: "desk", text: r.text }]);
      if (r.effect === "timer") setExtra((x) => x.some((e) => e.id === "timer") ? x : [...x, { id: "timer", at: t(9, "19:05"), kind: "reminder", type: "reminder", title: "The frittata is ready", for: "alex", source: "Timer on the kitchen tablet" }]);
      if (r.effect === "officeLightsOff") setHomeThings((h) => h.map((x) => (x.id === "h1" ? { ...x, state: "Off" } : x)));
      if (r.effect === "quiet22") setQuietStart("22:00");
      window.setTimeout(() => { followNow.current = false; }, 600);
    }, 950);
  };

  const onMic = () => {
    if (listening) {
      window.clearTimeout(listenTimer.current);
      setListening(false);
      return;
    }
    scrollToNow();
    setListening(true);
    listenTimer.current = window.setTimeout(() => {
      setListening(false);
      send("Turn off the office lights");
    }, 2600);
  };
  useEffect(() => () => window.clearTimeout(listenTimer.current), []);

  const prefill = (text: string) => {
    setInput(text);
    scrollToNow();
    window.setTimeout(() => {
      const el = inputRef.current;
      if (el) { el.focus(); el.setSelectionRange(text.length, text.length); }
    }, 350);
  };

  const reviewApproval = () => {
    const el = document.getElementById("v05-approval");
    const c = scrollRef.current;
    if (!el || !c) return;
    c.scrollTo({ top: offsetIn(el) - c.clientHeight * 0.25, behavior: "smooth" });
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  };

  const ctx: Ctx = {
    expert, enabled, approval, emailBody: emailCard.body,
    setEnabled: (id, v) => setEnabledState((s) => ({ ...s, [id]: v })),
    setApproval, onSend: send, prefill, reviewApproval,
    openMemory: () => setOverlay("memory"),
  };

  // ---- the river ----
  const entries = useMemo(() => buildEntries({ messages, typing, extra, quietStart }), [messages, typing, extra, quietStart]);
  const byDay = useMemo(() => {
    const map: Record<string, Entry[]> = {};
    for (const e of entries) (map[dayKey(e.at)] ??= []).push(e);
    return map;
  }, [entries]);
  const kindsByDay = useMemo(() => {
    const map: Record<string, Set<Kind>> = {};
    for (const e of entries) if (e.kind !== "ambient") (map[dayKey(e.at)] ??= new Set()).add(e.kind);
    return map;
  }, [entries]);
  const visible = (e: Entry) => (filter ? e.kind === filter : true);

  const renderRows = (list: Entry[]) => {
    let prev = "";
    return list.map((e) => {
      const label = time(e.at);
      const showTime = label !== prev;
      prev = label;
      return <EntryView key={e.id} e={e} future={e.at > NOW} ctx={ctx} showTime={showTime} />;
    });
  };

  const filters = (
    <div className="flex flex-wrap gap-1.5">
      {KINDS.map((k) => {
        const on = filter === k.id;
        return (
          <button
            key={k.id}
            onClick={() => setFilter(on ? null : k.id)}
            aria-pressed={on}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] transition ${on ? "border-transparent text-white" : "border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--line-strong)]"}`}
            style={on ? { background: k.color } : undefined}
          >
            {!on && <span className="size-[7px] rounded-full" style={{ background: k.color }} />}
            {k.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`v05 ${dark ? "dark" : ""} relative flex h-full flex-col overflow-hidden`}>
      <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-[var(--line)] px-4 lg:px-6">
        <Wordmark />
        <div className="flex-1" />
        <button
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Filter the timeline"
          aria-pressed={showFilters}
          className={`relative grid size-9 place-items-center rounded-full lg:hidden ${showFilters ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"}`}
        >
          <ListFilter size={18} />
          {filter && <span className="absolute top-1.5 right-1.5 size-2 rounded-full" style={{ background: KINDS.find((k) => k.id === filter)!.color }} />}
        </button>
        <div className="flex h-9 items-center rounded-full bg-[var(--surface-2)] p-[3px] text-[12.5px]" role="group" aria-label="Detail level">
          {(["Simple", "Expert"] as const).map((m) => {
            const on = (m === "Expert") === expert;
            return (
              <button key={m} onClick={() => setExpert(m === "Expert")} aria-pressed={on} className={`h-full rounded-full px-3 font-medium transition ${on ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"}`}>
                {m}
              </button>
            );
          })}
        </div>
        <button onClick={() => setDark(!dark)} aria-label={dark ? "Light mode" : "Dark mode"} className="grid size-9 place-items-center rounded-full hover:bg-[var(--surface-2)]">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button onClick={() => setOverlay("settings")} aria-label="Settings" className="flex h-9 items-center gap-2 rounded-full px-2.5 hover:bg-[var(--surface-2)] sm:px-3.5">
          <SlidersHorizontal size={17} />
          <span className="hidden text-[13.5px] font-medium sm:inline">Settings</span>
        </button>
        <span className="ml-1 hidden sm:inline-flex"><Avatar id="alex" size={28} /></span>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="river-scroll hidden w-[244px] shrink-0 flex-col gap-8 overflow-y-auto border-r border-[var(--line)] px-4 py-6 lg:flex">
          <button onClick={() => scrollToNow()} className="flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-left">
            <span className="now-pulse relative size-2.5 rounded-full bg-[var(--now)]" />
            <span className="flex-1 text-[13.5px] font-medium">Now</span>
            <span className="mono text-[12px] text-[var(--muted)]">Fri 18:40</span>
          </button>
          <RailScrubber active={active} kindsByDay={kindsByDay} onJump={jumpDay} />
          <div>
            <div className="mb-2 px-1 text-[12px] font-medium text-[var(--muted)]">Show only</div>
            {filters}
          </div>
        </aside>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-[var(--line)] lg:hidden">
            <StripScrubber active={active} kindsByDay={kindsByDay} onJump={jumpDay} />
            {showFilters && <div className="rise px-4 pb-3">{filters}</div>}
          </div>

          <main ref={scrollRef} onScroll={onScroll} className="river-scroll relative flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[800px] px-2 pt-2 pb-48 sm:px-6">
              {DAYS.map((day) => {
                const all = byDay[day.key] ?? [];
                const list = all.filter(visible);
                const isToday = day.key === TODAY_KEY;
                const future = day.key > TODAY_KEY;
                const past = isToday ? list.filter((e) => e.at <= NOW) : [];
                const ahead = isToday ? list.filter((e) => e.at > NOW) : [];
                return (
                  <section key={day.key}>
                    <div ref={(el) => { anchors.current[day.key] = el; }} />
                    <DayHeader day={day} future={future} count={list.length} />
                    {isToday ? (
                      <>
                        {renderRows(past)}
                        <NowBlock
                          ctx={ctx}
                          nowRef={nowRef}
                          composer={<Composer value={input} setValue={setInput} onSubmit={() => send(input)} listening={listening} onMic={onMic} inputRef={inputRef} />}
                        />
                        {renderRows(ahead)}
                      </>
                    ) : list.length ? (
                      renderRows(list)
                    ) : (
                      <Row spine={future ? "future" : "past"} pad="pb-6"><span /></Row>
                    )}
                  </section>
                );
              })}
              <div className="grid grid-cols-[2.6rem_1.5rem_1fr] sm:grid-cols-[4.25rem_2.5rem_1fr]">
                <div />
                <div className="relative h-24"><div className="spine-future absolute inset-y-0 left-1/2 w-px -translate-x-1/2 [mask-image:linear-gradient(to_bottom,black,transparent)]" /></div>
              </div>
            </div>
          </main>

          {nowDir !== "visible" && (
            <button
              onClick={() => scrollToNow()}
              className="fade-in absolute right-4 bottom-20 z-20 flex items-center gap-2 rounded-full bg-[var(--ink)] py-2.5 pr-4 pl-3 text-[13.5px] font-medium text-[var(--bg)] shadow-[var(--shadow)] sm:bottom-6 lg:right-8"
            >
              {nowDir === "up" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              Back to now
              <span className="size-2 rounded-full bg-[var(--now)]" />
            </button>
          )}
        </div>
      </div>

      {overlay && (
        <Overlay
          tab={overlay} setTab={setOverlay} expert={expert} onClose={() => setOverlay(null)}
          onAsk={(text) => { setOverlay(null); window.setTimeout(() => send(text), 120); }}
          memories={memories} setMemories={setMemories} homeThings={homeThings} setHomeThings={setHomeThings}
          quietStart={quietStart}
        />
      )}
    </div>
  );
}
