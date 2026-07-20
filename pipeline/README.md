# Omyear sequential pipeline

This directory turns a strict questionnaire into a source-linked Omyear book while
keeping arithmetic, generation and editorial approval separate.

## Contract

Input: `examples/maya.json`, validated against `schemas/input.schema.json`.

Output for each run:

| Artifact | Purpose |
|---|---|
| `input.json` | Immutable copy of the questionnaire |
| `calc.json` | Deterministic calculations and complete source registry |
| `prompt.txt` | Exact source-bounded editorial request |
| `draft.json` | Structured editorial output |
| `model-response.json` | GPT-5.6 response/model/usage metadata (OpenAI provider only) |
| `verification.json` | Citation, structure and language checks |
| `book.json` | Data compiled for the existing Astro book template |
| `run-report.json` | Stage timestamps, statuses and artifact paths |

The terminal status is deliberately `needs_human_review`. Generation success never
means publication approval.

## Providers

`openai` is the submission/production path and the default. It calls
`POST /v1/responses` with `gpt-5.6-sol`, medium reasoning, `store: false`, and a
strict JSON Schema output. It requires `OPENAI_API_KEY` in the process environment.
The key is never written to a run artifact.

`fixture` produces a deterministic synthetic draft. It exists for tests, UI work and
offline rehearsal; its output is clearly labelled `fixture` and is not evidence of a
GPT-5.6 run.

`codex` is a development fallback using `codex exec`. It is not used as submission
evidence; the Responses API path is the reproducible final path and records response
metadata directly.

## Source boundary

`engines/calculate.py` emits records such as:

```json
{
  "id": "calc.period.4",
  "kind": "calculation",
  "label": "Solar-year chapter 4",
  "value": {
    "index": 4,
    "solarHouse": 4,
    "start": "2027-02-08",
    "endExclusive": "2027-03-08"
  },
  "method": "12 sequential solar-year chapters"
}
```

Every interpretive object in `draft.json` must contain `sourceIds`, `confidence` and
`needsReview`. The verifier rejects unknown IDs, missing citations, missing or
misordered chapters, and candidate-location mismatches. It also surfaces language
warnings and all review flags.

## Commands

```bash
# Fast repeatable test
node --test pipeline/tests/pipeline.test.mjs

# Complete offline build, including installing Maya and building Astro
node pipeline/run.mjs --input pipeline/examples/maya.json --provider fixture

# Real GPT-5.6 run
node --env-file=.env.local pipeline/run.mjs \
  --input pipeline/examples/maya.json \
  --provider openai --model gpt-5.6-sol
```

Useful flags:

- `--run-dir <path>` chooses an explicit artifact directory.
- `--skip-build` skips `npm run build` in `web/`.
- `--no-install` does not copy the compiled book into `web/src/data/people/`.

## Privacy

The Maya sample is invented. Do not commit real questionnaires or generated run
directories. A public hackathon repository/deployment should contain only the
synthetic demo and code; private recipient photos and books belong in a separate
private workspace.
