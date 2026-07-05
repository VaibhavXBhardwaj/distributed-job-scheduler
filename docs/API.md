# API Reference

Base URL: `http://localhost:4100/api`

All endpoints except `/auth/*` require `Authorization: Bearer <token>`.

## Auth

### POST /auth/register
```json
{ "name": "Jane", "email": "jane@co.com", "password": "secret123", "organizationName": "Acme" }
```
Returns `{ token, user, organization }`. First user of a new org gets `ADMIN` role.

### POST /auth/login
```json
{ "email": "jane@co.com", "password": "secret123" }
```
Returns `{ token, user }`.

## Projects

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/projects` | any | Create a project |
| GET | `/projects` | any | List projects in your org |
| GET | `/projects/:id` | any | Get project + queues |
| DELETE | `/projects/:id` | ADMIN | Delete a project |

## Queues

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/queues` | ADMIN, ANALYST | Create queue + retry policy |
| GET | `/queues?projectId=` | any | List queues |
| GET | `/queues/:id` | any | Get queue + job status stats |
| PATCH | `/queues/:id/status` | ADMIN, ANALYST | `{ "action": "pause" \| "resume" }` |

Create body:
```json
{
  "projectId": "uuid",
  "name": "Email Queue",
  "concurrencyLimit": 10,
  "maxRetries": 3,
  "backoffStrategy": "EXPONENTIAL",
  "baseDelayMs": 1000,
  "maxDelayMs": 60000
}
```

## Jobs

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/jobs` | ADMIN, ANALYST | Create a job (rate limited: 30/min) |
| GET | `/jobs?queueId=&status=` | any | List jobs |
| GET | `/jobs/:id` | any | Get job + executions + logs + DLQ entry |
| PATCH | `/jobs/:id/cancel` | ADMIN, ANALYST | Cancel a queued job |

Create body:
```json
{
  "queueId": "uuid",
  "name": "Send Welcome Email",
  "type": "IMMEDIATE",
  "payload": { "to": "user@example.com" },
  "priority": 0,
  "maxAttempts": 3,
  "scheduledAt": "2026-07-05T10:00:00Z",
  "cronExpression": "0 * * * *",
  "dependsOnJobIds": ["uuid-of-prerequisite-job"]
}
```
`type` is one of `IMMEDIATE | DELAYED | SCHEDULED | RECURRING | BATCH`.

## Workers

| Method | Path | Description |
|---|---|---|
| POST | `/workers` | Register a worker `{ "name": "worker-1" }` |
| GET | `/workers` | List all workers with status |
| POST | `/workers/:id/heartbeat` | Send heartbeat `{ cpuLoad?, memoryMb? }` |
| POST | `/workers/claim` | Atomically claim next job `{ workerId, queueId? }` — returns `204` if nothing to claim |

## Health

### GET /health
Returns `{ status, db, redis, timestamp }` — used for container health checks.
