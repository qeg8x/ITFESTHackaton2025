#!/usr/bin/env -S deno run -A
/**
 * Скрипт инициализации БД
 * Запуск: deno task db:setup
 */

import '$std/dotenv/load.ts';
import { initDatabase, closePool } from '../src/config/database.ts';
import { runMigrations } from '../src/db/migrations.ts';
import { seedUniversities, hasData } from '../src/db/seed.ts';
import { logger } from '../src/utils/logger.ts';

const main = async () => {
  logger.info('=== Database Setup Script ===');
  
  try {
    // 1. Проверить подключение
    await initDatabase();
    
    // 2. Выполнить миграции
    const migrations = await runMigrations('./sql');
    
    const failed = migrations.filter((m) => !m.success);
    if (failed.length > 0) {
      logger.error('Some migrations failed', failed);
      Deno.exit(1);
    }
    
    // 3. Заполнить тестовыми данными (если БД пустая)
    const dataExists = await hasData();
    
    if (!dataExists) {
      logger.info('Database is empty, seeding with test data...');
      await seedUniversities();
    } else {
      logger.info('Database already has data, skipping seed');
    }
    
    logger.info('=== Database setup completed successfully ===');
  } catch (err) {
    logger.error('Database setup failed', err);
    Deno.exit(1);
  } finally {
    await closePool();
  }
};

await main();
