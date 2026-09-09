'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import CartItem from '@/components/CartItem';
import { useCartStore } from '@/lib/cartStore';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, ArrowLeft, Truck, AlertCircle, CreditCard, Smartphone, Building2, QrCode, X, ZoomIn, ExternalLink, MapPin } from 'lucide-react';
import Link from 'next/link';

interface PaymentMethod {
  id: string;
  type: string;
  name: string;
  qrCode: string | null;
}

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const [deliveryMethod, setDeliveryMethod] = useState<'LALAMOVE' | 'SHOPEE' | 'JNT'>('LALAMOVE');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxQr, setLightboxQr] = useState<{ src: string; name: string } | null>(null);
  const [shopeeLink, setShopeeLink] = useState('');
  const [lalamoveAddress, setLalamoveAddress] = useState('');
  const [useSameAddress, setUseSameAddress] = useState(false);

  useEffect(() => {
    fetch('/api/payment-methods')
      .then((r) => r.json())
      .then((data: PaymentMethod[]) => {
        setPaymentMethods(data);
        if (data.length > 0) setSelectedPaymentId(data[0].id);
      });
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setShopeeLink(data.shopee_checkout_link || ''));
  }, []);

  const gcashMethods = paymentMethods.filter((m) => m.type === 'GCASH');
  const bankMethods = paymentMethods.filter((m) => m.type === 'BANK_TRANSFER');
  const selectedPayment = paymentMethods.find((m) => m.id === selectedPaymentId);

  const handlePlaceOrder = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    if (!selectedPaymentId) {
      setError('Please select a payment method');
      return;
    }

    if (deliveryMethod === 'LALAMOVE' && !useSameAddress && !lalamoveAddress.trim()) {
      setError('Please enter your Lalamove delivery address or select "Same as shipping address"');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          deliveryMethod,
          paymentMethodId: selectedPaymentId,
          deliveryAddress: deliveryMethod === 'LALAMOVE'
            ? (useSameAddress ? 'Same as shipping address' : lalamoveAddress.trim())
            : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to place order');
        return;
      }

      clearCart();
      router.push(`/account/orders/${data.id}`);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/shop" className="text-espresso/50 hover:text-primary-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-display font-semibold text-espresso flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary-700" />
            Shopping Cart
          </h1>
          {items.length > 0 && (
            <span className="bg-primary-100 text-primary-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-16 text-center">
            <ShoppingCart className="h-16 w-16 text-stone-200 mx-auto mb-4" />
            <h2 className="text-xl font-display font-semibold text-espresso/80 mb-2">Your cart is empty</h2>
            <p className="text-espresso/50 mb-6">Add some products to get started</p>
            <Link href="/shop" className="btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-espresso">Items in Cart</h2>
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear all
                  </button>
                </div>
                {items.map((item) => (
                  <CartItem key={item.id} {...item} />
                ))}
              </div>

              {/* Delivery method */}
              <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-6 mt-4">
                <h2 className="font-display font-semibold text-espresso mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary-700" />
                  Delivery Method
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'LALAMOVE', label: 'Lalamove', desc: 'Same-day delivery' },
                    { value: 'SHOPEE', label: 'Shopee Checkout', desc: '2-3 business days' },
                    { value: 'JNT', label: 'J&T Express', desc: 'Standard delivery' },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        deliveryMethod === method.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        value={method.value}
                        checked={deliveryMethod === method.value}
                        onChange={(e) => setDeliveryMethod(e.target.value as 'LALAMOVE' | 'SHOPEE' | 'JNT')}
                        className="text-primary-600"
                      />
                      <div>
                        <p className="font-medium text-sm text-espresso">{method.label}</p>
                        <p className="text-xs text-espresso/50">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Shopee Checkout link */}
                {deliveryMethod === 'SHOPEE' && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <p className="text-sm font-medium text-orange-800 mb-2">Proceed to Shopee Checkout</p>
                    <p className="text-xs text-orange-600 mb-3">
                      Click the link below to complete your order through Shopee.
                    </p>
                    {shopeeLink ? (
                      <a
                        href={shopeeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Shopee Checkout
                      </a>
                    ) : (
                      <p className="text-xs text-orange-400 italic">Shopee checkout link not configured yet.</p>
                    )}
                  </div>
                )}

                {/* J&T Express info */}
                {deliveryMethod === 'JNT' && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm font-medium text-red-800 mb-1 flex items-center gap-1.5">
                      <Truck className="h-4 w-4" />
                      J&T Express
                    </p>
                    <p className="text-xs text-red-600">
                      No action needed on your end. After your order is confirmed, our team will book a J&T Express pickup for you and update your order with the tracking details.
                    </p>
                  </div>
                )}

                {/* Lalamove address */}
                {deliveryMethod === 'LALAMOVE' && (
                  <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-xl space-y-3">
                    <p className="text-sm font-medium text-primary-800 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      Lalamove Delivery Address
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSameAddress}
                        onChange={(e) => setUseSameAddress(e.target.checked)}
                        className="rounded text-primary-600"
                      />
                      <span className="text-sm text-primary-700">Same as my shipping address</span>
                    </label>
                    {!useSameAddress && (
                      <textarea
                        value={lalamoveAddress}
                        onChange={(e) => setLalamoveAddress(e.target.value)}
                        placeholder="Enter full delivery address or paste Lalamove pin location…"
                        rows={3}
                        className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Payment method */}
              <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-6 mt-4">
                <h2 className="font-display font-semibold text-espresso mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary-700" />
                  Payment Method
                </h2>

                {paymentMethods.length === 0 ? (
                  <p className="text-sm text-stone-400">No payment methods available. Please contact the store.</p>
                ) : (
                  <div className="space-y-4">
                    {/* GCash options */}
                    {gcashMethods.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-espresso/50 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Smartphone className="h-3 w-3" /> E-Wallet
                        </p>
                        <div className="space-y-2">
                          {gcashMethods.map((m) => (
                            <label
                              key={m.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedPaymentId === m.id ? 'border-sky-500 bg-sky-50' : 'border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="payment"
                                value={m.id}
                                checked={selectedPaymentId === m.id}
                                onChange={() => setSelectedPaymentId(m.id)}
                                className="text-sky-600"
                              />
                              <Smartphone className="h-4 w-4 text-sky-500 flex-shrink-0" />
                              <span className="font-medium text-sm text-espresso">{m.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bank Transfer options */}
                    {bankMethods.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-espresso/50 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> Bank Transfer
                        </p>
                        <div className="space-y-2">
                          {bankMethods.map((m) => (
                            <label
                              key={m.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedPaymentId === m.id ? 'border-primary-500 bg-primary-50' : 'border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="payment"
                                value={m.id}
                                checked={selectedPaymentId === m.id}
                                onChange={() => setSelectedPaymentId(m.id)}
                                className="text-primary-600"
                              />
                              <Building2 className="h-4 w-4 text-primary-600 flex-shrink-0" />
                              <span className="font-medium text-sm text-espresso">{m.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* QR Code display */}
                    {selectedPayment?.qrCode && (
                      <div className="mt-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                        <p className="text-xs font-medium text-espresso/60 mb-3 flex items-center gap-1">
                          <QrCode className="h-3 w-3" />
                          Scan to pay via {selectedPayment.name}
                        </p>
                        <div
                          className="relative w-40 h-40 mx-auto cursor-zoom-in group"
                          onClick={() => setLightboxQr({ src: selectedPayment.qrCode!, name: selectedPayment.name })}
                        >
                          <img
                            src={selectedPayment.qrCode}
                            alt={`${selectedPayment.name} QR Code`}
                            className="w-full h-full object-contain border border-stone-200 rounded-lg bg-white p-1"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-espresso/0 group-hover:bg-espresso/20 rounded-lg transition-colors">
                            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 text-center mt-2">
                          Tap image to enlarge · Send exact amount · Upload proof after placing order
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-6 sticky top-20">
                <h2 className="font-display font-semibold text-espresso mb-4">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-espresso/70">
                      <span className="truncate mr-2">{item.name} x{item.quantity}</span>
                      <span className="flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-stone-100 mt-4 pt-4">
                  <div className="flex justify-between font-bold text-espresso">
                    <span>Total</span>
                    <span className="text-primary-700 text-lg">{formatCurrency(getTotalPrice())}</span>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl mt-4 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
                  <p className="font-medium mb-1">Deposit Required</p>
                  <p>After placing your order, you have 24 hours to submit deposit proof. Otherwise, your order will be automatically cancelled.</p>
                </div>

                {!session ? (
                  <Link href="/login" className="block w-full btn-primary text-center mt-4 py-3">
                    Login to Place Order
                  </Link>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isLoading}
                    className="w-full btn-primary mt-4 py-3 text-base font-semibold"
                  >
                    {isLoading ? 'Placing Order...' : 'Place Order'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Lightbox */}
      {lightboxQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80"
          onClick={() => setLightboxQr(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-warm p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-espresso flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary-700" />
                {lightboxQr.name}
              </p>
              <button
                onClick={() => setLightboxQr(null)}
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-espresso transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={lightboxQr.src}
              alt={`${lightboxQr.name} QR Code`}
              className="w-full object-contain rounded-lg border border-stone-100"
            />
            <p className="text-xs text-stone-400 text-center mt-3">Scan with your phone camera or payment app</p>
          </div>
        </div>
      )}
    </div>
  );
}
