// PROTOTYPE - printed inserts for concept 01 "Paper".
import { useState } from "react";
import { Check, ChevronDown, Mail, Timer, Volume2 } from "lucide-react";
import type { Card, Message } from "../../fixtures";
import { useStore } from "./store";

export function CardView({ card }: { card: Card }) {
  switch (card.type) {
    case "recipe":
      return <RecipeCard card={card} />;
    case "shoppingList":
      return <ShoppingCard card={card} />;
    case "emailDraft":
      return <LetterCard card={card} />;
    case "approval":
      return <ApprovalCard card={card} />;
    case "weather":
      return <WeatherCard card={card} />;
    default:
      return null;
  }
}

function Button({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={
        "sans inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors " +
        (primary
          ? "bg-(--ink) text-(--paper) hover:bg-(--accent) hover:text-(--accent-ink)"
          : "border border-(--rule-strong) text-(--ink) hover:border-(--accent) hover:text-(--accent)")
      }
    >
      {children}
    </button>
  );
}

/* ---------- Recipe: a cookbook page ---------- */

function RecipeCard({ card }: { card: Extract<Card, { type: "recipe" }> }) {
  const { send } = useStore();
  return (
    <article className="insert relative px-6 pb-6 pt-7 sm:px-10 sm:pb-9 sm:pt-10">
      <div className="caps text-(--accent)">Recipe</div>
      <h3 className="display mt-2 text-[2rem] leading-[1.05] sm:text-[2.6rem]">{card.title}</h3>
      <p className="mt-2 italic text-(--ink-soft)">
        Serves {card.serves} &middot; ready in {card.time}
      </p>

      <div className="mt-7 grid gap-8 border-t border-(--rule) pt-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] sm:gap-10">
        <div>
          <div className="caps text-(--faint)">In your fridge</div>
          <ul className="mt-3 space-y-1.5 text-[1.02rem]">
            {card.have.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <div className="caps mt-6 text-(--faint)">To buy</div>
          <ul className="mt-3 space-y-1.5 text-[1.02rem]">
            {card.need.map((n) => (
              <li key={n} className="italic text-(--accent)">
                {n}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="caps text-(--faint)">Method</div>
          <ol className="mt-3 space-y-4">
            {card.steps.map((s, i) => (
              <li key={i} className="grid grid-cols-[1.6rem_1fr] gap-2 text-[1.02rem] leading-relaxed">
                <span className="display text-[1.5rem] leading-none text-(--accent)">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2 border-t border-(--rule) pt-5">
        <Button primary onClick={() => send("Start the frittata timer")}>
          <Timer size={15} strokeWidth={1.6} /> Start a 25-minute timer
        </Button>
        <Button onClick={() => send("Read me the recipe step by step")}>
          <Volume2 size={15} strokeWidth={1.6} /> Read it aloud
        </Button>
      </div>
    </article>
  );
}

/* ---------- Shopping list: a torn slip ---------- */

function ShoppingCard({ card }: { card: Extract<Card, { type: "shoppingList" }> }) {
  const [items, setItems] = useState(card.items);
  const left = items.filter((i) => !i.done).length;
  return (
    <article className="insert relative max-w-sm rotate-[-0.4deg]">
      <div className="perforated h-2 w-full" aria-hidden />
      <div className="px-6 pb-6 pt-3">
        <div className="flex items-baseline justify-between">
          <h3 className="display text-[1.5rem]">{card.title}</h3>
          <span className="caps text-(--faint)">{left} to get</span>
        </div>
        <ul className="mt-3">
          {items.map((it, i) => (
            <li key={it.name} className="border-b border-dashed border-(--rule) last:border-0">
              <button
                onClick={() => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
                className="flex w-full items-center gap-3 py-2.5 text-left text-[1.05rem]"
              >
                <span
                  className={
                    "grid size-[18px] shrink-0 place-items-center rounded-[3px] border transition-colors " +
                    (it.done ? "border-(--ink-soft) bg-(--ink-soft) text-(--insert)" : "border-(--rule-strong)")
                  }
                >
                  {it.done && <Check size={12} strokeWidth={2.4} />}
                </span>
                <span className={it.done ? "text-(--faint) line-through decoration-(--faint)" : ""}>{it.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="sans mt-4 text-[12.5px] text-(--faint)">On {card.sentTo}. Reminds you at the supermarket.</p>
      </div>
    </article>
  );
}

/* ---------- Email draft: a letter ---------- */

function LetterCard({ card }: { card: Extract<Card, { type: "emailDraft" }> }) {
  const { approval } = useStore();
  const status = approval === "approved" ? "Scheduled" : card.status;
  return (
    <article className="insert relative px-6 py-7 sm:px-12 sm:py-10">
      <div className="absolute right-5 top-5 rotate-[4deg] rounded-[3px] border border-(--accent) px-2 py-0.5 sm:right-8 sm:top-7">
        <span className="caps text-(--accent)">{status}</span>
      </div>
      <div className="flex items-center gap-2 text-(--faint)">
        <Mail size={14} strokeWidth={1.6} />
        <span className="caps">Email</span>
      </div>
      <dl className="sans mt-5 grid grid-cols-[4.5rem_1fr] gap-y-1.5 text-[13.5px]">
        <dt className="text-(--faint)">To</dt>
        <dd>{card.to}</dd>
        <dt className="text-(--faint)">Subject</dt>
        <dd className="pr-16 sm:pr-0">{card.subject}</dd>
      </dl>
      <div className="mt-6 whitespace-pre-line border-t border-(--rule) pt-6 text-[1.08rem] leading-[1.7]">{card.body}</div>
    </article>
  );
}

/* ---------- Approval: awaiting a signature ---------- */

function ApprovalCard({ card }: { card: Extract<Card, { type: "approval" }> }) {
  const { approval, setApproval, expert } = useStore();
  return (
    <article id="v01-approval" className="relative border-y-2 border-double border-(--accent) py-6 sm:px-2">
      <div className="caps text-(--accent)">
        {approval === "pending" ? "Awaiting your signature" : approval === "approved" ? "Signed" : "Held back"}
      </div>
      <h3 className="display mt-2 text-[1.6rem] leading-tight">{card.action}</h3>
      <p className="mt-1 text-(--ink-soft)">{card.detail}</p>
      <p className="mt-1 italic text-(--ink-soft)">Goes out {card.when}</p>
      {expert && (
        <p className="sans mt-2 text-[12px] text-(--faint)">
          Tier: send (asks once per exact message) &middot; Writer &middot; mail account alex@ &middot; requested 18:31:06
        </p>
      )}

      {approval === "pending" && (
        <div className="fade-in mt-5 flex flex-wrap items-center gap-2">
          <Button primary onClick={() => setApproval("approved")}>
            <Check size={15} strokeWidth={2} /> Approve and schedule
          </Button>
          <Button onClick={() => setApproval("held")}>Not yet</Button>
        </div>
      )}
      {approval === "approved" && (
        <div className="fade-in mt-5 flex flex-wrap items-end justify-between gap-4">
          <p className="text-[1.02rem]">Approved by Alex. It goes out Monday at 7:30, and I'll remind you on Friday to follow up.</p>
          <div className="text-right">
            <div className="display text-[1.9rem] italic leading-none">Alex</div>
            <button onClick={() => setApproval("pending")} className="sans link mt-1 text-[12px] text-(--faint)">
              Undo
            </button>
          </div>
        </div>
      )}
      {approval === "held" && (
        <div className="fade-in mt-5 flex flex-wrap items-baseline gap-3">
          <p className="text-[1.02rem]">Nothing will be sent until you say so.</p>
          <button onClick={() => setApproval("pending")} className="sans link text-[13px]">
            Change my mind
          </button>
        </div>
      )}
    </article>
  );
}

/* ---------- Weather: an almanac entry ---------- */

function WeatherCard({ card }: { card: Extract<Card, { type: "weather" }> }) {
  const { expert } = useStore();
  return (
    <article className="insert px-6 py-7 sm:px-10 sm:py-8">
      <div className="caps text-(--faint)">Saturday in {card.place}</div>
      <div className="mt-4 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-end sm:gap-12">
        <div>
          <div className="display lining text-[4.2rem] leading-none">
            {card.high}&deg;
            <span className="text-[2rem] text-(--faint)"> / {card.low}&deg;</span>
          </div>
          <p className="mt-3 italic text-(--ink-soft)">
            Now {card.now.toLowerCase()}, {card.temp}&deg;
          </p>
        </div>
        <table className="sans lining w-full text-[12.5px]">
          <tbody>
            <tr className="h-16 align-bottom">
              {card.hourly.map((h) => (
                <td key={h.time} className="px-1">
                  <div className="mx-auto flex h-14 w-6 flex-col justify-end">
                    <div
                      className="w-full bg-(--accent)"
                      style={{ height: `${Math.max(h.rain, 2) * 0.55}px`, opacity: h.rain ? 0.7 : 0.18 }}
                    />
                  </div>
                </td>
              ))}
            </tr>
            <tr className="text-center text-(--faint)">
              {card.hourly.map((h) => (
                <td key={h.time} className="pt-1.5">
                  {h.rain ? `${h.rain}%` : "dry"}
                </td>
              ))}
            </tr>
            <tr className="text-center">
              {card.hourly.map((h) => (
                <td key={h.time} className="border-t border-(--rule) pt-2 text-[14px]">
                  {h.temp}&deg;
                </td>
              ))}
            </tr>
            <tr className="text-center text-(--faint)">
              {card.hourly.map((h) => (
                <td key={h.time} className="pt-0.5">
                  {h.time.padStart(2, "0")}:00
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {expert && <p className="sans mt-5 text-[12px] text-(--faint)">Source: DWD open data, fetched 18:38 &middot; public info, no personal data sent</p>}
    </article>
  );
}

/* ---------- Task thread: a footnote of work done ---------- */

export function ThreadNote({ thread }: { thread: NonNullable<Message["thread"]> }) {
  const [open, setOpen] = useState(false);
  const { expert } = useStore();
  const helperFor = ["Researcher", "Researcher", "Researcher", "Writer"];
  return (
    <aside className="border-l-2 border-(--rule-strong) pl-4">
      <button onClick={() => setOpen((o) => !o)} className="group flex w-full items-baseline gap-3 text-left" aria-expanded={open}>
        <span className="caps text-(--faint)">Worked on this afternoon</span>
        <span className="flex-1" />
        <span className="caps text-(--faint)">{thread.status === "done" ? "Finished" : "In progress"}</span>
        <ChevronDown size={14} className={"self-center text-(--faint) transition-transform " + (open ? "rotate-180" : "")} />
      </button>
      <div className="mt-1 text-[1.05rem] italic">{thread.title}</div>
      {open && (
        <ol className="fade-in mt-3 space-y-1.5">
          {thread.steps.map((s, i) => (
            <li key={s} className="sans flex items-baseline gap-3 text-[13.5px] text-(--ink-soft)">
              <Check size={12} strokeWidth={2} className="shrink-0 translate-y-[1px] text-(--accent)" />
              <span className="flex-1">{s}</span>
              {expert && <span className="text-[11.5px] text-(--faint)">{helperFor[i]} &middot; 15:{String(10 + i * 7).padStart(2, "0")}</span>}
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
