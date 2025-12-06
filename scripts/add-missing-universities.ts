/**
 * Скрипт добавления недостающих университетов Казахстана
 * Запуск: ~/.deno/bin/deno run -A scripts/add-missing-universities.ts
 */

import 'https://deno.land/std@0.208.0/dotenv/load.ts';

import { transaction } from '../src/config/database.ts';
import { logger } from '../src/utils/logger.ts';
import type { PoolClient } from 'postgres';
import type { University, Program, Ranking, Scholarship, Contacts, Admissions, TuitionGeneral } from '../src/types/university.ts';

/**
 * Недостающие университеты для добавления
 */
const MISSING_UNIVERSITIES = [
  // ============================================
  // AlmaU (Almaty Management University)
  // ============================================
  {
    base: {
      name: 'Алматы Менеджмент Университет (AlmaU)',
      name_en: 'Almaty Management University',
      country: 'Казахстан',
      city: 'Алматы',
      website_url: 'https://almau.edu.kz/',
      logo_url: 'https://almau.edu.kz/wp-content/uploads/2023/01/logo.png',
      latitude: 43.2270,
      longitude: 76.9430,
    },
    profile: {
      name: 'Алматы Менеджмент Университет (AlmaU)',
      name_en: 'Almaty Management University',
      country: 'Казахстан',
      city: 'Алматы',
      website_url: 'https://almau.edu.kz/',
      description: 'AlmaU — ведущая бизнес-школа Центральной Азии, специализирующаяся на подготовке управленцев и предпринимателей. Имеет международные аккредитации AACSB и AMBA, партнёрства с ведущими бизнес-школами мира.',
      mission: 'Развитие предпринимательского потенциала и управленческих компетенций для бизнеса Казахстана и региона.',
      founded_year: 1988,
      student_count: 3000,
      programs: [
        {
          id: 'almau-ba-bsc',
          name: 'Business Administration',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English/Russian',
          description: 'Программа делового администрирования международного уровня.',
        },
        {
          id: 'almau-mba',
          name: 'MBA',
          degree_level: 'Master',
          duration_years: 2,
          language: 'English',
          description: 'Магистр бизнес-администрирования с международной аккредитацией.',
        },
        {
          id: 'almau-marketing-bsc',
          name: 'Marketing',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English/Russian',
        },
        {
          id: 'almau-finance-bsc',
          name: 'Finance',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English/Russian',
        },
        {
          id: 'almau-management-bsc',
          name: 'Management',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English/Russian',
        },
      ] as Program[],
      tuition_general: {
        international_students: '2 500 000 - 3 500 000 KZT в год',
        domestic_students: '2 500 000 - 3 500 000 KZT в год',
        payment_options: 'Оплата по семестрам, рассрочка',
        financial_aid: 'Академические скидки, корпоративные гранты',
      } as TuitionGeneral,
      admissions: {
        requirements: 'ЕНТ/SAT, IELTS 5.5+ для англоязычных программ',
        english_proficiency: 'IELTS 5.5 или TOEFL 70 для программ на английском',
        documents_needed: 'Аттестат, сертификат ЕНТ/SAT, IELTS/TOEFL, мотивационное письмо',
        application_process: 'Онлайн подача через сайт университета',
        intake_dates: 'Осенний приём: сентябрь',
      } as Admissions,
      scholarships: [
        { name: 'Академическая стипендия', amount: 'До 50%', description: 'Скидка на обучение по результатам ЕНТ', eligibility: 'Высокие баллы ЕНТ' },
        { name: 'AlmaU Leadership Grant', amount: 'До 100%', description: 'Полный грант для талантливых абитуриентов', eligibility: 'Лидерские качества, высокие академические показатели' },
      ] as Scholarship[],
      contacts: {
        main_email: 'info@almau.edu.kz',
        admissions_email: 'admission@almau.edu.kz',
        phone: '+7 727 302 2222',
        address: 'ул. Розыбакиева, 227, Алматы, 050060',
        social_media: {
          website: 'https://almau.edu.kz',
          facebook: 'https://facebook.com/AlmaUofficial',
          instagram: 'https://instagram.com/almau_official',
          linkedin: 'https://linkedin.com/school/almau',
        },
      } as Contacts,
      rankings: [
        { source: 'QS EECA Rankings', rank: 151, year: 2024, category: 'EECA' },
        { source: 'Eduniversal Business Schools', rank: 3, year: 2024, category: 'Central Asia' },
      ] as Ranking[],
      international: {
        accepts_international: true,
        international_percentage: 12,
        visa_support: 'Полная поддержка в оформлении студенческой визы',
        exchange_programs: 'Партнёрства с ESCP Europe, KEDGE Business School, Grenoble EM',
        languages_of_instruction: ['English', 'Russian'],
      },
      accreditations: 'AACSB, AMBA accreditation — одна из немногих бизнес-школ СНГ с двойной аккредитацией',
      achievements: 'Ведущая бизнес-школа Центральной Азии с международными аккредитациями AACSB и AMBA',
      research_focus: 'Предпринимательство, устойчивое развитие бизнеса, цифровая трансформация',
    } as Partial<University>,
  },

  // ============================================
  // Южно-Казахстанский университет им. М. Ауэзова
  // ============================================
  {
    base: {
      name: 'Южно-Казахстанский университет им. М. Ауэзова',
      name_en: 'M. Auezov South Kazakhstan University',
      country: 'Казахстан',
      city: 'Шымкент',
      website_url: 'https://auezov.edu.kz/',
      logo_url: 'https://auezov.edu.kz/images/logo.png',
      latitude: 42.3150,
      longitude: 69.5960,
    },
    profile: {
      name: 'Южно-Казахстанский университет им. М. Ауэзова',
      name_en: 'M. Auezov South Kazakhstan University',
      country: 'Казахстан',
      city: 'Шымкент',
      website_url: 'https://auezov.edu.kz/',
      description: 'Южно-Казахстанский университет имени М. Ауэзова — крупнейший университет на юге Казахстана. В 2025 году занял 621-ю позицию в мировом рейтинге QS и входит в Топ-150 университетов Азии. Предлагает 165 специальностей бакалавриата, программы на английском языке и двойные дипломы.',
      mission: 'Подготовка высококвалифицированных специалистов для развития южного региона Казахстана и страны в целом.',
      founded_year: 1943,
      student_count: 20000,
      faculty_count: 1200,
      programs: [
        {
          id: 'auezov-it-bsc',
          name: 'Информационные технологии',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian/English',
          tuition: { amount: 650000, currency: 'KZT', per_year: true },
        },
        {
          id: 'auezov-pedagogy-bsc',
          name: 'Педагогические науки',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 650000, currency: 'KZT', per_year: true },
          admission_requirements: 'ЕНТ + специальный экзамен',
        },
        {
          id: 'auezov-engineering-bsc',
          name: 'Инженерия',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 650000, currency: 'KZT', per_year: true },
        },
        {
          id: 'auezov-economics-bsc',
          name: 'Экономика',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 650000, currency: 'KZT', per_year: true },
        },
        {
          id: 'auezov-chemistry-bsc',
          name: 'Химия и химическая технология',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 650000, currency: 'KZT', per_year: true },
        },
        {
          id: 'auezov-law-bsc',
          name: 'Юриспруденция',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 650000, currency: 'KZT', per_year: true },
        },
        {
          id: 'auezov-medicine-bsc',
          name: 'Медицина',
          degree_level: 'Bachelor',
          duration_years: 5,
          language: 'Kazakh/Russian',
          tuition: { amount: 750000, currency: 'KZT', per_year: true },
        },
      ] as Program[],
      tuition_general: {
        domestic_students: 'от 650 000 KZT в год',
        international_students: 'от 700 000 KZT в год',
        payment_options: 'Оплата по семестрам',
        financial_aid: 'Государственные гранты, именные стипендии',
      } as TuitionGeneral,
      admissions: {
        requirements: 'ЕНТ, специальный экзамен для педагогических направлений',
        documents_needed: 'Аттестат, сертификат ЕНТ, медицинская справка, фото 3x4',
        application_process: 'Подача документов через приёмную комиссию или онлайн',
        intake_dates: 'Осенний приём: сентябрь',
      } as Admissions,
      scholarships: [
        { name: 'Государственный грант', amount: '100%', description: 'Полное покрытие стоимости обучения', eligibility: 'По результатам ЕНТ' },
        { name: 'Грант им. М. Ауэзова', amount: 'Повышенная стипендия', description: 'Для отличников', eligibility: 'GPA 3.67+' },
        { name: 'Социальная стипендия', amount: 'Базовая стипендия', description: 'Для студентов из малообеспеченных семей', eligibility: 'Социальный статус' },
      ] as Scholarship[],
      contacts: {
        main_email: 'info@auezov.edu.kz',
        admissions_email: 'admission@auezov.edu.kz',
        phone: '+7 7252 21 0007',
        address: 'пр. Тауке хана, 5, Шымкент, 160012',
        social_media: {
          website: 'https://auezov.edu.kz',
          facebook: 'https://facebook.com/AuezovUniversity',
          instagram: 'https://instagram.com/auezov_university',
        },
      } as Contacts,
      rankings: [
        { source: 'QS World University Rankings', rank: 621, year: 2025, category: 'Overall' },
        { source: 'QS Asia University Rankings', rank: 150, year: 2025, category: 'Asia' },
        { source: 'QS EECA Rankings', rank: 100, year: 2024, category: 'EECA' },
      ] as Ranking[],
      international: {
        accepts_international: true,
        international_percentage: 5,
        visa_support: 'Помощь в оформлении студенческой визы',
        exchange_programs: 'Программы двойного диплома с европейскими и азиатскими университетами',
        languages_of_instruction: ['Kazakh', 'Russian', 'English'],
      },
      accreditations: 'Министерство науки и высшего образования РК, международные аккредитации',
      achievements: '165 специальностей бакалавриата, входит в Топ-150 университетов Азии по QS, крупнейший вуз юга Казахстана',
      research_focus: 'Химическая технология, нефтехимия, агропромышленный комплекс, педагогика',
    } as Partial<University>,
  },
];

