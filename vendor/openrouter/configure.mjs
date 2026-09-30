import { configureLocalWorker } from './local-config.mjs';
try {
  await configureLocalWorker();
  console.log('Configuración de IA guardada en vendor/cloudflare/.dev.vars (archivo local ignorado). No se ha desplegado el Worker.');
} catch {
  console.error('No se ha podido configurar la IA. Revisa .env y los permisos del archivo local.');
  process.exitCode = 1;
}
