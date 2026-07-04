import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, RefreshCw } from 'lucide-react';
import api from '../lib/api';

interface Worker {
  id: string;
  name: string;
  status: string;
  lastHeartbeatAt: string | null;
  createdAt: string;
}

export default function Workers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkers();
    const interval = setInterval(loadWorkers, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadWorkers() {
    try {
      const res = await api.get('/workers');
      setWorkers(res.data.workers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function isStale(lastHeartbeatAt: string | null) {
    if (!lastHeartbeatAt) return true;
    return Date.now() - new Date(lastHeartbeatAt).getTime() > 30000;
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight">Workers</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            {workers.length} worker{workers.length !== 1 ? 's' : ''} registered · auto-refreshing every 5s
          </p>
        </div>
        <button
          onClick={loadWorkers}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-canvas)] transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-[var(--color-muted)] text-sm">Loading workers...</div>
      ) : workers.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-xl p-12 text-center">
          <p className="text-[var(--color-muted)] text-sm">No workers registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {workers.map((worker, i) => {
            const stale = isStale(worker.lastHeartbeatAt);
            return (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-[var(--color-canvas)] flex items-center justify-center">
                      <Cpu className="h-4 w-4 text-[var(--color-ink)]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{worker.name}</p>
                      <p className="text-xs text-[var(--color-muted)] font-[var(--font-mono)]">{worker.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${stale ? 'bg-[var(--color-muted)]' : 'bg-[var(--color-success)] animate-pulse'}`} />
                    <span className="text-xs text-[var(--color-muted)]">{stale ? 'offline' : 'online'}</span>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  Last heartbeat: {worker.lastHeartbeatAt ? new Date(worker.lastHeartbeatAt).toLocaleTimeString() : 'never'}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
