import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import AuthLayout from '../components/AuthLayout';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, organizationName);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.[0]?.message || err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="h-8 w-8 rounded-md bg-[var(--color-ink)] flex items-center justify-center">
            <div className="h-3 w-3 rounded-sm bg-[var(--color-accent-soft)]" />
          </div>
          <span className="font-[var(--font-display)] font-semibold text-lg tracking-tight">Loom</span>
        </div>

        <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight mb-1">
          Create your workspace
        </h1>
        <p className="text-[var(--color-muted)] text-sm mb-8">
          Start scheduling jobs in minutes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Organization name</label>
            <input
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
              placeholder="Acme Inc"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Your name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-soft)] rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-ink)] text-white px-4 py-2.5 text-sm font-medium transition hover:bg-black disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--color-muted)] text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--color-ink)] font-medium underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
