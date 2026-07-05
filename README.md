# Loom — Distributed Job Scheduler

A distributed job scheduling system with atomic claiming, configurable retry/backoff, dead-letter handling with AI-generated failure summaries, and a full dashboard.

## Quick start

```bash
git clone <this-repo>
cd distributed-job-scheduler
echo "GROQ_API_KEY=your_key_here" > .env
docker compose up --build -d
```

Backend: `http://localhost:4100` · Frontend: run separately (see below) · Health check: `curl http://localhost:4100/health`

## Frontend (dev mode)

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

## Running tests

```bash
cd backend
npm run test:concurrency   # proves atomic claiming under load
npm run test:retry         # proves backoff + retry state machine
npm run test:dlq           # proves DLQ transition + AI summary
npm run test:all           # runs all three
```

Requires the worker to be running (`docker compose up -d worker`) since tests create jobs and wait for the worker to process them.

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis
- **Worker**: standalone Node process, atomic claim via `SELECT FOR UPDATE SKIP LOCKED`
- **Frontend**: React, Vite, Tailwind, Framer Motion
- **AI**: Groq (Llama 3.3) for dead-letter failure summaries

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system diagram, job lifecycle, key decisions
- [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md) — database schema
- [`docs/API.md`](docs/API.md) — full API reference
- [`docs/DESIGN_DECISIONS.md`](docs/DESIGN_DECISIONS.md) — trade-offs, scope cuts, a real bug we found and fixed

## Features

- Atomic job claiming (zero duplicate execution under concurrency — proven via automated test)
- Configurable retry policies (fixed/linear/exponential backoff) per queue
- Dead-letter queue with AI-generated failure summaries
- Redis-backed rate limiting
- Role-based access control (ADMIN/ANALYST/VIEWER)
- Job dependencies (DAG) — jobs wait for prerequisites to complete
- Full dashboard: queues, jobs, job detail with execution history, worker monitor
- One-command Docker Compose run (Postgres + Redis + backend + worker)
