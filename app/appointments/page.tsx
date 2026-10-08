'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle, Calendar, Clock } from 'lucide-react';
import { bookableHours, formatHourRange } from '@/lib/appointments';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function maxDateISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().slice(0, 10);
}

export default function AppointmentsPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [date, setDate] = useState(todayISO());
  const [hour, setHour] = useState<number | null>(null);
  const [takenHours, setTakenHours] = useState<number[]>([]);
  const [isLoadingHours, setIsLoadingHours] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setForm(f => ({ ...f, name: f.name || session.user.name || '', email: f.email || session.user.email || '' }));
    }
  }, [session]);

  useEffect(() => {
    setIsLoadingHours(true);
    setHour(null);
    fetch(`/api/appointments?date=${date}`)
      .then(r => r.json())
      .then(data => setTakenHours(data.takenHours || []))
      .finally(() => setIsLoadingHours(false));
  }, [date]);

  const hours = useMemo(() => bookableHours(), []);
  const isToday = date === todayISO();
  const currentHour = new Date().getHours();

  const isPast = (h: number) => isToday && h <= currentHour;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hour === null) {
      setError('Please choose a time slot.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, date, hour }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Failed to book appointment');
      if (res.status === 409) {
        setTakenHours(prev => [...prev, hour]);
        setHour(null);
      }
    } else {
      setBooked(true);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-espresso/50 mb-3">Private Viewing</p>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-espresso mb-4 leading-tight">
          Book an Appointment
        </h1>
        <p className="text-espresso/60 max-w-xl mb-10">
          Visit our showroom by appointment — browse pieces in person, authenticate a find, or get a
          personal consultation. Slots are booked by the hour, 10am – 7pm.
        </p>

        {booked ? (
          <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-8 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-espresso mb-1">Appointment requested</h3>
            <p className="text-sm text-espresso/60">
              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {' · '}{hour !== null && formatHourRange(hour)}
            </p>
            <p className="text-sm text-espresso/60 mt-2">We'll confirm by email shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-6">
              <label className="label flex items-center gap-1.5 mb-2">
                <Calendar className="h-3.5 w-3.5" /> Date
              </label>
              <input
                type="date"
                required
                value={date}
                min={todayISO()}
                max={maxDateISO()}
                onChange={(e) => setDate(e.target.value)}
                className="input-field mb-5 max-w-xs"
              />

              <label className="label flex items-center gap-1.5 mb-2">
                <Clock className="h-3.5 w-3.5" /> Time Slot
              </label>
              {isLoadingHours ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-10 bg-stone-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {hours.map(h => {
                    const taken = takenHours.includes(h);
                    const past = isPast(h);
                    const disabled = taken || past;
                    return (
                      <button
                        key={h}
                        type="button"
                        disabled={disabled}
                        onClick={() => setHour(h)}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                          disabled
                            ? 'border-stone-100 text-stone-300 cursor-not-allowed bg-stone-50'
                            : hour === h
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-stone-200 text-espresso/70 hover:border-primary-300'
                        }`}
                      >
                        {formatHourRange(h)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
              )}
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Phone <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="09xxxxxxxxx"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="label">What would you like to see or discuss? (optional)</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Chanel Classic Flap in black caviar"
                  className="input-field"
                />
              </div>
              <button type="submit" disabled={isSubmitting || hour === null} className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
                {isSubmitting ? 'Booking...' : 'Request Appointment'}
              </button>
            </div>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
}
