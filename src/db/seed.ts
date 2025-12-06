import { transaction } from '../config/database.ts';
import { logger } from '../utils/logger.ts';
import type { University, Program, Rating } from '../types/university.ts';
import type { PoolClient } from 'postgres';

/**
 * Тестовые данные университетов
 */
const TEST_UNIVERSITIES: Array<{
  base: {
    name: string;
    name_en: string;
    country: string;
    city: string;
    website_url: string;
    logo_url?: string;
  };
  profile: Omit<University, 'id' | 'updated_at'>;
}> = [
  {
    base: {
      name: 'Назарбаев Университет',
      name_en: 'Nazarbayev University',
      country: 'Казахстан',
      city: 'Астана',
      website_url: 'https://nu.edu.kz',
    },
    profile: {
      name: 'Назарбаев Университет',
      name_en: 'Nazarbayev University',
      country: 'Казахстан',
      city: 'Астана',
      website_url: 'https://nu.edu.kz',
      description: 'Автономный исследовательский университет мирового класса в Казахстане',
      mission: 'Стать исследовательским университетом мирового класса',
      programs: [
        {
          id: 'nu-cs-bsc',
          name: 'Computer Science',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
        },
        {
          id: 'nu-ds-msc',
          name: 'Data Science',
          degree_level: 'Master',
          duration_years: 2,
          language: 'English',
        },
      ] as Program[],
      tuition: { amount: 0, currency: 'KZT', per_year: true },
      admissions: {
        requirements: 'SAT/ACT, IELTS 6.5+, аттестат',
        start_date: '2025-09-01',
      },
      scholarships: [
        { name: 'Полный грант', amount: '100%', description: 'Покрывает обучение и проживание' },
      ],
      contacts: {
        email: 'admissions@nu.edu.kz',
        phone: '+7 7172 70 6000',
        address: 'Кабанбай батыра 53, Астана',
      },
      ratings: [
        { source: 'QS World', rank: 211, year: 2024, category: 'Overall' },
      ] as Rating[],
    },
  },
  {
    base: {
      name: 'Московский государственный университет',
      name_en: 'Moscow State University',
      country: 'Россия',
      city: 'Москва',
      website_url: 'https://msu.ru',
    },
    profile: {
      name: 'Московский государственный университет',
      name_en: 'Moscow State University',
      country: 'Россия',
      city: 'Москва',
      website_url: 'https://msu.ru',
      description: 'Старейший и крупнейший университет России',
      mission: 'Развитие науки и подготовка кадров высшей квалификации',
      programs: [
        {
          id: 'msu-math-bsc',
          name: 'Математика',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Russian',
        },
        {
          id: 'msu-physics-phd',
          name: 'Физика',
          degree_level: 'PhD',
          duration_years: 4,
          language: 'Russian',
        },
      ] as Program[],
      tuition: { amount: 400000, currency: 'RUB', per_year: true },
      admissions: {
        requirements: 'ЕГЭ, вступительные экзамены',
        start_date: '2025-09-01',
      },
      contacts: {
        email: 'info@msu.ru',
        phone: '+7 495 939 1000',
        address: 'Ленинские горы, 1, Москва',
      },
      ratings: [
        { source: 'QS World', rank: 87, year: 2024, category: 'Overall' },
      ] as Rating[],
    },
  },
  {
    base: {
      name: 'Санкт-Петербургский государственный университет',
      name_en: 'Saint Petersburg State University',
      country: 'Россия',
      city: 'Санкт-Петербург',
      website_url: 'https://spbu.ru',
    },
    profile: {
      name: 'Санкт-Петербургский государственный университет',
      name_en: 'Saint Petersburg State University',
      country: 'Россия',
      city: 'Санкт-Петербург',
      website_url: 'https://spbu.ru',
      description: 'Один из ведущих университетов России с богатой историей',
      programs: [
        {
          id: 'spbu-law-bsc',
          name: 'Юриспруденция',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Russian',
        },
      ] as Program[],
      tuition: { amount: 350000, currency: 'RUB', per_year: true },
      admissions: {
        requirements: 'ЕГЭ, вступительные экзамены',
        start_date: '2025-09-01',
      },
      contacts: {
        email: 'info@spbu.ru',
        phone: '+7 812 328 2000',
        address: 'Университетская наб., 7-9, Санкт-Петербург',
      },
      ratings: [
        { source: 'QS World', rank: 264, year: 2024, category: 'Overall' },
      ] as Rating[],
    },
  },
  {
    base: {
      name: 'КБТУ',
      name_en: 'Kazakh-British Technical University',
      country: 'Казахстан',
      city: 'Алматы',
      website_url: 'https://kbtu.edu.kz',
    },
    profile: {
      name: 'Казахстанско-Британский технический университет',
      name_en: 'Kazakh-British Technical University',
      country: 'Казахстан',
      city: 'Алматы',
      website_url: 'https://kbtu.edu.kz',
      description: 'Ведущий технический университет Казахстана с британскими стандартами',
      programs: [
        {
          id: 'kbtu-it-bsc',
          name: 'Information Systems',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
        },
        {
          id: 'kbtu-petro-bsc',
          name: 'Petroleum Engineering',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
        },
      ] as Program[],
      tuition: { amount: 3200000, currency: 'KZT', per_year: true },
      admissions: {
        requirements: 'ЕНТ/SAT, IELTS 5.5+',
        start_date: '2025-09-01',
      },
      contacts: {
        email: 'admission@kbtu.kz',
        phone: '+7 727 272 5990',
        address: 'Толе би 59, Алматы',
      },
      ratings: [
        { source: 'QS EECA', rank: 120, year: 2024, category: 'Regional' },
      ] as Rating[],
    },
  },
  {
    base: {
      name: 'МУИТ',
      name_en: 'International IT University',
      country: 'Казахстан',
      city: 'Алматы',
      website_url: 'https://iitu.edu.kz',
    },
    profile: {
      name: 'Международный университет информационных технологий',
      name_en: 'International IT University',
      country: 'Казахстан',
      city: 'Алматы',
      website_url: 'https://iitu.edu.kz',
      description: 'Специализированный IT университет Казахстана',
      programs: [
        {
          id: 'iitu-se-bsc',
          name: 'Software Engineering',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
        },
        {
          id: 'iitu-cyber-msc',
          name: 'Cybersecurity',
          degree_level: 'Master',
          duration_years: 2,
          language: 'English',
        },
      ] as Program[],
      tuition: { amount: 2500000, currency: 'KZT', per_year: true },
      admissions: {
        requirements: 'ЕНТ, IELTS 5.0+',
        start_date: '2025-09-01',
      },
      contacts: {
        email: 'admission@iitu.edu.kz',
        phone: '+7 727 330 8500',
        address: 'Манаса 34/1, Алматы',
      },
    },
  },
];

