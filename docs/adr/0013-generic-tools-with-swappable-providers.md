# Generic tools have one interface and swappable Services, with keyless defaults that work out of the box

Web search, page reading, weather, places and news are built-in hux tools, each with one stable typed interface. Roles are granted the tool; the outside Service that does the work sits behind it and can be switched or added by the Member: a built-in adapter, a Wasm Plugin implementing the tool's WIT interface, or an MCP server's tool mapped onto it (ADR 0009). Each tool has an ordered fallback list of Services. hux ships defaults that need no account or key and whose terms allow an app to use them: the Gateway's own page fetch, Open-Meteo then MET Norway for weather, Open-Meteo geocoding then Photon and Nominatim for places, RSS for news, and Wikipedia plus DuckDuckGo instant answers for facts. Members add keyed Services (Brave, Tavily, Exa, Kagi, Mojeek, Marginalia, their own SearXNG) by asking. Findings are in `docs/research/tool-providers.md`.

We chose an interface with swappable Services over one tool per vendor so Roles, Skills and Routines never depend on which vendor a household uses, and over a single hard-wired vendor so hux works with no setup and no account. We rejected a keyless general web-search default: bundling SearXNG or scraping DuckDuckGo or Google breaks those engines' terms, and every compliant web-search API needs a key, so open-web search is offered at first use instead.

## Consequences

- A Service sees query text, so each Service gets a Member-set Trust level like a Model endpoint (ADR 0006), defaulting to Public; the Gateway checks a query's Labels against it before sending, and falls back, rewrites or asks. Results come back labelled as web content.
- Each Service declares its hosts, secret handle, rate limit, cache rules and attribution; its key lives in the vault and its hosts in its own egress allowlist. Answers name the Service and carry its attribution.
- Keyless defaults identify hux honestly, cache, never poll and round coordinates. Nominatim and MET Norway count all hux installs as one app, so the default list is data the project can update without a release.
- Open-Meteo's free tier is non-commercial; selling or hosting hux would mean changing that default.
