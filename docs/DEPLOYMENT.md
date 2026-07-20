# Static deployment handoff

Omyear builds to plain static files. No API key, server process, database or private
run directory is required in production.

```bash
npm --prefix web install
SITE_URL=https://your-final-domain.example npm run build
```

Publish `web/dist/` as the site root. The `SITE_URL` value is used for canonical and
Open Graph URLs, so rebuild after the final public URL is known.

After deployment, smoke-test:

- `/` returns the product page;
- `/pipeline` returns the seven-stage explanation;
- `/0811` returns Maya’s synthetic book;
- `/og.png` is available;
- the source ledger on `/0811#provenance` shows the response ID and verification counts.

Run `npm run check` immediately before the deployment build. Keep `.env.local`,
`pipeline/runs/`, private questionnaires and real recipient media outside the public
repository and hosting upload.
