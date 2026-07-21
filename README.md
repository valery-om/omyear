# Omyear

**A personal interactive book for the year between birthdays—a place to return to for
perspective, encouragement, and renewed confidence.**

Omyear brings five symbolic self-discovery systems together with a person's real
context, turning fragmented readings into one coherent, source-linked experience. It
begins with their goals, values, questions and turning points, then becomes a warm
personal book they can revisit throughout the year.

Most self-discovery readings are generic, fragmented or fatalistic. Omyear is designed
to restore perspective and agency rather than prescribe a future.

The first Omyear was a handmade gift for a best friend living far away: a place she
could open on a difficult day and still feel supported. Early recipients said they
returned to particular chapters when life felt uncertain. The book did not tell them
what would happen; it helped them meet change with more perspective and confidence.

That emotional purpose remains the product boundary. Omyear is made for reflection,
not prediction. Deterministic code owns the calculations, GPT‑5.6 synthesizes only
registered material, a verifier checks the result, and a human keeps the final
editorial word.

This is the sanitized OpenAI Build Week 2026 submission repository. It contains one
fully synthetic person, Maya, and no customer photos, private recipient books, music,
or production data.

## Judge it in three minutes

No account, payment or private data is required.

1. Open the [product](https://app.omyear.com/?lang=en) to understand the promise.
2. Read [Maya's Omyear](https://app.omyear.com/0811), a complete synthetic edition.
3. Use [Create yours](https://app.omyear.com/try/?lang=en) to test the bilingual live flow.
4. Inspect [How it works](https://app.omyear.com/pipeline) and the in-book source ledger.

Detailed judge instructions are in
[`docs/JUDGING_GUIDE.md`](docs/JUDGING_GUIDE.md). Local setup takes four commands below.

## From handmade gift to working product

Omyear's visual language and several handcrafted private books existed before Build
Week. The work submitted here is the repeatable product added after July 13: strict
schemas, generalized calculations, GPT‑5.6 generation, deterministic verification,
book compilation, bilingual creation, protected deployment, a synthetic public demo
and reproducible tests.

The explicit before/after boundary is documented in
[`docs/BUILD_WEEK_CHANGELOG.md`](docs/BUILD_WEEK_CHANGELOG.md).

## How it works

```mermaid
flowchart LR
  A["Structured questionnaire"] --> B["Deterministic calculations"]
  B --> C["72-record source registry"]
  C --> D["Parallel OpenAI Structured Outputs"]
  D --> E["Deterministic verifier"]
  E --> F["Human review gate"]
  F --> G["Astro personal book"]
```

Each run keeps:

```text
input.json → calc.json → prompt.txt → draft.json → verification.json
           → model-response.json → book.json → run-report.json
```

The terminal state is intentionally `needs_human_review`. A successful model call is
never treated as permission to publish a personal reading.

## What the OpenAI model does—and does not do

The model has one bounded role: transform the supplied source registry into editorial
JSON conforming to [`draft.schema.json`](pipeline/schemas/draft.schema.json). Every
interpretive object must include exact `sourceIds`, a confidence value and a review
flag.

The model does **not** calculate charts, invent biography, approve its own output, or
deploy a book. `calculate.py`, `verify.mjs` and the human review boundary own those
responsibilities.

The included public demo was produced by the Responses API with resolved model
`gpt-5.6-sol`. Sanitized metadata is in
[`evidence/gpt-5.6-run.json`](evidence/gpt-5.6-run.json), and the response ID is also
visible in Maya’s in-product provenance section.

The public creation flow uses three parallel `gpt-5.6-luna` Structured Output calls
for portrait, year and practice chapters. Code then merges the segments, restores all
deterministic fields and verifies the complete draft. The pre-generated evidence demo
remains the original single-pass `gpt-5.6-sol` run.

The production path also has explicit cost guardrails: each editorial segment has a
48 KB prompt ceiling and a 6,000-token output ceiling, while the edge gateway accepts at most six new books per UTC
day, and a canonical request fingerprint blocks accidental duplicate generations for
five minutes. A strongly consistent Durable Object serializes reservations before the
backend is called, while per-IP rate limiting remains in place. Token totals, including
cached input and reasoning tokens, are recorded without logging questionnaire content.

## How Codex contributed

Codex helped turn the original one-off gift into a repeatable, testable product:

- audited the pre-existing handcrafted Omyear project and separated new work;
- designed the strict input and editorial schemas;
- generalized the deterministic calculation engine;
- implemented the Responses API adapter, source registry, verifier and compiler;
- created the synthetic demo and visible provenance ledger;
- built and tested the bilingual questionnaire, streamed progress and private result renderer;
- tested desktop/mobile behavior and added self-contained E2E coverage;
- prepared the sanitized public repository and submission documentation.

Codex did not invent the product or make its editorial decisions. Founder Valeria
Omelnitskaya chose the audience, experience and boundaries: calculations stay
deterministic, model prose stays source-bounded, symbolic frameworks are presented as
reflection rather than prediction, the public demo uses synthetic data, and a person
always approves the final book.

## Local setup

Prerequisites: Node.js 20.19+ (or 22.12+), Python 3.11+, and `pyswisseph`.

```bash
python3 -m pip install pyswisseph
npm --prefix web install
npm run check
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

### Rehearse without an API call

```bash
node pipeline/run.mjs --input pipeline/examples/maya.json --provider fixture
```

The fixture exercises the complete orchestration but is explicitly labelled
`fixture`; it is not evidence of GPT‑5.6 usage.

### Run GPT‑5.6

```bash
cp .env.example .env.local
# Add an OpenAI Platform API key to .env.local, then:
node --env-file=.env.local pipeline/run.mjs \
  --input pipeline/examples/maya.json \
  --provider openai --model gpt-5.6-sol
```

`.env.local` and all `pipeline/runs/` directories are ignored by Git.

## Submission gallery

- [`devpost-thumbnail-landing-final.png`](docs/screenshots/devpost-thumbnail-landing-final.png) — recommended 3:2 thumbnail and product promise;
- [`five-systems-desktop-en.png`](docs/screenshots/five-systems-desktop-en.png) — five lenses and the code/model/source boundary;
- [`03-maya-demo.png`](docs/screenshots/03-maya-demo.png) — synthetic generated book;
- [`02-pipeline.png`](docs/screenshots/02-pipeline.png) — sequential algorithm.

## Submission materials

- [`docs/DEVPOST_SUBMISSION.md`](docs/DEVPOST_SUBMISSION.md) — copy-ready project story;
- [`docs/JUDGING_GUIDE.md`](docs/JUDGING_GUIDE.md) — the shortest path through the product;
- [`docs/VIDEO_SCRIPT.md`](docs/VIDEO_SCRIPT.md) — the under-three-minute demo script;
- [`docs/SCREENCAST_RUNBOOK.md`](docs/SCREENCAST_RUNBOOK.md) — exact recording clicks and cuts;
- [`docs/SUBMISSION_CHECKLIST.md`](docs/SUBMISSION_CHECKLIST.md) — final publishing checklist.

## Verification snapshot

The included GPT‑5.6 demo currently has 72 known records, 53 distinct sources cited,
zero invalid source IDs, missing citations, structural errors or language warnings,
and one correctly surfaced human-review flag for a three-framework synthesis.

Fresh production questionnaire runs also completed with `gpt-5.6-terra`: English in
27.6 seconds and Russian in 33.6 seconds. Both returned 12 months with zero source-link
or structural errors. Sanitized metadata is in
[`evidence/live-bilingual-runs.json`](evidence/live-bilingual-runs.json).

```bash
npm run test
npm run build
npm run audit
```

## Safety and privacy

All included systems are presented as symbolic self-reflection frameworks, not
scientific findings or event predictions. Omyear does not provide medical, legal,
mental-health, credit or investment advice.

Real questionnaires and run artifacts can contain sensitive personal data. They do
not belong in this repository. See [`SECURITY.md`](SECURITY.md) and
[`docs/TESTING.md`](docs/TESTING.md). Static hosting instructions are in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## License

Copyright (C) 2026 Valeria Omelnitskaya.

Omyear is free software licensed under the
[GNU Affero General Public License v3.0 or later](LICENSE) (`AGPL-3.0-or-later`).
If you modify Omyear and make the modified version available over a network, the
AGPL requires you to offer the corresponding source code to its users.

The deterministic calculation layer uses `pyswisseph`, which is also distributed
under the GNU Affero General Public License. See
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for attribution and source links.
