import { Handlers } from '$fresh/server.ts';
import {
  fetchAndHashWebsite,
  checkAndUpdateWebsite,
  updateAllSources,
  markdownToUniversityProfile,
} from '../../src/services/parser.service.ts';
import { htmlToMarkdown } from '../../src/utils/markdown.converter.ts';
import { checkOllamaHealth } from '../../src/utils/ollama.client.ts';
import { query } from '../../src/config/database.ts';
import { logger } from '../../src/utils/logger.ts';

/**
 * Простая проверка admin ключа
 */
const ADMIN_KEY = Deno.env.get('ADMIN_KEY') ?? 'dev-admin-key';

const isAuthorized = (req: Request): boolean => {
  const authHeader = req.headers.get('X-Admin-Key');
  return authHeader === ADMIN_KEY;
};

/**
 * POST /api/parser
 * Запуск парсинга
 *
 * Body:
 * - action: 'check' | 'update' | 'update-all' | 'preview'
 * - universityId?: string (для check/update)
 * - sourceId?: string (для check/update)
 * - url?: string (для preview)
 */
export const handler: Handlers = {
  /**
   * GET - статус парсера и Ollama
   */
  async GET(_req) {
    const startTime = Date.now();

    logger.debug('API: GET /api/parser');

    try {
      const ollamaHealthy = await checkOllamaHealth();

      // Статистика источников
      const stats = await query<{
        total: string;
        checked_today: string;
        never_checked: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE last_checked_at > NOW() - INTERVAL '24 hours') as checked_today,
          COUNT(*) FILTER (WHERE last_checked_at IS NULL) as never_checked
        FROM university_sources 
        WHERE is_active = true
      `);

      const duration = Date.now() - startTime;

      return new Response(
        JSON.stringify({
          status: 'ok',
          ollama: ollamaHealthy ? 'connected' : 'disconnected',
          sources: {
            total: parseInt(stats[0]?.total ?? '0', 10),
            checked_today: parseInt(stats[0]?.checked_today ?? '0', 10),
            never_checked: parseInt(stats[0]?.never_checked ?? '0', 10),
          },
          response_time_ms: duration,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (err) {
      logger.error('API: Parser status failed', err);

      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * POST - запуск парсинга
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

    try {
      const body = await req.json();
      const { action, universityId, sourceId, url } = body;

      logger.info('API: POST /api/parser', { action, universityId, url });

      switch (action) {
        case 'check': {
          // Проверить хэш сайта без обновления
          if (!url) {
            return new Response(
              JSON.stringify({ error: 'url is required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const result = await fetchAndHashWebsite(url);
          const duration = Date.now() - startTime;

          return new Response(
            JSON.stringify({
              success: true,
              hash: result.hash,
              contentLength: result.contentLength,
              response_time_ms: duration,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        case 'preview': {
          // Превью парсинга без сохранения
          if (!url) {
            return new Response(
              JSON.stringify({ error: 'url is required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const { html, hash } = await fetchAndHashWebsite(url);
          const markdown = htmlToMarkdown(html);
          const profile = await markdownToUniversityProfile(markdown, url);
          const duration = Date.now() - startTime;

          return new Response(
            JSON.stringify({
              success: true,
              hash,
              markdownLength: markdown.length,
              profile,
              response_time_ms: duration,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        case 'update': {
          // Обновить конкретный источник
          if (!universityId || !sourceId || !url) {
            return new Response(
              JSON.stringify({ error: 'universityId, sourceId, and url are required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const result = await checkAndUpdateWebsite(universityId, sourceId, url);
          const duration = Date.now() - startTime;

          return new Response(
            JSON.stringify({
              ...result,
              response_time_ms: duration,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        case 'update-all': {
          // Обновить все источники
          const result = await updateAllSources();
          const duration = Date.now() - startTime;

          return new Response(
            JSON.stringify({
              success: true,
              ...result,
              response_time_ms: duration,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        default:
          return new Response(
            JSON.stringify({
              error: 'Invalid action',
              available: ['check', 'preview', 'update', 'update-all'],
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
      }
    } catch (err) {
      logger.error('API: Parser action failed', err);

      return new Response(
        JSON.stringify({
          error: 'Parser error',
          message: err instanceof Error ? err.message : String(err),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
