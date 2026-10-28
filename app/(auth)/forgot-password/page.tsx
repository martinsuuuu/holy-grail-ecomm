'use client';

import { useState } from 'react';
import Link from 'next/link';
import HGMonogram from '@/components/HGMonogram';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } finally {
      setIsLoading(false);
      setSent(true);
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
          <h1 className="text-2xl font-display font-semibold text-espresso">Forgot your password?</h1>
          <p className="text-espresso/50 mt-1">We&apos;ll email you a link to reset it</p>
        </div>

        <div className="bg-white rounded-2xl shadow-warm border border-stone-200/70 p-8">
          {sent ? (
            <p className="text-sm text-espresso/80">
              If an account exists for <span className="font-medium">{email}</span>, a reset link is on its way.
              It expires in 1 hour.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="input-field"
                />
              </div>
              <button type="submit" disabled={isLoading} className="w-full btn-primary py-3 text-base">
                {isLoading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-espresso/60 mt-6">
          <Link href="/login" className="text-primary-700 hover:text-primary-900 font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
