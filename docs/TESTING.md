# Testing instructions for judges

## Deployed demo

1. Open `/try`, switch between English and Russian, and use the synthetic Maya button.
2. Open `/result?demo=maya` to inspect the live-result renderer without an API call.
3. Open `/pipeline` to see the sequence and verification counts.
4. Open `/0811` to read Maya’s synthetic generated book. No password is required.
5. Scroll to **How this book was made**.
6. Confirm `gpt-5.6-sol`, 72 records, 53 cited sources and 0 source-link errors.
7. Expand **Open the source ledger** to inspect exact inputs and calculations.

## Local demo

```bash
python3 -m pip install pyswisseph
npm --prefix web install
npm run check
npm run dev
```

Open `http://localhost:4321/pipeline` and `http://localhost:4321/0811`.

`npm run check` runs eight deterministic assertions, full offline artifact E2E, Astro build,
the public-repository secret/PII/file audit, and the dependency security audit. No API key is needed to view the
included GPT‑5.6 artifact or run fixture tests.

The sanitized production QA snapshot for both questionnaire languages lives at
`evidence/live-bilingual-runs.json`.
