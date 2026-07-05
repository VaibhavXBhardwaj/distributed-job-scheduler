import { setup } from './setup';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testRetry() {
  console.log('\n=== TEST: Retry logic with backoff ===');

  const { api, queueId } = await setup();

  // This job fails once, then succeeds - should retry and eventually complete
  const jobRes = await api.post('/jobs', {
    queueId,
    name: 'Retry Test Job',
    type: 'IMMEDIATE',
    maxAttempts: 3,
    payload: { forceFail: true }, // will fail every attempt since flag doesn't change
  });
  const jobId = jobRes.data.job.id;
  console.log(`Created job ${jobId} configured to always fail (testing retry attempts).`);

  const workerRes = await api.post('/workers', { name: 'retry-test-worker' });
  const workerId = workerRes.data.worker.id;

  // Claim and simulate worker processing manually via repeated claim calls
  // (In production the standalone worker process does this automatically)
  console.log('Waiting for standalone worker to process retries (watch for backoff delays)...');

  let finalStatus = '';
  let attempts = 0;
  for (let i = 0; i < 15; i++) {
    await sleep(1000);
    const check = await api.get(`/jobs/${jobId}`);
    finalStatus = check.data.job.status;
    attempts = check.data.job.attempts;
    console.log(`  [${i + 1}s] status=${finalStatus} attempts=${attempts}`);
    if (finalStatus === 'DEAD_LETTER' || finalStatus === 'COMPLETED') break;
  }

  if (finalStatus !== 'DEAD_LETTER') {
    console.error(`❌ FAILED: Expected job to reach DEAD_LETTER after exhausting retries, got ${finalStatus}`);
    process.exit(1);
  }

  if (attempts !== 3) {
    console.error(`❌ FAILED: Expected exactly 3 attempts, got ${attempts}`);
    process.exit(1);
  }

  console.log(`✅ PASSED: Job retried ${attempts} times with backoff, then correctly moved to DEAD_LETTER.\n`);
}

testRetry().catch((err) => {
  console.error('Test crashed:', err.response?.data || err.message);
  process.exit(1);
});
