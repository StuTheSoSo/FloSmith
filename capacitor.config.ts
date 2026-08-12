import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flosmith.app', // Ensure this matches your package name in the Play Console
  appName: 'FloSmith',
  webDir: 'dist/FloSmithApp/browser',
  server: {
    androidScheme: 'https' // Recommended for production
  },
  plugins: {
    Keyboard: {
      resize: 'none',
      scrollAssist: false
    }
  },
  android: {
    buildOptions: {
      releaseType: 'bundle', // Mandatory for new Play Store apps (.aab)
    }
  }
};

export default config;
