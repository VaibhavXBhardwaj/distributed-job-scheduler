import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import api from '../lib/api';

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

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJob();
  }, [id]);

  async function loadJob() {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data.job);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-[var(--color-muted)]">Loading...</div>;
  if (!job) return <div className="p-8 text-sm text-[var(--color-muted)]">Job not found.</div>;

  return (
    <div className="p-8 max-w-3xl">
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition mb-6">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to jobs
      </Link>

      <div className="flex items-start justify-between mb-1">
        <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight">{job.name}</h1>
        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${statusStyles[job.status] || ''}`}>
          {job.status}
        </span>
      </div>
      <p className="text-xs text-[var(--color-muted)] font-[var(--font-mono)] mb-8">{job.id}</p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <InfoCard label="Type" value={job.type} />
        <InfoCard label="Attempts" value={`${job.attempts} / ${job.maxAttempts}`} />
        <InfoCard label="Priority" value={job.priority} />
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Payload</h2>
        <pre className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs font-[var(--font-mono)] overflow-auto">
          {JSON.stringify(job.payload, null, 2)}
        </pre>
      </div>

      {job.dlqEntry && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3">Dead letter reason</h2>
          <div className="rounded-xl border border-[var(--color-danger-soft)] bg-[var(--color-danger-soft)]/30 p-4">
            <p className="text-sm text-[var(--color-danger)] mb-3">{job.dlqEntry.reason}</p>
            {job.dlqEntry.aiSummary && (
              <div className="flex gap-2 pt-3 border-t border-[var(--color-danger)]/20">
                <Sparkles className="h-4 w-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--color-ink)]">{job.dlqEntry.aiSummary}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold mb-3">Execution history</h2>
        {job.executions?.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No executions yet.</p>
        ) : (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
            {job.executions?.map((exec: any, i: number) => (
              <motion.div
                key={exec.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">Attempt {exec.attemptNumber}</p>
                  {exec.errorMessage && (
                    <p className="text-xs text-[var(--color-danger)] mt-0.5 font-[var(--font-mono)]">{exec.errorMessage}</p>
                  )}
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${statusStyles[exec.status] || ''}`}>
                  {exec.status}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs text-[var(--color-muted)] mb-1">{label}</p>
      <p className="text-sm font-medium font-[var(--font-mono)]">{value}</p>
    </div>
  );
}