/**
 * Вставить университет и его профиль
 * @param client - клиент БД
 * @param data - данные университета
 * @returns ID созданного университета
 */
const insertUniversity = async (
  client: PoolClient,
  data: (typeof TEST_UNIVERSITIES)[0]
): Promise<string> => {
  // Вставить базовую запись
  const uniResult = await client.queryObject<{ id: string }>(`
    INSERT INTO universities (name, name_en, country, city, website_url, logo_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (website_url) DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = NOW()
    RETURNING id
  `, [
    data.base.name,
    data.base.name_en,
    data.base.country,
    data.base.city,
    data.base.website_url,
    data.base.logo_url ?? null,
  ]);
  
  const universityId = uniResult.rows[0].id;
  
  // Создать полный профиль
  const fullProfile: University = {
    id: universityId,
    ...data.profile,
    updated_at: new Date().toISOString(),
  };
  
  // Вставить профиль
  await client.queryObject(`
    INSERT INTO university_profiles (university_id, profile_json, language, version)
    VALUES ($1, $2, 'ru', 1)
    ON CONFLICT (university_id, language, version) DO UPDATE SET
      profile_json = EXCLUDED.profile_json
  `, [universityId, JSON.stringify(fullProfile)]);
  
  return universityId;
};

/**
 * Заполнить БД тестовыми данными университетов
 * @returns количество добавленных университетов
 */
export const seedUniversities = async (): Promise<number> => {
  logger.info('Starting database seeding...');
  
  try {
    const count = await transaction(async (client) => {
      let inserted = 0;
      
      for (const university of TEST_UNIVERSITIES) {
        const id = await insertUniversity(client, university);
        logger.debug(`Seeded university: ${university.base.name}`, { id });
        inserted++;
      }
      
      return inserted;
    });
    
    logger.info(`Database seeding completed: ${count} universities added`);
    return count;
  } catch (err) {
    logger.error('Database seeding failed', err);
    throw err;
  }
};

/**
 * Очистить все данные (для тестов)
 */
export const clearAllData = async (): Promise<void> => {
  logger.warn('Clearing all data from database...');
  
  await transaction(async (client) => {
    await client.queryObject('DELETE FROM update_logs');
    await client.queryObject('DELETE FROM university_sources');
    await client.queryObject('DELETE FROM university_profiles');
    await client.queryObject('DELETE FROM universities');
  });
  
  logger.info('All data cleared');
};

/**
 * Проверить наличие данных
 * @returns true если данные есть
 */
export const hasData = async (): Promise<boolean> => {
  const { query } = await import('../config/database.ts');
  
  const result = await query<{ count: number }>(
    'SELECT COUNT(*) as count FROM universities'
  );
  
  return (result[0]?.count ?? 0) > 0;
};
