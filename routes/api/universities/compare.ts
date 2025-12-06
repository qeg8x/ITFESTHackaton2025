/**
 * API endpoint для сравнения университетов
 * GET /api/universities/compare?id1=uuid1&id2=uuid2&language=ru
 */

import { FreshContext, Handlers } from '$fresh/server.ts';
import { compareUniversities, clearBattleCache } from '../../../src/services/university-battle.service.ts';
import { logger } from '../../../src/utils/logger.ts';

export const handler: Handlers = {
  async GET(req: Request, _ctx: FreshContext) {
    const startTime = Date.now();
    const url = new URL(req.url);

    const id1 = url.searchParams.get('id1');
    const id2 = url.searchParams.get('id2');
    const language = url.searchParams.get('language') || 'ru';
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    logger.info('Compare request', { id1, id2, language, forceRefresh });

    // Если запрошено обновление кэша
    if (forceRefresh) {
      clearBattleCache();
      logger.info('Battle cache cleared due to refresh parameter');
    }

    // Валидация
    if (!id1 || !id2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing parameters',
          message: 'Both id1 and id2 are required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (id1 === id2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid parameters',
          message: 'Cannot compare university with itself',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Валидация UUID формата
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id1) || !uuidRegex.test(id2)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid UUID format',
          message: 'id1 and id2 must be valid UUIDs',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const result = await compareUniversities(id1, id2, language);
      const duration = Date.now() - startTime;

      logger.info('Compare response', {
        id1,
        id2,
        winner: result.overallWinner,
        duration,
      });

      return new Response(
        JSON.stringify({
          success: true,
          result,
          cached: duration < 100, // Предполагаем что кэш быстрее 100ms
          took_ms: duration,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400', // 24 часа
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      logger.error('Compare failed', { id1, id2, error: errorMessage, duration });

      // Определить тип ошибки
      const isNotFound = errorMessage.includes('not found');
      const isRateLimit = errorMessage.includes('wait');

      return new Response(
        JSON.stringify({
          success: false,
          error: isNotFound ? 'University not found' : isRateLimit ? 'Rate limit' : 'Comparison failed',
          message: errorMessage,
        }),
        {
          status: isNotFound ? 404 : isRateLimit ? 429 : 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
