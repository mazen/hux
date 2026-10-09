# Distributed, local-first voice & home assistant architectures

Research for hux planning. Researched 2026-10-09. Sources are primary (official docs, specs, source repos) unless marked otherwise. **[unverified]** marks claims I could not confirm from a primary source.

## 1. Home Assistant Assist + Wyoming

### Hub-to-device protocol, discovery, pairing
- **Wyoming** is a peer-to-peer TCP protocol, "basically JSONL + PCM audio": each message is a one-line JSON header (`type`, optional `data`, `data_length`, `payload_length`), then optional extra JSON data and an optional binary payload (usually PCM) ([wyoming README](https://github.com/OHF-Voice/wyoming)).
- It has **no authentication or encryption**, so it is meant only for trusted networks ([wyoming README](https://github.com/OHF-Voice/wyoming)).
- **Capability discovery happens in the protocol.** The client sends `describe`, and the server replies with `info`, listing its services by category: `asr`, `tts`, `wake`, `intent`, `handle`, `satellite`, `mic`, `snd`. Each model lists its languages and whether it is installed. `select-program` picks a program ([wyoming README](https://github.com/OHF-Voice/wyoming)).
- **Event families:** audio-start/chunk/stop, detect/detection, transcribe/transcript (also streaming), synthesize (also streaming), recognize/intent, handled, voice-started/stopped (VAD), satellite run/pause/run-pipeline, timer events ([wyoming README](https://github.com/OHF-Voice/wyoming)).
- **Who connects to whom:** the satellite *listens* (e.g. `tcp://0.0.0.0:10700`), and Home Assistant discovers it or is pointed at host:port, then connects in ([wyoming-satellite](https://github.com/rhasspy/wyoming-satellite)). HA auto-discovers Wyoming services ([HA Wyoming integration](https://www.home-assistant.io/integrations/wyoming/)). The discovery mechanism (zeroconf/mDNS) is not named in these docs **[unverified]**.
- **Pairing:** there is none beyond "add host:port in HA", because there is no auth ([wyoming README](https://github.com/OHF-Voice/wyoming)).
- **Shift away from Wyoming for satellites:** `wyoming-satellite` was **deprecated and archived in January 2026**. Its README recommends **Linux Voice Assistant**, which speaks the **ESPHome native API** (port 6053) and is discovered through HA's ESPHome integration ([wyoming-satellite](https://github.com/rhasspy/wyoming-satellite), [linux-voice-assistant](https://github.com/OHF-Voice/linux-voice-assistant)). Wyoming remains the plug-in protocol for STT/TTS/wake *services* ([HA Wyoming integration](https://www.home-assistant.io/integrations/wyoming/)).
- **Pipelines on the server:** clients run them over the WebSocket API with `assist_pipeline/run`, which takes `start_stage`/`end_stage` (wake_word|stt|intent|tts), an optional `device_id` and `conversation_id`, and binary audio frames prefixed with a handler ID ([HA dev docs: pipelines](https://developers.home-assistant.io/docs/voice/pipelines/)).

### Pipeline split: what runs where
- **The pipeline:** wake word → STT → intent/conversation agent → TTS. It can start or end at any stage, so a device that does its own wake word starts at `stt`, and a text client starts at `intent` ([HA dev docs: pipelines](https://developers.home-assistant.io/docs/voice/pipelines/)).
- **Wake word:**
  - On-device, *microWakeWord* runs on ESP32-S3 and Android. Audio goes to the server only after detection, but only a few models exist.
  - On the server, *openWakeWord* receives a continuous audio stream from each satellite. It is more accurate, but load scales per satellite (about 5 concurrent on a Pi 4) and it is English-only.
  - Source for both: [HA: about wake word](https://www.home-assistant.io/voice_control/about_wake_word/).
  - The satellite can also run openWakeWord locally beside itself ([wyoming-satellite](https://github.com/rhasspy/wyoming-satellite)).
- **Client-side VAD and audio enhancement:** clients should run VAD locally and stream only speech ([HA dev docs: pipelines](https://developers.home-assistant.io/docs/voice/pipelines/)). wyoming-satellite offers Silero VAD plus WebRTC AGC and noise suppression ([wyoming-satellite](https://github.com/rhasspy/wyoming-satellite)).
- **Local STT** ([HA local assistant](https://www.home-assistant.io/voice_control/voice_remote_local_assistant/)):
  - *Speech-to-Phrase* is closed-vocabulary and takes under 1 s on a Pi 4.
  - *Whisper* is open-vocabulary. It takes about 8 s on a Pi 4 and under 1 s on a NUC.
- **Local TTS:** *Piper*, a neural TTS that runs at about 1.6 s of audio per second on a Pi 4 ([HA local assistant](https://www.home-assistant.io/voice_control/voice_remote_local_assistant/)).
- **Where services run:** all of these are Wyoming services and can run on any host on the LAN, e.g. Whisper on a GPU box ([HA Wyoming integration](https://www.home-assistant.io/integrations/wyoming/)).
- **Intent and LLM:** a local intent matcher can run first and fall back to the LLM ("Prefer handling commands locally") ([HA: AI personality docs](https://www.home-assistant.io/voice_control/assist_create_open_ai_personality/), [HA blog 2025-09](https://www.home-assistant.io/blog/2025/09/11/ai-in-home-assistant)). A reported follow-up-mode quirk: once the LLM is in a follow-up conversation, later corrections don't go back through local matching ([core#162768](https://github.com/home-assistant/core/issues/162768)).

### Room/presence awareness and output routing
- **Area awareness:** each satellite is assigned an *area*. "Turn on the lights" then targets the satellite's area, and naming another room overrides it ([Year of the Voice ch. 5](https://www.home-assistant.io/blog/2023/12/13/year-of-the-voice-chapter-5)).
- **What "location" means:** it is the *location of the device that heard you*, not of the user. Typed commands from the app don't get it (community report, not primary: [forum](https://community.home-assistant.io/t/turn-on-the-light-intent/677248)).
- **No speaker or person location:** I found no documented speaker identification or per-person presence in Assist's routing **[unverified: absence]**. The LLM tool context does carry the `device_id` of the request ([HA dev docs: LLM API](https://developers.home-assistant.io/docs/core/llm/)).
- **Proactive output:** the `assist_satellite` entity supports `ANNOUNCE` (play TTS/media, return when finished) and `START_CONVERSATION` (announce, then listen for a reply) ([assist_satellite entity](https://developers.home-assistant.io/docs/core/entity/assist-satellite/)). These actions can target an *area*, which hits every satellite in it ([start_conversation action](https://www.home-assistant.io/actions/assist_satellite.start_conversation/)).

### Capability description
- **Wyoming:** the `describe`/`info` response lists services by category (`mic`, `snd`, `wake`, `asr`, `tts`, `satellite`…) ([wyoming README](https://github.com/OHF-Voice/wyoming)).
- **HA satellite entity:** supported-feature flags (ANNOUNCE, START_CONVERSATION), plus available/active wake words with `max_active_wake_words`, a pipeline select entity and a VAD-sensitivity select ([assist_satellite entity](https://developers.home-assistant.io/docs/core/entity/assist-satellite/)).
- **Missing:** no generic "screen/display/camera" capability model exists. Voice is the modality **[unverified: absence]**.

### Extensibility and controlled LLM access
- **Exposure is the permission boundary.** Entities must be explicitly *exposed* per assistant (Assist / Google / Alexa) to protect sensitive devices like locks ([HA: expose devices](https://www.home-assistant.io/voice_control/voice_remote_expose_devices/)). LLM agents can only control or read exposed entities ([OpenAI conversation](https://www.home-assistant.io/integrations/openai_conversation/)).
- **LLM API** ([HA dev docs: LLM API](https://developers.home-assistant.io/docs/core/llm/)):
  - The built-in *Assist API* exposes intents as tools, with no admin actions.
  - `llm.Tool` objects have a JSON schema plus annotations (read-only, destructive, idempotent, open-world).
  - `LLMContext` carries platform, language, assistant and device_id.
  - Integrations can register custom APIs or add tools per request through `llm.py`.
- **MCP server** (HA as server) ([MCP server](https://www.home-assistant.io/integrations/mcp_server/)):
  - Uses Streamable HTTP at `/api/mcp` and `/api/mcp/<api_id>`, with auth by OAuth (IndieAuth) or a long-lived token.
  - Non-Assist APIs require admin.
  - Supports tools, prompts, and a `homeassistant://assist/context-snapshot` resource.
  - Does not support sampling or notifications.
- **MCP client** (HA consuming external MCP servers): it fetches the server's tools over SSE and offers them to LLM conversation agents. It supports tools only ([MCP client](https://www.home-assistant.io/integrations/mcp/)).

## 2. OpenVoiceOS (OVOS) / Neon and HiveMind
- **OVOS message bus** ([OVOS bus](https://openvoiceos.github.io/ovos-technical-manual/100-bus_service/)):
  - WebSocket on `127.0.0.1:8181/core`.
  - Each `Message` has a `type`, `data`, and a `context` holding `session` (lang, STT/TTS prefs, device id), `source` and `destination`.
  - It **broadcasts every message to every component** and does no routing or auth.
  - The docs say never to expose it, and recommend HiveMind for remote access.
- **OVOS modular plugins:** mic, VAD, wake word, STT and TTS. There are also intent pipelines (Adapt, Padatious, Model2Vec, persona/LLM, fallback), PHAL for hardware, and self-hostable STT/TTS/persona servers ([OVOS manual](https://openvoiceos.github.io/ovos-technical-manual/)).
- **HiveMind topology and transport:**
  - A hub (`hivemind-core`) hosts the assistant, and thin satellites (voice, mic-only, browser, ESP32, chat bridges) do I/O only ([HiveMind docs](https://jarbashivemind.github.io/HiveMind-community-docs/)).
  - Messages can ESCALATE up a mesh of hubs or BROADCAST down to many devices ([HiveMind docs](https://jarbashivemind.github.io/HiveMind-community-docs/)).
  - Transports are pluggable: WebSocket :5678 and HTTP :5679 ([HiveMind-core](https://github.com/JarbasHiveMind/HiveMind-core)).
- **HiveMind pairing, crypto and permissions** ([HiveMind-core](https://github.com/JarbasHiveMind/HiveMind-core)):
  - `add-client` issues an access key and password per device.
  - Sessions are E2E-encrypted with a Noise handshake (protocol v3).
  - **Permissions are deny-by-default:** each message type must be granted (`allow-msg`), and admin gets no bypass.
  - Per-client skill and intent blacklists and ESCALATE/PROPAGATE/BROADCAST gates are available.
  - Exact BUS/SHARED_BUS semantics are not in the pages I read **[unverified]**.
- **Neon AI:** an OVOS derivative. Not researched separately **[unverified]**.

## 3. Willow
Willow is an ESP32 voice front end with a separate Willow Inference Server for STT/TTS/LLM, and it has an HA integration folder ([willow repo](https://github.com/toverainc/willow)). I could not confirm its maintenance status or its on-device wake-word details **[unverified]**. It is of low relevance given HA's own ESP32 path.

## 4. Takeaways for hux
- **Integrate with Home Assistant; don't re-implement it.**
  - **Recommended route:** hux as an MCP client of HA's `/api/mcp/assist`. HA's exposure settings then become hux's device-permission boundary for free.
  - **For richer control:** use the WebSocket API ([MCP server](https://www.home-assistant.io/integrations/mcp_server/)).
  - **Optionally the reverse:** hux as an MCP server or conversation agent for HA's LLM agents ([MCP client](https://www.home-assistant.io/integrations/mcp/)).
- **Reuse Wyoming *services*, not Wyoming as hux's node protocol.** Speaking Wyoming to Whisper/Piper/openWakeWord/Speech-to-Phrase gives drop-in local STT/TTS/wake. Wyoming has no auth or encryption, and HA itself moved satellites to the ESPHome API. hux's gateway↔node link needs its own authenticated, encrypted channel.
- **Model pipelines as stages with flexible start/end points,** as HA does with `start_stage`/`end_stage`. A wall tablet does its own wake word and VAD, a voice-only device may stream continuously, and a desktop/phone enters at the text stage.
- **Copy the describe/info handshake for capability discovery,** extended with display/screen count, camera, input types and presence sensors. HA's capability model is voice-only.
- **Room awareness:** HA's "area of the device that heard you" is the minimum viable model. hux should add explicit presence signals (active input device, phone location, HA presence sensors) to route output, e.g. answer on the desktop monitor rather than the wall speaker. Area-targeted announce/start-conversation is a useful primitive to mirror.
- **Look at HiveMind's security model:**
  - per-node keys at pairing
  - Noise-encrypted sessions
  - deny-by-default per-node message/skill whitelists
  This maps well to a gateway with heterogeneous, differently-trusted nodes.
- **Avoid:**
  - OVOS-style unauthenticated broadcast-to-all buses. They rely on localhost-only exposure.
  - Sending every utterance to an LLM. A local-first intent fast path with LLM fallback cuts latency, but the fallback's follow-up state needs care ([core#162768](https://github.com/home-assistant/core/issues/162768)).
  - Building a dependency on archived wyoming-satellite.
- **Tool annotations:** reuse HA's tool annotations (read-only/destructive/idempotent) as hux's confirmation policy, e.g. confirm before destructive actions like unlocking doors.
