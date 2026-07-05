import axios from 'axios';

const BASE_URL = 'http://localhost:4100/api';

export async function setup() {
  const email = `test-${Date.now()}@loom.test`;
  const password = 'testpass123';

  const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
    name: 'Test Runner',
    email,
    password,
    organizationName: `Test Org ${Date.now()}`,
  });

  const token = registerRes.data.token;
  const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  const projectRes = await api.post('/projects', { name: 'Test Project' });
  const projectId = projectRes.data.project.id;

  const queueRes = await api.post('/queues', {
    projectId,
    name: 'Test Queue',
    concurrencyLimit: 20,
    maxRetries: 3,
    backoffStrategy: 'FIXED',
    baseDelayMs: 500,
    maxDelayMs: 2000,
  });
  const queueId = queueRes.data.queue.id;

  return { api, projectId, queueId };
}
