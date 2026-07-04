import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pause, Play, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import NewQueueModal from '../components/NewQueueModal';

interface Queue {
  id: string;
  name: string;
  isPaused: boolean;
  concurrencyLimit: number;
  priority: number;
  projectId: string;
}

interface Project {
  id: string;
  name: string;
}

export default function Dashboard() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [queuesRes, projectsRes] = await Promise.all([
        api.get('/queues'),
        api.get('/projects'),
      ]);
      setQueues(queuesRes.data.queues);
      setProjects(projectsRes.data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function togglePause(id: string, currentlyPaused: boolean) {
    await api.patch(`/queues/${id}/status`, { action: currentlyPaused ? 'resume' : 'pause' });
    loadData();
  }

  const defaultProjectId = projects[0]?.id;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight">Queues</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            {queues.length} queue{queues.length !== 1 ? 's' : ''} across your organization
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!defaultProjectId}
          className="flex items-center gap-2 rounded-lg bg-[var(--color-ink)] text-white px-4 py-2.5 text-sm font-medium hover:bg-black transition disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New queue
        </button>
      </div>

      {loading ? (
        <div className="text-[var(--color-muted)] text-sm">Loading queues...</div>
      ) : queues.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-xl p-12 text-center">
          <p className="text-[var(--color-muted)] text-sm">No queues yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {queues.map((queue, i) => (
            <motion.div
              key={queue.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="group flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 hover:border-[var(--color-ink)] transition cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`h-2 w-2 rounded-full ${queue.isPaused ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'}`} />
                <div>
                  <p className="font-medium text-sm">{queue.name}</p>
                  <p className="text-xs text-[var(--color-muted)] font-[var(--font-mono)] mt-0.5">
                    concurrency: {queue.concurrencyLimit} · priority: {queue.priority}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); togglePause(queue.id, queue.isPaused); }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-canvas)] transition"
                >
                  {queue.isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  {queue.isPaused ? 'Resume' : 'Pause'}
                </button>
                <ChevronRight className="h-4 w-4 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && defaultProjectId && (
        <NewQueueModal
          projectId={defaultProjectId}
          onClose={() => setShowModal(false)}
          onCreated={loadData}
        />
      )}
    </div>
  );
}
