# Shadow Self

Shadow Self is a local-first habit tracking and projection app. Log sleep, exercise, water, screen time, and social time; the app computes an inverted Shadow log, shows score divergence, and can call a Fastify backend for Claude-powered 30-day simulations.

## Stack

- `apps/web`: React, Vite, Tailwind, Zustand, Recharts
- `apps/api`: Fastify API for `POST /api/simulation/run`
- `packages/shared`: shared habit definitions, inversion logic, scoring, mock data, and Zod schemas

## Setup

```bash
pnpm install
cp .env.example .env
```

Set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` in `.env` before running a real simulation. Everything except the Claude simulation works without an API key.

## Scripts

```bash
pnpm dev
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

The web app runs on `http://localhost:5173`. The API runs on `http://localhost:8787` by default.
