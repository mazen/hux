# Providers for hux's built-in generic tools

Research date: 2026-10-09. Scope: which external services could back `web_search`, page fetch/read, weather, geocoding/maps and news, (a) as a **zero-configuration default** (no account, no key, thousands of independent self-hosted Gateways each making their own requests) and (b) as **Member-configurable** options (Member brings a key). Primary sources are linked inline. **[unverified]** marks claims I could not confirm in a primary source; **[opinion]** marks quality judgements.

Framing facts that apply throughout:
- Several keyless services count limits **per application, not per install**. Nominatim: "the usage limits above apply per website/application" (https://operations.osmfoundation.org/policies/nominatim/). MET Norway: 20 req/s "per application (total, not per client)" (https://api.met.no/doc/TermsOfService). For these services, every hux install together counts as one client.
- Other services limit **per IP**. Open-Meteo's maintainer refers to an IP-based limit (https://github.com/open-meteo/open-meteo/discussions/853). Each household Gateway then has its own budget.
- robots.txt "rules are not a form of access authorization", and the RFC addresses "crawlers", meaning automated clients (https://www.rfc-editor.org/rfc/rfc9309.html §1). A website's ToS can still forbid automated access to it, independent of robots.txt (see Google and DuckDuckGo below).

## 1. Web search

### Keyless options

**SearXNG** (self-hosted metasearch)
- AGPL-3.0 (https://github.com/searxng/searxng). Docker image `searxng/searxng`, served on port 8080 (https://docs.searxng.org/admin/installation-docker.html).
- **Output:** JSON is **off by default**. The default `search.formats` is `html` only, so `json` has to be enabled (https://docs.searxng.org/admin/settings/settings_search.html).
- **How it gets results:** it queries upstream engines (Google, Bing, DuckDuckGo, Brave, Qwant, Startpage and others), mostly by requesting their public result pages **[unverified per engine; the README only lists them]**. Google's terms forbid "using automated means to access content … in violation of the machine-readable instructions" and list "scraping content that doesn't belong to you" as grounds for termination (https://policies.google.com/terms). Google sued SerpApi over SERP scraping in December 2025 (secondary: https://news.bloomberglaw.com/ip-law/google-accuses-web-scraping-company-of-copyright-violations). **A SearXNG instance that hux bundles and runs would therefore be hux automating scraping of engines whose terms forbid it.** A private, low-volume instance is common practice, but it is not ToS-clean.
- **Public instances** (searx.space) are not usable as an API backend. The limiter flags clients whose Accept header lacks `text/html`, that send no Accept-Language, or whose User-Agent matches `curl`, `python-requests`, `Go-http-client`, `Java` and similar. Non-HTML formats get `API_MAX = 4` requests per `API_WINDOW = 3600` s per IP (https://docs.searxng.org/src/searx.botdetection.html). With `public_instance: true`, link-token bot detection is turned on (https://docs.searxng.org/admin/settings/settings_server.html). I found no published policy on searx.space itself **[unverified]**. Pointing thousands of installs at public instances would be abusive.
- **Quality [opinion]:** good, because results are aggregated from big engines, but upstream blocking and CAPTCHAs make it flaky.
- **Verdict:** offer it as a configurable backend ("SearXNG URL") for Members who already run one. Don't bundle it as the silent default.

**DuckDuckGo**
- The **Instant Answer API** (`api.duckduckgo.com`) is keyless, but DDG says it "is not a full search results API … we unfortunately do not have the rights to fully syndicate our results" (archived official page: https://web-archive.nli.org.il/National_Library/mp_/https://duckduckgo.com/api). The live page did not render for me. It returns abstracts (often Wikipedia), calculations and disambiguations, not web results.
- **HTML endpoints** (`html.duckduckgo.com`, `lite.duckduckgo.com`): robots.txt says `Allow: /` (https://html.duckduckgo.com/robots.txt), but the ToS say "We expect you to use our Services as authorized" (https://duckduckgo.com/terms). Given the syndication statement above, scraping these endpoints is **not an authorized API**. Libraries that do it, such as `duckduckgo_search`, run against DDG's own stated position and get rate-limited in practice **[unverified]**.
- **Verdict:** HTML scraping is not acceptable as a default. The Instant Answer API is a fine keyless fact or abstract source, but it is not web search.

**Marginalia Search**
- Every request needs an `API-Key` header. The key `public` exists "for integration development", "often hits a rate limit", and has a shared limit across all consumers (HTTP 503 when exceeded). Free keys come by email, and both free and paid non-commercial results are **CC BY-NC-SA 4.0**. Commercial keys are metered via Polar and carry no attribution requirement. The engine is AGPL (https://about.marginalia-search.com/article/api/).
- **Quality [opinion]:** an independent small-web index. It is weak for news, shopping and "what are the opening hours" queries.
- **Verdict:** the `public` key is explicitly for development, so it is not an install-wide default. A free key requested by email is a fine Member option.

**Wikipedia / Wikimedia APIs**
- No key. Limits: 10 req/min for unidentified clients and **200 req/min for unauthenticated bots with a compliant User-Agent** that includes contact details. Authenticated established editors get 2,000 req/min (https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits).
- **User-Agent policy:** use the format `<client>/<version> (<contact>) <library>/<version>`. Generic UAs get 403 or are blocked without notice (https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy).
- **Etiquette:** send requests serially rather than in parallel, cache, and use `maxlag` for non-interactive jobs (https://www.mediawiki.org/wiki/API:Etiquette).
- **Content licence:** CC BY-SA, so attribution and share-alike apply when content is shown (https://www.mediawiki.org/wiki/Wikimedia_APIs).
- **Wikimedia Enterprise** free account: 50,000 On-demand requests/month and needs signup (https://enterprise.wikimedia.com/pricing/). It is unnecessary for hux.
- **Verdict:** a legitimate keyless source for encyclopedic lookups, though not general web search. The 200/min limit is per identified client, and whether it is keyed per IP or per UA is not stated. Each Gateway should include its own instance identifier in the UA.

### Keyed options (Member brings a key)

| Provider | Free allowance | Paid | Notes (source) |
|---|---|---|---|
| **Brave Search API** | No free plan since Feb 2026; **$5/month auto credits** (~1,000 queries), credit card required | $5 / 1k (Search), 50 qps; Answers $4 / 1k + tokens | Storing results (e.g. to train an LLM) needs a plan "that explicitly grants storage rights"; ZDR only on Enterprise; no rights to third-party page content (https://brave.com/search/api/). Free-tier removal date of 2026-02-12 from trackers only (https://agentdeals.dev/digest/2026-w07) **[secondary]**. Own independent index. Quality **[opinion]**: the best general-purpose independent index |
| **Tavily** | 1,000 credits/month, no card | $0.008/credit PAYG | Built for LLM agents (returns extracted content); rate limits not published (https://www.tavily.com/pricing). Privacy and retention **[unverified]** |
| **Exa** | $10 credits/month (resets), no card | Search $4–7 / 1k, contents $1 / 1k pages | Neural/semantic index; ZDR on Enterprise only (https://exa.ai/pricing) |
| **Kagi Search API** | Trial **[unverified details]** | $12 / 1k searches, Extract $4 / 1k pages | Token auth; inherits the account's personalisation settings (https://kagi.com/api/pricing, https://help.kagi.com/kagi/api/search.html). FastGPT and Summarizer are not on the current pricing page **[unverified]**. Quality **[opinion]**: excellent |
| **Mojeek** | Trial "with limited queries" on request | £2 CPM (5 qps, 100k/day), £3 CPM Business | AI use allowed on all plans; storage only on Business/Enterprise, others may cache for 1 h (https://www.mojeek.com/services/search/web-search-api/). Independent UK index, privacy-focused |
| **Jina Search** (`s.jina.ai`) | Needs a key (no-key access blocked); new keys get 10M tokens | ≥10k tokens per search | 100 RPM with key (https://jina.ai/reader/) |
| **Marginalia** | Free key by email | Metered commercial | See above |
| **SearXNG (own instance)** | n/a | Self-hosted | See above |
| Serper / SerpAPI | Keyed | Paid | Resell scraped Google SERPs; Google is suing SerpApi (secondary: https://news.bloomberglaw.com/ip-law/google-accuses-web-scraping-company-of-copyright-violations). Don't list them as recommended |

**Dead or unavailable for hux:**
- **Bing Search APIs** were retired on 2025-08-11 (https://learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement). The replacement, **Grounding with Bing**, only works inside Azure AI Foundry agents. Raw results are not returned to developers, citations must be displayed "in the exact form provided by Microsoft", it requires a paid Azure subscription, and data leaves the Azure compliance boundary (https://learn.microsoft.com/en-us/azure/ai-foundry/agents/how-to/tools/bing-grounding). It does not fit hux.
- **Google Custom Search JSON API** is "closed to new customers", and existing customers must migrate by **2027-01-01**. It offers 100 free queries/day, and Google points to Vertex AI Search for up to 50 domains (https://developers.google.com/custom-search/v1/overview, updated 2026-02-18). Not an option.
- **Qwant/Ecosia EUSP ("Staan")** is reportedly open to third parties (secondary: https://www.searchenginejournal.com/ecosia-qwant-launch-european-search-infrastructure/553182/), but I found no public API terms or pricing **[unverified]**. Worth watching as an EU index.
- **Startpage:** I could not fetch its site, and no public API is known to me **[unverified]**.

## 2. Page fetch / read

| Option | Key | Limits | Privacy | Licence |
|---|---|---|---|---|
| **Gateway plain HTTP fetch** + local HTML→Markdown | none | none beyond each site's terms | The URL goes only to the target site | n/a |
| **Jina Reader** (`r.jina.ai`) | optional | 20 RPM without a key, 500 RPM with a free key (10M tokens) | Caches a URL for 5 min; "Do Not Cache or Track" option; no training on requests (https://jina.ai/reader/) | Apache-2.0, self-hostable image `ghcr.io/jina-ai/reader:oss` (headless Chrome; some non-redistributable assets) (https://github.com/jina-ai/reader) |
| **Firecrawl** | yes | Free: 1,000 credits/month, 10 scrapes/min, 2 concurrent (https://www.firecrawl.dev/pricing) | **[unverified]** | AGPL-3.0, self-host guide; the cloud has "additional features" (https://github.com/firecrawl/firecrawl) |

**Notes:**
- A fetch the Member triggers for one URL is not crawling in the RFC 9309 sense. Even so, the Gateway should: send an honest, identifying User-Agent; honour robots.txt for agent-initiated, non-interactive fetches (caching it for ≤24 h, per RFC 9309 §2.4); not bypass paywalls or anti-bot challenges; cap size and redirects; and apply SSRF protection (no private, link-local or metadata IPs).
- The keyless Jina tier is per-IP **[unverified]** and sends every URL to a third party. Use it only as an opt-in fallback for JavaScript-heavy pages.

## 3. Weather

| Provider | Key | Limits | Licence / attribution | Terms for many installs | Self-host |
|---|---|---|---|---|---|
| **Open-Meteo** | none (non-commercial) | 600/min, 5,000/h, **10,000/day**, 300k/month (https://open-meteo.com/en/terms), enforced per IP (maintainer: https://github.com/open-meteo/open-meteo/discussions/853) | Data CC BY 4.0, e.g. "Weather data by Open-Meteo.com" (https://github.com/open-meteo/open-meteo) | Free only for **non-commercial** use: "private or non-profit websites or apps that do not have subscriptions or advertising". Commercial use needs a paid plan. Logs IP and coordinates, deleted after 90 days (https://open-meteo.com/en/terms) | Server AGPLv3; Docker; can lazily fetch from the public Open-Meteo database (https://github.com/open-meteo/open-meteo) |
| **MET Norway** (api.met.no) | none | **20 req/s total per application** (all installs together); over that "requires special agreement"; coordinates ≤4 decimals; honour `Expires`/`If-Modified-Since` | CC BY 4.0: credit, link to the licence, indicate changes | UA must name the app plus a contact; mobile and browser clients should go through a proxy; no polling more often than every 10 min (https://api.met.no/doc/TermsOfService) | No |
| **Bright Sky** (DWD, Germany) | none | Not published | DWD data under DWD terms, CC BY 4.0 per DWD's CDC terms (https://opendata.dwd.de/climate_environment/CDC/Terms_of_use.pdf); official attribution wording at https://www.dwd.de/copyright **[could not load]** | "Free … for any purpose" (https://brightsky.dev/) | MIT, `docker-compose up` (https://github.com/jdemaeyer/brightsky) |
| **NWS** api.weather.gov (US) | none (a key is planned "in the future") | Not public; retry after ~5 s; proxied traffic hits the limit sooner | "Open data, free to use for any purpose" | UA with app plus contact required (https://www.weather.gov/documentation/services-web-api) | No |

**Quality [opinion]:**
- Open-Meteo blends national models (ICON, GFS, ECMWF, MET Norway and others) and has global coverage.
- MET Norway is global, and strongest in the Nordics.
- Bright Sky and NWS are authoritative for official warnings in their own countries.

## 4. Geocoding and maps

| Provider | Key | Free limits | Terms relevant to hux | Licence |
|---|---|---|---|---|
| **Nominatim (OSMF public)** | none | **max 1 req/s, per application**; identifying UA or Referer; caching expected | User-triggered searches are OK "provided that your number of users is moderate"; "periodic requests from apps are considered bulk geocoding"; apps "must make sure that they can switch the service at our request at any time"; a proxy plus cache is recommended; no-code platforms may not embed it as a general service (https://operations.osmfoundation.org/policies/nominatim/) | ODbL; apps "must credit OpenStreetMap" (https://osmfoundation.org/wiki/Licence/Attribution_Guidelines) |
| **Photon (komoot public)** | none | Unspecified; "extensive usage will be throttled"; no availability guarantee (https://photon.komoot.io/) | Fair use only | Software Apache-2.0; OSM data (ODbL) |
| **Open-Meteo Geocoding** | none (non-commercial) | Shares Open-Meteo's limits | City and postcode search only (GeoNames), with coordinates, timezone and admin areas (https://open-meteo.com/en/docs/geocoding-api) | GeoNames CC BY 4.0 **[unverified]** |
| **Nominatim self-hosted** | n/a | n/a | Planet: ≥1 TB NVMe, 128 GB RAM recommended, ~2.5 days to import; a country extract is far smaller (https://nominatim.org/release-docs/latest/admin/Installation/) | GPL (https://github.com/osm-search/Nominatim) |
| **Photon self-hosted** | n/a | n/a | Planet ~95 GB disk, 64 GB RAM recommended; weekly dumps from GraphHopper (https://github.com/komoot/photon) | Apache-2.0 |
| **Geoapify** | yes | 3,000 credits/day, 5 req/s, **commercial production allowed** | Attribution required (https://www.geoapify.com/pricing/) | OSM-based |
| **LocationIQ** | yes | 5,000/day, 2 req/s | Commercial use allowed with a "Search by LocationIQ.com" link (https://locationiq.com/pricing) | OSM-based |
| **OpenCage** | yes | 2,500/day, 1 req/s, but the trial is **"testing only"** | May store results permanently (https://opencagedata.com/pricing) | OSM plus open data |

**OSM tiles** (tile.openstreetmap.org):
- Requires a distinct app User-Agent, visible attribution and honouring cache headers (≥7 days if unreadable).
- No prefetch and **no offline use**. Availability is best-effort, with "no SLA or guarantee". The tile URL should be configurable (https://operations.osmfoundation.org/policies/tiles/).
- It is usable for on-screen maps that a Member is actively viewing, through a Gateway cache, but not as a guaranteed default.

## 5. News

- **RSS/Atom feeds:** no key and the most robust option. Each publisher's terms govern reuse **[per-publisher]**. Members add feeds, and hux can ship a curated starter list.
- **GDELT:** free for "any academic, commercial, or governmental use"; redistribution must cite GDELT with a link (https://www.gdeltproject.org/about.html). The DOC 2.0 API (`api.gdeltproject.org`) is keyless **[API terms and limits unverified]**. Quality **[opinion]**: broad, but metadata-level and noisy.
- **NewsAPI.org:** the free Developer plan is 100 requests/day with a 24 h delay, "development and testing in a development environment only", so production use requires an upgrade (https://newsapi.org/pricing). **It cannot be a default.**
- Brave and Tavily also have news modes via their keyed APIs.

## 6. Candidates for out-of-the-box defaults

| Tool | Keyless default | Fallback order | Member-configurable |
|---|---|---|---|
| **web_search** | **None for general web search.** No keyless option is both ToS-clean and scales to thousands of installs. Ship `web_search` as "needs a provider". Out of the box, offer only `encyclopedia_lookup` (Wikipedia/Wikimedia API with a compliant UA) plus the DuckDuckGo Instant Answer API for quick facts | Configured provider → Wikipedia (facts only) | **Brave** (best general index; card required, $5/mo credits), **Tavily** (1k/mo, no card; agent-friendly), **Exa** ($10/mo, no card), **Kagi**, **Mojeek** (privacy, EU-friendly), **Marginalia** (free key, non-commercial, CC BY-NC-SA), **own SearXNG URL** (Member's choice and Member's responsibility for upstream ToS) |
| **web_fetch** | **Gateway's own HTTP fetch** plus local readability→Markdown | Own fetch → (opt-in) Jina Reader for JS-heavy pages | Jina key, self-hosted Jina Reader, Firecrawl (key or self-hosted) |
| **weather** | **Open-Meteo** (per-IP limits; a household is far below 10k/day). Valid only while hux installs are non-commercial; attribute "Weather data by Open-Meteo.com" (CC BY 4.0) | Open-Meteo → MET Norway (with a project-level UA and contact; cache per `Expires`; truncate coordinates to 4 decimals) | Self-hosted Open-Meteo; Bright Sky (DE) and NWS (US) for official alerts; commercial Open-Meteo key |
| **geocoding** | **Open-Meteo Geocoding** for place and postcode → coordinates (enough for weather). Public Nominatim/Photon only for **interactive, Member-triggered** lookups, through a Gateway cache, with OSM attribution. All installs share one Nominatim budget of 1 req/s, so it must be switchable remotely | Open-Meteo Geocoding → Photon (komoot) → Nominatim | Geoapify (free, production allowed), LocationIQ (free with link), OpenCage (paid), self-hosted Photon/Nominatim (country extract) |
| **maps/tiles** | None guaranteed. OSM tiles only for on-screen viewing through a cache with attribution; no offline use | — | Self-hosted or commercial tile provider |
| **news** | **RSS** (curated starter feeds, Member-editable) | RSS → GDELT DOC API | Brave/Tavily news modes; NewsAPI only on a paid plan |

**Caveats:**
1. **Identify honestly.** MET Norway, Wikimedia, NWS and OSM all require an identifying User-Agent with contact details. hux needs a project contact (URL or email) in the default UA, plus a per-install suffix, so operators can tell installs apart without the project being blocked as a whole.
2. **Per-application budgets (Nominatim 1 req/s, MET 20 req/s) are shared by all hux installs.** Cache aggressively at each Gateway, never poll, and make every endpoint switchable through config (and ideally through a remotely updatable provider list), since OSMF may require switching "at any time".
3. **Commercial status matters.** Open-Meteo's free tier, Marginalia's free keys and NewsAPI's dev plan are non-commercial or dev-only. If hux is ever sold, hosted or ad-supported, these defaults must change.
4. **Attribution must surface in answers:** CC BY 4.0 for Open-Meteo, MET and DWD; ODbL ("© OpenStreetMap contributors") for OSM-based results; CC BY-SA for Wikipedia text; CC BY-NC-SA for Marginalia's free tier. Tool results should carry an `attribution` field that the UI or voice layer can render.
5. **Privacy:** every keyless service sees the household's IP. Open-Meteo logs coordinates for 90 days. Round coordinates (to ~3–4 decimals) and strip personal data from queries at the Gateway.
6. **Don't ship scrapers as defaults:** no DuckDuckGo HTML, no bundled SearXNG hitting Google, no Serper/SerpAPI.
