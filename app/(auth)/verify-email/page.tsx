'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import HGMonogram from '@/components/HGMonogram';

function VerifyContent() {
  const token = useSearchParams().get('token');
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  // Verified from the page (not a GET link) so email scanners that pre-fetch URLs can't burn the token
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This link is invalid.');
      return;
    }
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) return setStatus('ok');
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || 'This link is invalid or has expired');
        setStatus('error');
      })
      .catch(() => {
        setMessage('An unexpected error occurred');
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Link href="/shop" className="inline-flex items-center gap-2.5 mb-6">
          <HGMonogram className="h-12 w-12" />
          <span className="font-display font-semibold text-3xl tracking-wide text-espresso">Holy Grail</span>
        </Link>
        <div className="bg-white rounded-2xl shadow-warm border border-stone-200/70 p-8">
          {status === 'loading' && <p className="text-espresso/70">Verifying your email...</p>}
          {status === 'ok' && (
            <>
              <h1 className="text-xl font-display font-semibold text-espresso mb-2">Email verified</h1>
              <p className="text-sm text-espresso/70 mb-6">Your account is ready.</p>
              <Link href="/login?verified=true" className="btn-primary inline-block px-6 py-3">Sign in</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="text-xl font-display font-semibold text-espresso mb-2">Couldn&apos;t verify</h1>
              <p className="text-sm text-red-700 mb-6">{message}</p>
              <Link href="/login" className="text-primary-700 hover:text-primary-900 font-medium text-sm">
                Go to sign in to request a new link
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
