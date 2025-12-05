import { logger } from '../utils/logger.ts';
import { query } from '../config/database.ts';
import { checkAndUpdateWebsite } from '../services/parser.service.ts';

/**
 * Конфигурация воркера
 */
const WORKER_CONFIG = {
  /** Интервал проверки в миллисекундах (60 сек для MVP, 24 часа для прода) */
  intervalMs: Deno.env.get('DENO_ENV') === 'production' 
    ? 24 * 60 * 60 * 1000  // 24 часа
    : 60 * 1000,           // 60 секунд для dev
  
  /** Максимум одновременных обновлений */
  maxConcurrent: 3,
  
  /** Пауза между запросами (мс) */
  delayBetweenRequests: 2000,
  
  /** Включен ли воркер */
  enabled: Deno.env.get('UPDATE_WORKER_ENABLED') !== 'false',
};

/**
 * Источник для обновления
 */
interface UpdateSource {
  id: string;
  university_id: string;
  url: string;
  university_name: string;
}

/**
 * Результат обновления источника
 */
interface UpdateSourceResult {
  sourceId: string;
  universityName: string;
  success: boolean;
  updated: boolean;
  error?: string;
  duration_ms: number;
}

/**
 * ID интервала для возможности остановки
 */
let workerIntervalId: number | null = null;

/**
 * Флаг что обновление сейчас выполняется
 */
let isUpdating = false;

/**
 * Получить список источников для обновления
 * @returns список источников отсортированный по давности проверки
 */
const getSourcesForUpdate = async (): Promise<UpdateSource[]> => {
  const sources = await query<UpdateSource>(`
    SELECT 
      s.id,
      s.university_id,
      s.url,
      u.name as university_name
    FROM university_sources s
    JOIN universities u ON u.id = s.university_id
    WHERE s.is_active = true AND u.is_active = true
    ORDER BY s.last_checked_at ASC NULLS FIRST
  `);
  
  return sources;
};

/**
 * Обновить один источник с логированием
 * @param source - источник для обновления
 * @returns результат обновления
 */
