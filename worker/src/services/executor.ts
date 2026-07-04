export interface ExecutionResult {
  success: boolean;
  errorMessage?: string;
  errorStack?: string;
}

// Simulates executing a job's payload. In a real system this would
// dispatch to actual handlers based on job.name / job.payload.
export async function executeJob(jobName: string, payload: any): Promise<ExecutionResult> {
  console.log(`[worker] executing job "${jobName}" with payload:`, payload);

  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1500));

  // Simulate ~20% random failure rate to demonstrate retry/DLQ logic
  const shouldFail = Math.random() < 0.2;

  if (shouldFail) {
    return {
      success: false,
      errorMessage: 'Simulated execution failure',
      errorStack: 'Error: Simulated execution failure\n    at executeJob (executor.ts)',
    };
  }

  return { success: true };
}

export function calculateBackoffMs(
  strategy: 'FIXED' | 'LINEAR' | 'EXPONENTIAL',
  baseDelayMs: number,
  maxDelayMs: number,
  attempt: number
): number {
  let delay: number;

  switch (strategy) {
    case 'FIXED':
      delay = baseDelayMs;
      break;
    case 'LINEAR':
      delay = baseDelayMs * attempt;
      break;
    case 'EXPONENTIAL':
      delay = baseDelayMs * Math.pow(2, attempt - 1);
      break;
    default:
      delay = baseDelayMs;
  }

  return Math.min(delay, maxDelayMs);
}
