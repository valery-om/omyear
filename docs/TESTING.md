# Testing Omyear

The public experience requires no account, payment or private information.

## Recommended judge path

1. Open <https://app.omyear.com/?lang=en>.
2. Open <https://app.omyear.com/0811> to read Maya's complete synthetic book.
3. Browse the portrait, year theme, twelve chapters, places and practices.
4. Near the end, open **How this book was made**.
5. Confirm the resolved model is `gpt-5.6-sol`, then expand the source ledger.
6. Open <https://app.omyear.com/try/?lang=en>, choose **Use Maya's sample** and start a
   live generation.
7. Switch to Russian with the language control if you want to verify the bilingual
   flow.
8. Open <https://app.omyear.com/pipeline> for the seven-stage implementation view.

The live endpoint is rate-limited to one generation per minute per IP. Allow up to
three minutes for a complete book. Questionnaire and result data remain in the current
tab and are not written to a database.

## What a successful run demonstrates

- the questionnaire is validated before generation;
- deterministic calculations complete before model prose;
- GPT‑5.6 returns strict editorial JSON with source IDs;
- each parallel schema enumerates the source IDs that segment may return;
- exact dates, numbers, IDs and distances are restored by code;
- the verifier checks citations, structure, twelve periods, locations and language;
- the result renders as a complete responsive book;
- the terminal state still requires a human editorial decision.

## Local verification

Prerequisites: Node.js 20.19+ (or 22.12+), Python 3.11+ and `pyswisseph`.

```bash
python3 -m pip install pyswisseph
npm --prefix web install
npm run check
npm run dev
```

Open <http://localhost:4321>.

`npm run check` performs:

- eight deterministic pipeline assertions;
- the full offline questionnaire-to-book fixture run;
- an Astro production build;
- Cloudflare Worker type-check and deploy dry-run;
- a public-repository secret, PII and private-file audit;
- dependency security audits for the root and web packages.

No API key is required to inspect the included GPT‑5.6 evidence or run fixture tests.
To perform a new model run, copy `.env.example` to `.env.local`, add an OpenAI Platform
key locally and follow the command in the root README. `.env.local` and all run
directories are ignored by Git.

## Included evidence

- `evidence/gpt-5.6-run.json` — sanitized model and response metadata for Maya.
- `evidence/live-bilingual-runs.json` — sanitized current GPT‑5.6 production QA in English and Russian.
- `web/src/data/people/maya-demo.json` — the complete synthetic book and provenance.

The included evidence demo contains 72 registered records, cites 53 and has no unknown
source IDs or structural errors. One cross-framework synthesis is intentionally left
for human review.

The current bilingual production runs resolved to `gpt-5.6-terra`, completed in 27.6
and 33.6 seconds, and returned zero source-link or structural errors. The Russian
verifier surfaced one content warning for human review rather than hiding it.
