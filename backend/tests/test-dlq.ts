import { setup } from './setup';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testDLQ() {
  console.log('\n=== TEST: DLQ transition with AI summary ===');

  const { api, queueId } = await setup();

  const jobRes = await api.post('/jobs', {
    queueId,
    name: 'DLQ Test Job',
    type: 'IMMEDIATE',
    maxAttempts: 1,
    payload: { forceFail: true },
  });
  const jobId = jobRes.data.job.id;
  console.log(`Created job ${jobId} with maxAttempts=1, forced to fail.`);

  let finalStatus = '';
  let job: any = null;
  for (let i = 0; i < 10; i++) {
    await sleep(1000);
    const check = await api.get(`/jobs/${jobId}`);
    job = check.data.job;
    finalStatus = job.status;
    console.log(`  [${i + 1}s] status=${finalStatus}`);
    if (finalStatus === 'DEAD_LETTER') break;
  }

  if (finalStatus !== 'DEAD_LETTER') {
    console.error(`❌ FAILED: Expected DEAD_LETTER, got ${finalStatus}`);
    process.exit(1);
  }

  if (!job.dlqEntry) {
    console.error('❌ FAILED: No dlqEntry found on job');
    process.exit(1);
  }

  console.log(`DLQ reason: ${job.dlqEntry.reason}`);
  console.log(`AI summary present: ${!!job.dlqEntry.aiSummary}`);

  console.log('✅ PASSED: Job correctly moved to DEAD_LETTER with reason recorded.\n');
}

testDLQ().catch((err) => {
  console.error('Test crashed:', err.response?.data || err.message);
  process.exit(1);
});
