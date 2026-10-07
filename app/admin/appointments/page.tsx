'use client';

import { useState, useEffect } from 'react';
import { formatHourRange, APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_COLOR } from '@/lib/appointments';
import { CalendarCheck, Search, Filter, CheckCircle, XCircle, Clock, Phone, Mail } from 'lucide-react';

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  date: string;
  hour: number;
  notes: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/appointments')
      .then(res => res.json())
      .then(data => { setAppointments(data); setIsLoading(false); });
  }, []);

  const updateStatus = async (id: string, status: Appointment['status']) => {
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    }
  };

  const filtered = appointments.filter(a => {
    const q = search.toLowerCase();
    const matchesSearch = a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayISO = new Date().toISOString().slice(0, 10);
  const statusOptions = [
    { value: 'all', label: 'All Appointments' },
    { value: 'PENDING', label: 'Pending Confirmation' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-espresso">Appointments</h1>
          <p className="text-stone-500 text-sm mt-1">{appointments.length} showroom viewing requests</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-stone-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field py-2"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Date & Time</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Guest</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Notes</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-stone-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                  <CalendarCheck className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                  <p>No appointments found</p>
                </td>
              </tr>
            ) : (
              filtered.map(a => {
                const isPastDate = a.date < todayISO;
                return (
                  <tr key={a.id} className="hover:bg-stone-50/60">
                    <td className="px-6 py-4">
                      <p className={`text-sm font-medium ${isPastDate ? 'text-stone-400' : 'text-espresso'}`}>
                        {new Date(a.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatHourRange(a.hour)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-espresso">{a.name}</p>
                      <p className="text-xs text-stone-500 flex items-center gap-1"><Mail className="h-3 w-3" /> {a.email}</p>
                      {a.phone && <p className="text-xs text-stone-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {a.phone}</p>}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-xs text-stone-500 truncate">{a.notes || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge text-xs ${APPOINTMENT_STATUS_COLOR[a.status]}`}>
                        {APPOINTMENT_STATUS_LABEL[a.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {a.status === 'PENDING' && (
                          <button
                            onClick={() => updateStatus(a.id, 'CONFIRMED')}
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          >
                            <CheckCircle className="h-3 w-3" /> Confirm
                          </button>
                        )}
                        {a.status === 'CONFIRMED' && (
                          <button
                            onClick={() => updateStatus(a.id, 'COMPLETED')}
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200"
                          >
                            <CheckCircle className="h-3 w-3" /> Mark Done
                          </button>
                        )}
                        {(a.status === 'PENDING' || a.status === 'CONFIRMED') && (
                          <button
                            onClick={() => updateStatus(a.id, 'CANCELLED')}
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            <XCircle className="h-3 w-3" /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
