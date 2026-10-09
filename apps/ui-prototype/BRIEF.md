# PROTOTYPE brief, round 2: the generative canvas

Throwaway prototype. Four designers each build one **interaction model** for hux's generative UI. The owner flips between them (`?variant=01..04`, arrow keys) and picks one or a mix. Round 1 (ten styled apps with predesigned pages) was rejected; don't repeat it.

## The idea

There is no app with pages. A screen is a **Surface**: this browser window is just one, exactly like one monitor of the desk PC or the kitchen tablet. A Surface is mostly **empty space plus an input**. You tell hux what you want to see and where, like in a science-fiction film:

- "Show me the frittata recipe on the right and keep it there while I cook."
- "Start a 25 minute timer next to it."
- "Put my calendar for next week along the bottom."
- "Make the weather smaller." "Get rid of the shopping list." "Clear everything except the timer."
- "Set this up as my morning screen" — and from then on that arrangement stays.

hux places **widgets** on the Surface. Some are **passing** (an answer you glance at, fades or can be dismissed) and some **stay** (the user asked to keep them; they survive until removed). A user who wants a dashboard simply asks for one, and it stays. Dialogue text is secondary: short replies near the input, with history available but never dominating the Surface.

Only two screens are predesigned: **Schedule** (reminders, calendar, routines) and **Settings**. Everything else is generated.

## What every concept must show

1. **Starting state**: the Surface Alex set up earlier for Friday evenings: a small weather widget, today's calendar, the shopping list, all staying. Plus the input (with a visible voice affordance) and one pending thing that needs Alex (approve the email to Todd).
2. **The demo script**, clickable as suggestion chips *and* typeable (simple keyword matching is fine; this is a mock, not the product). Each step visibly changes the Surface:
   1. "What could I cook tonight?" → a passing answer with three ideas.
   2. "Show the frittata recipe on the right and keep it there" → recipe widget, placed right, staying.
   3. "Start a 25 minute timer next to it" → a running timer widget.
   4. "Show me the email to Todd" → the draft, large, editable, with Approve.
   5. "Put my calendar for next week along the bottom" → placed accordingly.
   6. "Make the weather smaller" / "Remove the shopping list".
   7. "Clear everything except the timer".
   8. "Save this as my cooking screen" → the arrangement becomes a named layout that can be brought back ("Show my cooking screen").
3. **Direct manipulation** as a complement to talking: the user can also move, resize, keep/unkeep and close widgets by hand, in the way your interaction model suggests.
4. **Schedule** and **Settings**: reachable by asking ("Show my schedule", "Open settings") and by one small, unobtrusive affordance. Keep them simple and calm: reminders, calendar and routines (toggle on/off) from fixtures; the ten settings groups from `settingsGroups`, simple vs expert items, and "Ask hux to change this".
5. **This Surface is one of several**: somewhere quiet, show which Surface this is ("Desk PC · left screen" in expert mode) and that widgets can be sent elsewhere ("Send the recipe to the kitchen tablet" → a short confirmation).
6. **Light and dark mode** (toggle, default from system; put `dark` on your own root), **simple and expert mode** (expert reveals which helper/device/model, widget placement data, timestamps).
7. **Responsive**: at 390px the phone is a small Surface; the same commands must produce a sensible stacked arrangement. At 1440px+ use the space.
8. A coherent, restrained visual identity for "hux" that serves the canvas (widgets must look like one family). The visual style is secondary to the interaction model; don't spend the effort on decoration.

## Your interaction model

Given in your task. It decides how placement works (where things go when asked, how they avoid each other, what "keep" means, how layouts are stored and switched). Make that model **legible**: someone flipping between concepts should immediately feel the difference.

## Copy rules (strict)

- Write like a thoughtful human product writer. Plain words. Short. Calm. Specific. Use the fixture data and this household (Alex, Sam, Mia, Berlin, Friday 9 Oct 2026, 18:40).
- **Every line must carry information.** Headings name the thing. No intro sentences or subtitles describing what a screen shows. No empty-state essays.
- No lorem ipsum, no "AI-powered", "unlock", "seamless", "supercharge", "effortless", no exclamation cheer, no emoji.
- Technical words only in expert mode.
- Before adding any element: **is this really necessary? Would a layperson understand it?**

## Technical constraints

- Write **only** inside `src/variants/vNN/`. Don't edit other files.
- `index.tsx`: `export const name = "<Concept name>"` and `export default function Variant()`. The concept owns the full viewport (`h-full`). A floating prototype switcher sits at the bottom centre; keep the input clear of the bottom ~56px at the centre, or accept overlap.
- React 19 + TypeScript + Tailwind v4 + `lucide-react`. Optional `styles.css` in your folder, scoped under a unique class (`.v02`). Google Fonts `@import` is fine. No new dependencies.
- Data: `import { ... } from "../../fixtures";`.
- Verify with `pnpm typecheck` in `apps/ui-prototype` (fix errors in your folder only) and, if you have browser tools, by running `pnpm dev` (port 5199) and clicking through the demo script at 1440px and 390px.
