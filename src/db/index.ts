/**
 * Экспорт функций работы с БД
 */

export {
  runMigrations,
  getAppliedMigrations,
} from './migrations.ts';

export {
  seedUniversities,
  clearAllData,
  hasData,
} from './seed.ts';
