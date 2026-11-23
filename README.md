# Shadow Self

Log five daily habits and meet the version of you that does the exact opposite. After seven days, the app
projects thirty days of energy, focus, and mood — for you, and for your Shadow.

## For users

- **Just open the hosted link** — no install, no account.
- Everything you log stays in your browser. Nothing is uploaded.
- New here? Hit **"try with sample data"** on the check-in page to see the whole app in one tap.
- Back up or move your logs anytime in **Settings → Download my data**.
- A habit-awareness toy, not medical or mental-health advice.

## Stack

- `apps/web`: React, Vite, Tailwind, Zustand, Recharts, framer-motion
- `apps/api`: Fastify API for `POST /api/simulation/run`
- `packages/shared`: shared habit definitions, inversion logic, scoring, mock data, and Zod schemas

## Develop

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The web app runs on `http://localhost:5173`. The API runs on `http://localhost:8787` by default.

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## The simulation and AI

The projection math is deterministic; an AI only writes the summary. Pick any supported provider —
**Anthropic, OpenAI, Gemini, or Grok** — either by:

- pasting a key in the app's **Settings → AI narration** — stored only in the browser and used to call the
  provider directly (works with no backend at all), or
- setting `<PROVIDER>_API_KEY` / `<PROVIDER>_MODEL` in `.env` on the optional API (see `.env.example`).

**Everything works without a key** — the API returns a built-in summary generated from the deterministic
projection (the verdict's `"source"` is `"template"`, otherwise the provider name).

## Deploy

The app is **fully static** — the browser computes projections locally and calls the AI provider directly
with the key the user enters in Settings. No backend required.

- **Vercel (free)** — import the repo; `vercel.json` already configures the pnpm build and SPA rewrites.
- **Netlify** — `netlify.toml` does the same.
- Any static host works — build `apps/web` and publish `apps/web/dist` with an SPA fallback to `index.html`.

The optional Fastify API (`apps/api`) is only needed if you want **server-side** keys — deploy it with
`render.yaml`, set `VITE_API_BASE_URL` on the web app, and it will be used when the user has no key of their
own. Without it, the built-in summary still covers that case.

### Server env vars

| Var | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Claude narrative (optional) |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI narrative (optional) |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Gemini narrative (optional) |
| `GROK_API_KEY` / `GROK_MODEL` | Grok narrative — `XAI_API_KEY` also works (optional) |
| `CORS_ORIGIN` | Comma-separated allowlist; unset = allow all (local dev) |
| `RATE_LIMIT_MAX` | Requests/minute per IP (default 10) |
| `API_PORT` / `API_HOST` | Listen address |

## License

MIT — see [LICENSE](LICENSE). If you enable Claude, Anthropic's
[usage policies](https://www.anthropic.com/legal/aup) apply to that feature.
