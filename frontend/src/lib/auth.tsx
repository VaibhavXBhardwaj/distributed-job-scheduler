import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from './api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, organizationName: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('loom_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('loom_user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('loom_token', res.data.token);
    localStorage.setItem('loom_user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
  }

  async function register(name: string, email: string, password: string, organizationName: string) {
    const res = await api.post('/auth/register', { name, email, password, organizationName });
    localStorage.setItem('loom_token', res.data.token);
    localStorage.setItem('loom_user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem('loom_token');
    localStorage.removeItem('loom_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
