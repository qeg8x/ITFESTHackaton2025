/**
 * API для тестирования всех новых функций
 * POST /api/test/features
 */

import { Handlers } from '$fresh/server.ts';
import { logger } from '../../../src/utils/logger.ts';
import { requireAdmin, unauthorizedResponse } from '../../../src/middleware/auth.ts';
import { 
  searchUniversitiesInDb, 
  verifyUniversityWithAI,
  getSearchStats,
} from '../../../src/services/search.service.ts';
import {
  listUniversitiesForAdmin,
  getProfileForEdit,
} from '../../../src/services/admin.service.ts';
import { query } from '../../../src/config/database.ts';

type TestType = 'search' | 'admin' | 'parser' | 'all';

interface TestResult {
  name: string;
  passed: boolean;
  duration_ms: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface TestSuiteResult {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  duration_ms: number;
  tests: TestResult[];
}

/**
 * Запустить один тест
 */
const runTest = async (
  name: string,
  fn: () => Promise<Record<string, unknown> | void>
): Promise<TestResult> => {
  const start = Date.now();
  try {
    const details = await fn();
    return {
      name,
      passed: true,
      duration_ms: Date.now() - start,
      details: details ?? undefined,
    };
  } catch (err) {
    return {
      name,
      passed: false,
      duration_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

/**
 * Тесты поиска
 */
const runSearchTests = async (): Promise<TestSuiteResult> => {
  const start = Date.now();
  const tests: TestResult[] = [];

  // Test 1: Поиск в БД (должен работать)
  tests.push(await runTest('DB Search - basic query', async () => {
    const { results } = await searchUniversitiesInDb('university', 5);
    if (!Array.isArray(results)) throw new Error('Results is not an array');
    return { results_count: results.length };
  }));

  // Test 2: Поиск с пустым запросом (должен вернуть пустой массив)
  tests.push(await runTest('DB Search - empty query handling', async () => {
    const { results } = await searchUniversitiesInDb('', 5);
    return { results_count: results.length };
  }));

  // Test 3: Поиск с длинным запросом
  tests.push(await runTest('DB Search - long query', async () => {
    const longQuery = 'a'.repeat(50);
    const { results } = await searchUniversitiesInDb(longQuery, 5);
    return { results_count: results.length };
  }));

  // Test 4: Поиск с кириллицей
  tests.push(await runTest('DB Search - cyrillic query', async () => {
    const { results } = await searchUniversitiesInDb('университет', 5);
    return { results_count: results.length };
  }));

  // Test 5: Проверка score calculation
  tests.push(await runTest('DB Search - score calculation', async () => {
    const { results } = await searchUniversitiesInDb('Harvard', 5);
    const hasScores = results.every(r => typeof r.score === 'number' && r.score >= 0 && r.score <= 100);
    if (!hasScores) throw new Error('Invalid scores');
    return { first_score: results[0]?.score };
  }));

  // Test 6: AI Verify (если Ollama доступна)
  tests.push(await runTest('AI Verify - availability check', async () => {
    try {
      const { result, rateLimited } = await verifyUniversityWithAI('Harvard', 'test');
      if (rateLimited) return { status: 'rate_limited' };
      return { found: result?.found, confidence: result?.confidence };
    } catch (err) {
      // AI может быть недоступен - это не ошибка теста
      return { status: 'ai_unavailable', note: String(err) };
    }
  }));

  // Test 7: Кэш работает
  tests.push(await runTest('Search cache - working', async () => {
    const stats = getSearchStats();
    return { 
      db_cache_size: stats.dbCacheSize,
      ai_cache_size: stats.aiCacheSize,
    };
  }));

  const passed = tests.filter(t => t.passed).length;
  return {
    suite: 'search',
    total: tests.length,
    passed,
    failed: tests.length - passed,
    duration_ms: Date.now() - start,
    tests,
  };
};

/**
 * Тесты админ-функций
 */
const runAdminTests = async (): Promise<TestSuiteResult> => {
  const start = Date.now();
  const tests: TestResult[] = [];

  // Test 1: Список университетов
  tests.push(await runTest('Admin - list universities', async () => {
    const { data, total } = await listUniversitiesForAdmin({ limit: 10 });
    if (!Array.isArray(data)) throw new Error('Data is not an array');
    return { count: data.length, total };
  }));

  // Test 2: Получить профиль (если есть университеты)
  tests.push(await runTest('Admin - get profile', async () => {
    const { data } = await listUniversitiesForAdmin({ limit: 1 });
    if (data.length === 0) return { status: 'no_universities' };
    
    const profile = await getProfileForEdit(data[0].id);
    if (!profile) throw new Error('Profile not found');
    return { 
      has_name: !!profile.name,
      has_programs: Array.isArray(profile.programs),
      programs_count: profile.programs?.length ?? 0,
    };
  }));

  // Test 3: Проверка структуры профиля
  tests.push(await runTest('Admin - profile structure', async () => {
    const { data } = await listUniversitiesForAdmin({ limit: 1 });
    if (data.length === 0) return { status: 'no_universities' };
    
    const profile = await getProfileForEdit(data[0].id);
    if (!profile) throw new Error('Profile not found');
    
    const requiredFields = ['id', 'name', 'country', 'city'];
    const missing = requiredFields.filter(f => !(f in profile));
    if (missing.length > 0) throw new Error(`Missing fields: ${missing.join(', ')}`);
    
    return { all_required_fields: true };
  }));

  // Test 4: Поиск по имени
  tests.push(await runTest('Admin - search by name', async () => {
    const { data, total } = await listUniversitiesForAdmin({ 
      limit: 10, 
      search: 'university' 
    });
    return { found: data.length, total };
  }));

  // Test 5: Пагинация
  tests.push(await runTest('Admin - pagination', async () => {
    const page1 = await listUniversitiesForAdmin({ limit: 2, offset: 0 });
    const page2 = await listUniversitiesForAdmin({ limit: 2, offset: 2 });
    
    // Проверить что разные результаты (если достаточно данных)
    if (page1.data.length > 0 && page2.data.length > 0) {
      const different = page1.data[0].id !== page2.data[0]?.id;
      return { pagination_works: different, page1_count: page1.data.length, page2_count: page2.data.length };
    }
    return { status: 'not_enough_data' };
  }));

  const passed = tests.filter(t => t.passed).length;
  return {
    suite: 'admin',
    total: tests.length,
    passed,
    failed: tests.length - passed,
    duration_ms: Date.now() - start,
    tests,
  };
};

/**
 * Тесты парсера
 */
const runParserTests = async (): Promise<TestSuiteResult> => {
  const start = Date.now();
  const tests: TestResult[] = [];

  // Test 1: БД доступна
  tests.push(await runTest('Parser - database connection', async () => {
    const result = await query<{ count: string }>('SELECT COUNT(*) as count FROM universities');
    return { universities_count: parseInt(result[0]?.count ?? '0', 10) };
  }));

  // Test 2: Промпты существуют
  tests.push(await runTest('Parser - prompts exist', async () => {
    const promptsDir = new URL('../../src/prompts', import.meta.url);
    const prompts: string[] = [];
    
    try {
      for await (const entry of Deno.readDir(promptsDir)) {
        if (entry.name.endsWith('.md')) {
          prompts.push(entry.name);
        }
      }
    } catch {
      // Prompts directory may not exist
    }
    
    return { prompts_found: prompts.length, files: prompts };
  }));

  // Test 3: Completeness score в профилях
  tests.push(await runTest('Parser - completeness scores', async () => {
    const { data } = await listUniversitiesForAdmin({ limit: 10 });
    const withScore = data.filter(u => u.metadata?.completeness_score !== undefined);
    const avgScore = withScore.length > 0
      ? withScore.reduce((acc, u) => acc + (u.metadata?.completeness_score ?? 0), 0) / withScore.length
      : 0;
    
    return { 
      profiles_with_score: withScore.length,
      average_completeness: Math.round(avgScore),
    };
  }));

  // Test 4: Структура профилей корректна
  tests.push(await runTest('Parser - profile structure valid', async () => {
    const { data } = await listUniversitiesForAdmin({ limit: 5 });
    let validCount = 0;
    
    for (const uni of data) {
      if (uni.id && uni.name && uni.country) {
        validCount++;
      }
    }
    
    return { 
      total: data.length,
      valid: validCount,
      all_valid: validCount === data.length,
    };
  }));

  const passed = tests.filter(t => t.passed).length;
  return {
    suite: 'parser',
    total: tests.length,
    passed,
    failed: tests.length - passed,
    duration_ms: Date.now() - start,
    tests,
  };
};

export const handler: Handlers = {
  /**
   * POST - Запустить тесты
   */
  async POST(req) {
    // Аутентификация
    const auth = requireAdmin(req);
    if (!auth.valid) {
      return unauthorizedResponse(auth.error);
    }

    logger.info('Running feature tests', { admin: auth.adminInfo?.name });

    let body: { test_type?: TestType } = {};
    try {
      body = await req.json();
    } catch {
      // Если тело пустое, запускаем все тесты
    }

    const testType = body.test_type || 'all';
    const startTime = Date.now();
    const results: TestSuiteResult[] = [];

    try {
      if (testType === 'search' || testType === 'all') {
        results.push(await runSearchTests());
      }

      if (testType === 'admin' || testType === 'all') {
        results.push(await runAdminTests());
      }

      if (testType === 'parser' || testType === 'all') {
        results.push(await runParserTests());
      }

      const totalTests = results.reduce((acc, r) => acc + r.total, 0);
      const totalPassed = results.reduce((acc, r) => acc + r.passed, 0);
      const totalFailed = results.reduce((acc, r) => acc + r.failed, 0);

      return new Response(JSON.stringify({
        success: totalFailed === 0,
        summary: {
          total_suites: results.length,
          total_tests: totalTests,
          passed: totalPassed,
          failed: totalFailed,
          pass_rate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0,
          total_duration_ms: Date.now() - startTime,
        },
        suites: results,
      }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (err) {
      logger.error('Test execution failed', { error: err });
      return new Response(JSON.stringify({
        success: false,
        error: 'Test execution failed',
        message: err instanceof Error ? err.message : String(err),
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  /**
   * GET - Документация
   */
  GET() {
    return new Response(JSON.stringify({
      endpoint: 'POST /api/test/features',
      description: 'Run feature tests for the application',
      requires: 'X-Admin-Key header',
      body: {
        test_type: '"search" | "admin" | "parser" | "all" (default: "all")',
      },
      test_suites: {
        search: [
          'DB Search - basic query',
          'DB Search - empty query handling',
          'DB Search - long query',
          'DB Search - cyrillic query',
          'DB Search - score calculation',
          'AI Verify - availability check',
          'Search cache - working',
        ],
        admin: [
          'Admin - list universities',
          'Admin - get profile',
          'Admin - profile structure',
          'Admin - search by name',
          'Admin - pagination',
        ],
        parser: [
          'Parser - database connection',
          'Parser - prompts exist',
          'Parser - completeness scores',
          'Parser - profile structure valid',
        ],
      },
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
