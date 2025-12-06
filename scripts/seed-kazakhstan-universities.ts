/**
 * Скрипт загрузки топ-университетов Казахстана
 * Запуск: deno run -A scripts/seed-kazakhstan-universities.ts
 */

// Загрузить переменные окружения
import 'https://deno.land/std@0.208.0/dotenv/load.ts';

import { transaction } from '../src/config/database.ts';
import { fetchAndHashWebsite, markdownToUniversityProfile } from '../src/services/parser.service.ts';
import { htmlToMarkdown } from '../src/utils/markdown.converter.ts';
import { logger } from '../src/utils/logger.ts';
import type { PoolClient } from 'postgres';

/**
 * Топ-университеты Казахстана
 */
const KAZAKHSTAN_UNIVERSITIES = [
  {
    name: 'Казахский национальный университет им. аль-Фараби',
    name_en: 'Al-Farabi Kazakh National University',
    website: 'https://www.kaznu.kz/',
    logo_url: 'https://www.kaznu.kz/content/images/logo.png',
    city: 'Almaty',
    latitude: 43.2220,
    longitude: 76.9265,
  },
  {
    name: 'Назарбаев Университет',
    name_en: 'Nazarbayev University',
    website: 'https://nu.edu.kz/',
    logo_url: 'https://nu.edu.kz/wp-content/themes/flavor/assets/images/logo.svg',
    city: 'Astana',
    latitude: 51.0906,
    longitude: 71.3984,
  },
  {
    name: 'Казахстанско-Британский технический университет',
    name_en: 'Kazakh-British Technical University (KBTU)',
    website: 'https://www.kbtu.kz/',
    logo_url: 'https://kbtu.kz/images/logo.svg',
    city: 'Almaty',
    latitude: 43.2380,
    longitude: 76.9440,
  },
  {
    name: 'Евразийский национальный университет им. Л.Н. Гумилёва',
    name_en: 'L.N. Gumilyov Eurasian National University',
    website: 'https://www.enu.kz/',
    logo_url: 'https://www.enu.kz/images/logo.png',
    city: 'Astana',
    latitude: 51.1280,
    longitude: 71.4306,
  },
  {
    name: 'Казахский национальный исследовательский технический университет им. К.И. Сатпаева',
    name_en: 'Satbayev University (KazNRTU)',
    website: 'https://satbayev.university/',
    logo_url: 'https://satbayev.university/storage/pages/December2021/logo-satbayev.png',
    city: 'Almaty',
    latitude: 43.2330,
    longitude: 76.9200,
  },
  {
    name: 'Казахский национальный медицинский университет им. С.Д. Асфендиярова',
    name_en: 'Asfendiyarov Kazakh National Medical University',
    website: 'https://kaznmu.kz/',
    logo_url: 'https://kaznmu.kz/wp-content/uploads/2020/07/logo.png',
    city: 'Almaty',
    latitude: 43.2380,
    longitude: 76.9450,
  },
  {
    name: 'Международный университет информационных технологий',
    name_en: 'International IT University (IITU)',
    website: 'https://iitu.edu.kz/',
    logo_url: 'https://iitu.edu.kz/wp-content/themes/flavor/assets/images/logo.svg',
    city: 'Almaty',
    latitude: 43.2284,
    longitude: 76.8735,
  },
  {
    name: 'Университет Туран',
    name_en: 'Turan University',
    website: 'https://www.turan-edu.kz/',
    logo_url: 'https://www.turan-edu.kz/images/logo.png',
    city: 'Almaty',
    latitude: 43.2310,
    longitude: 76.9070,
  },
  {
    name: 'Алматы Менеджмент Университет (AlmaU)',
    name_en: 'Almaty Management University',
    website: 'https://almau.edu.kz/',
    logo_url: 'https://almau.edu.kz/wp-content/uploads/2023/01/logo.png',
    city: 'Almaty',
    latitude: 43.2270,
    longitude: 76.9430,
  },
  {
    name: 'Южно-Казахстанский университет им. М. Ауэзова',
    name_en: 'M. Auezov South Kazakhstan University',
    website: 'https://auezov.edu.kz/',
    logo_url: 'https://auezov.edu.kz/images/logo.png',
    city: 'Shymkent',
    latitude: 42.3150,
    longitude: 69.5960,
  },
];

