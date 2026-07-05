# Design Decisions & Trade-offs

## Why Postgres `SELECT FOR UPDATE SKIP LOCKED` over a Redis queue
Chose Postgres-native locking over a separate Redis-based queue to keep job state, execution history, and claim ownership in one transactional store. This avoids dual-write consistency problems (e.g. a job claimed in Redis but the Postgres row not yet updated). `SKIP LOCKED` is the same pattern used by production job systems like Oban (Elixir) and River (Go). Redis is still used, but for what it's actually good at: ephemeral rate-limit counters.

## Why a standalone worker process instead of an in-process queue
Workers are separate Node processes so they can scale horizontally and independently of the API. Each worker polls, claims, and executes without any coordination beyond the shared Postgres claim mechanism — proven safe under concurrency via automated tests.

## Retry backoff: configurable per queue
Rather than a single global retry policy, each queue has its own `RetryPolicy` (fixed/linear/exponential, configurable base/max delay). This mirrors real-world need: a payment webhook queue might want aggressive exponential backoff, while a low-stakes analytics queue might want fixed short retries.

## AI failure summaries: Groq/Llama instead of a fixed provider
Originally scoped for a general LLM call on DLQ transition. Used Groq (Llama 3.3 70B) for its generous free tier and OpenAI-compatible API, keeping the integration provider-agnostic — swapping providers only requires changing `worker/src/services/aiSummary.ts`.

## A real bug we found and fixed via testing
Automated DLQ testing (`test-dlq.ts`) caught a race condition: the job's status was updated to `DEAD_LETTER` *before* the AI summary call and `DeadLetterJob` record creation completed, leaving a window where a job showed dead-lettered with no DLQ record. Fixed by generating the summary first, then wrapping both writes in `prisma.$transaction([...])` so they commit atomically together.

## Known gaps / scope cuts (honest, under time pressure)
- **Stale claim reaper**: if a worker crashes mid-job, that job stays `CLAIMED`/`RUNNING` forever. A production system would need a periodic sweep to requeue jobs whose claiming worker's heartbeat has gone stale. Not built due to time constraints — documented here as a known limitation rather than silently omitted.
- **Queue sharding**: explicitly scoped out early — low payoff for the evaluation timeframe.
- **Event-driven execution** (jobs triggering other jobs on completion): the DAG dependency feature covers the "wait for prerequisite" case; a full pub/sub trigger system was not built separately.
- **WebSocket live updates**: the dashboard currently polls (5s interval on Workers page); true push-based updates were deprioritized in favor of finishing core reliability engineering and both bonus features.

## What we prioritized instead
Given limited time, we prioritized: (1) atomic claiming correctness — proven under real concurrency, not just claimed; (2) full retry/backoff/DLQ lifecycle — proven end-to-end, including a real bug caught and fixed by our own test suite; (3) both bonus features (AI summaries, rate limiting) fully working, not stubbed; (4) a real Dockerized one-command run path; (5) a complete, functional frontend wired to real data rather than a partial implementation of more features.
