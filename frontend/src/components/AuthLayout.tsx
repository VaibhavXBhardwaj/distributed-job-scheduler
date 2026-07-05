import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, GitBranch } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-ink)] relative overflow-hidden flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, #0F766E 0%, transparent 50%), radial-gradient(circle at 80% 80%, #134E4A 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 flex items-center gap-2.5"
        >
          <div className="h-8 w-8 rounded-md bg-[var(--color-accent-soft)] flex items-center justify-center">
            <div className="h-3 w-3 rounded-sm bg-[var(--color-ink)]" />
          </div>
          <span className="font-[var(--font-display)] font-semibold text-lg text-white tracking-tight">Loom</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10"
        >
          <h1 className="font-[var(--font-display)] text-3xl font-semibold text-white tracking-tight mb-3 max-w-md">
            Reliable job scheduling, built for scale.
          </h1>
          <p className="text-white/60 text-sm max-w-sm mb-10">
            Atomic claiming, smart retries, and dead-letter handling — so nothing falls through the cracks.
          </p>

          <div className="space-y-4">
            <Feature icon={<Zap className="h-4 w-4" />} label="Zero duplicate execution, proven under concurrency" />
            <Feature icon={<Shield className="h-4 w-4" />} label="Automatic retries with configurable backoff" />
            <Feature icon={<GitBranch className="h-4 w-4" />} label="Job dependencies with DAG-aware scheduling" />
          </div>
        </motion.div>

        <p className="relative z-10 text-white/30 text-xs font-[var(--font-mono)]">© 2026 Loom</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 bg-[var(--color-canvas)]">
        {children}
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-[var(--color-accent-soft)] shrink-0">
        {icon}
      </div>
      <p className="text-sm text-white/80">{label}</p>
    </div>
  );
}
