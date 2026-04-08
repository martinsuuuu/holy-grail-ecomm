'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import OrderCountdown from '@/components/OrderCountdown';
import { formatCurrency, formatDateTime, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import { ArrowLeft, Package, Upload, CheckCircle, Truck, Clock, AlertCircle, ImageIcon, X, MapPin, QrCode, Smartphone, Building2, ZoomIn } from 'lucide-react';
import { isAddressComplete } from '@/lib/address';
import Link from 'next/link';

interface PaymentMethod {
  id: string;
  type: string;
  name: string;
  accountName: string | null;
  accountNumber: string | null;
  qrCode: string | null;
}

interface OrderDetail {
  id: string;
  status: string;
  deliveryMethod: string;
  totalAmount: number;
  reservationExpiry: string;
  depositProof: string | null;
  depositConfirmed: boolean;
  shippedAt: string | null;
  createdAt: string;
  paymentMethodName: string | null;
  paymentMethod: PaymentMethod | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      imageUrl: string | null;
      category: string | null;
      type: string | null;
    };
  }>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [userAddress, setUserAddress] = useState<string | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lightboxQr, setLightboxQr] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  useEffect(() => {
    if (session) {
      Promise.all([
        fetch(`/api/orders/${params.id}`).then(res => {
          if (!res.ok) throw new Error('Order not found');
          return res.json();
        }),
        fetch('/api/profile').then(res => res.json()),
      ])
        .then(([orderData, profileData]) => {
          setOrder(orderData);
          setUserAddress(profileData.address ?? null);
          setIsLoading(false);
        })
        .catch(() => router.push('/account'));
    }
  }, [session, params.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setProofImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitDeposit = async () => {
    if (!proofImage) {
      setError('Please upload a screenshot or photo of your payment');
      return;
    }
    setIsSubmitting(true);
    setError('');

    const depositProof = proofNote.trim()
      ? `${proofImage}||note:${proofNote.trim()}`
      : proofImage;

    const res = await fetch(`/api/orders/${params.id}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depositProof }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
    } else {
      setOrder(prev => prev ? { ...prev, ...data } : null);
      setSuccess('Deposit proof submitted! Admin will review and confirm your order.');
      setProofImage(null);
      setProofNote('');
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const hasPasabuy = order.items.some(item => item.product.type === 'PASABUY') ||
    order.status === 'WAITING_FOR_ARRIVAL';

  const statusSteps = hasPasabuy
    ? [
        { key: 'PENDING_DEPOSIT', label: 'Order Placed' },
        { key: 'DEPOSIT_SUBMITTED', label: 'Deposit Submitted' },
        { key: 'WAITING_FOR_ARRIVAL', label: 'Waiting for Arrival' },
        { key: 'CONFIRMED', label: 'Confirmed' },
        { key: 'SHIPPED', label: 'Shipped' },
        { key: 'DELIVERED', label: 'Delivered' },
      ]
    : [
        { key: 'PENDING_DEPOSIT', label: 'Order Placed' },
        { key: 'DEPOSIT_SUBMITTED', label: 'Deposit Submitted' },
        { key: 'CONFIRMED', label: 'Confirmed' },
        { key: 'SHIPPED', label: 'Shipped' },
        { key: 'DELIVERED', label: 'Delivered' },
      ];

  const currentStepIndex = order.status === 'CANCELLED'
    ? -1
    : statusSteps.findIndex(s => s.key === order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/account" className="text-gray-500 hover:text-indigo-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {hasPasabuy
              ? <span className="badge text-xs bg-purple-100 text-purple-700">Pasabuy</span>
              : <span className="badge text-xs bg-emerald-100 text-emerald-700">On Hand</span>
            }
            <span className={`badge ${getOrderStatusColor(order.status)}`}>
              {getOrderStatusLabel(order.status)}
            </span>
          </div>
        </div>

        {/* Countdown for pending orders */}
        {order.status === 'PENDING_DEPOSIT' && (
          <div className="mb-4">
            <OrderCountdown expiryDate={order.reservationExpiry} />
          </div>
        )}

        {/* Status Steps */}
        {order.status !== 'CANCELLED' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      index <= currentStepIndex
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {index < currentStepIndex ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <p className={`text-xs mt-1 text-center w-16 ${
                      index <= currentStepIndex ? 'text-indigo-600 font-medium' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div className={`h-0.5 w-8 sm:w-12 mx-1 mb-5 ${
                      index < currentStepIndex ? 'bg-indigo-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancelled notice */}
        {order.status === 'CANCELLED' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Order Cancelled</p>
              <p className="text-sm text-red-600">This order was cancelled. Reserved stock has been returned.</p>
            </div>
          </div>
        )}

        {/* Deposit + Payment Section */}
        {order.status === 'PENDING_DEPOSIT' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* Left — Upload proof */}
            <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Upload className="h-5 w-5 text-amber-500" />
                Submit Deposit Proof
              </h3>
              {success ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  {success}
                </div>
              ) : !isAddressComplete(userAddress) ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>You need to add a delivery address to your profile before submitting a deposit.</span>
                  </div>
                  <Link
                    href="/account"
                    className="btn-primary text-center text-sm"
                  >
                    Go to Account Settings
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Pay using the method on the right, then upload your proof here.
                  </p>
                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mb-3 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  {proofImage ? (
                    <div className="relative mb-3">
                      <img
                        src={proofImage}
                        alt="Deposit proof preview"
                        className="w-full max-h-52 object-contain rounded-xl border border-gray-200 bg-gray-50"
                      />
                      <button
                        onClick={() => setProofImage(null)}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Image ready to submit
                      </p>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-amber-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all mb-3">
                      <ImageIcon className="h-8 w-8 text-amber-400 mb-2" />
                      <span className="text-sm font-medium text-amber-700">Click to upload payment screenshot</span>
                      <span className="text-xs text-gray-400 mt-1">JPG, PNG, GIF · Max 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}

                  <input
                    type="text"
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    placeholder="Optional: reference number or note"
                    className="input-field mb-3"
                  />

                  <button
                    onClick={handleSubmitDeposit}
                    disabled={isSubmitting || !proofImage}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Deposit Proof'}
                  </button>
                </>
              )}
            </div>

            {/* Right — Payment method details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                {order.paymentMethod?.type === 'GCASH'
                  ? <Smartphone className="h-5 w-5 text-blue-500" />
                  : <Building2 className="h-5 w-5 text-indigo-500" />}
                Pay via {order.paymentMethodName ?? 'Payment Method'}
              </h3>

              {order.paymentMethod ? (
                <div className="space-y-4">
                  {/* Account details */}
                  {(order.paymentMethod.accountName || order.paymentMethod.accountNumber) && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      {order.paymentMethod.accountName && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Account Name</p>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5 select-all">{order.paymentMethod.accountName}</p>
                        </div>
                      )}
                      {order.paymentMethod.accountNumber && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Account Number</p>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5 select-all tracking-wider">{order.paymentMethod.accountNumber}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Amount to Send</p>
                        <p className="font-bold text-indigo-600 text-lg mt-0.5">{formatCurrency(order.totalAmount)}</p>
                      </div>
                    </div>
                  )}

                  {/* QR Code */}
                  {order.paymentMethod.qrCode && (
                    <div className="flex flex-col items-center">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <QrCode className="h-3 w-3" /> Scan to pay
                      </p>
                      <div
                        className="relative w-44 h-44 cursor-zoom-in group"
                        onClick={() => setLightboxQr(true)}
                      >
                        <img
                          src={order.paymentMethod.qrCode}
                          alt={`${order.paymentMethod.name} QR`}
                          className="w-full h-full object-contain border border-gray-200 rounded-xl bg-white p-1"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 text-center">Tap to enlarge · Send exact amount</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Payment details unavailable. Contact the store.</p>
              )}
            </div>
          </div>
        )}

        {/* QR Lightbox */}
        {lightboxQr && order.paymentMethod?.qrCode && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setLightboxQr(false)}
          >
            <div
              className="relative bg-white rounded-2xl shadow-2xl p-5 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-indigo-600" />
                  {order.paymentMethod.name}
                </p>
                <button
                  onClick={() => setLightboxQr(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <img
                src={order.paymentMethod.qrCode}
                alt={`${order.paymentMethod.name} QR Code`}
                className="w-full object-contain rounded-lg border border-gray-100"
              />
              <p className="text-xs text-gray-400 text-center mt-3">Scan with your phone camera or payment app</p>
            </div>
          </div>
        )}

        {order.status === 'DEPOSIT_SUBMITTED' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800">Deposit Under Review</p>
              <p className="text-sm text-blue-600">Your deposit proof has been submitted. Admin will confirm shortly.</p>
              {order.depositProof && (
                <div className="mt-2">
                  {order.depositProof.startsWith('data:image') ? (
                    <img
                      src={order.depositProof.split('||note:')[0]}
                      alt="Deposit proof"
                      className="max-h-40 rounded-lg border border-blue-200 object-contain bg-white"
                    />
                  ) : null}
                  {order.depositProof.includes('||note:') && (
                    <p className="text-xs text-blue-500 mt-1">
                      Note: {order.depositProof.split('||note:')[1]}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {order.status === 'WAITING_FOR_ARRIVAL' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Truck className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-orange-800">Waiting for Arrival</p>
                <p className="text-sm text-orange-600 mt-1">
                  Your deposit has been confirmed! Your pasabuy items are currently being sourced.
                  We&apos;ll notify you as soon as they arrive.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-orange-500">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Sit tight — your items are on the way to us!</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600" />
            Order Items
          </h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{item.product.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                </div>
                <p className="font-semibold text-sm text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="h-4 w-4" />
                <span>{order.deliveryMethod}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-indigo-600">{formatCurrency(order.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
