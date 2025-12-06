import { query, queryOne } from '../config/database.ts';
import { logger } from '../utils/logger.ts';
import type {
  UniversityRow,
  UniversityProfileRow,
  UpdateLogRow,
  UniversityWithProfile,
  CreateUpdateLogInput,
} from '../types/database.ts';
import type { University } from '../types/university.ts';

/**
 * Параметры пагинации
 */
interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Параметры поиска университетов
 */
interface SearchParams extends PaginationParams {
  search?: string;
  country?: string;
  city?: string;
}

/**
 * Результат списка с пагинацией
 */
interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Получить список университетов
 * @param params - параметры пагинации и поиска
 * @returns список университетов с пагинацией
 */
export const getAllUniversities = async (
  params: SearchParams = {}
): Promise<PaginatedResult<UniversityRow>> => {
  const { limit = 20, offset = 0, search, country, city } = params;

  logger.debug('Fetching universities', { limit, offset, search, country, city });

  try {
    // Базовый запрос
    let whereClause = 'WHERE is_active = true';
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    // Добавить фильтр поиска
    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR name_en ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Фильтр по стране
    if (country) {
      whereClause += ` AND country = $${paramIndex}`;
      queryParams.push(country);
      paramIndex++;
    }

    // Фильтр по городу
    if (city) {
      whereClause += ` AND city = $${paramIndex}`;
      queryParams.push(city);
      paramIndex++;
    }

    // Получить общее количество
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM universities ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult[0]?.count ?? '0', 10);

    // Получить данные с пагинацией
    const data = await query<UniversityRow>(
      `SELECT id, name, name_en, country, city, website_url, logo_url, is_active, created_at, updated_at
       FROM universities
       ${whereClause}
       ORDER BY name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    logger.info('Universities fetched', { count: data.length, total });

    return { data, total, limit, offset };
  } catch (err) {
    logger.error('Failed to fetch universities', err);
    throw err;
  }
};

/**
 * Получить университет по ID
 * @param id - UUID университета
 * @returns университет или null
 */
export const getUniversityById = async (
  id: string
): Promise<UniversityRow | null> => {
  logger.debug('Fetching university by ID', { id });

  try {
    const university = await queryOne<UniversityRow>(
      `SELECT id, name, name_en, country, city, website_url, logo_url, is_active, created_at, updated_at
       FROM universities
       WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (!university) {
      logger.debug('University not found', { id });
      return null;
    }

    logger.debug('University found', { id, name: university.name });
    return university;
  } catch (err) {
    logger.error('Failed to fetch university', { id, error: err });
    throw err;
  }
};

/**
 * Получить университет с профилем
 * @param id - UUID университета
 * @returns университет с профилем или null
 */
export const getUniversityWithProfile = async (
  id: string
): Promise<UniversityWithProfile | null> => {
  logger.debug('Fetching university with profile', { id });

  try {
    const result = await queryOne<UniversityRow & { profile_json: University | null }>(
      `SELECT 
        u.id, u.name, u.name_en, u.country, u.city, 
        u.website_url, u.logo_url, u.is_active, u.created_at, u.updated_at,
        p.profile_json
       FROM universities u
       LEFT JOIN LATERAL (
         SELECT profile_json 
         FROM university_profiles 
         WHERE university_id = u.id 
         ORDER BY version DESC, created_at DESC 
         LIMIT 1
       ) p ON true
       WHERE u.id = $1 AND u.is_active = true`,
      [id]
    );

    if (!result) {
      logger.debug('University not found', { id });
      return null;
    }

    const { profile_json, ...university } = result;

    logger.debug('University with profile found', { id, hasProfile: !!profile_json });

    return {
      ...university,
      profile: profile_json,
    };
  } catch (err) {
    logger.error('Failed to fetch university with profile', { id, error: err });
    throw err;
  }
};

/**
 * Получить только профиль университета
 * @param id - UUID университета
 * @returns профиль или null
 */
