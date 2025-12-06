/**
 * Admin Service - управление университетами
 */

import { logger } from '../utils/logger.ts';
import { query, queryOne, transaction } from '../config/database.ts';
import { calculateCompletenessScore } from './parser.service.ts';
import { NO_INFO, type University, type Program } from '../types/university.ts';
import type { PoolClient } from 'postgres';

/**
 * Результат операции
 */
export interface AdminOperationResult {
  success: boolean;
  message: string;
  changes?: Record<string, unknown>;
  data?: unknown;
}

/**
 * Diff изменений
 */
export interface ChangesDiff {
  added: number;
  removed: number;
  updated: number;
  details?: string[];
}

/**
 * Валидация университета
 */
export const validateUniversity = (data: Partial<University>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name is required (min 2 characters)');
  }

  if (!data.country || data.country.trim().length < 2) {
    errors.push('Country is required');
  }

  if (!data.city || data.city.trim().length < 2) {
    errors.push('City is required');
  }

  if (data.website_url) {
    try {
      new URL(data.website_url);
    } catch {
      errors.push('Invalid website URL');
    }
  }

  if (data.programs && !Array.isArray(data.programs)) {
    errors.push('Programs must be an array');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Валидация программы
 */
export const validateProgram = (data: Partial<Program>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Program name is required');
  }

  if (!data.degree_level) {
    errors.push('Degree level is required');
  }

  if (data.duration_years !== undefined && (data.duration_years < 1 || data.duration_years > 10)) {
    errors.push('Duration must be between 1 and 10 years');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Создать университет
 */
export const createUniversity = async (data: {
  name: string;
  name_en?: string;
  country: string;
  city: string;
  website_url: string;
  description?: string;
}): Promise<AdminOperationResult> => {
  logger.info('Admin: Creating university', { name: data.name });

  const validation = validateUniversity(data as Partial<University>);
  if (!validation.valid) {
    return { success: false, message: 'Validation failed', changes: { errors: validation.errors } };
  }

  try {
    const result = await transaction(async (client: PoolClient) => {
      // Создать университет
      const uniResult = await client.queryObject<{ id: string }>(
        `INSERT INTO universities (name, name_en, country, city, website_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [data.name, data.name_en ?? null, data.country, data.city, data.website_url]
      );

      const universityId = uniResult.rows[0].id;

      // Создать начальный профиль
      const profile: University = {
        id: universityId,
        name: data.name,
        name_en: data.name_en,
        country: data.country,
        city: data.city,
        website_url: data.website_url,
        description: data.description ?? NO_INFO,
        programs: [],
        updated_at: new Date().toISOString(),
      };

      await client.queryObject(
        `INSERT INTO university_profiles (university_id, profile_json, language, version)
         VALUES ($1, $2, 'ru', 1)`,
        [universityId, JSON.stringify(profile)]
      );

      // Создать источник
      await client.queryObject(
        `INSERT INTO university_sources (university_id, url, source_type)
         VALUES ($1, $2, 'website')`,
        [universityId, data.website_url]
      );

      return universityId;
    });

    logger.info('Admin: University created', { id: result });

    return {
      success: true,
      message: 'University created successfully',
      data: { id: result },
    };
  } catch (err) {
    logger.error('Admin: Failed to create university', err);
    return { success: false, message: `Failed to create: ${err}` };
  }
};

/**
 * Удалить университет
 */
export const deleteUniversity = async (id: string): Promise<AdminOperationResult> => {
  logger.info('Admin: Deleting university', { id });

  try {
    // Проверить существование
    const exists = await queryOne<{ id: string }>(
      'SELECT id FROM universities WHERE id = $1',
      [id]
    );

    if (!exists) {
      return { success: false, message: 'University not found' };
    }

    await transaction(async (client: PoolClient) => {
      // Удалить логи
      await client.queryObject(
        `DELETE FROM update_logs WHERE source_id IN 
         (SELECT id FROM university_sources WHERE university_id = $1)`,
        [id]
      );

      // Удалить источники
      await client.queryObject(
        'DELETE FROM university_sources WHERE university_id = $1',
        [id]
      );

      // Удалить профили
      await client.queryObject(
        'DELETE FROM university_profiles WHERE university_id = $1',
        [id]
      );

      // Удалить университет
      await client.queryObject(
        'DELETE FROM universities WHERE id = $1',
        [id]
      );
    });

    logger.info('Admin: University deleted', { id });

    return { success: true, message: 'University deleted successfully' };
  } catch (err) {
    logger.error('Admin: Failed to delete university', err);
    return { success: false, message: `Failed to delete: ${err}` };
  }
};

/**
 * Получить профиль для редактирования
 */
export const getProfileForEdit = async (universityId: string): Promise<University | null> => {
  const result = await queryOne<{ profile_json: University }>(
    `SELECT profile_json FROM university_profiles 
     WHERE university_id = $1 
     ORDER BY version DESC LIMIT 1`,
    [universityId]
  );

  return result?.profile_json ?? null;
};

/**
 * Обновить профиль университета (целиком)
 */
export const updateUniversityProfile = async (
  universityId: string,
  newProfile: Partial<University>
): Promise<AdminOperationResult> => {
  logger.info('Admin: Updating university profile', { id: universityId });

  try {
    // Получить текущий профиль
    const currentProfile = await getProfileForEdit(universityId);
    if (!currentProfile) {
      return { success: false, message: 'University not found' };
    }

    // Валидация
    const validation = validateUniversity(newProfile);
    if (!validation.valid) {
      return { success: false, message: 'Validation failed', changes: { errors: validation.errors } };
    }

    // Вычислить изменения
    const changes = calculateDiffs(currentProfile, newProfile as University);

    // Создать обновлённый профиль
    const updatedProfile: University = {
      ...currentProfile,
      ...newProfile,
      id: universityId,
      updated_at: new Date().toISOString(),
    };

    // Пересчитать completeness
    const oldScore = currentProfile.metadata?.completeness_score ?? calculateCompletenessScore(currentProfile);
    const newScore = calculateCompletenessScore(updatedProfile);

    updatedProfile.metadata = {
      ...updatedProfile.metadata,
      parsed_at: new Date().toISOString(),
      source_url: currentProfile.website_url,
      completeness_score: newScore,
      missing_fields: [],
      notes: 'Updated via admin',
    };

    await transaction(async (client: PoolClient) => {
      // Получить текущую версию
      const versionResult = await client.queryObject<{ version: number }>(
        `SELECT COALESCE(MAX(version), 0) as version 
         FROM university_profiles WHERE university_id = $1`,
        [universityId]
      );
      const newVersion = (versionResult.rows[0]?.version ?? 0) + 1;

      // Вставить новую версию
      await client.queryObject(
        `INSERT INTO university_profiles (university_id, profile_json, language, version)
         VALUES ($1, $2, 'ru', $3)`,
        [universityId, JSON.stringify(updatedProfile), newVersion]
      );

      // Обновить базовую информацию
      await client.queryObject(
        `UPDATE universities 
         SET name = $1, name_en = $2, country = $3, city = $4, website_url = $5, updated_at = NOW()
         WHERE id = $6`,
        [
          updatedProfile.name,
          updatedProfile.name_en ?? null,
          updatedProfile.country,
          updatedProfile.city,
          updatedProfile.website_url,
          universityId,
        ]
      );
    });

    logger.info('Admin: Profile updated', { 
      id: universityId, 
      scoreChange: `${oldScore} → ${newScore}` 
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      changes: {
        ...changes,
        completeness_score: `${oldScore} → ${newScore}`,
      },
    };
  } catch (err) {
    logger.error('Admin: Failed to update profile', err);
    return { success: false, message: `Failed to update: ${err}` };
  }
};

/**
 * Обновить часть профиля по пути
 */
export const patchUniversityProfile = async (
  universityId: string,
  path: string,
  value: unknown
): Promise<AdminOperationResult> => {
  logger.info('Admin: Patching profile', { id: universityId, path });

  try {
    const currentProfile = await getProfileForEdit(universityId);
    if (!currentProfile) {
      return { success: false, message: 'University not found' };
    }

    // Установить значение по пути
    const updated = setNestedValue(currentProfile as unknown as Record<string, unknown>, path, value);
    if (!updated) {
      return { success: false, message: `Invalid path: ${path}` };
    }

    // Использовать полное обновление
    return await updateUniversityProfile(universityId, currentProfile);
  } catch (err) {
    logger.error('Admin: Failed to patch profile', err);
    return { success: false, message: `Failed to patch: ${err}` };
  }
};

/**
 * Установить вложенное значение по пути
 */
const setNestedValue = (obj: Record<string, unknown>, path: string, value: unknown): boolean => {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (current[key] === undefined || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = parts[parts.length - 1];
  current[lastKey] = value;
  return true;
};

/**
 * Получить программы университета
 */
export const getPrograms = async (universityId: string): Promise<Program[]> => {
  const profile = await getProfileForEdit(universityId);
  return profile?.programs ?? [];
};

/**
 * Создать программу
 */
export const createProgram = async (
  universityId: string,
  programData: Partial<Program>
): Promise<AdminOperationResult> => {
  logger.info('Admin: Creating program', { universityId, name: programData.name });

  const validation = validateProgram(programData);
  if (!validation.valid) {
    return { success: false, message: 'Validation failed', changes: { errors: validation.errors } };
  }

  try {
    const currentProfile = await getProfileForEdit(universityId);
    if (!currentProfile) {
      return { success: false, message: 'University not found' };
    }

    // Генерировать ID
    const newId = `prog-${Date.now()}`;
    const newProgram: Program = {
      id: newId,
      name: programData.name!,
      degree_level: programData.degree_level ?? 'Bachelor',
      duration_years: programData.duration_years ?? 4,
      language: programData.language ?? NO_INFO,
      description: programData.description,
      tuition: programData.tuition,
      admission_requirements: programData.admission_requirements,
      language_requirements: programData.language_requirements,
      application_deadline: programData.application_deadline,
      career_outcomes: programData.career_outcomes,
    };

    currentProfile.programs = [...(currentProfile.programs ?? []), newProgram];

    const result = await updateUniversityProfile(universityId, currentProfile);

    return {
      ...result,
      data: { program_id: newId },
      message: result.success ? 'Program created' : result.message,
    };
  } catch (err) {
    logger.error('Admin: Failed to create program', err);
    return { success: false, message: `Failed to create: ${err}` };
  }
};

/**
 * Обновить программу
 */
export const updateProgram = async (
  universityId: string,
  programId: string,
  programData: Partial<Program>
): Promise<AdminOperationResult> => {
  logger.info('Admin: Updating program', { universityId, programId });

  try {
    const currentProfile = await getProfileForEdit(universityId);
    if (!currentProfile) {
      return { success: false, message: 'University not found' };
    }

    const programIndex = currentProfile.programs?.findIndex((p) => p.id === programId) ?? -1;
    if (programIndex === -1) {
      return { success: false, message: 'Program not found' };
    }

    // Обновить программу
    currentProfile.programs![programIndex] = {
      ...currentProfile.programs![programIndex],
      ...programData,
      id: programId, // Сохранить ID
    };

    return await updateUniversityProfile(universityId, currentProfile);
  } catch (err) {
    logger.error('Admin: Failed to update program', err);
    return { success: false, message: `Failed to update: ${err}` };
  }
};

/**
 * Удалить программу
 */
export const deleteProgram = async (
  universityId: string,
  programId: string
): Promise<AdminOperationResult> => {
  logger.info('Admin: Deleting program', { universityId, programId });

  try {
    const currentProfile = await getProfileForEdit(universityId);
    if (!currentProfile) {
      return { success: false, message: 'University not found' };
    }

    const initialCount = currentProfile.programs?.length ?? 0;
    currentProfile.programs = currentProfile.programs?.filter((p) => p.id !== programId) ?? [];

    if (currentProfile.programs.length === initialCount) {
      return { success: false, message: 'Program not found' };
    }

    const result = await updateUniversityProfile(universityId, currentProfile);

    return {
      ...result,
      message: result.success ? 'Program deleted' : result.message,
      changes: { programs: { removed: 1 } },
    };
  } catch (err) {
    logger.error('Admin: Failed to delete program', err);
    return { success: false, message: `Failed to delete: ${err}` };
  }
};

/**
 * Вычислить разницу между профилями
 */
export const calculateDiffs = (
  oldData: University,
  newData: University
): Record<string, ChangesDiff | string> => {
  const changes: Record<string, ChangesDiff | string> = {};

  // Программы
  const oldPrograms = oldData.programs ?? [];
  const newPrograms = newData.programs ?? [];
  const oldIds = new Set(oldPrograms.map((p) => p.id));
  const newIds = new Set(newPrograms.map((p) => p.id));

  const added = newPrograms.filter((p) => !oldIds.has(p.id)).length;
  const removed = oldPrograms.filter((p) => !newIds.has(p.id)).length;
  const updated = newPrograms.filter((p) => {
    if (!oldIds.has(p.id)) return false;
    const oldProg = oldPrograms.find((op) => op.id === p.id);
    return JSON.stringify(oldProg) !== JSON.stringify(p);
  }).length;

  if (added > 0 || removed > 0 || updated > 0) {
    changes.programs = { added, removed, updated };
  }

  // Базовые поля
  const basicFields = ['name', 'name_en', 'description', 'mission', 'country', 'city'] as const;
  for (const field of basicFields) {
    if (oldData[field] !== newData[field]) {
      changes[field] = `"${oldData[field] ?? ''}" → "${newData[field] ?? ''}"`;
    }
  }

  return changes;
};

/**
 * Список университетов для админа
 */
export const listUniversitiesForAdmin = async (options: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<{ data: University[]; total: number }> => {
  const { limit = 50, offset = 0, search } = options;

  let whereClause = '';
  const params: unknown[] = [limit, offset];

  if (search) {
    whereClause = `WHERE u.name ILIKE $3 OR u.name_en ILIKE $3`;
    params.push(`%${search}%`);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM universities u ${whereClause}`,
    search ? [`%${search}%`] : []
  );
  const total = parseInt(countResult?.count ?? '0', 10);

  const universities = await query<{
    id: string;
    name: string;
    profile_json: University;
  }>(
    `SELECT u.id, u.name, up.profile_json
     FROM universities u
     LEFT JOIN LATERAL (
       SELECT profile_json FROM university_profiles 
       WHERE university_id = u.id 
       ORDER BY version DESC LIMIT 1
     ) up ON true
     ${whereClause}
     ORDER BY u.name
     LIMIT $1 OFFSET $2`,
    params
  );

  return {
    data: universities.map((u) => u.profile_json ?? { id: u.id, name: u.name } as University),
    total,
  };
};
