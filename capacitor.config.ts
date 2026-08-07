import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flosmith.app',
  appName: 'FloSmith',
  webDir: 'dist/FloSmithApp/browser',
  bundledWebRuntime: false,
  plugins: {
    Keyboard: {
      resize: 'none',
      scrollAssist: false
    }
  }
};

export default config;