export const getUniversityProfile = async (
  id: string
): Promise<University | null> => {
  logger.debug('Fetching university profile', { id });

  try {
    const result = await queryOne<{ profile_json: University }>(
      `SELECT profile_json
       FROM university_profiles
       WHERE university_id = $1
       ORDER BY version DESC, created_at DESC
       LIMIT 1`,
      [id]
    );

    if (!result) {
      logger.debug('Profile not found', { id });
      return null;
    }

    return result.profile_json;
  } catch (err) {
    logger.error('Failed to fetch university profile', { id, error: err });
    throw err;
  }
};

/**
 * Обновить профиль университета
 * @param id - UUID университета
 * @param profile - новый профиль
 * @returns обновленный профиль
 */
export const updateUniversityProfile = async (
  id: string,
  profile: University
): Promise<UniversityProfileRow> => {
  logger.info('Updating university profile', { id });

  try {
    // Получить текущую версию
    const currentVersion = await queryOne<{ version: number }>(
      `SELECT COALESCE(MAX(version), 0) as version
       FROM university_profiles
       WHERE university_id = $1`,
      [id]
    );

    const newVersion = (currentVersion?.version ?? 0) + 1;

    // Обновить timestamp в профиле
    const updatedProfile: University = {
      ...profile,
      id,
      updated_at: new Date().toISOString(),
    };

    // Вставить новую версию профиля
    const result = await queryOne<UniversityProfileRow>(
      `INSERT INTO university_profiles (university_id, profile_json, language, version)
       VALUES ($1, $2, 'ru', $3)
       RETURNING id, university_id, profile_json, language, version, created_at`,
      [id, JSON.stringify(updatedProfile), newVersion]
    );

    if (!result) {
      throw new Error('Failed to insert profile');
    }

    // Обновить updated_at в основной таблице
    await query(
      `UPDATE universities SET updated_at = NOW() WHERE id = $1`,
      [id]
    );

    logger.info('University profile updated', { id, version: newVersion });

    return result;
  } catch (err) {
    logger.error('Failed to update university profile', { id, error: err });
    throw err;
  }
};

/**
 * Логировать попытку обновления
 * @param input - данные лога
 * @returns созданная запись лога
 */
export const logUpdateAttempt = async (
  input: CreateUpdateLogInput
): Promise<UpdateLogRow> => {
  logger.debug('Logging update attempt', input);

  try {
    const result = await queryOne<UpdateLogRow>(
      `INSERT INTO update_logs (source_id, status, changes_detected, error_message, processing_time_ms)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, source_id, status, changes_detected, error_message, processing_time_ms, created_at`,
      [
        input.source_id,
        input.status,
        input.changes_detected,
        input.error_message ?? null,
        input.processing_time_ms ?? null,
      ]
    );

    if (!result) {
      throw new Error('Failed to create update log');
    }

    logger.debug('Update log created', { id: result.id });

    return result;
  } catch (err) {
    logger.error('Failed to log update attempt', err);
    throw err;
  }
};

/**
 * Получить список стран (для фильтров)
 * @returns список уникальных стран
 */
export const getCountries = async (): Promise<string[]> => {
  try {
    const result = await query<{ country: string }>(
      `SELECT DISTINCT country FROM universities WHERE is_active = true ORDER BY country`
    );
    return result.map((r) => r.country);
  } catch (err) {
    logger.error('Failed to fetch countries', err);
    throw err;
  }
};

/**
 * Получить список городов (для фильтров)
 * @param country - опциональный фильтр по стране
 * @returns список уникальных городов
 */
export const getCities = async (country?: string): Promise<string[]> => {
  try {
    let sql = `SELECT DISTINCT city FROM universities WHERE is_active = true`;
    const params: unknown[] = [];

    if (country) {
      sql += ` AND country = $1`;
      params.push(country);
    }

    sql += ` ORDER BY city`;

    const result = await query<{ city: string }>(sql, params);
    return result.map((r) => r.city);
  } catch (err) {
    logger.error('Failed to fetch cities', err);
    throw err;
  }
};
