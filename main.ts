/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

/**
 * Точка входа приложения "Цифровой университет"
 * 
 * Порядок инициализации:
 * 1. Загрузка переменных окружения
 * 2. Проверка подключения к БД
 * 3. Запуск миграций
 * 4. Заполнение тестовыми данными (если база пустая)
 * 5. Запуск фонового воркера обновления
 * 6. Запуск Fresh сервера
 */

import '$std/dotenv/load.ts';

import { start } from '$fresh/server.ts';
import manifest from './fresh.gen.ts';
import config from './fresh.config.ts';
import { logger } from './src/utils/logger.ts';
import { testConnection, closePool, query } from './src/config/database.ts';
import { runMigrations } from './src/db/migrations.ts';
import { seedUniversities } from './src/db/seed.ts';
import { startUpdateWorker, stopUpdateWorker } from './src/workers/update.worker.ts';
import { loadEnv } from './src/config/env.ts';

/**
 * Проверить пустая ли база данных
 */
async function checkDbEmpty(): Promise<boolean> {
  try {
    const result = await query<{ count: string }>('SELECT COUNT(*) as count FROM universities');
    return parseInt(result[0]?.count ?? '0', 10) === 0;
  } catch {
    return true;
  }
}

/**
 * Главная функция инициализации
 */
async function main(): Promise<void> {
  const startTime = Date.now();
  
  logger.info('╔════════════════════════════════════════════╗');
  logger.info('║     🎓 Цифровой университет - Запуск      ║');
  logger.info('╚════════════════════════════════════════════╝');
  
  try {
    // 1. Загрузка переменных окружения
    logger.info('📋 Загрузка конфигурации...');
    const env = loadEnv();
    logger.info('Окружение:', { 
      DENO_ENV: env.DENO_ENV,
      PORT: env.PORT,
    });
    
    // 2. Проверка подключения к БД
    logger.info('🔌 Проверка подключения к базе данных...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      throw new Error('Не удалось подключиться к базе данных');
    }
    logger.info('✅ База данных подключена');
    
    // 3. Запуск миграций
    logger.info('📦 Запуск миграций...');
    const migrations = await runMigrations();
    logger.info('✅ Миграции выполнены', {
      count: migrations.length,
    });
    
    // 4. Заполнение тестовыми данными (если база пустая)
    const empty = await checkDbEmpty();
    if (empty) {
      logger.info('🌱 База пустая, заполняем тестовыми данными...');
      await seedUniversities();
      logger.info('✅ Тестовые данные добавлены');
    } else {
      logger.info('📊 База данных уже содержит данные');
    }
    
    // 5. Запуск фонового воркера
    logger.info('⚙️  Запуск фонового воркера обновления...');
    startUpdateWorker();
    
    // 6. Запуск Fresh сервера
    const initDuration = Date.now() - startTime;
    logger.info('🚀 Запуск веб-сервера...');
    logger.info(`✅ Инициализация завершена за ${initDuration}ms`);
    logger.info('');
    logger.info('╔════════════════════════════════════════════╗');
    logger.info(`║  Сервер: http://localhost:${env.PORT}            ║`);
    logger.info('║  API:    /api/universities               ║');
    logger.info('║  Health: /api/debug?action=health        ║');
    logger.info('╚════════════════════════════════════════════╝');
    logger.info('');
    
    // Запуск Fresh
    await start(manifest, config);
    
  } catch (err) {
    logger.error('❌ Критическая ошибка при запуске:', err);
    throw err;
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(): Promise<void> {
  logger.info('🛑 Получен сигнал завершения...');
  
  try {
    // Остановить воркер
    stopUpdateWorker();
    logger.info('✅ Воркер остановлен');
    
    // Закрыть пул подключений
    await closePool();
    logger.info('✅ Подключения к БД закрыты');
    
    logger.info('👋 До свидания!');
  } catch (err) {
    logger.error('Ошибка при завершении:', err);
  }
}

// Обработка сигналов завершения
Deno.addSignalListener('SIGINT', async () => {
  await shutdown();
  Deno.exit(0);
});

Deno.addSignalListener('SIGTERM', async () => {
  await shutdown();
  Deno.exit(0);
});

// Запуск приложения
main().catch((err) => {
  console.error('💥 Fatal error:', err);
  Deno.exit(1);
});
