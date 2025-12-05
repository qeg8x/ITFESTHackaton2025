import { Handlers } from '$fresh/server.ts';
import {
  getUniversityById,
  getUniversityProfile,
  updateUniversityProfile,
} from '../../../../src/services/universities.service.ts';
import { logger } from '../../../../src/utils/logger.ts';
import type { University } from '../../../../src/types/university.ts';

/**
 * Простая проверка admin ключа
 * В продакшене использовать нормальную аутентификацию
 */
const ADMIN_KEY = Deno.env.get('ADMIN_KEY') ?? 'dev-admin-key';

/**
 * Проверка авторизации
 */
const isAuthorized = (req: Request): boolean => {
  const authHeader = req.headers.get('X-Admin-Key');
  return authHeader === ADMIN_KEY;
};

/**
 * GET /api/universities/:id/profile
 * Получить только профиль университета
 *
 * POST /api/universities/:id/profile
 * Обновить профиль университета (требует X-Admin-Key header)
 */
export const handler: Handlers = {
  /**
   * GET - получить профиль
   */
  async GET(_req, ctx) {
    const { id } = ctx.params;
    const startTime = Date.now();

    logger.info('API: GET /api/universities/:id/profile', { id });

    // Валидация UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Invalid ID format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const profile = await getUniversityProfile(id);

      if (!profile) {
        return new Response(
          JSON.stringify({ error: 'Not Found', message: 'Profile not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const duration = Date.now() - startTime;
      logger.info('API: Profile fetched', { id, duration_ms: duration });

      return new Response(JSON.stringify(profile), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${duration}ms`,
        },
      });
    } catch (err) {
      logger.error('API: Failed to fetch profile', { id, error: err });

      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: 'Failed to fetch profile' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * POST - обновить профиль
   */
  async POST(req, ctx) {
    const { id } = ctx.params;
    const startTime = Date.now();

    logger.info('API: POST /api/universities/:id/profile', { id });

    // Проверка авторизации
    if (!isAuthorized(req)) {
      logger.warn('API: Unauthorized profile update attempt', { id });

      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing X-Admin-Key header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Валидация UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Invalid ID format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Проверить существование университета
      const university = await getUniversityById(id);

      if (!university) {
        return new Response(
          JSON.stringify({ error: 'Not Found', message: 'University not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Парсинг тела запроса
      let profileData: Partial<University>;

      try {
        profileData = await req.json();
      } catch {
        return new Response(
          JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON body' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Валидация обязательных полей
      if (!profileData.name || !profileData.country || !profileData.city) {
        return new Response(
          JSON.stringify({
            error: 'Bad Request',
            message: 'Missing required fields: name, country, city',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Подготовить полный профиль
      const fullProfile: University = {
        id,
        name: profileData.name,
        name_en: profileData.name_en,
        country: profileData.country,
        city: profileData.city,
        website_url: profileData.website_url ?? university.website_url,
        logo_url: profileData.logo_url,
        description: profileData.description ?? '',
        mission: profileData.mission,
        programs: profileData.programs ?? [],
        tuition: profileData.tuition,
        admissions: profileData.admissions ?? { requirements: '' },
        scholarships: profileData.scholarships,
        contacts: profileData.contacts ?? {},
        ratings: profileData.ratings,
        updated_at: new Date().toISOString(),
      };

      // Обновить профиль
      const result = await updateUniversityProfile(id, fullProfile);

      const duration = Date.now() - startTime;
      logger.info('API: Profile updated', {
        id,
        version: result.version,
        duration_ms: duration,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Profile updated successfully',
          version: result.version,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (err) {
      logger.error('API: Failed to update profile', { id, error: err });

      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: 'Failed to update profile' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
