<div align="center">

# 🧵 Loom

### A distributed job scheduling system with atomic execution guarantees

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)

Reliable background job processing with zero-duplicate atomic claiming, configurable retry backoff, AI-powered failure triage, and a live dashboard — all running with one command.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Running Locally (Dev Mode)](#running-locally-dev-mode)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [License](#license)

## Overview

Loom is a production-style distributed job scheduler built to demonstrate correct handling of the hard problems in background job processing: **atomic claiming under concurrency**, **configurable retry with backoff**, **dead-letter handling**, and **observability** — backed by a real dashboard, not just an API.

Every reliability claim below is backed by an automated test in [`backend/tests`](backend/tests), not just manual verification.

## Features

| Feature | Status |
|---|---|
| 🔒 Atomic job claiming (`SELECT FOR UPDATE SKIP LOCKED`) — zero duplicate execution under concurrency | ✅ Tested |
| ♻️ Configurable retry policies — fixed / linear / exponential backoff, per queue | ✅ Tested |
| ⚰️ Dead-letter queue with AI-generated failure summaries (Groq / Llama 3.3) | ✅ Tested |
| 🚦 Redis-backed rate limiting | ✅ Tested |
| 🔐 Role-based access control (ADMIN / ANALYST / VIEWER) | ✅ |
| 🔗 Job dependencies (DAG) — jobs wait for prerequisites to complete | ✅ |
| 📊 Full dashboard — queues, jobs, execution history, live worker monitor | ✅ |
| 🐳 One-command Docker Compose run (Postgres + Redis + backend + worker) | ✅ |

## Architecture





**Job lifecycle:**
QUEUED/SCHEDULED → CLAIMED → RUNNING → COMPLETED
│
├─ (retries left) → SCHEDULED (backoff delay) → back to QUEUED
└─ (retries exhausted) → DEAD_LETTER (+ AI summary)

Full diagrams with Mermaid source: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js · Express · TypeScript · Prisma |
| **Database** | PostgreSQL 16 |
| **Cache / Rate Limiting** | Redis 7 |
| **Worker** | Standalone Node.js process |
| **Frontend** | React 19 · Vite · Tailwind CSS · Framer Motion |
| **AI** | Groq API (Llama 3.3 70B) |
| **Infra** | Docker · Docker Compose |

## Quick Start

Requires [Docker](https://www.docker.com/products/docker-desktop/) and a free [Groq API key](https://console.groq.com/keys).

```bash
# 1. Clone the repo
git clone https://github.com/VaibhavXBhardwaj/distributed-job-scheduler.git
cd distributed-job-scheduler

# 2. Add your Groq API key
echo "GROQ_API_KEY=your_key_here" > .env

# 3. Start everything — Postgres, Redis, backend, worker
docker compose up --build -d

# 4. Verify it's running
curl http://localhost:4100/health
# → {"status":"ok","db":"connected","redis":"connected",...}
```

The backend is now live at `http://localhost:4100`.

### Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — register an account and you're in.

## Running Locally (Dev Mode)

For active development without Docker rebuilds:

```bash
# Terminal 1 — start just the databases
docker compose up -d postgres redis

# Terminal 2 — backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Terminal 3 — worker
cd worker
npm install
npx prisma generate
npm run dev

# Terminal 4 — frontend
cd frontend
npm install
npm run dev
```

## Running Tests

Automated tests prove the three hardest reliability guarantees — not just claimed, verified:

```bash
cd backend

npm run test:concurrency   # 10 workers race for 10 jobs → proves zero duplicate claims
npm run test:retry         # forces failures → proves backoff + retry state machine
npm run test:dlq           # exhausts retries → proves DLQ transition + AI summary
npm run test:all           # runs all three
```

> Requires the worker container to be running (`docker compose up -d worker`), since tests create real jobs and wait for the worker to process them.

**Sample output:**
=== TEST: Atomic claim under concurrency ===
Created 10 jobs.
Registered 10 workers.
10 jobs claimed out of 10 workers.
10 unique job IDs among claims.
✅ PASSED: All jobs claimed exactly once, zero duplicates under concurrency.
## API Reference

Full reference with request/response examples: [`docs/API.md`](docs/API.md)

| Resource | Endpoints |
|---|---|
| **Auth** | `POST /auth/register` · `POST /auth/login` |
| **Projects** | `POST /projects` · `GET /projects` · `GET /projects/:id` · `DELETE /projects/:id` |
| **Queues** | `POST /queues` · `GET /queues` · `GET /queues/:id` · `PATCH /queues/:id/status` |
| **Jobs** | `POST /jobs` · `GET /jobs` · `GET /jobs/:id` · `PATCH /jobs/:id/cancel` |
| **Workers** | `POST /workers` · `GET /workers` · `POST /workers/claim` · `POST /workers/:id/heartbeat` |

## Project Structure
distributed-job-scheduler/
├── backend/              # Express API — auth, projects, queues, jobs
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, RBAC, rate limiting
│   │   ├── routes/       # Express routers
│   │   └── lib/          # Prisma + Redis clients
│   ├── prisma/           # Schema + migrations
│   └── tests/            # Automated reliability tests
├── worker/                # Standalone job execution process
│   └── src/
│       ├── services/     # Executor, backoff calculator, AI summaries
│       └── index.ts       # Poll loop, atomic claim, retry/DLQ logic
├── frontend/              # React dashboard
│   └── src/
│       ├── pages/         # Queues, Jobs, JobDetail, Workers
│       ├── components/    # Layout, modals
│       └── lib/           # API client, auth context
├── docs/                  # Architecture, ER diagram, API docs, design decisions
└── docker-compose.yml     # One-command orchestration

## Documentation

| Doc | Contents |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System diagram, job lifecycle, key design decisions |
| [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md) | Full database schema (Mermaid ERD) |
| [`docs/API.md`](docs/API.md) | Complete API reference with examples |
| [`docs/DESIGN_DECISIONS.md`](docs/DESIGN_DECISIONS.md) | Trade-offs, a real race-condition bug found via testing, honest scope cuts |

## License

Licensed under the [MIT License](LICENSE).

---

<div align="center">
Built with ⚡ by <a href="https://github.com/VaibhavXBhardwaj">Vaibhav</a>
</div>
