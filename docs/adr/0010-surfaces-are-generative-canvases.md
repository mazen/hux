# Surfaces are generative canvases, not pages of an app

hux has no app with predesigned pages. Every screen (a browser tab, each desktop monitor, the kitchen tablet, a phone) is a Surface that starts as empty space plus an input. Members say what to show and where, and hux places widgets there: passing ones that answer the moment, and kept ones that stay until removed, so a dashboard is just something a Member asks for. Arrangements can be saved as named layouts and brought back. We want people to shape their own screens by asking, as in science fiction, rather than learn our navigation. Round 1 of the UI prototype explored a predesigned multi-page app, and it was rejected.

## Consequences

- The Gateway stores widget and layout state per Surface.
- Placement is requested in words and carried out by the model through typed placement tool calls; code never parses the request (ADR 0004).
- Only Schedule (reminders, calendar, routines) and Settings are predesigned.
- The web interface is a Surface like a monitor, not a chat window with a control panel.
- Dialogue text is secondary to what is on the Surface.
