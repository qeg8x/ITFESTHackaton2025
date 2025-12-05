import { Handlers } from '$fresh/server.ts';
import { getUniversityWithProfile } from '../../../src/services/universities.service.ts';
import { logger } from '../../../src/utils/logger.ts';

/**
 * GET /api/universities/:id
 * Получить университет по ID с полным профилем
 */
export const handler: Handlers = {
  async GET(_req, ctx) {
    const { id } = ctx.params;
    const startTime = Date.now();

    logger.info('API: GET /api/universities/:id', { id });

    // Валидация UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      logger.warn('API: Invalid UUID format', { id });

      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid university ID format',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      const university = await getUniversityWithProfile(id);

      if (!university) {
        logger.info('API: University not found', { id });

        return new Response(
          JSON.stringify({
            error: 'Not Found',
            message: 'University not found',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const duration = Date.now() - startTime;
      logger.info('API: University fetched', {
        id,
        name: university.name,
        duration_ms: duration,
      });

      return new Response(JSON.stringify(university), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${duration}ms`,
        },
      });
    } catch (err) {
      logger.error('API: Failed to fetch university', { id, error: err });

      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to fetch university',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