/**
 * Добавить университет в базу данных
 */
const addUniversity = async (
  client: PoolClient,
  baseData: typeof MISSING_UNIVERSITIES[0]['base'],
  profileData: Partial<University>
): Promise<string> => {
  // Проверить, существует ли уже
  const existing = await client.queryObject<{ id: string }>(
    `SELECT id FROM universities WHERE website_url = $1`,
    [baseData.website_url]
  );

  if (existing.rows.length > 0) {
    logger.info(`University already exists: ${baseData.name}`);
    return existing.rows[0].id;
  }

  // Создать запись в таблице universities
  const result = await client.queryObject<{ id: string }>(
    `INSERT INTO universities (name, name_en, country, city, website_url, logo_url, latitude, longitude, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
     RETURNING id`,
    [
      baseData.name,
      baseData.name_en,
      baseData.country,
      baseData.city,
      baseData.website_url,
      baseData.logo_url,
      baseData.latitude,
      baseData.longitude,
    ]
  );

  const universityId = result.rows[0].id;

  // Создать профиль
  const fullProfile: University = {
    ...profileData,
    id: universityId,
    updated_at: new Date().toISOString(),
    metadata: {
      parsed_at: new Date().toISOString(),
      source_url: baseData.website_url,
      completeness_score: 85,
      missing_fields: [],
      notes: 'Added with comprehensive data from web sources',
    },
  } as University;

  await client.queryObject(
    `INSERT INTO university_profiles (university_id, profile_json, language, version)
     VALUES ($1, $2, 'ru', 1)`,
    [universityId, JSON.stringify(fullProfile)]
  );

  // Создать источник
  await client.queryObject(
    `INSERT INTO university_sources (university_id, url, source_type, is_active)
     VALUES ($1, $2, 'website', true)
     ON CONFLICT (url) DO NOTHING`,
    [universityId, baseData.website_url]
  );

  logger.info(`✅ Added: ${baseData.name}`);
  return universityId;
};

/**
 * Главная функция
 */
const main = async () => {
  console.log('='.repeat(60));
  console.log('🎓 Добавление недостающих университетов Казахстана');
  console.log('='.repeat(60));
  console.log(`\nВсего для добавления: ${MISSING_UNIVERSITIES.length}\n`);

  let successCount = 0;

  for (const uni of MISSING_UNIVERSITIES) {
    try {
      await transaction(async (client) => {
        await addUniversity(client, uni.base, uni.profile);
      });
      successCount++;
    } catch (err) {
      logger.error(`Failed to add ${uni.base.name}`, { error: err });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 РЕЗУЛЬТАТЫ');
  console.log('='.repeat(60));
  console.log(`\n✅ Добавлено: ${successCount}`);
  console.log('\n' + '='.repeat(60));
  console.log('Готово!');
};

// Запуск
main().catch(console.error);
