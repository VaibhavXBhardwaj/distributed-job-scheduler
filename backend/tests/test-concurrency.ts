import { setup } from './setup';

async function testConcurrency() {
  console.log('\n=== TEST: Atomic claim under concurrency ===');

  const { api, queueId } = await setup();

  const NUM_JOBS = 10;
  const jobIds: string[] = [];

  for (let i = 0; i < NUM_JOBS; i++) {
    const res = await api.post('/jobs', {
      queueId,
      name: `Concurrency Test ${i}`,
      type: 'IMMEDIATE',
      payload: { forceFail: false },
    });
    jobIds.push(res.data.job.id);
  }
  console.log(`Created ${NUM_JOBS} jobs.`);

  const workerIds: string[] = [];
  for (let i = 0; i < NUM_JOBS; i++) {
    const res = await api.post('/workers', { name: `test-worker-${i}` });
    workerIds.push(res.data.worker.id);
  }
  console.log(`Registered ${NUM_JOBS} workers.`);

  const claimPromises = workerIds.map((workerId) =>
    api.post('/workers/claim', { workerId, queueId }).then((res) => ({
      workerId,
      jobId: res.data?.job?.id || null,
    }))
  );

  const results = await Promise.all(claimPromises);

  const claimedJobIds = results.map((r) => r.jobId).filter(Boolean);
  const uniqueJobIds = new Set(claimedJobIds);

  console.log(`${claimedJobIds.length} jobs claimed out of ${NUM_JOBS} workers.`);
  console.log(`${uniqueJobIds.size} unique job IDs among claims.`);

  if (claimedJobIds.length !== uniqueJobIds.size) {
    console.error('❌ FAILED: Duplicate job claims detected! Atomic claiming is broken.');
    process.exit(1);
  }

  if (uniqueJobIds.size !== NUM_JOBS) {
    console.error(`❌ FAILED: Expected ${NUM_JOBS} unique claims, got ${uniqueJobIds.size}.`);
    process.exit(1);
  }

  console.log('✅ PASSED: All jobs claimed exactly once, zero duplicates under concurrency.\n');
}

testConcurrency().catch((err) => {
  console.error('Test crashed:', err.response?.data || err.message);
  process.exit(1);
});
