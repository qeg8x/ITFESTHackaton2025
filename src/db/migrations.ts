import { getClient } from '../config/database.ts';
import { logger } from '../utils/logger.ts';
import type { PoolClient } from 'postgres';

/**
 * Результат выполнения миграции
 */
interface MigrationResult {
  filename: string;
  success: boolean;
  error?: string;
  duration_ms: number;
}

/**
 * Получить список SQL файлов миграций
 * @param migrationsDir - путь к папке с миграциями
 * @returns отсортированный список файлов
 */
const getMigrationFiles = async (migrationsDir: string): Promise<string[]> => {
  const files: string[] = [];
  
  try {
    for await (const entry of Deno.readDir(migrationsDir)) {
      if (entry.isFile && entry.name.endsWith('.sql')) {
        files.push(entry.name);
      }
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      logger.warn(`Migrations directory not found: ${migrationsDir}`);
      return [];
    }
    throw err;
  }
  
  // Сортировка по номеру миграции (001_, 002_, ...)
  return files.sort((a, b) => a.localeCompare(b));
};

/**
 * Прочитать содержимое SQL файла
 * @param filePath - путь к файлу
 * @returns содержимое файла
 */
const readSqlFile = async (filePath: string): Promise<string> => {
  const content = await Deno.readTextFile(filePath);
  return content;
};

/**
 * Создать таблицу для отслеживания миграций
 * @param client - клиент БД
 */
const ensureMigrationsTable = async (client: PoolClient): Promise<void> => {
  await client.queryObject(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
};

/**
 * Проверить была ли миграция применена
 * @param client - клиент БД
 * @param filename - имя файла миграции
 * @returns true если миграция уже применена
 */
const isMigrationApplied = async (
  client: PoolClient,
  filename: string
): Promise<boolean> => {
  const result = await client.queryObject<{ count: number }>(
    'SELECT COUNT(*) as count FROM _migrations WHERE filename = $1',
    [filename]
  );
  return (result.rows[0]?.count ?? 0) > 0;
};

/**
 * Записать миграцию как примененную
 * @param client - клиент БД
 * @param filename - имя файла миграции
 */
const recordMigration = async (
  client: PoolClient,
  filename: string
): Promise<void> => {
  await client.queryObject(
    'INSERT INTO _migrations (filename) VALUES ($1)',
    [filename]
  );
};

/**
 * Выполнить одну миграцию
 * @param client - клиент БД
 * @param migrationsDir - папка с миграциями
 * @param filename - имя файла
 * @returns результат миграции
 */
const executeMigration = async (
  client: PoolClient,
  migrationsDir: string,
  filename: string
): Promise<MigrationResult> => {
  const startTime = Date.now();
  
  try {
    // Проверить идемпотентность
    const alreadyApplied = await isMigrationApplied(client, filename);
    
    if (alreadyApplied) {
      logger.debug(`Migration already applied: ${filename}`);
      return {
        filename,
        success: true,
        duration_ms: Date.now() - startTime,
      };
    }
    
    // Прочитать и выполнить SQL
    const filePath = `${migrationsDir}/${filename}`;
    const sql = await readSqlFile(filePath);
    
    logger.info(`Applying migration: ${filename}`);
    
    await client.queryObject(sql);
    await recordMigration(client, filename);
    
    const duration = Date.now() - startTime;
    logger.info(`Migration applied successfully: ${filename} (${duration}ms)`);
    
    return {
      filename,
      success: true,
      duration_ms: duration,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Migration failed: ${filename}`, { error: errorMessage });
    
    return {
      filename,
      success: false,
      error: errorMessage,
      duration_ms: Date.now() - startTime,
    };
  }
};

/**
 * Выполнить все миграции
 * @param migrationsDir - путь к папке с миграциями (по умолчанию ./sql)
 * @returns массив результатов
 */
export const runMigrations = async (
  migrationsDir = './sql'
): Promise<MigrationResult[]> => {
  const results: MigrationResult[] = [];
  let client = null;
  
  try {
    logger.info('Starting database migrations...');
    
    client = await getClient();
    
    // Создать таблицу миграций
    await ensureMigrationsTable(client);
    
    // Получить список файлов
    const files = await getMigrationFiles(migrationsDir);
    
    if (files.length === 0) {
      logger.info('No migration files found');
      return results;
    }
    
    logger.info(`Found ${files.length} migration file(s)`);
    
    // Выполнить миграции последовательно
    for (const filename of files) {
      const result = await executeMigration(client, migrationsDir, filename);
      results.push(result);
      
      // Прервать при ошибке
      if (!result.success) {
        logger.error('Migration process stopped due to error');
        break;
      }
    }
    
    // Статистика
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    
    logger.info('Migrations completed', {
      total: results.length,
      successful,
      failed,
    });
    
    return results;
  } catch (err) {
    logger.error('Migration process failed', err);
    throw err;
  } finally {
    client?.release();
  }
};

/**
 * Получить список примененных миграций
 * @returns список имен файлов
 */
export const getAppliedMigrations = async (): Promise<string[]> => {
  let client = null;
  
  try {
    client = await getClient();
    
    await ensureMigrationsTable(client);
    
    const result = await client.queryObject<{ filename: string }>(
      'SELECT filename FROM _migrations ORDER BY applied_at'
    );
    
    return result.rows.map((r) => r.filename);
  } finally {
    client?.release();
  }
};
