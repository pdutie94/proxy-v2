"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[360px] bg-white border border-slate-200 rounded-md p-6">
      <div className="text-center mb-6">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-50 border border-slate-200 text-blue-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="mt-3 text-lg font-semibold text-slate-900">ProxyV2 Login</h2>
        <p className="text-xs text-slate-500 mt-1">
          Access your proxy infrastructure
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-red-50 border border-red-100 p-2 text-xs text-red-600 text-center">
            {error}
          </div>
        )}
        
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Email Address</label>
            <input
              type="email"
              required
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="admin@proxy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Password</label>
            <input
              type="password"
              required
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-9 w-full items-center justify-center rounded-md bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
}
