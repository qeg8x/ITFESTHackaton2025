import { Handlers } from '$fresh/server.ts';
import { logger } from '../../../src/utils/logger.ts';
import { 
  fetchAndHashWebsite, 
  markdownToUniversityProfile,
  calculateCompletenessScore,
  ParserError 
} from '../../../src/services/parser.service.ts';
import { htmlToMarkdown } from '../../../src/utils/markdown.converter.ts';
import { queryOne } from '../../../src/config/database.ts';
import type { University } from '../../../src/types/university.ts';

/**
 * Конфигурация тестового парсера
 */
const TEST_PARSER_CONFIG = {
  maxTimeout: 60000, // 60 секунд
  maxMarkdownLength: 100000, // 100KB markdown в ответе
};

/**
 * Проверить admin key
 */
const validateAdminKey = (req: Request): boolean => {
  const adminKey = req.headers.get('X-Admin-Key') ?? req.headers.get('admin-key');
  const expectedKey = Deno.env.get('ADMIN_KEY') ?? 'dev-admin-key';
  return adminKey === expectedKey;
};

/**
 * Тело запроса
 */
interface TestParserRequest {
  url: string;
  university_id?: string;
}

/**
 * Ответ с результатами парсинга
 */
interface TestParserResponse {
  success: boolean;
  university?: Partial<University>;
  stats: {
    completeness_score: number;
    programs_count: number;
    missing_fields: string[];
    parse_time_ms: number;
    fetch_time_ms: number;
    total_time_ms: number;
    html_size: number;
    markdown_size: number;
    errors: string[];
  };
  raw_markdown?: string;
  error?: string;
}

/**
 * POST /api/admin/test-parser
 * Тестирование парсинга без сохранения в БД
 */
export const handler: Handlers = {
  async POST(req) {
    const startTime = Date.now();
    const errors: string[] = [];

    logger.info('API: POST /api/admin/test-parser');

    // 1. Проверка авторизации
    if (!validateAdminKey(req)) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Invalid or missing admin key' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Парсинг тела запроса
    let body: TestParserRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ 
        error: 'Bad Request',
        message: 'Invalid JSON body' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Валидация URL
    if (!body.url) {
      return new Response(JSON.stringify({ 
        error: 'Bad Request',
        message: 'URL is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      new URL(body.url);
    } catch {
      return new Response(JSON.stringify({ 
        error: 'Bad Request',
        message: 'Invalid URL format' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    logger.info('Testing parser', { url: body.url, university_id: body.university_id });

    let fetchTimeMs = 0;
    let htmlSize = 0;
    let markdownSize = 0;
    let markdown = '';

    try {
      // 4. Получить существующие данные если university_id указан
      let existingData: Partial<University> | undefined;
      
      if (body.university_id) {
        const existing = await queryOne<{ profile_json: University }>(
          `SELECT profile_json FROM university_profiles 
           WHERE university_id = $1 
           ORDER BY version DESC LIMIT 1`,
          [body.university_id]
        );
        
        if (existing?.profile_json) {
          existingData = existing.profile_json;
          logger.debug('Found existing profile', { id: body.university_id });
        }
      }

      // 5. Загрузить HTML
      const fetchStart = Date.now();
      const { html, hash } = await fetchAndHashWebsite(body.url);
      fetchTimeMs = Date.now() - fetchStart;
      htmlSize = html.length;

      logger.debug('HTML fetched', { 
        size: htmlSize, 
        hash: hash.substring(0, 16),
        time_ms: fetchTimeMs 
      });

      // 6. Конвертировать в Markdown
      markdown = htmlToMarkdown(html);
      markdownSize = markdown.length;

      logger.debug('Converted to Markdown', { size: markdownSize });

      // 7. Парсинг через LLM
      const parseStart = Date.now();
      const university = await markdownToUniversityProfile(
        markdown, 
        body.url, 
        existingData
      );
      const parseTimeMs = Date.now() - parseStart;

      // 8. Статистика
      const completenessScore = calculateCompletenessScore(university as University);
      const programsCount = university.programs?.length ?? 0;
      const missingFields = university.metadata?.missing_fields ?? [];

      const totalTimeMs = Date.now() - startTime;

      logger.info('Parser test completed', {
        url: body.url,
        completenessScore,
        programsCount,
        totalTimeMs,
      });

      // 9. Ограничить размер markdown в ответе
      const truncatedMarkdown = markdown.length > TEST_PARSER_CONFIG.maxMarkdownLength
        ? markdown.substring(0, TEST_PARSER_CONFIG.maxMarkdownLength) + '\n\n... [TRUNCATED]'
        : markdown;

      const response: TestParserResponse = {
        success: true,
        university,
        stats: {
          completeness_score: completenessScore,
          programs_count: programsCount,
          missing_fields: missingFields,
          parse_time_ms: parseTimeMs,
          fetch_time_ms: fetchTimeMs,
          total_time_ms: totalTimeMs,
          html_size: htmlSize,
          markdown_size: markdownSize,
          errors,
        },
        raw_markdown: truncatedMarkdown,
      };

      return new Response(JSON.stringify(response, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (err) {
      const totalTimeMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorCode = err instanceof ParserError ? err.code : 'UNKNOWN';

      logger.error('Parser test failed', {
        url: body.url,
        error: errorMessage,
        code: errorCode,
        totalTimeMs,
      });

      errors.push(errorMessage);

      const response: TestParserResponse = {
        success: false,
        stats: {
          completeness_score: 0,
          programs_count: 0,
          missing_fields: [],
          parse_time_ms: 0,
          fetch_time_ms: fetchTimeMs,
          total_time_ms: totalTimeMs,
          html_size: htmlSize,
          markdown_size: markdownSize,
          errors,
        },
        raw_markdown: markdown || undefined,
        error: errorMessage,
      };

      const status = err instanceof ParserError 
        ? (err.code === 'FETCH_ERROR' ? 502 : 500)
        : 500;

      return new Response(JSON.stringify(response, null, 2), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  /**
   * GET /api/admin/test-parser
   * Информация об эндпоинте
   */
  GET(req) {
    // Проверка авторизации
    if (!validateAdminKey(req)) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Invalid or missing admin key' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      endpoint: '/api/admin/test-parser',
      method: 'POST',
      description: 'Test university website parsing without saving to database',
      headers: {
        'X-Admin-Key': 'Required - admin authentication key',
        'Content-Type': 'application/json',
      },
      body: {
        url: 'string (required) - University website URL to parse',
        university_id: 'string (optional) - Existing university ID for context',
      },
      response: {
        success: 'boolean',
        university: 'Parsed university profile object',
        stats: {
          completeness_score: 'number (0-100)',
          programs_count: 'number',
          missing_fields: 'string[]',
          parse_time_ms: 'number',
          fetch_time_ms: 'number',
          total_time_ms: 'number',
          html_size: 'number (bytes)',
          markdown_size: 'number (bytes)',
          errors: 'string[]',
        },
        raw_markdown: 'string (truncated to 100KB)',
      },
      example: {
        curl: `curl -X POST http://localhost:8000/api/admin/test-parser \\
  -H "X-Admin-Key: dev-admin-key" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://nu.edu.kz"}'`,
      },
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
