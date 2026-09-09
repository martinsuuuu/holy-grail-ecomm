'use client';

import { useState, useEffect } from 'react';
import { Truck, ExternalLink, Save, CheckCircle } from 'lucide-react';

export default function DeliverySettingsPage() {
  const [shopeeLink, setShopeeLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        setShopeeLink(data.shopee_checkout_link || '');
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopee_checkout_link: shopeeLink }),
    });
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-espresso flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary-600" />
          Delivery Settings
        </h1>
        <p className="text-sm text-stone-500 mt-1">Configure delivery options shown to customers at checkout</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/70 shadow-soft p-6">
        <h2 className="text-base font-display font-semibold text-espresso mb-1">Shopee Checkout</h2>
        <p className="text-sm text-stone-500 mb-4">
          Customers selecting Shopee Checkout will see this link at checkout. Paste your Shopee product or checkout URL here.
        </p>

        {isLoading ? (
          <div className="h-10 bg-stone-200 rounded-xl animate-pulse" />
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="url"
                value={shopeeLink}
                onChange={(e) => { setShopeeLink(e.target.value); setSaved(false); }}
                placeholder="https://shopee.ph/..."
                className="flex-1 border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {shopeeLink && (
                <a
                  href={shopeeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-2 text-sm text-primary-600 hover:text-primary-800 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Test
                </a>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="mt-4 flex items-center gap-2 bg-espresso hover:bg-primary-800 disabled:opacity-60 text-cream text-sm font-medium px-4 py-2 rounded-full transition-colors"
            >
              {saved ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving…' : 'Save'}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
