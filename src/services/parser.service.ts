import { logger } from '../utils/logger.ts';
import { htmlToMarkdown, computeHash, normalizeText, stripHtmlTags } from '../utils/markdown.converter.ts';
import { callOllamaForJson } from '../utils/ollama.client.ts';
import { query, queryOne, transaction } from '../config/database.ts';
import { buildParserPrompt } from '../prompts/index.ts';
import { 
  NO_INFO, 
  type University, 
  type Program,
  type UniversityThreeDTour,
  type ThreeDTourSource,
  type ThreeDTourProvider,
} from '../types/university.ts';
import type { UniversitySourceRow, UpdateStatus } from '../types/database.ts';
import type { PoolClient } from 'postgres';

/**
 * Конфигурация парсера
 */
const PARSER_CONFIG = {
  fetchTimeout: 15000, // 15 секунд
  userAgent: 'DigitalUniversity/1.0 (Educational Parser)',
  maxRetries: 3,
  llmRetries: 3, // Retry для LLM парсинга
  llmRetryDelay: 2000, // Задержка между retry
  maxChunkSize: 12000, // Максимальный размер одного чанка для LLM
  chunkOverlap: 500, // Перекрытие между чанками для контекста
};

/**
 * Результат загрузки сайта
 */
interface FetchResult {
  html: string;
  hash: string;
  contentLength: number;
}

/**
 * Результат обновления
 */
interface UpdateResult {
  updated: boolean;
  message: string;
  newHash?: string;
  error?: string;
}

/**
 * Ошибка парсера
 */
export class ParserError extends Error {
  constructor(
    message: string,
    public code: 'FETCH_ERROR' | 'PARSE_ERROR' | 'LLM_ERROR' | 'DB_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'ParserError';
  }
}

/**
 * Загрузить HTML с сайта и вычислить хэш
 * @param url - URL сайта
 * @returns HTML и хэш
 */
export const fetchAndHashWebsite = async (url: string): Promise<FetchResult> => {
  logger.info('Fetching website', { url });
  const startTime = Date.now();

  for (let attempt = 1; attempt <= PARSER_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        PARSER_CONFIG.fetchTimeout
      );

      const response = await fetch(url, {
        headers: {
          'User-Agent': PARSER_CONFIG.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ru,en;q=0.9',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ParserError(
          `HTTP ${response.status}: ${response.statusText}`,
          'FETCH_ERROR',
          { status: response.status }
        );
      }

      const html = await response.text();
      
      // Нормализуем текст для хэширования (убираем динамический контент)
      const normalizedForHash = normalizeText(stripHtmlTags(html));
      const hash = await computeHash(normalizedForHash);

      const duration = Date.now() - startTime;
      logger.info('Website fetched successfully', {
        url,
        contentLength: html.length,
        hash: hash.substring(0, 16) + '...',
        duration_ms: duration,
      });

      return {
        html,
        hash,
        contentLength: html.length,
      };
    } catch (err) {
      const isLastAttempt = attempt === PARSER_CONFIG.maxRetries;

      if (err instanceof Error && err.name === 'AbortError') {
        logger.error('Fetch timeout', { url, attempt, timeout: PARSER_CONFIG.fetchTimeout });
        
        if (isLastAttempt) {
          throw new ParserError('Request timed out', 'FETCH_ERROR', { url });
        }
      } else if (err instanceof ParserError) {
        throw err;
      } else {
        logger.error('Fetch failed', { url, attempt, error: err });
        
        if (isLastAttempt) {
          throw new ParserError(
            `Failed to fetch: ${err instanceof Error ? err.message : String(err)}`,
            'FETCH_ERROR',
            { url }
          );
        }
      }

      // Ждем перед retry
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  throw new ParserError('Failed to fetch after all retries', 'FETCH_ERROR', { url });
};

/**
 * Разбить текст на чанки для обработки
 * @param text - исходный текст
 * @param maxSize - максимальный размер чанка
 * @param overlap - перекрытие между чанками
 * @returns массив чанков
 */
const splitIntoChunks = (text: string, maxSize: number, overlap: number): string[] => {
  if (text.length <= maxSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxSize, text.length);
    
    // Попробовать разбить на границе параграфа или предложения
    if (end < text.length) {
      const lastParagraph = text.lastIndexOf('\n\n', end);
      const lastSentence = text.lastIndexOf('. ', end);
      const lastNewline = text.lastIndexOf('\n', end);
      
      if (lastParagraph > start + maxSize / 2) {
        end = lastParagraph + 2;
      } else if (lastSentence > start + maxSize / 2) {
        end = lastSentence + 2;
      } else if (lastNewline > start + maxSize / 2) {
        end = lastNewline + 1;
      }
    }
    
    chunks.push(text.slice(start, end));
    start = end - overlap;
    
    if (start >= text.length - overlap) break;
  }

  logger.info('Split text into chunks', {
    originalLength: text.length,
    chunksCount: chunks.length,
    chunkSizes: chunks.map(c => c.length),
  });

  return chunks;
};

