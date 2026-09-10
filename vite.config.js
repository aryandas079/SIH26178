import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import sensorLogWatcherPlugin from './scripts/vitePluginSensorLogs.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const geminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || 'AQ.Ab8RN6L-0tHhsik9pQr7rab4bEchUDIZAgtupg3oM-6LCvobXg';

  return {
    plugins: [react(), sensorLogWatcherPlugin()],
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
