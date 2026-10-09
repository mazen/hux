# PROTOTYPE brief: ten UI concepts for hux

Throwaway prototype. Ten designers each build one **complete, radically different** concept of hux's final web UI. The owner will flip between them (`?variant=01..10`, arrow keys) and pick a direction or mix.

## What hux is

A personal assistant for a household that runs on many devices (desk PC, kitchen tablet, phone, speaker). You talk to it by typing or voice; it answers in words **and** by showing things (a recipe, a shopping list, an email draft, the weather). It also does things on its own: reminders, routines, briefings, turning lights off when everyone leaves. Privacy first: it can run on AI models at home.

The people using this are **not technical**. Picture a parent at the kitchen counter, not a developer.

## What every concept must include

All in one React component tree (your `index.tsx` default export), fully self-contained, mock interactions in memory:

1. **Assistant view (the heart of the product, gets most of the space and love).** The Conversation from `src/fixtures.ts`, including the inline cards (recipe, shopping list, email draft with approval, weather, task thread "Research: home batteries"). An input for typing plus a visible voice affordance. Sending a message appends it and a short canned assistant reply. Suggested next actions.
2. **Plans** (name it as you see fit): reminders, calendar and routines (repeating jobs) from fixtures. Toggling a routine on/off works.
3. **Settings**: all ten groups from `settingsGroups`. The point to prove: **settings are vast but feel simple**. Simple mode shows only the `simple` items; expert mode reveals the `expert` items. Somewhere it should be obvious that you can also just *ask* hux to change a setting ("Ask hux to change this").
4. Also reachable somewhere (doesn't need a full page): devices, home devices, helpers, what hux remembers (memories, each editable/removable), recent activity, pending approval.
5. **Light and dark mode**: a toggle, defaulting to the system preference. Put the `dark` class on your own root element; Tailwind `dark:` variants are configured for that.
6. **Simple / expert mode**: a toggle. Expert reveals detail (which device, which helper did what, model and trust info, timestamps), never hides essentials.
7. **Responsive**: must work at 390px wide (phone) and at 1440px+ (desktop). On a phone, the assistant view comes first.
8. A distinct **identity**: a logo mark or wordmark for "hux", type pairing, colour system, motion where it helps. It should feel like a product with a point of view, not a template.

## Copy rules (strict)

- Write like a thoughtful human product writer. Plain words. Short. Calm. Specific.
- Use the fixture data; any extra text must be realistic for this household (Alex, Sam, Mia, Berlin, Friday 9 Oct 2026, 18:40).
- No lorem ipsum, no "AI-powered", no "Unlock", "Seamless", "Supercharge", "Effortlessly", no exclamation-mark cheer, no emoji confetti, no placeholder voice ("Your AI assistant will help you here").
- Technical words (model, endpoint, node, MCP, token) only appear in expert mode.
- Before adding any element, ask: **is this really necessary? Would a layperson understand it?**

- **Every line must carry information.** Headings name the thing ("Home", "Reminders"); no intro sentences or subtitles describing what a screen or section shows (bad: "The house as hux sees it: what's switched on, what it has learned, and what it has done today."). If removing a sentence loses nothing, remove it.

## Technical constraints

- Write **only** inside your own folder `src/variants/vNN/`. Do not edit any other file (others are working in parallel).
- `index.tsx` must `export const name = "<Concept name>"` and `export default function Variant()`.
- The concept owns the full viewport (`h-full` root). Leave ~56px clear at the bottom-centre on desktop or accept overlap: a floating prototype switcher sits there.
- Stack: React 19 + TypeScript + Tailwind v4 (utility classes) + `lucide-react` icons. You may add a `styles.css` in your folder (imported from your `index.tsx`) for fonts (`@import url(...)` from Google Fonts is fine), custom properties and keyframes. Scope custom CSS under a class unique to your concept (e.g. `.v03`) so it can't leak into other concepts.
- No new npm dependencies. Split into several files in your folder if it helps.
- Import data with `import { ... } from "../../fixtures";`.
- Verify: run `pnpm typecheck` in `apps/ui-prototype`. Fix every error in **your** folder; ignore errors in other folders (they're mid-flight).
