import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flosmith.app',
  appName: 'FloSmith',
  webDir: 'dist/FloSmithApp/browser',
  server: {
    androidScheme: 'http' // Switched to http to troubleshoot blank screen issues
  },
  plugins: {
    Keyboard: {
      resize: 'none',
      scrollAssist: false
    }
  },
  android: {
    buildOptions: {
      releaseType: 'bundle',
    }
  }
};

export default config;
