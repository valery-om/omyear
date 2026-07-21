# Devpost submission copy

Copy-ready English text for the OpenAI Build Week submission. This copy is grounded
in the founder interview and should receive one final read-aloud pass before it is
submitted, so the finished entry still sounds unmistakably like Valeria.

## Project name

Omyear

## Elevator pitch

A personal year book to return to whenever you need your wings back.

## Category / track

Apps for Your Life

## Short description

Omyear is a personal interactive book for the year between birthdays—a place to
return to for perspective, encouragement, and renewed confidence. It brings five
symbolic self-discovery systems together with a person’s real context, turning
fragmented readings into one coherent, source-linked experience.

## Inspiration

I made the first Omyear for my best friend, who lives far away. I wanted to give her
something she could keep: a calm place entirely about her, where she could return on a
difficult day and still feel my support. A reminder of her strengths, her
possibilities and how deeply she is loved.

Friends who received early handmade editions told me they returned to a particular
month when life felt uncertain. Seeing change reflected there did not predict what
would happen, but it helped them meet it with more curiosity and confidence.

That is the heart of Omyear. Modern life gives us many reasons to doubt ourselves and
very few places devoted entirely to remembering who we are. Omyear is for reflective,
curious people who find meaning in both structured knowledge and symbolism. It can be
a gift that says “I believe in you,” or a gift we choose for ourselves.

Most self-discovery readings are generic, fragmented, or fatalistic. They give people
separate interpretations and leave them to connect everything on their own. Omyear
turns five symbolic systems and a person’s chosen real-life context into one coherent,
caring book—designed to restore perspective and agency rather than prescribe a future.

## What it does

Omyear is a personal interactive book for the year between birthdays—a place to
return to for perspective, encouragement, and renewed confidence. The reader shares
confirmed facts, goals, values, birth data, important locations and the questions
that are alive for them now.

Deterministic code calculates numerology, the 22-Arcana Matrix, astrology, Human
Design and astrocartography. GPT‑5.6 weaves only registered results and the context a
person chooses to share into one coherent editorial voice. The finished experience
includes a personal portrait, themes for the year, twelve monthly chapters, places,
practices and reflection prompts.

The book is designed to be revisited. It does not tell a person what must happen or
what they must do. It offers another angle, names strengths that may have been
forgotten and turns difficult themes into questions with agency.

Every generated interpretation can show what it was allowed to use. Inputs and
calculations receive stable source IDs, the model can select only IDs enumerated in
its schema, deterministic checks reject altered values, and a human keeps the last
editorial word.

The public Maya edition is entirely synthetic and requires no login. The live creation
flow works in English and Russian and keeps the generated result only in the current
browser tab.

## How we built it

An Astro website presents the book. Behind it, Python and Swiss Ephemeris handle
astronomical calculations while Node.js orchestrates the run, builds an immutable
source registry and calls the OpenAI Responses API. Three parallel `gpt-5.6-terra`
Structured Output calls create different parts of the book. Code then merges them and
restores exact dates, numbers, IDs and measured distances before verification.

The verifier checks citations, required sections, twelve consecutive periods,
locations and language. A human-review gate remains mandatory even when every
automated check passes. Approved data compiles into the warm, responsive format of
the original handmade editions.

Cloudflare Pages serves the product, a Cloudflare Worker protects and streams the API,
and Vercel runs the Node/Python backend. The private result remains in the current
browser tab rather than a database. Before any paid model call, a strongly consistent
edge guard reserves one of eight daily live-generation slots and rejects accidental
duplicates. Each of the three editorial calls also has a 6,000-token output ceiling,
so the public demo cannot create an unbounded API bill.

GPT‑5.6 interprets and connects the registered material inside the product. Codex was
my development partner during Build Week: it helped turn the original handmade idea
into a working product by designing the pipeline, schemas, calculations, verification,
interface and tests, then preparing the public submission.

GPT‑5.6 matters because the difficult part is not producing one more isolated reading.
It is finding useful connections across a large registered evidence set while keeping
the result warm, coherent and faithful to the person. The model handles that bounded
synthesis; code owns the calculations and verification.

I kept the product and editorial decisions: symbolic systems remain prompts for
reflection rather than scientific or predictive claims; calculations stay
deterministic; the public person is synthetic; and the model never approves its own
work.

## Challenges

The hardest challenge was preserving warmth inside clear boundaries. Five
self-discovery systems can easily become unrelated reports, and generated prose can
sound convincing even when it has invented the person inside it. I wanted synthesis
without fabrication and optimism without fatalism.

