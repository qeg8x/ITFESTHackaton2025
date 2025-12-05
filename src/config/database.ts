import { Pool, PoolClient } from 'postgres';
import { logger } from '../utils/logger.ts';
import { getDatabaseUrl } from './env.ts';

/**
 * Глобальный пул подключений
 */
let pool: Pool | null = null;

/**
 * Конфигурация пула подключений
 */
const POOL_CONFIG = {
  size: 5,         // Размер пула
  lazy: true,      // Ленивая инициализация
};

/**
 * Создать пул подключений к БД
 * @returns Pool - пул подключений PostgreSQL
 */
const createPool = (): Pool => {
  const databaseUrl = getDatabaseUrl();
  
  logger.info('Creating database connection pool...');
  
  return new Pool(databaseUrl, POOL_CONFIG.size, POOL_CONFIG.lazy);
};

/**
 * Получить пул подключений (singleton)
 * @returns Pool - пул подключений
 */
export const getPool = (): Pool => {
  if (!pool) {
    pool = createPool();
  }
  return pool;
};

/**
 * Получить клиент из пула
 * @returns PoolClient - клиент БД
 */
export const getClient = async (): Promise<PoolClient> => {
  const p = getPool();
  return await p.connect();
};

/**
 * Проверить подключение к БД
 * @returns true если подключение успешно
 */
export const testConnection = async (): Promise<boolean> => {
  let client: PoolClient | null = null;
  
  try {
    logger.info('Testing database connection...');
    
    client = await getClient();
    const result = await client.queryObject<{ now: Date }>('SELECT NOW() as now');
    
    logger.info('Database connection successful', {
      serverTime: result.rows[0]?.now,
    });
    
    return true;
  } catch (err) {
    logger.error('Database connection failed', err);
    return false;
  } finally {
    client?.release();
  }
};

/**
 * Выполнить SQL-запрос
 * @param queryText - SQL запрос
 * @param args - параметры запроса
 * @returns результат запроса
 */
export const query = async <T>(
  queryText: string,
  args: unknown[] = []
): Promise<T[]> => {
  let client: PoolClient | null = null;
  
  try {
    client = await getClient();
    const result = await client.queryObject<T>(queryText, args);
    return result.rows;
  } catch (err) {
    logger.error('Query execution failed', { query: queryText, error: err });
    throw err;
  } finally {
    client?.release();
  }
};

/**
 * Выполнить SQL-запрос и вернуть первую строку
 * @param queryText - SQL запрос
 * @param args - параметры запроса
 * @returns первая строка или null
 */
export const queryOne = async <T>(
  queryText: string,
  args: unknown[] = []
): Promise<T | null> => {
  const rows = await query<T>(queryText, args);
  return rows[0] ?? null;
};

/**
 * Выполнить транзакцию
 * @param fn - функция с запросами
 * @returns результат транзакции
 */
export const transaction = async <T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> => {
  let client: PoolClient | null = null;
  
  try {
    client = await getClient();
    await client.queryObject('BEGIN');
    
    const result = await fn(client);
    
    await client.queryObject('COMMIT');
    return result;
  } catch (err) {
    if (client) {
      await client.queryObject('ROLLBACK');
    }
    logger.error('Transaction failed, rolled back', err);
    throw err;
  } finally {
    client?.release();
  }
};

/**
 * Закрыть пул подключений
 */
export const closePool = async (): Promise<void> => {
  if (pool) {
    logger.info('Closing database connection pool...');
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
};

/**
 * Инициализировать подключение к БД
 * @returns true если инициализация успешна
 */
export const initDatabase = async (): Promise<boolean> => {
  try {
    const connected = await testConnection();
    
    if (!connected) {
      throw new Error('Could not establish database connection');
    }
    
    return true;
  } catch (err) {
    logger.error('Database initialization failed', err);
    throw err;
  }
};
