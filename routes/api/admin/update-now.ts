import { Handlers } from '$fresh/server.ts';
import {
  updateUniversityNow,
  triggerManualUpdate,
  getWorkerStatus,
} from '../../../src/workers/update.worker.ts';
import { getUniversityWithProfile } from '../../../src/services/universities.service.ts';
import { logger } from '../../../src/utils/logger.ts';

/**
 * Проверка admin ключа
 */
const ADMIN_KEY = Deno.env.get('ADMIN_KEY') ?? 'dev-admin-key';

const isAuthorized = (req: Request): boolean => {
  const authHeader = req.headers.get('X-Admin-Key');
  return authHeader === ADMIN_KEY;
};

/**
 * GET /api/admin/update-now
 * Получить статус воркера
 *
 * POST /api/admin/update-now
 * Запустить обновление
 *
 * Query params:
 * - university_id: обновить конкретный университет
 * - all: обновить все (если указан)
 */
export const handler: Handlers = {
  /**
   * GET - статус воркера
   */
  GET(req) {
    if (!isAuthorized(req)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const status = getWorkerStatus();

    return new Response(
      JSON.stringify({
        worker: status,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  },

  /**
   * POST - запустить обновление
   */
  async POST(req) {
    const startTime = Date.now();

    // Проверка авторизации
    if (!isAuthorized(req)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const universityId = url.searchParams.get('university_id');
    const updateAll = url.searchParams.has('all');

    logger.info('API: POST /api/admin/update-now', { universityId, updateAll });

    try {
      // Обновить все университеты
      if (updateAll) {
        const result = await triggerManualUpdate();
        const duration = Date.now() - startTime;

        return new Response(
          JSON.stringify({
            success: true,
            message: `Updated ${result.updated} universities`,
            ...result,
            response_time_ms: duration,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Обновить конкретный университет
      if (universityId) {
        // Валидация UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(universityId)) {
          return new Response(
            JSON.stringify({ error: 'Invalid university_id format' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const result = await updateUniversityNow(universityId);

        if (!result) {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'No active source found for this university',
            }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Получить обновленный профиль
        let profile = null;
        if (result.success) {
          const university = await getUniversityWithProfile(universityId);
          profile = university?.profile ?? null;
        }

        const duration = Date.now() - startTime;

        return new Response(
          JSON.stringify({
            success: result.success,
            updated: result.updated,
            message: result.error ?? (result.updated ? 'Profile updated' : 'No changes detected'),
            university: result.universityName,
            profile,
            response_time_ms: duration,
          }),
          {
            status: result.success ? 200 : 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Не указан ни university_id, ни all
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Specify university_id or ?all query param',
          examples: [
            'POST /api/admin/update-now?university_id=xxx',
            'POST /api/admin/update-now?all',
          ],
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      logger.error('API: Update failed', err);

      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: err instanceof Error ? err.message : String(err),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
