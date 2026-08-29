import { createApp } from './app';
import { env } from './config';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(
    `[backend] listening on http://localhost:${env.port} (${env.nodeEnv})`,
  );
});

// Graceful shutdown
function shutdown(signal: string): void {
  console.log(`[backend] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
