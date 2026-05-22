import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dodo.livraison',
  appName: 'Dodo Livraison',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false // Strict HTTPS compliance for Google Play Store safety
  },
  android: {
    allowMixedContent: false,
    captureInput: true
  }
};

export default config;