const updateSource = async (source: UpdateSource): Promise<UpdateSourceResult> => {
  const startTime = Date.now();
  
  try {
    logger.debug('Updating source', {
      sourceId: source.id,
      university: source.university_name,
      url: source.url,
    });
    
    const result = await checkAndUpdateWebsite(
      source.university_id,
      source.id,
      source.url
    );
    
    const duration = Date.now() - startTime;
    
    return {
      sourceId: source.id,
      universityName: source.university_name,
      success: !result.error,
      updated: result.updated,
      error: result.error,
      duration_ms: duration,
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    logger.error('Source update failed', {
      sourceId: source.id,
      university: source.university_name,
      error: errorMessage,
    });
    
    return {
      sourceId: source.id,
      universityName: source.university_name,
      success: false,
      updated: false,
      error: errorMessage,
      duration_ms: duration,
    };
  }
};

/**
 * Обработать пакет источников с ограничением параллелизма
 * @param sources - список источников
 * @param concurrency - максимум одновременных запросов
 * @returns результаты обновления
 */
const processBatch = async (
  sources: UpdateSource[],
  concurrency: number
): Promise<UpdateSourceResult[]> => {
  const results: UpdateSourceResult[] = [];
  const queue = [...sources];
  const activePromises: Promise<void>[] = [];
  
  const processNext = async (): Promise<void> => {
    const source = queue.shift();
    if (!source) return;
    
    const result = await updateSource(source);
    results.push(result);
    
    // Пауза между запросами
    await new Promise((resolve) => 
      setTimeout(resolve, WORKER_CONFIG.delayBetweenRequests)
    );
    
    // Обработать следующий
    await processNext();
  };
  
  // Запустить начальные воркеры
  for (let i = 0; i < Math.min(concurrency, sources.length); i++) {
    activePromises.push(processNext());
  }
  
  // Ждать завершения всех
  await Promise.all(activePromises);
  
  return results;
};

/**
 * Выполнить цикл обновления
 */
const runUpdateCycle = async (): Promise<void> => {
  if (isUpdating) {
    logger.warn('Update cycle already in progress, skipping');
    return;
  }
  
  isUpdating = true;
  const cycleStartTime = Date.now();
  
  logger.info('=== Starting update cycle ===');
  
  try {
    // Получить источники
    const sources = await getSourcesForUpdate();
    
    if (sources.length === 0) {
      logger.info('No sources to update');
      return;
    }
    
    logger.info(`Found ${sources.length} sources to check`);
    
    // Обработать источники
    const results = await processBatch(sources, WORKER_CONFIG.maxConcurrent);
    
    // Подсчитать статистику
    const stats = {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      updated: results.filter((r) => r.updated).length,
      failed: results.filter((r) => !r.success).length,
      duration_ms: Date.now() - cycleStartTime,
    };
    
    logger.info('=== Update cycle completed ===', stats);
    
    // Логировать детали ошибок
    const errors = results.filter((r) => !r.success);
    if (errors.length > 0) {
      logger.warn('Failed updates:', {
        count: errors.length,
        sources: errors.map((e) => ({
          name: e.universityName,
          error: e.error,
        })),
      });
    }
  } catch (err) {
    logger.error('Update cycle failed', err);
  } finally {
    isUpdating = false;
  }
};

/**
 * Запустить воркер обновления
 */
export const startUpdateWorker = (): void => {
  if (!WORKER_CONFIG.enabled) {
    logger.info('Update worker is disabled');
    return;
  }
  
  if (workerIntervalId !== null) {
    logger.warn('Update worker already running');
    return;
  }
  
  logger.info('Starting update worker', {
    interval_ms: WORKER_CONFIG.intervalMs,
    interval_human: WORKER_CONFIG.intervalMs >= 3600000 
      ? `${WORKER_CONFIG.intervalMs / 3600000} hours`
      : `${WORKER_CONFIG.intervalMs / 1000} seconds`,
    maxConcurrent: WORKER_CONFIG.maxConcurrent,
  });
  
  // Запустить первый цикл через 10 секунд после старта
  setTimeout(() => {
    runUpdateCycle();
  }, 10000);
  
  // Запланировать регулярные обновления
  workerIntervalId = setInterval(() => {
    runUpdateCycle();
  }, WORKER_CONFIG.intervalMs);
  
  logger.info('Update worker started');
};

/**
 * Остановить воркер обновления
 */
export const stopUpdateWorker = (): void => {
  if (workerIntervalId !== null) {
    clearInterval(workerIntervalId);
    workerIntervalId = null;
    logger.info('Update worker stopped');
  }
};

/**
 * Проверить статус воркера
 */
export const getWorkerStatus = (): {
  running: boolean;
  isUpdating: boolean;
  config: typeof WORKER_CONFIG;
} => {
  return {
    running: workerIntervalId !== null,
    isUpdating,
    config: WORKER_CONFIG,
  };
};

/**
 * Запустить обновление вручную (для админ API)
 */
export const triggerManualUpdate = async (): Promise<{
  total: number;
  updated: number;
  failed: number;
  duration_ms: number;
}> => {
  logger.info('Manual update triggered');
  
  const startTime = Date.now();
  const sources = await getSourcesForUpdate();
  const results = await processBatch(sources, WORKER_CONFIG.maxConcurrent);
  
  return {
    total: results.length,
    updated: results.filter((r) => r.updated).length,
    failed: results.filter((r) => !r.success).length,
    duration_ms: Date.now() - startTime,
  };
};

/**
 * Обновить конкретный университет
 * @param universityId - ID университета
 * @returns результат обновления
 */
export const updateUniversityNow = async (
  universityId: string
): Promise<UpdateSourceResult | null> => {
  logger.info('Manual university update triggered', { universityId });
  
  // Найти источник
  const sources = await query<UpdateSource>(`
    SELECT 
      s.id,
      s.university_id,
      s.url,
      u.name as university_name
    FROM university_sources s
    JOIN universities u ON u.id = s.university_id
    WHERE s.university_id = $1 AND s.is_active = true
    LIMIT 1
  `, [universityId]);
  
  if (sources.length === 0) {
    logger.warn('No active source found for university', { universityId });
    return null;
  }
  
  return await updateSource(sources[0]);
};
