# Devpost submission copy

## Project name

Omyear

## Tagline

A personal year book that can show its work.

## Track

Apps for Your Life

## Short description

Omyear turns a birthday questionnaire into a source-linked personal year book. Code
performs deterministic symbolic calculations, OpenAI models write only from registered
evidence, a verifier checks every citation and required section, and a human keeps the
last editorial word.

## Inspiration

Personalized birthday books can feel deeply meaningful, but producing one by hand is
slow and hard to verify. Generic AI readings solve the speed problem by creating a
trust problem: the reader cannot tell what came from them, what was calculated and
what the model invented. Omyear asks whether a personal story can stay warm while also
showing its evidence.

## What it does

Omyear follows one inspectable sequence:

1. validates confirmed facts, goals, birth data and a gift message;
2. calculates the symbolic systems with deterministic code;
3. gives every input and calculation a stable source ID;
4. asks GPT‑5.6 for strict editorial JSON where every interpretive object cites those IDs;
5. verifies citations, exact values, twelve periods, dates, locations and language guardrails;
6. stops at a mandatory human-review gate;
7. compiles the result into a responsive personal book with a visible source ledger.

The public Maya demo is fully synthetic and requires no login. A bilingual English /
Russian questionnaire also runs the sequence live and keeps the result in the current
browser tab.

## How we built it

The web experience uses Astro. Python and Swiss Ephemeris perform deterministic
calendar/astronomical calculations; Node.js orchestrates the run, calls the OpenAI
Responses API, verifies the structured draft and compiles `book.json`. The live flow
uses three parallel `gpt-5.4-mini` Structured Outputs for lower latency; code merges
them and rehydrates every number, date, ID and measured distance before verification.
The evidence demo resolved to `gpt-5.6-sol` and cites 53 of 72 records with zero
source-link or structural errors. Cloudflare Workers protects and streams the API;
Vercel runs the Node and Python functions.

Codex helped audit and generalize the existing handcrafted project, design the schemas
and safety boundary, implement the engine and verifier, build the provenance UI, run
responsive browser QA, and prepare this sanitized submission. The owner chose the
product boundary and retained every final editorial decision.

## Challenges

The hardest part was deciding what the model must never own—and making a full book fit
inside serverless latency limits. We split editorial generation into parallel,
source-filtered chapters and kept the edge connection alive with SSE heartbeats.
Calculations had to remain repeatable, biography had to remain questionnaire-bound,
and symbolic interpretation had to stay visibly separate from fact. We also separated
the public demo from a private workspace so no recipient data or old Git history could
leak into judging.

## Accomplishments

- Complete questionnaire-to-book run instead of a prompt demo.
- Bilingual RU/EN questionnaire, generation progress and private browser result.
- Source IDs on every interpretive object and exact-value post-generation checks.
- One correctly surfaced cross-framework human-review flag.
- Public in-product provenance with model and response ID.
- Synthetic data, zero private photos and reproducible offline E2E.

## What we learned

Structured Outputs solve shape, not truth. Useful personalization needs three separate
contracts: what the person confirmed, what code calculated and what the model is
allowed to interpret. The human-review boundary becomes clearer once those layers are
explicit.

## What is next

Add an editorial review workspace and private account/deployment isolation per
recipient. The calculation/verifier layer can also become an
evaluation harness for comparing prompt and model changes without losing provenance.

## Built with

Codex, GPT‑5.6 Sol, GPT‑5.4 mini, OpenAI Responses API, Structured Outputs, Astro,
Node.js, Python, Swiss Ephemeris, Cloudflare Workers/Pages, Vercel, HTML and CSS.

## Gallery order

1. `docs/screenshots/01-product-home.png` — product promise.
2. `docs/screenshots/02-pipeline.png` — seven-stage algorithm and proof counts.
3. `docs/screenshots/03-maya-demo.png` — synthetic book cover.

## Add before submitting

- Demo: `https://omyear.pages.dev`
- Repository: `https://github.com/valery-om/omyear`
- YouTube: `[PUBLIC VIDEO URL]`
- Codex `/feedback` session ID: `[SESSION ID]`
