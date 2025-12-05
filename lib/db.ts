import { Pool } from 'postgres';

/**
 * Пул подключений к PostgreSQL
 */
const createPool = () => {
  const databaseUrl = Deno.env.get('DATABASE_URL');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return new Pool(databaseUrl, 3, true);
};

let pool: Pool | null = null;

/**
 * Получить пул подключений к БД
 * @returns Pool - пул подключений PostgreSQL
 */
export const getPool = (): Pool => {
  if (!pool) {
    pool = createPool();
  }
  return pool;
};

/**
 * Выполнить SQL-запрос
 * @param query - SQL запрос
 * @param args - параметры запроса
 * @returns результат запроса
 */
export const query = async <T>(
  queryText: string,
  args: unknown[] = []
): Promise<T[]> => {
  const client = await getPool().connect();
  try {
    const result = await client.queryObject<T>(queryText, args);
    return result.rows;
  } finally {
    client.release();
  }
};

/**
 * Выполнить SQL-запрос и вернуть первую строку
 * @param queryText - SQL запрос
 * @param args - параметры запроса
 * @returns первая строка результата или null
 */
export const queryOne = async <T>(
  queryText: string,
  args: unknown[] = []
): Promise<T | null> => {
  const rows = await query<T>(queryText, args);
  return rows[0] ?? null;
};
