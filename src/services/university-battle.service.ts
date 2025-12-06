/**
 * Сервис для сравнения университетов (Battle Mode)
 */

import { logger } from '../utils/logger.ts';
import { callOllamaForJson } from '../utils/ollama.client.ts';
import { queryOne } from '../config/database.ts';
import type { University } from '../types/university.ts';

/**
 * Критерий сравнения
 */
export interface ComparisonCriterion {
  name: string;
  nameRu: string;
  scoreA: number;
  scoreB: number;
  winner: 'A' | 'B' | 'Tie';
  explanation: string;
}

/**
 * Информация об университете в результатах
 */
export interface BattleUniversity {
  id: string;
  name: string;
  name_en?: string;
  country: string;
  city: string;
  totalScore: number;
  // Расширенные данные для отображения
  description?: string;
  website_url?: string;
  logo_url?: string;
  founded_year?: number;
  student_count?: number;
  faculty_count?: number;
  rankings?: Array<{ source: string; rank?: number; year: number }>;
  programs_count?: number;
  tuition_info?: string;
  scholarships_count?: number;
  international_percentage?: number;
  languages?: string[];
  accreditations?: string;
}

/**
 * Результат сравнения
 */
export interface BattleResult {
  universityA: BattleUniversity;
  universityB: BattleUniversity;
  criteria: ComparisonCriterion[];
  overallWinner: 'A' | 'B' | 'Tie';
  strengthsA: string[];
  strengthsB: string[];
  recommendation: string;
  winsA: number;
  winsB: number;
  ties: number;
}

/**
 * Кэш результатов сравнения
 */