/**
 * Объединить результаты парсинга нескольких чанков
 * @param results - массив частичных профилей
 * @returns объединённый профиль
 */
const mergeProfileResults = (results: Partial<University>[]): Partial<University> => {
  if (results.length === 0) return {};
  if (results.length === 1) return results[0];

  const merged: Partial<University> = { ...results[0] };
  
  for (let i = 1; i < results.length; i++) {
    const result = results[i];
    
    // Объединить программы (избегая дубликатов)
    if (result.programs?.length) {
      const existingIds = new Set(merged.programs?.map(p => p.id) || []);
      const newPrograms = result.programs.filter(p => !existingIds.has(p.id));
      merged.programs = [...(merged.programs || []), ...newPrograms];
    }
    
    // Объединить стипендии
    if (result.scholarships?.length) {
      const existingNames = new Set(merged.scholarships?.map(s => s.name) || []);
      const newScholarships = result.scholarships.filter(s => !existingNames.has(s.name));
      merged.scholarships = [...(merged.scholarships || []), ...newScholarships];
    }
    
    // Объединить рейтинги
    if (result.rankings?.length) {
      merged.rankings = [...(merged.rankings || []), ...result.rankings];
    }
    
    // Заполнить пустые поля
    for (const key of Object.keys(result) as (keyof University)[]) {
      if (!merged[key] && result[key]) {
        (merged as Record<string, unknown>)[key] = result[key];
      }
    }
  }
  
  return merged;
};

/**
 * Преобразовать Markdown в профиль университета через LLM (версия 2)
 * Использует улучшенный промпт с retry логикой
 * Поддерживает разбиение на части для больших текстов
 * @param markdown - текст в формате Markdown
 * @param sourceUrl - URL источника
 * @param existingData - существующие данные для контекста
 * @returns профиль университета
 */
