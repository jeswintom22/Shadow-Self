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

## The simulation and Claude

Set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` in `.env` to have Claude write the projection narrative.
**Everything works without a key** — without one, the API returns a built-in summary generated from the
deterministic projection (the verdict is marked `"source": "template"` vs `"claude"`).

## Deploy

The repo ships with ready-to-use configs:

- **Web → Netlify** (`netlify.toml`): import the repo, set `VITE_API_BASE_URL` to your API URL. Any static
  host works — build `apps/web` and publish `apps/web/dist` with an SPA fallback to `index.html`.
- **API → Render** (`render.yaml`): import the repo as a Blueprint. Set `CORS_ORIGIN` to your site's URL and
  optionally `ANTHROPIC_API_KEY`. Health check is `GET /health`.

### Server env vars

| Var | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Claude narrative (optional) |
| `CORS_ORIGIN` | Comma-separated allowlist; unset = allow all (local dev) |
| `RATE_LIMIT_MAX` | Requests/minute per IP (default 10) |
| `API_PORT` / `API_HOST` | Listen address |

## License

MIT — see [LICENSE](LICENSE). If you enable Claude, Anthropic's
[usage policies](https://www.anthropic.com/legal/aup) apply to that feature.
