'use client';

import { useEffect } from 'react';

/**
 * Wires up native-shell behavior when this site is running inside the
 * Capacitor app wrapper (see capacitor.config.ts — it points the wrapper at
 * this live site via `server.url`, so the exact same Next.js code serves
 * both the website and the app). A complete no-op on the regular website:
 * Capacitor.isNativePlatform() is false in any normal browser, so none of
 * the native bridge calls below ever run there.
 */
export default function CapacitorBridge() {
  useEffect(() => {
    let removeBackButtonListener: (() => void) | undefined;

    (async () => {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;

      const { StatusBar, Style } = await import('@capacitor/status-bar');
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#0B3D2E' }).catch(() => {});

      // Android has no in-app back button of its own — without this, the
      // hardware back button does nothing (or exits the app immediately)
      // instead of navigating back through the site like a user expects.
      const { App } = await import('@capacitor/app');
      const sub = await App.addListener('backButton', () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });
      removeBackButtonListener = () => sub.remove();
    })();

    return () => removeBackButtonListener?.();
  }, []);

  return null;
}
