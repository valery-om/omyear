# Production deployment handoff

Omyear uses three public layers:

- Cloudflare Pages serves the static Astro site at `https://app.omyear.com`, with
  `https://omyear.pages.dev` retained as the platform fallback;
- a Cloudflare Worker at `https://omyear-api.om777-ai.workers.dev` validates origins,
  enforces request-size and per-IP rate limits, and streams generation events;
- Vercel runs the Node editorial function and private Python/Swiss Ephemeris calculator
  behind `https://omyear-backend.vercel.app`.

The browser never receives either secret. `OPENAI_API_KEY` and
`BACKEND_SHARED_SECRET` are Vercel production secrets; the same shared secret is a
Cloudflare Worker secret. Questionnaire and generated-book data are not written to a
database. The result is stored only in the current tab's `sessionStorage`.

## Static site

```bash
npm install
npm --prefix web install
SITE_URL=https://app.omyear.com npm run build
npm run deploy:pages
```

## Backend

The repository is linked to the Vercel project `omyear-backend`.

```bash
vercel --prod
```

Required production environment variables:

- `OPENAI_API_KEY` — funded OpenAI Platform project key;
- `BACKEND_SHARED_SECRET` — a random value also installed as the Worker secret.

## Gateway

```bash
npm --prefix worker run check
cd worker && npx wrangler deploy
```

`worker/wrangler.jsonc` contains only public bindings. Never commit `.dev.vars`.

## Smoke test

- `/` returns the bilingual product page;
- `/try` validates both languages and four unique places;
- `/result?demo=maya` renders 13 book sections, 12 months and 72 source rows;
- `/pipeline` returns the seven-stage explanation;
- `/0811` returns Maya's synthetic evidence demo;
- Worker `OPTIONS /generate` returns the production CORS origin;
- Worker `POST /generate` streams progress and either a verified book or a safe error;
- `/og.png` is available.

Run `npm run check` immediately before deployment. Keep `.env.local`,
`pipeline/runs/`, private questionnaires and real recipient media outside the public
repository and hosting upload.
