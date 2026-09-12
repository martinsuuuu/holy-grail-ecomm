'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-espresso/50 mb-3">Get in touch</p>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-espresso mb-8 leading-tight">
          Contact Us
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6 text-espresso/70">
            <div>
              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-espresso mb-2">Hours</h3>
              <p className="text-sm">By appointment only</p>
              <p className="text-sm">10am – 7pm (GMT+8)</p>
            </div>
            <div>
              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-espresso mb-2">Showroom</h3>
              <p className="text-sm">Metro Manila, Philippines</p>
            </div>
            <div>
              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-espresso mb-2">General Inquiries</h3>
              <p className="text-sm">Use the form to reach our team, or check our <a href="/faq" className="underline hover:text-espresso">FAQ</a> for quick answers.</p>
            </div>
          </div>

          <div>
            {sent ? (
              <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-8 text-center">
                <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-display font-bold text-lg text-espresso mb-1">Message received</h3>
                <p className="text-sm text-espresso/60">Thanks for reaching out — our team will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="label">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="How can we help?"
                    className="input-field"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
