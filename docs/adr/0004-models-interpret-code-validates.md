# Models interpret input; code only validates typed boundaries

hux code never parses what people type or say (no regexes, keyword lists, command prefixes or heuristics) and never repairs model output. Every interpretation (intent, times, "this app", suspected prompt injection) is made by a model, and LLM quirks are handled by the SDK. Code checks tool arguments and structured output against schemas and policy, and returns failures to the model or the Member rather than patching them. This deliberately rejects the common pattern of regex fast paths and output fix-ups: those break on other languages and voice transcripts, and they hide model problems that should be fixed by changing models, prompts or schemas.

## Consequences

- Relative times ("tomorrow at 9") are turned into absolute ones by the model, using the time in the Context envelope, and the Gateway only validates the result.
- Fast paths are made with cheap, fast Decisions, not with code heuristics.