/**
 * Результат загрузки университета
 */
interface LoadResult {
  name: string;
  success: boolean;
  completeness_score: number;
  error?: string;
}

/**
 * Загрузить университет
 */
const loadUniversity = async (
  uni: typeof KAZAKHSTAN_UNIVERSITIES[0]
): Promise<LoadResult> => {
  logger.info(`Loading: ${uni.name_en}`);
  const startTime = Date.now();

  try {
    // 1. Попробовать загрузить сайт
    let html: string;
    let hash: string;

    try {
      const result = await fetchAndHashWebsite(uni.website);
      html = result.html;
      hash = result.hash;
    } catch (fetchErr) {
      logger.warn(`Failed to fetch ${uni.website}, using fallback data`, { error: fetchErr });
      
      // Создать базовую запись без парсинга сайта
      return await createFallbackUniversity(uni);
    }

    // 2. Конвертировать в Markdown
    const markdown = htmlToMarkdown(html);

    // 3. Парсить через LLM
    const profile = await markdownToUniversityProfile(markdown, uni.website, {
      name: uni.name,
      name_en: uni.name_en,
      country: 'Kazakhstan',
      city: uni.city,
    });

    // 4. Сохранить в БД
    await transaction(async (client: PoolClient) => {
      // Проверить существует ли университет
      const existing = await client.queryObject<{ id: string }>(
        `SELECT id FROM universities WHERE website_url = $1`,
        [uni.website]
      );

      let universityId: string;

      if (existing.rows.length > 0) {
        // Обновить существующий
        universityId = existing.rows[0].id;
        await client.queryObject(
          `UPDATE universities SET
            name = $1, name_en = $2, latitude = $3, longitude = $4, logo_url = $5, updated_at = NOW()
           WHERE id = $6`,
          [uni.name, uni.name_en, uni.latitude, uni.longitude, uni.logo_url, universityId]
        );
      } else {
        // Создать новый
        const uniResult = await client.queryObject<{ id: string }>(
          `INSERT INTO universities (
            name, name_en, country, city, website_url, 
            latitude, longitude, logo_url, is_active
          ) VALUES ($1, $2, 'Kazakhstan', $3, $4, $5, $6, $7, true)
          RETURNING id`,
          [uni.name, uni.name_en, uni.city, uni.website, uni.latitude, uni.longitude, uni.logo_url]
        );
        universityId = uniResult.rows[0].id;
      }

      // Создать профиль
      await client.queryObject(
        `INSERT INTO university_profiles (university_id, profile_json, language, version)
         VALUES ($1, $2, 'ru', 1)
         ON CONFLICT (university_id, language, version) DO UPDATE SET
           profile_json = EXCLUDED.profile_json`,
        [universityId, JSON.stringify({ ...profile, id: universityId })]
      );

      // Создать источник
      await client.queryObject(
        `INSERT INTO university_sources (university_id, url, current_hash, last_parsed_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (url) DO UPDATE SET
           current_hash = EXCLUDED.current_hash,
           last_parsed_at = NOW()`,
        [universityId, uni.website, hash]
      );
    });

    const duration = Date.now() - startTime;
    const completeness = profile.metadata?.completeness_score ?? 0;

    logger.info(`Loaded: ${uni.name_en}`, {
      completeness_score: completeness,
      duration_ms: duration,
    });

    return {
      name: uni.name_en,
      success: true,
      completeness_score: completeness,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to load: ${uni.name_en}`, { error: errorMessage });

    return {
      name: uni.name_en,
      success: false,
      completeness_score: 0,
      error: errorMessage,
    };
  }
};

/**
 * Создать fallback запись университета без парсинга
 */
const createFallbackUniversity = async (
  uni: typeof KAZAKHSTAN_UNIVERSITIES[0]
): Promise<LoadResult> => {
  try {
    await transaction(async (client: PoolClient) => {
      // Проверить существует ли
      const existing = await client.queryObject<{ id: string }>(
        `SELECT id FROM universities WHERE website_url = $1`,
        [uni.website]
      );

      let universityId: string;

      if (existing.rows.length > 0) {
        universityId = existing.rows[0].id;
        await client.queryObject(
          `UPDATE universities SET name = $1, name_en = $2, latitude = $3, longitude = $4, logo_url = $5, updated_at = NOW() WHERE id = $6`,
          [uni.name, uni.name_en, uni.latitude, uni.longitude, uni.logo_url, universityId]
        );
      } else {
        const uniResult = await client.queryObject<{ id: string }>(
          `INSERT INTO universities (name, name_en, country, city, website_url, latitude, longitude, logo_url, is_active)
           VALUES ($1, $2, 'Kazakhstan', $3, $4, $5, $6, $7, true) RETURNING id`,
          [uni.name, uni.name_en, uni.city, uni.website, uni.latitude, uni.longitude, uni.logo_url]
        );
        universityId = uniResult.rows[0].id;
      }

      // Базовый профиль
      const fallbackProfile = {
        id: universityId,
        name: uni.name,
        name_en: uni.name_en,
        country: 'Kazakhstan',
        city: uni.city,
        website_url: uni.website,
        description: 'Информация скоро будет доступна.',
        programs: [],
        updated_at: new Date().toISOString(),
        metadata: {
          parsed_at: new Date().toISOString(),
          source_url: uni.website,
          completeness_score: 10,
          missing_fields: ['description', 'programs', 'contacts'],
          notes: 'Fallback profile - website not accessible',
        },
      };

      await client.queryObject(
        `INSERT INTO university_profiles (university_id, profile_json, language, version)
         VALUES ($1, $2, 'ru', 1)
         ON CONFLICT (university_id, language, version) DO UPDATE SET
           profile_json = EXCLUDED.profile_json`,
        [universityId, JSON.stringify(fallbackProfile)]
      );
    });

    return {
      name: uni.name_en,
      success: true,
      completeness_score: 10,
    };
  } catch (err) {
    return {
      name: uni.name_en,
      success: false,
      completeness_score: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

/**
 * Главная функция
 */
const main = async () => {
  console.log('='.repeat(60));
  console.log('🎓 Загрузка топ-университетов Казахстана');
  console.log('='.repeat(60));
  console.log(`\nВсего университетов: ${KAZAKHSTAN_UNIVERSITIES.length}\n`);

  const results: LoadResult[] = [];

  // Загрузить университеты последовательно
  for (const uni of KAZAKHSTAN_UNIVERSITIES) {
    console.log(`\n📚 ${uni.name_en}...`);
    const result = await loadUniversity(uni);
    results.push(result);

    // Пауза между запросами
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Вывод результатов
  console.log('\n' + '='.repeat(60));
  console.log('📊 РЕЗУЛЬТАТЫ');
  console.log('='.repeat(60));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const avgCompleteness = successful.length > 0
    ? Math.round(successful.reduce((sum, r) => sum + r.completeness_score, 0) / successful.length)
    : 0;

  console.log(`\n✅ Загружено: ${successful.length}/${KAZAKHSTAN_UNIVERSITIES.length}`);
  console.log(`❌ Ошибки: ${failed.length}`);
  console.log(`📈 Средняя заполненность: ${avgCompleteness}%`);

  if (failed.length > 0) {
    console.log('\n❌ Неудачные:');
    failed.forEach((r) => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n✅ Успешные:');
  successful.forEach((r) => {
    console.log(`   - ${r.name}: ${r.completeness_score}%`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('Готово!');
};

// Запуск
main().catch(console.error);
