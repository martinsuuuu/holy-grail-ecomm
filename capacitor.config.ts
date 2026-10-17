import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.holygrail.app',
  appName: 'Holy Grail',
  webDir: 'mobile-shell',
  // This Next.js app has server-rendered routes, auth, and a live database —
  // it can't be statically exported into the app bundle, so the WebView
  // loads the live production site directly instead.
  server: {
    url: 'https://luxury-ecomm-khaki.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0B3D2E',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B3D2E',
      overlaysWebView: false,
    },
  },
};

export default config;
