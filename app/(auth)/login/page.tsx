'use client';

import { useState, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import HGMonogram from '@/components/HGMonogram';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/shop';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        const session = await getSession();
        const role = session?.user?.role;
        if (role === 'ADMIN') {
          router.push('/admin');
        } else if (role === 'SHIPPER') {
          router.push('/shipper');
        } else {
          router.push(callbackUrl);
        }
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/shop" className="inline-flex items-center gap-2.5 mb-6">
            <HGMonogram className="h-12 w-12" />
            <span className="font-display font-semibold text-3xl tracking-wide text-espresso">Holy Grail</span>
          </Link>
          <h1 className="text-2xl font-display font-semibold text-espresso">Welcome back</h1>
          <p className="text-espresso/50 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-warm border border-stone-200/70 p-8">
          {error && (
            <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm ${
              error === 'Your account has been blocked'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-red-50 text-red-700'
            }`}>
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

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

            <div>
              <label className="label">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-xl border-stone-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-espresso"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-base"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-stone-50 rounded-xl">
            <p className="text-xs font-medium text-espresso/50 mb-2">Demo accounts:</p>
            <div className="space-y-1 text-xs text-espresso/70">
              <p><span className="font-medium">Admin:</span> admin@retail.com / admin123</p>
              <p><span className="font-medium">Shipper:</span> shipper@retail.com / shipper123</p>
              <p><span className="font-medium">Customer:</span> customer@retail.com / customer123</p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-espresso/60 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary-700 hover:text-primary-900 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