A complete book is also much larger than a typical chat response. We split generation
into source-filtered sections, used strict schemas, streamed progress and restored
deterministic values after generation. We built the public demo from scratch with
synthetic data, keeping every real recipient's history and photographs private.

## Accomplishments that we're proud of

- Turned a one-off handmade gift into a repeatable questionnaire-to-book product.
- Built a complete bilingual generation flow, not a prompt or static mock-up.
- Combined five symbolic frameworks into one coherent narrative while keeping each
  generated claim traceable to supplied or calculated material.
- Completed current GPT‑5.6 production runs in both English and Russian with zero
  source-link or structural errors.
- Kept real recipient data out of the public repository and demo.
- Preserved the most important feature of the original gift: a beautiful place a
  person can return to when they need perspective and encouragement.

The included GPT‑5.6 evidence run contains 72 registered records, cites 53 of them and
has no unknown citations or structural errors. One cross-framework passage is
correctly left for human review rather than silently approved.

## What we learned

Trust needs imagination and clear boundaries. Structured Outputs guarantee shape,
not truth. Useful personalization needs three separate contracts: what the person
confirmed, what code calculated and what the model may interpret. With those layers
explicit, AI can connect a large amount of material into a story that still belongs
to the person reading it.

I also learned that the emotional center of the product is not prediction. It is
return. The book matters when someone opens it months later and remembers that they
still have choices, strengths and people who believe in them.

## What's next for Omyear

Omyear will grow into a small family of birthday and life-cycle reflection tools: a
pre-birthday workbook, guided practices, a more intimate self-gift flow and a gifting
flow that lets someone add their own message of care.

The next product layer is a private space where a person can review, annotate and keep
their editions over time. The verification layer can also become an evaluation
harness for improving prompts and models without losing the book's boundaries.

The long-term idea is simple: help more people keep a small inner flame of kindness
and self-belief alive—and make it easier to pass that care to someone else.

## Built with

Codex, GPT‑5.6 Sol, GPT‑5.6 Terra, OpenAI Responses API, Structured Outputs, Astro,
Node.js, Python, Swiss Ephemeris, Cloudflare Workers, Cloudflare Pages, Vercel, HTML
and CSS.

## Testing instructions

No account, payment, API key or real personal data is required.

1. Open `https://app.omyear.com/?lang=en` for the product promise.
2. Open `https://app.omyear.com/0811` for Maya's complete synthetic edition.
3. Open `https://app.omyear.com/try/?lang=en`, select **Use Maya's sample**, confirm
   permission and generate a new private result.
4. Open `https://app.omyear.com/pipeline` and the in-book source ledger to inspect how
   calculations, GPT‑5.6 synthesis and verification remain separated.

The result stays in the current browser tab. English and Russian use the same
pipeline. The endpoint is rate-limited to one generation per minute per IP.

## Why it fits the judging criteria

- **Technological Implementation:** Codex helped build a non-trivial, source-bounded
  pipeline with deterministic calculations, parallel GPT‑5.6 Structured Outputs,
  verification, compilation, tests and protected deployment.
- **Design:** Omyear is a complete bilingual product experience—from questionnaire
  and streamed progress to a responsive interactive book—not a prompt demo.
- **Potential Impact:** it addresses a specific problem for reflective people who
  receive generic, fragmented or fatalistic readings and want perspective without
  surrendering agency.
- **Quality of the Idea:** it turns five usually separate symbolic systems and a
  person's real context into one caring, traceable book designed to be revisited.

## Repository license

Omyear is published under `AGPL-3.0-or-later`, matching the license of the
`pyswisseph` calculation dependency. Third-party attribution and source links are in
`THIRD_PARTY_NOTICES.md`.

## Submission links

- Product: `https://app.omyear.com/?lang=en`
- Judge test: `https://app.omyear.com/try/?lang=en`
- Synthetic Maya book: `https://app.omyear.com/0811`
- How it works: `https://app.omyear.com/pipeline`
- Repository: `https://github.com/valery-om/omyear`
- YouTube: `[ADD PUBLIC YOUTUBE URL AFTER UPLOAD]`
- Codex `/feedback` Session ID: `019f7e5e-e8c5-7b92-8071-156ffe666acf`

## Gallery order

1. `devpost-thumbnail-landing-final.png` — the emotional product promise.
2. `five-systems-desktop-en.png` — the five lenses and technical boundary.
3. `03-maya-demo.png` — Maya's complete synthetic book.
4. `02-pipeline.png` — the story-to-book pipeline and verification boundary.

## Thumbnail

Use `docs/screenshots/devpost-thumbnail-landing-final.png` (3:2, under 5 MB). It is a
clean capture of the product itself and keeps the submission visually consistent.
