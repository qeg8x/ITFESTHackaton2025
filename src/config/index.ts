/**
 * Экспорт конфигурации
 */

export {
  loadEnv,
  isDevelopment,
  isProduction,
  getDatabaseUrl,
  type EnvConfig,
} from './env.ts';

export {
  getPool,
  getClient,
  query,
  queryOne,
  transaction,
  testConnection,
  initDatabase,
  closePool,
} from './database.ts';

export {
  validateAdminKey,
  getAdminInfo,
  hasPermission,
  maskKey,
  getAdminCount,
  clearAdminKeysCache,
  type AdminInfo,
  type AdminPermission,
} from './admin.ts';
