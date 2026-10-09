# System 1 decision models (Jev) and non-chat model types for hux

Researched 2026-10-09. Sources are cited inline. Items marked **[unverified]** come from secondary write-ups or prior knowledge and were not confirmed against a primary source.

## Part 1: Jev

### Identification

**Confidence: high.** "Jev" is **TypeSafe AI's Jev**, which the company calls its first public "System One Model" ([typesafe.ai](https://typesafe.ai), [docs.typesafe.ai/introduction](https://docs.typesafe.ai/introduction)). The name follows Kahneman's split: a fast intuitive judgement layer that sits next to System 2 reasoning LLMs. It launched around 15–16 Sep 2026 ([InfoQ](https://infoq.com/news/2026/10/typesafe-ai-jev-released)). The current version is `jev-1.13.x`.

### What it does

Jev is a **non-generative decision model**. Each call takes a `state` (text or JSON) and a map of typed `questions`. Jev answers all of them in one parallel pass, and each question is evaluated separately against the same state. It returns typed answers with calibrated probabilities instead of prose ([quickstart](https://docs.typesafe.ai/introduction/quickstart)). There are three primitives:

| Type | Input | Output |
|---|---|---|
| `noul` | `instructions` (a yes/no statement) | `noul`: P(true), 0–1 |
| `choice` | `instructions` + `criteria` {key: description} | `choice`, `confidence`, `probabilities` per key |
| `score` | `instructions` + ordered `criteria` list | `score` (index, can fall between levels), `confidence`, `legend`, `probabilities` |

The intended pattern is **confidence-gated routing**: code acts when the answer is above a threshold and escalates to an LLM or a human when it is below. TypeSafe's docs include patterns for intent routing, guardrails for LLMs, RAG passage classification, re-ranking, and function calling ([llms.txt index](https://docs.typesafe.ai/llms.txt)).

### Facts

- **Architecture and size:** Not disclosed. TypeSafe mentions only "a new architecture, a new sampler, and a new training algorithm", which it calls RL for Calibrated Decisions (RLCD) ([typesafe.ai](https://typesafe.ai)).
- **Context:** About 32k tokens ([InfoQ](https://infoq.com/news/2026/10/typesafe-ai-jev-released)). Other secondary sources say 64k with 32k for state **[unverified]**.
- **Can it run locally? No.** Jev has closed weights and is available only through TypeSafe's hosted API. The service runs from the US West Coast, and no EU region is documented **[unverified, secondary]**. Zero data retention is offered to enterprise customers only, according to secondary sources **[unverified]**.
- **Licence:** Proprietary. The service is covered by the ToS and AUP. TypeSafe's GitHub hosts MIT/Apache tooling only **[unverified]**.
- **API:** `POST https://api.typesafe.ai/v1/systemone` with a Bearer key and `model: "jev-latest"` ([quickstart](https://docs.typesafe.ai/introduction/quickstart)). Official SDKs exist for Python (`typesafe-sdk`) and JS (`@typesafe-ai/sdk`). **There is no Rust SDK**, but the JSON wire format is small and easy to call with `reqwest`.
- **Latency and cost:** TypeSafe quotes 70–500 ms end to end, about 0.11 s against 8.6 s for an LLM on its own workflow evals, and claims "193.6x faster" ([typesafe.ai](https://typesafe.ai), [InfoQ](https://infoq.com/news/2026/10/typesafe-ai-jev-released)). Users report a median of about 76 ms and a median speedup of about 7x, not 193x ([InfoQ](https://infoq.com/news/2026/10/typesafe-ai-jev-released), citing OpenChamber). Price is $0.042 per 1M input tokens, with free output.
- **Known weaknesses:** TypeSafe's "Jev 1.13 jaggedness" page lists counting, arithmetic, date comparison, and loss of accuracy on large or noisy state. A wrong answer is still a *valid* typed value, so the format cannot catch it ([InfoQ](https://infoq.com/news/2026/10/typesafe-ai-jev-released)).

### Vendor integrations

- **Vercel AI Gateway:** Model id `typesafe-ai/jev`. Vercel offers a drop-in TypeSafe-compatible base URL (`https://ai-gateway.vercel.sh/typesafe/v1/systemone`), a vendor-neutral "Decision" modality in the AI SDK, and **confidence-based decision fallbacks**: if `confidenceBelow` is hit, the gateway reruns the question on an LLM ([Vercel docs](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe), [changelog](https://vercel.com/changelog/ai-gateway-now-supports-typesafe-clients-and-http-api-for-jev)). Vercel reports Jev reached about 13% of paid Gateway teams in 24 hours **[secondary]**.
- **Netlify AI Gateway** ([changelog](https://www.netlify.com/changelog/typesafe-jev-ai-gateway/)).
- **LangChain:** A `TypeSafeClassifier` with model routing and AutoMode middleware that screens tool calls before execution. **Pydantic AI:** `typesafe:jev-latest`. **Promptfoo:** a provider ([InfoQ](https://infoq.com/news/2026/10/typesafe-ai-jev-released), [pydantic.dev](https://pydantic.dev/docs/ai/models/typesafe.md)).
- **"Jev-compatible" decision models are already emerging as a category:**
  - **Cloudflare Clef** (27B, from Qwen) and **Clef-flash** (9B, from Qwen3.5-9B). Both are **open weights, Apache-2.0** on Hugging Face and on Workers AI. The model card calls them "fully compatible with Jev and SystemOne" ([HF clef-flash](https://huggingface.co/Cloudflare/clef-flash)). Clef-flash reportedly has a median latency of about 39 ms and needs about 41 GB VRAM for 64k context **[secondary]**. GGUF builds for llama.cpp and Ollama are mentioned, but it is unclear whether those keep the joint decision head.
  - **Laya** (Convai Innovations) is hosted on Vercel and is TypeSafe-compatible ([changelog](https://vercel.com/changelog/laya-decision-model-now-available-on-ai-gateway-free-through-october-31)).
  - **JevOS** is a community project: a CPU-only, roughly 630 MB INT8 OpenVINO model (cut-down MiniCPM-1B) that speaks `/v1/systemone`, at about 25–110 ms on a laptop. It appears to support yes/no (`noul`) only, and the licence is unclear ([railway template](https://railway.com/deploy/jevos), [github.com/feder-cr/jev](https://github.com/feder-cr/jev)) **[not vetted]**.

### How it slots into hux

A System 1 layer fits the request front door well. One call per inbound message or event could ask several questions at once:

- `intent` (choice)
- `urgency` (score)
- `contains_personal_data` / `sensitivity_class` (noul/choice)
- `route` (choice: local-small / local-large / remote)
- `is_injection_attempt` (noul, on tool outputs and fetched content)
- `needs_tool` / `auto_approve_tool_call` (noul)

Below a confidence threshold, hux escalates to the System 2 LLM or asks the user.

**The privacy problem:** hosted Jev would see *every* input before any privacy decision has been made, which defeats the purpose of a sensitivity router for a privacy-first assistant. Recommendation:

1. Define a hux-owned `Decide` trait that mirrors the `systemone` wire shape (state + typed questions → probabilities + confidence). This shape is turning into a de facto standard, used by Vercel's Decision API, Clef, Laya, and JevOS.
2. The default backend should be **local**: a small classifier, or Clef-flash/JevOS-class models if the hardware allows. A local LLM with logprob-constrained choice is a workable fallback.
3. Allow hosted Jev only *after* a local gate has cleared the data as non-sensitive, or as a user-opted remote backend.

## Part 2: Non-chat model interactions the adapter layer needs

rig-core 0.44 has provider-agnostic modules for `completion`, `embeddings`, `rerank`, `transcription`, `audio_generation` (TTS), and `image_generation` ([docs.rs/rig-core](https://docs.rs/rig-core/latest/rig_core/)). Which local providers implement each of these was not checked. rig has **no** decision/classifier, wake-word, VAD, or OCR abstraction.

| Interaction | rig covers? | Local runtime / crate (Rust) | Notes |
|---|---|---|---|
| Chat / structured extraction | Yes (completion, extractor) | Ollama / llama.cpp server (via rig provider), `mistral.rs`, candle | Constrained JSON/grammar decoding in llama.cpp is more reliable than prompting **[prior knowledge]** |
| Embeddings | Yes (`embeddings`) | `fastembed` (ONNX via `ort`), candle; `rig-fastembed` companion **[unverified current status]** | [docs.rs/fastembed](https://docs.rs/fastembed) |
| Reranking | Yes (`rerank`, new) | `fastembed::TextRerank` (cross-encoders such as bge-reranker, ONNX) | Local, offline after the first download ([docs.rs/fastembed](https://docs.rs/fastembed)) |
| System 1 decisions (Jev-style) | **No** | HTTP to Jev / Clef / Laya / JevOS (`/v1/systemone`); local Clef-flash via llama.cpp/vLLM; or a custom small classifier via `ort` | hux-owned `Decide` trait (see Part 1) |
| Guard / safety | No (it is just a completion) | Llama Guard (LLM via llama.cpp); Prompt Guard 2 (86M/22M, ONNX via `ort`); Qwen3Guard **[prior knowledge; check licences: Llama licence for Meta models]** | Small injection classifiers run on CPU in milliseconds |
| STT | Yes (`transcription`) | `whisper-rs` (whisper.cpp), sherpa-onnx, candle-whisper **[prior knowledge]** | Streaming STT also needs VAD (Silero VAD via `ort`) |
| TTS | Yes (`audio_generation`) | Piper (ONNX; the current fork is GPL **[verify]**), Kokoro-82M via `ort`, sherpa-onnx **[prior knowledge]** | See `voice-and-home.md` |
| Wake word | No | openWakeWord (ONNX via `ort`), `rustpotter` (pure Rust), Porcupine (commercial) **[prior knowledge]** | Must run always-on, on the edge device |
| Vision / OCR | Partial (multimodal input to completion; `image_generation` for output only) | VLMs via llama.cpp/Ollama (e.g. Qwen-VL class); `ocrs` (pure Rust OCR), Tesseract bindings **[prior knowledge]** | OCR-only is far cheaper than a VLM for documents |

**Implication:** the hux adapter layer should expose capability traits (Complete, Embed, Rerank, Decide, Guard, Transcribe, Speak, WakeWord, See) with per-capability backends. rig should back the capabilities it already covers, and direct `ort`/whisper/HTTP backends should fill the gaps. The local-vs-remote routing policy belongs to each capability, not to each provider.