const battleCache = new Map<string, { result: BattleResult; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 часа

/**
 * Rate limiter для сравнений
 */
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_COOLDOWN = 1000; // 1 секунда между запросами на одну пару

/**
 * Генерация ключа кэша
 */
const getCacheKey = (id1: string, id2: string, language: string): string => {
  const sortedIds = [id1, id2].sort();
  return `${sortedIds[0]}:${sortedIds[1]}:${language}`;
};

/**
 * Получить университет из БД
 */
const getUniversityById = async (id: string): Promise<University | null> => {
  const result = await queryOne<{ profile_json: University }>(
    `SELECT up.profile_json 
     FROM university_profiles up
     WHERE up.university_id = $1
     ORDER BY up.version DESC
     LIMIT 1`,
    [id]
  );
  return result?.profile_json || null;
};

/**
 * Языковые метки для критериев
 */
const CRITERIA_LABELS: Record<string, Record<string, string>> = {
  'Academic Reputation': { ru: 'Академическая репутация', kk: 'Академиялық беделі', en: 'Academic Reputation' },
  'Teaching Quality': { ru: 'Качество преподавания', kk: 'Оқыту сапасы', en: 'Teaching Quality' },
  'Research Output': { ru: 'Научная деятельность', kk: 'Ғылыми қызмет', en: 'Research Output' },
  'International Diversity': { ru: 'Международное разнообразие', kk: 'Халықаралық әртүрлілік', en: 'International Diversity' },
  'Cost Effectiveness': { ru: 'Соотношение цены и качества', kk: 'Баға мен сапа арақатынасы', en: 'Cost Effectiveness' },
  'Student Life': { ru: 'Студенческая жизнь', kk: 'Студенттік өмір', en: 'Student Life' },
  'Career Outcomes': { ru: 'Карьерные перспективы', kk: 'Мансаптық перспективалар', en: 'Career Outcomes' },
  'Faculty Quality': { ru: 'Качество преподавательского состава', kk: 'Оқытушылар сапасы', en: 'Faculty Quality' },
};

/**
 * Форматировать данные университета для промпта
 */
const formatUniversityData = (uni: University): string => {
  const lines: string[] = [];

  // Базовая информация
  lines.push(`Название: ${uni.name}`);
  if (uni.name_en) lines.push(`Name (EN): ${uni.name_en}`);
  lines.push(`Страна: ${uni.country}`);
  lines.push(`Город: ${uni.city}`);
  if (uni.founded_year) lines.push(`Год основания: ${uni.founded_year}`);
  if (uni.description) lines.push(`Описание: ${uni.description}`);
  if (uni.mission) lines.push(`Миссия: ${uni.mission}`);

  // Статистика
  if (uni.student_count) lines.push(`Количество студентов: ${uni.student_count}`);
  if (uni.faculty_count) lines.push(`Количество преподавателей: ${uni.faculty_count}`);

  // Рейтинги
  const rankings = uni.rankings || uni.ratings || [];
  if (rankings.length > 0) {
    lines.push(`Рейтинги:`);
    rankings.forEach((r) => {
      lines.push(`  - ${r.source}: #${r.rank} (${r.year})`);
    });
  }

  // Программы обучения
  if (uni.programs && uni.programs.length > 0) {
    lines.push(`Образовательные программы (${uni.programs.length}):`);
    uni.programs.slice(0, 10).forEach((p) => {
      const tuitionStr = p.tuition?.amount 
        ? `, стоимость: ${p.tuition.amount.toLocaleString()} ${p.tuition.currency}/год`
        : '';
      lines.push(`  - ${p.name} (${p.degree_level}, ${p.duration_years} года, ${p.language}${tuitionStr})`);
    });
    if (uni.programs.length > 10) {
      lines.push(`  ... и ещё ${uni.programs.length - 10} программ`);
    }
  }

  // Стоимость обучения
  if (uni.tuition_general) {
    lines.push(`Стоимость обучения:`);
    if (uni.tuition_general.domestic_students) {
      lines.push(`  - Для местных студентов: ${uni.tuition_general.domestic_students}`);
    }
    if (uni.tuition_general.international_students) {
      lines.push(`  - Для иностранных студентов: ${uni.tuition_general.international_students}`);
    }
    if (uni.tuition_general.financial_aid) {
      lines.push(`  - Финансовая помощь: ${uni.tuition_general.financial_aid}`);
    }
  } else if (uni.tuition?.amount) {
    lines.push(`Стоимость обучения: ${uni.tuition.amount.toLocaleString()} ${uni.tuition.currency}/год`);
  }

  // Стипендии
  if (uni.scholarships && uni.scholarships.length > 0) {
    lines.push(`Стипендии и гранты:`);
    uni.scholarships.forEach((s) => {
      lines.push(`  - ${s.name}: ${s.amount || ''} ${s.description || ''}`);
    });
  }

  // Требования к поступлению
  if (uni.admissions) {
    lines.push(`Поступление:`);
    if (uni.admissions.requirements) lines.push(`  - Требования: ${uni.admissions.requirements}`);
    if (uni.admissions.english_proficiency) lines.push(`  - Английский: ${uni.admissions.english_proficiency}`);
    if (uni.admissions.test_requirements) lines.push(`  - Тесты: ${uni.admissions.test_requirements}`);
    if (uni.admissions.intake_dates) lines.push(`  - Приём: ${uni.admissions.intake_dates}`);
  }

  // Международные возможности
  if (uni.international) {
    lines.push(`Международное:`);
    if (uni.international.accepts_international) lines.push(`  - Принимает иностранных студентов: Да`);
    if (uni.international.international_percentage) {
      lines.push(`  - Доля иностранных студентов: ${uni.international.international_percentage}%`);
    }
    if (uni.international.exchange_programs) lines.push(`  - Обмен: ${uni.international.exchange_programs}`);
    if (uni.international.languages_of_instruction) {
      lines.push(`  - Языки обучения: ${uni.international.languages_of_instruction.join(', ')}`);
    }
  }

  // Контакты
  if (uni.contacts) {
    lines.push(`Контакты:`);
    if (uni.contacts.main_email || uni.contacts.email) {
      lines.push(`  - Email: ${uni.contacts.main_email || uni.contacts.email}`);
    }
    if (uni.contacts.phone) lines.push(`  - Телефон: ${uni.contacts.phone}`);
    if (uni.contacts.address) lines.push(`  - Адрес: ${uni.contacts.address}`);
  }

  // Дополнительно
  if (uni.accreditations) lines.push(`Аккредитации: ${uni.accreditations}`);
  if (uni.achievements) lines.push(`Достижения: ${uni.achievements}`);
  if (uni.research_focus) lines.push(`Научный фокус: ${uni.research_focus}`);

  return lines.join('\n');
};

/**
 * Построить промпт для Ollama
 */
const buildComparisonPrompt = (
  uniA: University,
  uniB: University,
  language: string
): string => {
  const langName = language === 'ru' ? 'Russian' : language === 'kk' ? 'Kazakh' : 'English';

  const uniAData = formatUniversityData(uniA);
  const uniBData = formatUniversityData(uniB);

  return `You are an expert university analyst. Compare these two universities based on ALL the data provided below.

CRITICAL: Use ONLY the actual data provided. Do NOT guess or make up information.

Compare on these criteria (score 1-10 based on the data):
1. Academic Reputation - based on rankings, accreditations, achievements
2. Teaching Quality - based on faculty count, student/faculty ratio, programs quality
3. Research Output - based on research focus, notable alumni, achievements
4. International Diversity - based on international students %, exchange programs, languages
5. Cost Effectiveness - based on tuition costs vs rankings/quality
6. Student Life - based on campus, facilities, student count
7. Career Outcomes - based on employer reputation, notable alumni
8. Faculty Quality - based on faculty count, accreditations

═══════════════════════════════════════════════════════════════
UNIVERSITY A - FULL DATA:
═══════════════════════════════════════════════════════════════
${uniAData}

═══════════════════════════════════════════════════════════════
UNIVERSITY B - FULL DATA:
═══════════════════════════════════════════════════════════════
${uniBData}

═══════════════════════════════════════════════════════════════

INSTRUCTIONS:
1. For each criterion, analyze the actual data provided above
2. Give scores 1-10 based on real data, not assumptions
3. If data is missing for a criterion, score based on available related data
4. Write explanations in ${langName}
5. Be objective and fair

Return ONLY valid JSON in this exact format:
{
  "criteria": [
    { "name": "Academic Reputation", "scoreA": 8, "scoreB": 7, "winner": "A", "explanation": "Краткое объяснение на основе данных..." },
    { "name": "Teaching Quality", "scoreA": 7, "scoreB": 8, "winner": "B", "explanation": "..." },
    { "name": "Research Output", "scoreA": 8, "scoreB": 6, "winner": "A", "explanation": "..." },
    { "name": "International Diversity", "scoreA": 9, "scoreB": 5, "winner": "A", "explanation": "..." },
    { "name": "Cost Effectiveness", "scoreA": 6, "scoreB": 8, "winner": "B", "explanation": "..." },
    { "name": "Student Life", "scoreA": 7, "scoreB": 7, "winner": "Tie", "explanation": "..." },
    { "name": "Career Outcomes", "scoreA": 8, "scoreB": 7, "winner": "A", "explanation": "..." },
    { "name": "Faculty Quality", "scoreA": 8, "scoreB": 7, "winner": "A", "explanation": "..." }
  ],
  "overallWinner": "A",
  "strengthsA": ["сила 1", "сила 2", "сила 3"],
  "strengthsB": ["сила 1", "сила 2", "сила 3"],
  "recommendation": "Рекомендация для абитуриентов: кому подойдёт какой университет..."
}`;
};

/**
 * Результат парсинга от Ollama
 */
interface OllamaComparisonResult {
  criteria: Array<{
    name: string;
    scoreA: number;
    scoreB: number;
    winner: 'A' | 'B' | 'Tie';
    explanation: string;
  }>;
  overallWinner: 'A' | 'B' | 'Tie';
  strengthsA: string[];
  strengthsB: string[];
  recommendation: string;
}

/**
 * Сравнить два университета
 * @param id1 - ID первого университета
 * @param id2 - ID второго университета
 * @param language - язык результатов (ru | kk | en)
 * @returns результат сравнения
 */
export const compareUniversities = async (
  id1: string,
  id2: string,
  language: string = 'ru'
): Promise<BattleResult> => {
  const startTime = Date.now();
  const cacheKey = getCacheKey(id1, id2, language);

  // Проверить rate limit
  const lastRequest = rateLimitMap.get(cacheKey);
  if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_COOLDOWN) {
    throw new Error('Please wait before comparing these universities again');
  }
  rateLimitMap.set(cacheKey, Date.now());

  // Проверить кэш
  const cached = battleCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('Battle cache hit', { id1, id2, language });
    return cached.result;
  }

  logger.info('Comparing universities', { id1, id2, language });

  // Получить университеты из БД
  const [uniA, uniB] = await Promise.all([
    getUniversityById(id1),
    getUniversityById(id2),
  ]);

  if (!uniA) {
    throw new Error(`University A not found: ${id1}`);
  }
  if (!uniB) {
    throw new Error(`University B not found: ${id2}`);
  }

  // Вызвать Ollama для сравнения
  const prompt = buildComparisonPrompt(uniA, uniB, language);
  
  let ollamaResult: OllamaComparisonResult;
  try {
    ollamaResult = await callOllamaForJson<OllamaComparisonResult>(prompt);
  } catch (err) {
    logger.error('Ollama comparison failed', { error: err });
    throw new Error('Failed to generate comparison. Please try again.');
  }

  // Подсчитать статистику
  let winsA = 0;
  let winsB = 0;
  let ties = 0;
  let totalA = 0;
  let totalB = 0;

  const criteria: ComparisonCriterion[] = ollamaResult.criteria.map((c) => {
    if (c.winner === 'A') winsA++;
    else if (c.winner === 'B') winsB++;
    else ties++;

    totalA += c.scoreA;
    totalB += c.scoreB;

    return {
      name: c.name,
      nameRu: CRITERIA_LABELS[c.name]?.[language] || c.name,
      scoreA: c.scoreA,
      scoreB: c.scoreB,
      winner: c.winner,
      explanation: c.explanation,
    };
  });

  /**
   * Вспомогательная функция для форматирования информации о стоимости
   */
  const formatTuitionInfo = (uni: University): string | undefined => {
    if (uni.tuition_general?.domestic_students) {
      return uni.tuition_general.domestic_students;
    }
    if (uni.tuition?.amount) {
      return `${uni.tuition.amount.toLocaleString()} ${uni.tuition.currency}/год`;
    }
    return undefined;
  };

  const result: BattleResult = {
    universityA: {
      id: id1,
      name: uniA.name,
      name_en: uniA.name_en,
      country: uniA.country,
      city: uniA.city,
      totalScore: totalA,
      description: uniA.description,
      website_url: uniA.website_url,
      logo_url: uniA.logo_url,
      founded_year: uniA.founded_year,
      student_count: uniA.student_count,
      faculty_count: uniA.faculty_count,
      rankings: (uniA.rankings || uniA.ratings || []).map((r) => ({
        source: r.source,
        rank: r.rank,
        year: r.year,
      })),
      programs_count: uniA.programs?.length || 0,
      tuition_info: formatTuitionInfo(uniA),
      scholarships_count: uniA.scholarships?.length || 0,
      international_percentage: uniA.international?.international_percentage,
      languages: uniA.international?.languages_of_instruction,
      accreditations: uniA.accreditations,
    },
    universityB: {
      id: id2,
      name: uniB.name,
      name_en: uniB.name_en,
      country: uniB.country,
      city: uniB.city,
      totalScore: totalB,
      description: uniB.description,
      website_url: uniB.website_url,
      logo_url: uniB.logo_url,
      founded_year: uniB.founded_year,
      student_count: uniB.student_count,
      faculty_count: uniB.faculty_count,
      rankings: (uniB.rankings || uniB.ratings || []).map((r) => ({
        source: r.source,
        rank: r.rank,
        year: r.year,
      })),
      programs_count: uniB.programs?.length || 0,
      tuition_info: formatTuitionInfo(uniB),
      scholarships_count: uniB.scholarships?.length || 0,
      international_percentage: uniB.international?.international_percentage,
      languages: uniB.international?.languages_of_instruction,
      accreditations: uniB.accreditations,
    },
    criteria,
    overallWinner: ollamaResult.overallWinner,
    strengthsA: ollamaResult.strengthsA || [],
    strengthsB: ollamaResult.strengthsB || [],
    recommendation: ollamaResult.recommendation || '',
    winsA,
    winsB,
    ties,
  };

  // Сохранить в кэш
  battleCache.set(cacheKey, { result, timestamp: Date.now() });

  const duration = Date.now() - startTime;
  logger.info('Battle completed', {
    id1,
    id2,
    winner: result.overallWinner,
    duration,
  });

  return result;
};

/**
 * Очистить кэш сравнений
 */
export const clearBattleCache = (): void => {
  battleCache.clear();
  logger.debug('Battle cache cleared');
};
