'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import HGMonogram from '@/components/HGMonogram';

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Could not reset password');
      router.push('/login?reset=true');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/shop" className="inline-flex items-center gap-2.5 mb-6">
            <HGMonogram className="h-12 w-12" />
            <span className="font-display font-semibold text-3xl tracking-wide text-espresso">Holy Grail</span>
          </Link>
          <h1 className="text-2xl font-display font-semibold text-espresso">Choose a new password</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-warm border border-stone-200/70 p-8">
          {!token ? (
            <p className="text-sm text-red-700">
              This link is invalid.{' '}
              <Link href="/forgot-password" className="underline font-medium">Request a new one</Link>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm bg-red-50 text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {error}
                    {error.includes('expired') && (
                      <>
                        {' '}
                        <Link href="/forgot-password" className="underline font-medium">Request a new link</Link>
                      </>
                    )}
                  </span>
                </div>
              )}
              <div>
                <label className="label">New password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="input-field" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full btn-primary py-3 text-base">
                {isLoading ? 'Saving...' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetForm />
    </Suspense>
  );
}
