import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import api from '../lib/api';

interface Job {
  id: string;
  name: string;
  status: string;
  type: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  QUEUED: 'bg-[var(--color-border)] text-[var(--color-muted)]',
  SCHEDULED: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  CLAIMED: 'bg-[var(--color-running-soft)] text-[var(--color-running)]',
  RUNNING: 'bg-[var(--color-running-soft)] text-[var(--color-running)]',
  COMPLETED: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  FAILED: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  DEAD_LETTER: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  CANCELLED: 'bg-[var(--color-border)] text-[var(--color-muted)]',
};

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const res = await api.get('/jobs');
      setJobs(res.data.jobs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} across all queues
          </p>
        </div>
        <button
          onClick={loadJobs}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-canvas)] transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-[var(--color-muted)] text-sm">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-xl p-12 text-center">
          <p className="text-[var(--color-muted)] text-sm">No jobs yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-muted)] uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Attempts</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, i) => (
                <motion.tr
                  key={job.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)] transition"
                >
                  <td className="px-5 py-3.5 font-medium">{job.name}</td>
                  <td className="px-5 py-3.5 text-[var(--color-muted)] font-[var(--font-mono)] text-xs">{job.type}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${statusStyles[job.status] || ''}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
                    {job.attempts}/{job.maxAttempts}
                  </td>
                  <td className="px-5 py-3.5 text-[var(--color-muted)] text-xs">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
