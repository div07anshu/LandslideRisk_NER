import { createApp } from './app';
import { env } from './config';
import { startAlertMonitor } from './services/alertMonitor';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(
    `[backend] listening on http://localhost:${env.port} (${env.nodeEnv})`,
  );

  startAlertMonitor();
});

// Graceful shutdown
function shutdown(signal: string): void {
  console.log(`[backend] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));