'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface OrderCountdownProps {
  expiryDate: string | Date;
}

export default function OrderCountdown({ expiryDate }: OrderCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryDate).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiryDate]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded-xl">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Reservation expired</span>
      </div>
    );
  }

  const isUrgent = timeLeft.hours < 2;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isUrgent ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
      <Clock className="h-4 w-4" />
      <span className="text-sm font-medium">
        Reservation expires in:{' '}
        <span className="font-bold">
          {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </span>
    </div>
  );
}
