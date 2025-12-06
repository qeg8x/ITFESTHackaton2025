/**
 * API для создания университета из результата AI верификации
 * POST /api/search/create
 */

import { Handlers } from '$fresh/server.ts';
import { logger } from '../../../src/utils/logger.ts';
import { 
  createUniversityFromAIResult, 
  searchUniversitiesInDb 
} from '../../../src/services/search.service.ts';
import type { UniversitySearchResult } from '../../../src/services/university-search.service.ts';

/**
 * Получить IP клиента
 */
const getClientIp = (req: Request): string => {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
};

export const handler: Handlers = {
  /**
   * POST - Создать университет из результата AI верификации
   */
  async POST(req) {
    const startTime = Date.now();
    const clientIp = getClientIp(req);

    logger.info('API: POST /api/search/create', { ip: clientIp });

    // Парсинг body
    let body: { search_result: UniversitySearchResult };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid JSON body',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Валидация search_result
    const searchResult = body.search_result;

    if (!searchResult) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing search_result in body',
        expected: '{ "search_result": { "found": true, "official_name": "...", ... } }',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Проверить что found = true
    if (!searchResult.found) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot create university: AI verification returned found=false',
        reasoning: searchResult.reasoning,
        alternatives: searchResult.alternatives,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Проверить confidence
    if (searchResult.confidence < 70) {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot create university: confidence too low (${searchResult.confidence}%)`,
        message: 'AI confidence must be at least 70% to create a university',
        reasoning: searchResult.reasoning,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Проверить official_name
    if (!searchResult.official_name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot create university: official_name is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Проверить что университета нет в БД
    try {
      const { results, exactMatch } = await searchUniversitiesInDb(searchResult.official_name, 1);

      if (exactMatch) {
        return new Response(JSON.stringify({
          success: false,
          error: 'University already exists in database',
          existing_university: results[0],
        }), {
          status: 409, // Conflict
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (results.length > 0 && results[0].score >= 90) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Similar university already exists in database',
          existing_university: results[0],
          message: `Found similar university with ${results[0].score}% match`,
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (err) {
      logger.error('DB check failed', { error: err });
      // Продолжаем создание даже если проверка не удалась
    }

    // Создать университет
    try {
      const university = await createUniversityFromAIResult(searchResult, clientIp);

      logger.info('University created via API', { 
        id: university.id, 
        name: university.name,
        ip: clientIp,
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'University successfully created. Please parse website for detailed info.',
        university: {
          id: university.id,
          name: university.name,
          name_en: university.name_en,
          country: university.country,
          city: university.city,
          website_url: university.website_url,
          completeness: university.metadata?.completeness_score ?? 15,
        },
        next_steps: [
          'Set official website URL if not detected',
          'Trigger parsing to get detailed information',
          'Review and edit profile manually if needed',
        ],
        took_ms: Date.now() - startTime,
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (err) {
      logger.error('Create university failed', { error: err, ip: clientIp });

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      // Проверить если это дубликат
      if (errorMessage.includes('already exists')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'University already exists in database',
          message: errorMessage,
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create university',
        message: errorMessage,
        took_ms: Date.now() - startTime,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  /**
   * GET - Документация endpoint
   */
  GET() {
    return new Response(JSON.stringify({
      endpoint: 'POST /api/search/create',
      description: 'Create a university from AI verification result',
      body: {
        search_result: {
          found: 'boolean (must be true)',
          confidence: 'number (must be >= 70)',
          official_name: 'string (required)',
          official_name_en: 'string (optional)',
          country: 'string (optional)',
          city: 'string (optional)',
          website: 'string (optional)',
          reasoning: 'string',
          alternatives: 'string[]',
        },
      },
      responses: {
        201: 'University created successfully',
        400: 'Invalid request (missing fields, low confidence, etc)',
        409: 'University already exists in database',
        500: 'Server error',
      },
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
