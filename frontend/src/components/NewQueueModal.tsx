import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import api from '../lib/api';

interface Props {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function NewQueueModal({ projectId, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [concurrencyLimit, setConcurrencyLimit] = useState(5);
  const [maxRetries, setMaxRetries] = useState(3);
  const [backoffStrategy, setBackoffStrategy] = useState('EXPONENTIAL');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/queues', {
        projectId,
        name,
        concurrencyLimit,
        maxRetries,
        backoffStrategy,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create queue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-[var(--font-display)] text-lg font-semibold tracking-tight">New queue</h2>
            <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Queue name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                placeholder="e.g. Email Queue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Concurrency</label>
                <input
                  type="number"
                  min={1}
                  value={concurrencyLimit}
                  onChange={(e) => setConcurrencyLimit(Number(e.target.value))}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Max retries</label>
                <input
                  type="number"
                  min={0}
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Number(e.target.value))}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Backoff strategy</label>
              <select
                value={backoffStrategy}
                onChange={(e) => setBackoffStrategy(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
              >
                <option value="FIXED">Fixed</option>
                <option value="LINEAR">Linear</option>
                <option value="EXPONENTIAL">Exponential</option>
              </select>
            </div>

            {error && (
              <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-soft)] rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-ink)] text-white px-4 py-2.5 text-sm font-medium hover:bg-black transition disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create queue'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
