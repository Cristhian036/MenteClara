import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.menteclara.app',
  appName: 'MenteClara',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  overrideUserAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A.230803.041) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.122 Mobile Safari/537.36'
};


export default config;
