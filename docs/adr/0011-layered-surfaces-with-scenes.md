# Surfaces are layered, and arrangements are saved as scenes

Every Surface has three layers: a Background of kept widgets arranged in regions that split and nest automatically, Windows in front for what the Member is working with now, and Alerts above everything for what can't wait (an Approval, an alarm, a lottery win). The layers separate what is ambient from what is active and what is urgent, so a new answer never shuffles the things a Member chose to keep, and nothing urgent hides behind them. A Surface's arrangement is saved as a named Scene ("Cooking") and switched by asking, by hand, or automatically at a time or in a Place, which makes screens reusable and familiar. Scene replaces the term "layout" from ADR 0010. Windows can still be moved and resized by hand.

The owner chose this after round 2 of the UI prototype, which built four placement models side by side (free space, tiles, layers, scenes); the code is archived on branch `prototype/ui-concepts-round2`. Layers became the core and scenes were taken from the scenes model. Tiles were rejected as too rigid. Free space had the clearest visual style, which the design starts from.

## Consequences

- The Gateway stores per Surface its regions, windows, open alerts and scenes; placement tools address a layer.
- Schedule and Settings stay predesigned (ADR 0010) and get full views with generous space.
- The full Conversation history and each Task's Thread (who did what, with what data and model) can be pulled up, in plain words by default and in full detail in expert mode.
- All visual styling is expressed as semantic design tokens, never literal values, so Members can pick or install Themes; light and dark are defined per Theme.