export const markdownToUniversityProfile = async (
  markdown: string,
  sourceUrl: string,
  existingData?: Partial<University>
): Promise<Partial<University>> => {
  logger.info('Converting Markdown to University profile via LLM v2', {
    markdownLength: markdown.length,
    sourceUrl,
    hasExistingData: !!existingData,
  });

  // Разбить на чанки если текст слишком большой
  const chunks = splitIntoChunks(markdown, PARSER_CONFIG.maxChunkSize, PARSER_CONFIG.chunkOverlap);
  
  if (chunks.length > 1) {
    logger.info('Processing in multiple chunks', { chunksCount: chunks.length });
    
    const results: Partial<University>[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      logger.debug(`Processing chunk ${i + 1}/${chunks.length}`);
      
      try {
        const chunkResult = await parseSingleChunk(chunks[i], sourceUrl, i === 0 ? existingData : undefined);
        results.push(chunkResult);
      } catch (err) {
        logger.warn(`Chunk ${i + 1} parsing failed`, { error: err });
        // Продолжаем с остальными чанками
      }
      
      // Небольшая пауза между чанками чтобы не перегрузить LLM
      if (i < chunks.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    if (results.length === 0) {
      throw new ParserError('All chunks failed to parse', 'LLM_ERROR', { chunksCount: chunks.length });
    }
    
    const merged = mergeProfileResults(results);
    
    // Добавить metadata
    const completenessScore = calculateCompletenessScore(merged as University);
    merged.metadata = {
      parsed_at: new Date().toISOString(),
      source_url: sourceUrl,
      completeness_score: completenessScore,
      missing_fields: getMissingFieldsList(merged),
      notes: `Parsed in ${chunks.length} chunks, ${results.length} successful`,
    };
    
    return merged;
  }

  // Одиночный чанк - обычная обработка
  return parseSingleChunk(markdown, sourceUrl, existingData);
};

/**
 * Парсить один чанк текста
 */
const parseSingleChunk = async (
  markdown: string,
  sourceUrl: string,
  existingData?: Partial<University>
): Promise<Partial<University>> => {
  let lastError: Error | null = null;

  // Retry логика
  for (let attempt = 1; attempt <= PARSER_CONFIG.llmRetries; attempt++) {
    try {
      logger.debug(`LLM parsing attempt ${attempt}/${PARSER_CONFIG.llmRetries}`);
      
      // Построить промпт с новым шаблоном v2
      const prompt = await buildParserPrompt(markdown, sourceUrl);

      const result = await callOllamaForJson<Partial<University>>(prompt);

      // Валидация и нормализация результата
      const validated = validateAndNormalizeProfile(result, existingData, sourceUrl);

      // Подсчитать completeness score
      const completenessScore = calculateCompletenessScore(validated as University);

      // Добавить metadata
      validated.metadata = {
        parsed_at: new Date().toISOString(),
        source_url: sourceUrl,
        completeness_score: completenessScore,
        missing_fields: getMissingFieldsList(validated),
        notes: `Parsed on attempt ${attempt}`,
      };

      logger.info('Profile extracted successfully', {
        name: validated.name,
        programsCount: validated.programs?.length ?? 0,
        completenessScore,
        attempt,
      });

      return validated;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      logger.warn(`LLM parsing attempt ${attempt} failed`, {
        error: lastError.message,
        willRetry: attempt < PARSER_CONFIG.llmRetries,
      });

      if (attempt < PARSER_CONFIG.llmRetries) {
        await new Promise((resolve) => 
          setTimeout(resolve, PARSER_CONFIG.llmRetryDelay * attempt)
        );
      }
    }
  }

  // Все попытки исчерпаны
  throw new ParserError(
    `LLM parsing failed after ${PARSER_CONFIG.llmRetries} attempts: ${lastError?.message}`,
    'LLM_ERROR',
    { lastError, sourceUrl }
  );
};

/**
 * Подсчитать процент заполненности профиля
 * @param university - профиль университета
 * @returns число от 0 до 100
 */
export const calculateCompletenessScore = (university: Partial<University>): number => {
  const fields = [
    // Обязательные базовые поля (вес 2)
    { value: university.name, weight: 2 },
    { value: university.country, weight: 2 },
    { value: university.city, weight: 2 },
    { value: university.description, weight: 2 },
    
    // Важные поля (вес 1.5)
    { value: university.programs?.length, weight: 1.5 },
    { value: university.contacts?.main_email || university.contacts?.email, weight: 1.5 },
    { value: university.contacts?.phone, weight: 1.5 },
    { value: university.admissions?.requirements, weight: 1.5 },
    
    // Дополнительные поля (вес 1)
    { value: university.name_en, weight: 1 },
    { value: university.mission, weight: 1 },
    { value: university.founded_year, weight: 1 },
    { value: university.student_count, weight: 1 },
    { value: university.contacts?.address, weight: 1 },
    { value: university.tuition_general?.international_students, weight: 1 },
    { value: university.scholarships?.length, weight: 1 },
    { value: university.rankings?.length, weight: 1 },
    { value: university.campus?.facilities, weight: 1 },
    { value: university.international?.languages_of_instruction?.length, weight: 1 },
  ];

  let totalWeight = 0;
  let filledWeight = 0;

  for (const field of fields) {
    totalWeight += field.weight;
    
    if (isFieldFilled(field.value)) {
      filledWeight += field.weight;
    }
  }

  return Math.round((filledWeight / totalWeight) * 100);
};

/**
 * Проверить заполнено ли поле
 */
const isFieldFilled = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (value === NO_INFO || value === '') return false;
  if (typeof value === 'number' && value === 0) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
};

/**
 * Получить список незаполненных полей
 */
const getMissingFieldsList = (profile: Partial<University>): string[] => {
  const missing: string[] = [];
  
  const check = (value: unknown, name: string): void => {
    if (!isFieldFilled(value)) {
      missing.push(name);
    }
  };

  check(profile.description, 'description');
  check(profile.mission, 'mission');
  check(profile.founded_year, 'founded_year');
  check(profile.student_count, 'student_count');
  check(profile.programs?.length, 'programs');
  check(profile.contacts?.main_email || profile.contacts?.email, 'contacts.email');
  check(profile.contacts?.phone, 'contacts.phone');
  check(profile.contacts?.address, 'contacts.address');
  check(profile.admissions?.requirements, 'admissions.requirements');
  check(profile.tuition_general?.international_students, 'tuition');
  check(profile.scholarships?.length, 'scholarships');
  check(profile.rankings?.length, 'rankings');

  return missing;
};

/**
 * Извлечь все программы из markdown
 * Использует regex + AI для поиска
 * @param markdown - текст сайта
 * @returns массив программ
 */
export const extractAllPrograms = async (markdown: string): Promise<Program[]> => {
  logger.debug('Extracting programs from markdown', { length: markdown.length });

  // Regex паттерны для поиска программ
  const programPatterns = [
    /(?:бакалавр|bachelor|магистр|master|phd|докторант|аспирант)[\w\s]+(?:программа|program|специальность|направление)/gi,
    /(?:программа|program|специальность|направление)\s*[«"']?[\w\s]+[»"']?/gi,
    /(?:BSc|MSc|BA|MA|MBA|PhD)\s+(?:in\s+)?[\w\s]+/gi,
  ];

  const foundProgramNames = new Set<string>();

  for (const pattern of programPatterns) {
    const matches = markdown.match(pattern);
    if (matches) {
      matches.forEach((m) => foundProgramNames.add(m.trim()));
    }
  }

  logger.debug('Found program mentions', { count: foundProgramNames.size });

  // Если найдены упоминания, используем AI для детального парсинга
  if (foundProgramNames.size > 0) {
    const programsPrompt = `Extract educational programs from this text.
    
Found program mentions: ${Array.from(foundProgramNames).join(', ')}

Text:
${markdown.substring(0, 10000)}

Return JSON array of programs with structure:
[{
  "id": "program_1",
  "name": "Program Name",
  "degree_level": "Bachelor|Master|PhD|Diploma",
  "duration_years": 4,
  "language": "English",
  "description": "Description or 'Нет информации'",
  "admission_requirements": "Requirements or 'Нет информации'"
}]

Extract ALL programs you can find. Return ONLY JSON array.`;

    try {
      const programs = await callOllamaForJson<Program[]>(programsPrompt);
      
      if (Array.isArray(programs)) {
        return programs.map((p, i) => normalizeProgram(p, i));
      }
    } catch (err) {
      logger.warn('Failed to extract programs via AI', { error: err });
    }
  }

  return [];
};

/**
 * Нормализовать программу, заполнить пустые поля
 */
const normalizeProgram = (program: Partial<Program>, index: number): Program => {
  return {
    id: program.id || `prog-${index + 1}`,
    name: program.name || NO_INFO,
    degree_level: validateDegreeLevel(program.degree_level),
    duration_years: program.duration_years || 4,
    language: program.language || NO_INFO,
    description: program.description || NO_INFO,
    tuition: program.tuition,
    admission_requirements: program.admission_requirements || NO_INFO,
    language_requirements: program.language_requirements,
    application_deadline: program.application_deadline,
    career_outcomes: program.career_outcomes,
  };
};

/**
 * Валидировать и нормализовать профиль
 */
const validateAndNormalizeProfile = (
  profile: Partial<University>,
  existingData?: Partial<University>,
  _sourceUrl?: string
): Partial<University> => {
  // Объединить с существующими данными
  const merged: Partial<University> = {
    ...existingData,
    ...profile,
  };

  // Убедиться что обязательные поля заполнены
  if (!merged.name) {
    merged.name = existingData?.name ?? 'Unknown University';
  }

  if (!merged.country) {
    merged.country = existingData?.country ?? 'Unknown';
  }

  if (!merged.city) {
    merged.city = existingData?.city ?? 'Unknown';
  }

  if (!merged.website_url) {
    merged.website_url = existingData?.website_url ?? '';
  }

  if (!merged.description) {
    merged.description = '';
  }

  // Нормализовать programs
  if (merged.programs && Array.isArray(merged.programs)) {
    merged.programs = merged.programs.map((p, index) => ({
      id: p.id || `prog-${index}`,
      name: p.name || 'Unknown Program',
      degree_level: validateDegreeLevel(p.degree_level),
      duration_years: p.duration_years || 4,
      language: p.language || 'Unknown',
      tuition: p.tuition,
      admission_requirements: p.admission_requirements,
    }));
  } else {
    merged.programs = [];
  }

  // Нормализовать admissions
  if (!merged.admissions) {
    merged.admissions = { requirements: '' };
  }

  // Нормализовать contacts
  if (!merged.contacts) {
    merged.contacts = {};
  }

  // Нормализовать 3D-тур
  if (merged['3d_tour']) {
    merged['3d_tour'] = normalizeThreeDTour(merged['3d_tour']);
  }

  return merged;
};

/**
 * Нормализовать структуру 3D-тура
 */
const normalizeThreeDTour = (
  tour: Partial<UniversityThreeDTour>
): UniversityThreeDTour => {
  const sources: ThreeDTourProvider[] = [];
  const normalizedTour: UniversityThreeDTour = {
    available_sources: [],
  };

  const normalizeSource = (source?: ThreeDTourSource): ThreeDTourSource | undefined => {
    if (!source) return undefined;
    if (!isFinite(source.latitude) || !isFinite(source.longitude)) {
      return undefined;
    }
    return {
      source: source.source,
      url: source.url,
      latitude: clampLatitude(source.latitude),
      longitude: clampLongitude(source.longitude),
      address: source.address,
      available: source.available ?? true,
      last_validated: source.last_validated ? new Date(source.last_validated) : new Date(),
    };
  };

  const google = normalizeSource(tour.google_maps);
  const yandex = normalizeSource(tour.yandex_panorama);
  const twogis = normalizeSource(tour.twogis);

  if (google) {
    normalizedTour.google_maps = google;
    sources.push('google');
  }
  if (yandex) {
    normalizedTour.yandex_panorama = yandex;
    sources.push('yandex');
  }
  if (twogis) {
    normalizedTour.twogis = twogis;
    sources.push('2gis');
  }

  normalizedTour.available_sources = sources;
  normalizedTour.primary_source = tour.primary_source && sources.includes(tour.primary_source)
    ? tour.primary_source
    : sources[0];
  normalizedTour.last_updated = tour.last_updated ? new Date(tour.last_updated) : new Date();

  return normalizedTour;
};

const clampLatitude = (value: number): number => {
  if (value > 90) return 90;
  if (value < -90) return -90;
  return value;
};

const clampLongitude = (value: number): number => {
  if (value > 180) return 180;
  if (value < -180) return -180;
  return value;
};

/**
 * Валидировать уровень образования
 */
const validateDegreeLevel = (level?: string): 'Bachelor' | 'Master' | 'PhD' => {
  const normalized = level?.toLowerCase();
  
  if (normalized?.includes('bachelor') || normalized?.includes('бакалавр')) {
    return 'Bachelor';
  }
  if (normalized?.includes('master') || normalized?.includes('магистр')) {
    return 'Master';
  }
  if (normalized?.includes('phd') || normalized?.includes('доктор') || normalized?.includes('аспирант')) {
    return 'PhD';
  }
  
  return 'Bachelor';
};

/**
 * Известные категории специализаций
 */
const SPECIALIZATION_KEYWORDS: Record<string, string[]> = {
  'STEM': ['computer', 'engineering', 'math', 'physics', 'chemistry', 'biology', 'science', 'technology', 'информатика', 'инженер', 'математика', 'физика', 'химия', 'биология'],
  'Business': ['business', 'management', 'finance', 'marketing', 'economics', 'mba', 'бизнес', 'менеджмент', 'финанс', 'маркетинг', 'экономик'],
  'Medicine': ['medicine', 'medical', 'health', 'nursing', 'pharmacy', 'медицин', 'здоров', 'фармац', 'врач'],
  'Arts': ['art', 'design', 'music', 'theater', 'film', 'creative', 'искусств', 'дизайн', 'музык', 'театр', 'кино'],
  'Engineering': ['mechanical', 'electrical', 'civil', 'aerospace', 'industrial', 'механик', 'электр', 'строител', 'промышлен'],
  'Law': ['law', 'legal', 'jurisprudence', 'право', 'юрид', 'юриспруд'],
  'Humanities': ['history', 'philosophy', 'literature', 'linguistics', 'psychology', 'история', 'философ', 'литератур', 'лингвист', 'психолог'],
  'Social Sciences': ['sociology', 'political', 'international', 'social', 'социолог', 'политолог', 'международн'],
  'Education': ['education', 'teaching', 'pedagogy', 'образован', 'педагог', 'учител'],
  'Agriculture': ['agriculture', 'farming', 'agronomy', 'сельско', 'агро', 'фермер'],
};

/**
 * Извлечь специализации университета из программ
 * @param university - профиль университета
 * @returns массив категорий специализаций
 */
export const extractSpecializations = (university: Partial<University>): string[] => {
  const specializations = new Set<string>();
  const programs = university.programs || [];

  // Собрать весь текст для анализа
  const textToAnalyze = [
    university.description || '',
    university.mission || '',
    ...programs.map((p) => `${p.name} ${p.description || ''}`),
  ].join(' ').toLowerCase();

  // Проверить каждую категорию
  for (const [category, keywords] of Object.entries(SPECIALIZATION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (textToAnalyze.includes(keyword.toLowerCase())) {
        specializations.add(category);
        break;
      }
    }
  }

  return Array.from(specializations);
};

/**
 * Результат извлечения диапазона стоимости
 */
interface TuitionRange {
  min: number | null;
  max: number | null;
}

/**
 * Извлечь диапазон стоимости обучения
 * @param university - профиль университета
 * @returns минимальная и максимальная стоимость
 */
export const extractTuitionRange = (university: Partial<University>): TuitionRange => {
  const programs = university.programs || [];
  const amounts: number[] = [];

  // Собрать все суммы из программ
  for (const program of programs) {
    if (program.tuition?.amount && typeof program.tuition.amount === 'number') {
      amounts.push(program.tuition.amount);
    }
  }

  // Проверить общие данные о стоимости
  const generalTuition = university.tuition_general;
  if (generalTuition) {
    const parseAmount = (str: string | undefined): number | null => {
      if (!str) return null;
      const match = str.match(/[\d,]+/);
      if (match) {
        return parseInt(match[0].replace(/,/g, ''), 10);
      }
      return null;
    };

    const intAmount = parseAmount(generalTuition.international_students);
    const domAmount = parseAmount(generalTuition.domestic_students);
    
    if (intAmount) amounts.push(intAmount);
    if (domAmount) amounts.push(domAmount);
  }

  if (amounts.length === 0) {
    return { min: null, max: null };
  }

  return {
    min: Math.min(...amounts),
    max: Math.max(...amounts),
  };
};

/**
 * Определить категорию размера университета
 * @param university - профиль университета
 * @returns категория размера: small, medium, large
 */
export const determineUniversitySize = (
  university: Partial<University>
): 'small' | 'medium' | 'large' | null => {
  const studentCount = university.student_count;

  if (!studentCount || studentCount <= 0) {
    return null;
  }

  if (studentCount < 5000) {
    return 'small';
  }
  if (studentCount <= 20000) {
    return 'medium';
  }
  return 'large';
};

/**
 * Извлечь уникальные языки обучения из программ
 * @param university - профиль университета
 * @returns массив языков
 */
export const extractLanguages = (university: Partial<University>): string[] => {
  const languages = new Set<string>();
  const programs = university.programs || [];

  for (const program of programs) {
    if (program.language && program.language !== NO_INFO) {
      languages.add(program.language);
    }
  }

  // Проверить international данные
  const intlLanguages = university.international?.languages_of_instruction;
  if (Array.isArray(intlLanguages)) {
    for (const lang of intlLanguages) {
      if (lang && lang !== NO_INFO) {
        languages.add(lang);
      }
    }
  }

  return Array.from(languages);
};

/**
 * Извлечь уникальные уровни образования из программ
 * @param university - профиль университета
 * @returns массив уровней (Bachelor, Master, PhD)
 */
export const extractDegreeLevels = (university: Partial<University>): string[] => {
  const levels = new Set<string>();
  const programs = university.programs || [];

  for (const program of programs) {
    if (program.degree_level) {
      levels.add(program.degree_level);
    }
  }

  return Array.from(levels);
};

/**
 * Подготовить данные для расширенных колонок БД
 * @param university - профиль университета
 * @returns объект с данными для новых колонок
 */
export const prepareExtendedDbFields = (university: Partial<University>) => {
  const tuitionRange = extractTuitionRange(university);
  
  return {
    specializations: JSON.stringify(extractSpecializations(university)),
    languages: JSON.stringify(extractLanguages(university)),
    degree_levels: JSON.stringify(extractDegreeLevels(university)),
    min_tuition: tuitionRange.min,
    max_tuition: tuitionRange.max,
    size_category: determineUniversitySize(university),
    rankings: JSON.stringify(university.rankings || []),
    accepts_international: university.international?.accepts_international ?? true,
    founded_year: university.founded_year || null,
    student_count: university.student_count || null,
  };
};

/**
 * Удалить все профили университета и создать заново с нуля
 * @param universityId - ID университета
 * @param sourceId - ID источника
 * @param url - URL сайта
 * @returns результат обновления
 */
export const resetAndReparseUniversity = async (
  universityId: string,
  sourceId: string,
  url: string
): Promise<UpdateResult> => {
  logger.info('Resetting and reparsing university', { universityId, sourceId, url });
  const startTime = Date.now();

  try {
    // 1. Удалить ВСЕ старые профили для этого университета
    await query(
      `DELETE FROM university_profiles WHERE university_id = $1`,
      [universityId]
    );
    logger.info('Deleted old profiles', { universityId });

    // 2. Сбросить хэш источника чтобы гарантировать парсинг
    await query(
      `UPDATE university_sources 
       SET current_hash = NULL, last_parsed_at = NULL 
       WHERE id = $1`,
      [sourceId]
    );
    logger.info('Reset source hash', { sourceId });

    // 3. Загрузить сайт
    const { html, hash } = await fetchAndHashWebsite(url);

    // 4. Конвертировать HTML в Markdown
    const markdown = htmlToMarkdown(html);
    logger.info('Converting to profile via LLM', { markdownLength: markdown.length });

    // 5. Извлечь профиль через LLM (без существующих данных - начинаем с нуля)
    const newProfile = await markdownToUniversityProfile(markdown, url);

    // 6. Сохранить новый профиль в БД
    await transaction(async (client: PoolClient) => {
      // Получить базовые данные университета
      const uniData = await client.queryObject<{ name: string; country: string; city: string; website_url: string }>(
        `SELECT name, country, city, website_url FROM universities WHERE id = $1`,
        [universityId]
      );
      const uni = uniData.rows[0];

      // Создать полный профиль
      const fullProfile: University = {
        id: universityId,
        name: newProfile.name || uni?.name || 'Unknown',
        name_en: newProfile.name_en,
        country: newProfile.country || uni?.country || 'Unknown',
        city: newProfile.city || uni?.city || 'Unknown',
        website_url: newProfile.website_url || uni?.website_url || url,
        logo_url: newProfile.logo_url,
        description: newProfile.description || '',
        mission: newProfile.mission,
        founded_year: newProfile.founded_year,
        student_count: newProfile.student_count,
        faculty_count: newProfile.faculty_count,
        programs: newProfile.programs ?? [],
        tuition: newProfile.tuition,
        tuition_general: newProfile.tuition_general,
        admissions: newProfile.admissions || { requirements: '' },
        scholarships: newProfile.scholarships ?? [],
        contacts: newProfile.contacts || {},
        rankings: newProfile.rankings ?? [],
        campus: newProfile.campus,
        international: newProfile.international,
        other: newProfile.other,
        metadata: newProfile.metadata,
        ratings: newProfile.ratings,
        updated_at: new Date().toISOString(),
      };

      // Вставить новый профиль с версией 1
      await client.queryObject(
        `INSERT INTO university_profiles (university_id, profile_json, language, version)
         VALUES ($1, $2, 'ru', 1)`,
        [universityId, JSON.stringify(fullProfile)]
      );

      // Обновить source
      await client.queryObject(
        `UPDATE university_sources 
         SET current_hash = $1, last_checked_at = NOW(), last_parsed_at = NOW()
         WHERE id = $2`,
        [hash, sourceId]
      );

      // Обновить университет с расширенными полями
      const extendedFields = prepareExtendedDbFields(fullProfile);
      await client.queryObject(
        `UPDATE universities SET 
          updated_at = NOW(),
          specializations = $2,
          languages = $3,
          degree_levels = $4,
          min_tuition = $5,
          max_tuition = $6,
          size_category = $7,
          rankings = $8,
          accepts_international = $9,
          founded_year = $10,
          student_count = $11,
          indexed_at = NOW()
        WHERE id = $1`,
        [
          universityId,
          extendedFields.specializations,
          extendedFields.languages,
          extendedFields.degree_levels,
          extendedFields.min_tuition,
          extendedFields.max_tuition,
          extendedFields.size_category,
          extendedFields.rankings,
          extendedFields.accepts_international,
          extendedFields.founded_year,
          extendedFields.student_count,
        ]
      );
    });

    const processingTime = Date.now() - startTime;
    const completenessScore = newProfile.metadata?.completeness_score ?? 0;

    await logUpdate(sourceId, 'success', true, undefined, processingTime, completenessScore);

    logger.info('University reset and reparsed successfully', {
      universityId,
      completenessScore,
      programsCount: newProfile.programs?.length ?? 0,
      duration_ms: processingTime,
    });

    return {
      updated: true,
      message: `Profile recreated from scratch (completeness: ${completenessScore}%)`,
      newHash: hash,
    };
  } catch (err) {
    const processingTime = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    await logUpdate(sourceId, 'failed', false, errorMessage, processingTime);

    logger.error('University reset failed', {
      universityId,
      error: errorMessage,
      duration_ms: processingTime,
    });

    return {
      updated: false,
      message: 'Reset and reparse failed',
      error: errorMessage,
    };
  }
};

/**
 * Проверить и обновить данные сайта университета
 * @param universityId - ID университета
 * @param sourceId - ID источника
 * @param url - URL сайта
 * @param forceUpdate - принудительное обновление (игнорировать хэш)
 * @returns результат обновления
 */
export const checkAndUpdateWebsite = async (
  universityId: string,
  sourceId: string,
  url: string,
  forceUpdate: boolean = false
): Promise<UpdateResult> => {
  logger.info('Checking website for updates', { universityId, sourceId, url, forceUpdate });
  const startTime = Date.now();

  try {
    // 1. Получить текущий хэш и completeness из БД
    const source = await queryOne<UniversitySourceRow>(
      `SELECT current_hash, last_checked_at FROM university_sources WHERE id = $1`,
      [sourceId]
    );

    if (!source) {
      throw new ParserError('Source not found', 'DB_ERROR', { sourceId });
    }

    // Проверить текущий completeness score
    const currentProfile = await queryOne<{ profile_json: University }>(
      `SELECT profile_json FROM university_profiles 
       WHERE university_id = $1 
       ORDER BY version DESC LIMIT 1`,
      [universityId]
    );
    
    const currentCompleteness = currentProfile?.profile_json?.metadata?.completeness_score ?? 0;
    const needsReparse = currentCompleteness < 30; // Если заполнено меньше 30% - нужно перепарсить

    // 2. Загрузить и хэшировать сайт
    const { html, hash } = await fetchAndHashWebsite(url);

    // 3. Проверить нужно ли обновлять
    const hasChanges = source.current_hash !== hash;
    const shouldUpdate = forceUpdate || hasChanges || needsReparse;

    if (!shouldUpdate) {
      // Обновить только last_checked_at
      await query(
        `UPDATE university_sources SET last_checked_at = NOW() WHERE id = $1`,
        [sourceId]
      );

      await logUpdate(sourceId, 'skipped', false);

      const duration = Date.now() - startTime;
      logger.info('No changes detected', { universityId, duration_ms: duration, currentCompleteness });

      return {
        updated: false,
        message: 'No changes detected',
      };
    }
    
    logger.info('Will update profile', { 
      universityId, 
      reason: forceUpdate ? 'force' : (needsReparse ? 'low_completeness' : 'hash_changed'),
      currentCompleteness,
    });

    // 4. Изменения обнаружены - парсим новый контент
    logger.info('Changes detected, parsing new content', { universityId });

    // Получить существующие данные
    const existingProfile = await queryOne<{ profile_json: University }>(
      `SELECT profile_json FROM university_profiles 
       WHERE university_id = $1 
       ORDER BY version DESC LIMIT 1`,
      [universityId]
    );

    // Конвертировать HTML в Markdown
    const markdown = htmlToMarkdown(html);

    // Извлечь профиль через LLM v2
    const newProfile = await markdownToUniversityProfile(
      markdown,
      url,
      existingProfile?.profile_json
    );

    // 5. Сохранить в БД
    await transaction(async (client: PoolClient) => {
      // Получить текущую версию
      const versionResult = await client.queryObject<{ version: number }>(
        `SELECT COALESCE(MAX(version), 0) as version 
         FROM university_profiles WHERE university_id = $1`,
        [universityId]
      );
      const newVersion = (versionResult.rows[0]?.version ?? 0) + 1;

      // Создать полный профиль
      const fullProfile: University = {
        id: universityId,
        name: newProfile.name!,
        name_en: newProfile.name_en,
        country: newProfile.country!,
        city: newProfile.city!,
        website_url: newProfile.website_url!,
        logo_url: newProfile.logo_url,
        description: newProfile.description!,
        mission: newProfile.mission,
        programs: newProfile.programs ?? [],
        tuition: newProfile.tuition,
        admissions: newProfile.admissions!,
        scholarships: newProfile.scholarships,
        contacts: newProfile.contacts!,
        ratings: newProfile.ratings,
        updated_at: new Date().toISOString(),
      };

      // Вставить новую версию профиля
      await client.queryObject(
        `INSERT INTO university_profiles (university_id, profile_json, language, version)
         VALUES ($1, $2, 'ru', $3)`,
        [universityId, JSON.stringify(fullProfile), newVersion]
      );

      // Обновить source
      await client.queryObject(
        `UPDATE university_sources 
         SET current_hash = $1, last_checked_at = NOW(), last_parsed_at = NOW()
         WHERE id = $2`,
        [hash, sourceId]
      );

      // Обновить университет с расширенными полями
      const extendedFields = prepareExtendedDbFields(fullProfile);
      await client.queryObject(
        `UPDATE universities SET 
          updated_at = NOW(),
          specializations = $2,
          languages = $3,
          degree_levels = $4,
          min_tuition = $5,
          max_tuition = $6,
          size_category = $7,
          rankings = $8,
          accepts_international = $9,
          founded_year = $10,
          student_count = $11,
          indexed_at = NOW()
        WHERE id = $1`,
        [
          universityId,
          extendedFields.specializations,
          extendedFields.languages,
          extendedFields.degree_levels,
          extendedFields.min_tuition,
          extendedFields.max_tuition,
          extendedFields.size_category,
          extendedFields.rankings,
          extendedFields.accepts_international,
          extendedFields.founded_year,
          extendedFields.student_count,
        ]
      );
    });

    // 6. Записать лог с completeness score
    const processingTime = Date.now() - startTime;
    const completenessScore = newProfile.metadata?.completeness_score ?? 0;
    
    await logUpdate(sourceId, 'success', true, undefined, processingTime, completenessScore);

    logger.info('Website updated successfully', {
      universityId,
      newHash: hash.substring(0, 16) + '...',
      completenessScore,
      programsCount: newProfile.programs?.length ?? 0,
      duration_ms: processingTime,
    });

    return {
      updated: true,
      message: `Profile updated (completeness: ${completenessScore}%)`,
      newHash: hash,
    };
  } catch (err) {
    const processingTime = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Сохранить markdown для отладки при ошибке
    try {
      await saveFailedParseData(sourceId, errorMessage);
    } catch (saveErr) {
      logger.warn('Failed to save debug data', { error: saveErr });
    }

    await logUpdate(sourceId, 'failed', false, errorMessage, processingTime);

    logger.error('Website update failed', {
      universityId,
      error: errorMessage,
      duration_ms: processingTime,
    });

    return {
      updated: false,
      message: 'Update failed',
      error: errorMessage,
    };
  }
};

/**
 * Сохранить данные неудачного парсинга для отладки
 */
const saveFailedParseData = async (
  sourceId: string,
  errorMessage: string
): Promise<void> => {
  await query(
    `UPDATE university_sources 
     SET last_error = $1, last_error_at = NOW() 
     WHERE id = $2`,
    [errorMessage, sourceId]
  );
};

/**
 * Записать лог обновления
 */
const logUpdate = async (
  sourceId: string,
  status: UpdateStatus,
  changesDetected: boolean,
  errorMessage?: string,
  processingTimeMs?: number,
  completenessScore?: number
): Promise<void> => {
  try {
    await query(
      `INSERT INTO update_logs (source_id, status, changes_detected, error_message, processing_time_ms)
       VALUES ($1, $2, $3, $4, $5)`,
      [sourceId, status, changesDetected, errorMessage ?? null, processingTimeMs ?? null]
    );
    
    // Логируем completeness score если есть
    if (completenessScore !== undefined) {
      logger.debug('Update logged', { sourceId, status, completenessScore });
    }
  } catch (err) {
    logger.error('Failed to log update', err);
  }
};

/**
 * Обновить все активные источники
 * @returns статистика обновления
 */
export const updateAllSources = async (): Promise<{
  total: number;
  updated: number;
  failed: number;
  skipped: number;
}> => {
  logger.info('Starting bulk update of all sources');

  const sources = await query<{
    id: string;
    university_id: string;
    url: string;
  }>(
    `SELECT id, university_id, url 
     FROM university_sources 
     WHERE is_active = true 
     ORDER BY last_checked_at ASC NULLS FIRST`
  );

  const stats = {
    total: sources.length,
    updated: 0,
    failed: 0,
    skipped: 0,
  };

  for (const source of sources) {
    try {
      const result = await checkAndUpdateWebsite(
        source.university_id,
        source.id,
        source.url
      );

      if (result.updated) {
        stats.updated++;
      } else if (result.error) {
        stats.failed++;
      } else {
        stats.skipped++;
      }

      // Пауза между запросами
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      logger.error('Failed to update source', { sourceId: source.id, error: err });
      stats.failed++;
    }
  }

  logger.info('Bulk update completed', stats);

  return stats;
};
