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

      // iOS overlays the status bar on top of the WebView by default, which
      // left a blank gap (the page's own background showing through) above
      // the announcement bar instead of the brand color. Reserving the
      // space instead avoids needing safe-area-aware CSS across the site.
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
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
