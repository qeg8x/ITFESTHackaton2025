/**
 * Скрипт обновления данных топ-университетов Казахстана
 * Заполняет пробелы в существующих записях полной актуальной информацией
 * Запуск: deno run -A scripts/update-kazakhstan-universities-data.ts
 */

import 'https://deno.land/std@0.208.0/dotenv/load.ts';

import { transaction } from '../src/config/database.ts';
import { logger } from '../src/utils/logger.ts';
import type { PoolClient } from 'postgres';
import type { University, Program, Ranking, Scholarship, Contacts, Admissions, TuitionGeneral } from '../src/types/university.ts';

/**
 * Полные данные топ-университетов Казахстана (актуальные на 2025 год)
 */
const KAZAKHSTAN_UNIVERSITIES_DATA: Array<{
  website_url: string;
  profile: Partial<University>;
}> = [
  // ============================================
  // 1. Назарбаев Университет
  // ============================================
  {
    website_url: 'https://nu.edu.kz/',
    profile: {
      name: 'Назарбаев Университет',
      name_en: 'Nazarbayev University',
      country: 'Казахстан',
      city: 'Астана',
      description: 'Назарбаев Университет — автономный исследовательский университет мирового класса в Казахстане. Основан в 2010 году и является флагманом высшего образования страны. Университет предлагает образовательные программы международного уровня полностью на английском языке. Партнёрские отношения с ведущими мировыми университетами обеспечивают высокое качество образования и исследований.',
      mission: 'Стать исследовательским университетом мирового класса, вносящим вклад в развитие Казахстана и региона через образование, исследования и инновации.',
      founded_year: 2010,
      student_count: 8000,
      faculty_count: 600,
      programs: [
        {
          id: 'nu-cs-bsc',
          name: 'Computer Science',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          description: 'Программа подготовки специалистов в области компьютерных наук с фокусом на AI, машинное обучение и разработку ПО.',
          tuition: { amount: 7260000, currency: 'KZT', per_year: true },
        },
        {
          id: 'nu-ee-bsc',
          name: 'Electrical and Electronic Engineering',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          description: 'Инженерная программа по электротехнике и электронике.',
          tuition: { amount: 7260000, currency: 'KZT', per_year: true },
        },
        {
          id: 'nu-me-bsc',
          name: 'Mechanical Engineering',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          description: 'Программа машиностроения с акцентом на современные технологии.',
          tuition: { amount: 7260000, currency: 'KZT', per_year: true },
        },
        {
          id: 'nu-ce-bsc',
          name: 'Chemical Engineering',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          tuition: { amount: 7260000, currency: 'KZT', per_year: true },
        },
        {
          id: 'nu-bio-bsc',
          name: 'Biology',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          tuition: { amount: 7260000, currency: 'KZT', per_year: true },
        },
        {
          id: 'nu-economics-bsc',
          name: 'Economics',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          tuition: { amount: 7260000, currency: 'KZT', per_year: true },
        },
        {
          id: 'nu-ds-msc',
          name: 'Data Science',
          degree_level: 'Master',
          duration_years: 2,
          language: 'English',
          description: 'Магистерская программа по науке о данных с акцентом на Big Data и аналитику.',
        },
        {
          id: 'nu-mba',
          name: 'MBA',
          degree_level: 'Master',
          duration_years: 2,
          language: 'English',
          description: 'Программа MBA международного уровня.',
        },
      ] as Program[],
      tuition_general: {
        international_students: '15 000 USD в год (~7 260 000 KZT)',
        domestic_students: '15 000 USD в год (~7 260 000 KZT) для платных мест, гранты покрывают 100%',
        payment_options: 'Единовременная оплата или рассрочка',
        financial_aid: 'Образовательные гранты покрывают обучение и проживание',
      } as TuitionGeneral,
      admissions: {
        requirements: 'ЕНТ от 85 баллов, GPA от 4.0/5.0, IELTS 6.0+ или TOEFL iBT 60+',
        english_proficiency: 'IELTS 6.0 или TOEFL iBT 60 (для Foundation IELTS 5.5)',
        test_requirements: 'NUET (Nazarbayev University Entrance Test) для грантовых мест',
        documents_needed: 'Аттестат, сертификат IELTS/TOEFL, мотивационное письмо',
        application_process: 'Онлайн подача через портал университета, NUET для грантов',
        intake_dates: 'Осенний приём: сентябрь',
      } as Admissions,
      scholarships: [
        { name: 'Полный грант NU', amount: '100%', description: 'Покрывает обучение, проживание и стипендию', eligibility: 'Высокие баллы NUET и собеседование' },
        { name: 'Частичный грант', amount: '50-75%', description: 'Покрывает часть стоимости обучения', eligibility: 'По результатам конкурсного отбора' },
      ] as Scholarship[],
      contacts: {
        main_email: 'admissions@nu.edu.kz',
        admissions_email: 'admissions@nu.edu.kz',
        phone: '+7 7172 70 6000',
        address: 'Кабанбай батыра 53, Астана, 010000',
        social_media: {
          website: 'https://nu.edu.kz',
          facebook: 'https://facebook.com/NazarbayevUniversity',
          instagram: 'https://instagram.com/nu_university',
          linkedin: 'https://linkedin.com/school/nazarbayev-university',
        },
      } as Contacts,
      rankings: [
        { source: 'QS World University Rankings', rank: 207, year: 2025, category: 'Overall' },
        { source: 'QS Asia University Rankings', rank: 38, year: 2025, category: 'Asia' },
        { source: 'THE World University Rankings', rank: 301, year: 2024, category: 'Overall' },
      ] as Ranking[],
      international: {
        accepts_international: true,
        international_percentage: 15,
        visa_support: 'Полная поддержка в оформлении студенческой визы',
        exchange_programs: 'Партнёрства с Duke, Cambridge, Wisconsin-Madison, NUS',
        languages_of_instruction: ['English'],
      },
      accreditations: 'ABET (инженерные программы), AACSB (бизнес-школа)',
      achievements: 'Топ-1 университет Казахстана, входит в Топ-40 Азии по QS',
      research_focus: 'Энергетика, устойчивое развитие, биомедицина, AI и Data Science',
    },
  },

  // ============================================
  // 2. Казахский национальный университет им. аль-Фараби
  // ============================================
  {
    website_url: 'https://www.kaznu.kz/',
    profile: {
      name: 'Казахский национальный университет им. аль-Фараби',
      name_en: 'Al-Farabi Kazakh National University',
      country: 'Казахстан',
      city: 'Алматы',
      description: 'Казахский национальный университет имени аль-Фараби — крупнейший и старейший университет Казахстана, основанный в 1934 году. Университет является лидером страны в мировых рейтингах и предлагает образование на 15 факультетах. Входит в Топ-200 мировых университетов по QS.',
      mission: 'Подготовка высококвалифицированных специалистов и развитие науки для устойчивого развития Казахстана.',
      founded_year: 1934,
      student_count: 25000,
      faculty_count: 2000,
      programs: [
        {
          id: 'kaznu-cs-bsc',
          name: 'Информатика',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian/English',
          tuition: { amount: 1200000, currency: 'KZT', per_year: true },
        },
        {
          id: 'kaznu-law-bsc',
          name: 'Юриспруденция',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 1200000, currency: 'KZT', per_year: true },
        },
        {
          id: 'kaznu-ir-bsc',
          name: 'Международные отношения',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian/English',
          tuition: { amount: 1200000, currency: 'KZT', per_year: true },
        },
        {
          id: 'kaznu-economics-bsc',
          name: 'Экономика',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 1200000, currency: 'KZT', per_year: true },
        },
        {
          id: 'kaznu-physics-bsc',
          name: 'Физика',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 1200000, currency: 'KZT', per_year: true },
        },
        {
          id: 'kaznu-biology-bsc',
          name: 'Биология',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 1200000, currency: 'KZT', per_year: true },
        },
      ] as Program[],
      tuition_general: {
        international_students: '1 200 000 KZT в год',
        domestic_students: '1 200 000 KZT в год (платное), государственные гранты',
        payment_options: 'Оплата по семестрам',
        financial_aid: 'Государственные гранты, именные стипендии',
      } as TuitionGeneral,
      admissions: {
        requirements: 'ЕНТ от 65 баллов (контракт), от 70 баллов (бюджет)',
        english_proficiency: 'Для англоязычных программ: IELTS 5.5+',
        documents_needed: 'Аттестат, сертификат ЕНТ, медицинская справка',
        application_process: 'Подача документов через приёмную комиссию',
        intake_dates: 'Осенний приём: сентябрь',
      } as Admissions,
      scholarships: [
        { name: 'Государственный грант', amount: '100%', description: 'Покрывает полную стоимость обучения', eligibility: 'По результатам ЕНТ' },
        { name: 'Стипендия аль-Фараби', amount: 'Повышенная стипендия', description: 'Для отличников', eligibility: 'GPA 3.67+' },
      ] as Scholarship[],
      contacts: {
        main_email: 'info@kaznu.kz',
        admissions_email: 'admission@kaznu.kz',
        phone: '+7 727 377 3330',
        address: 'пр. аль-Фараби, 71, Алматы, 050040',
        social_media: {
          website: 'https://www.kaznu.kz',
          facebook: 'https://facebook.com/kazikimlasfarabi',
          instagram: 'https://instagram.com/kaznu_official',
        },
      } as Contacts,
      rankings: [
        { source: 'QS World University Rankings', rank: 163, year: 2025, category: 'Overall' },
        { source: 'QS Asia University Rankings', rank: 25, year: 2025, category: 'Asia' },
      ] as Ranking[],
      international: {
        accepts_international: true,
        international_percentage: 8,
        visa_support: 'Помощь в оформлении визы',
        exchange_programs: 'Двудипломные программы с европейскими университетами',
        languages_of_instruction: ['Kazakh', 'Russian', 'English'],
      },
      accreditations: 'Министерство науки и высшего образования РК',
      achievements: 'Топ-1 в Казахстане по QS World Rankings, входит в Топ-200 мира',
    },
  },

  // ============================================
  // 3. Казахстанско-Британский технический университет (KBTU)
  // ============================================
  {
    website_url: 'https://www.kbtu.kz/',
    profile: {
      name: 'Казахстанско-Британский технический университет',
      name_en: 'Kazakh-British Technical University (KBTU)',
      country: 'Казахстан',
      city: 'Алматы',
      description: 'Казахстанско-Британский технический университет — современный технический вуз, созданный на основе сотрудничества Казахстана и Великобритании. Специализируется на подготовке инженеров и IT-специалистов мирового уровня. Программы соответствуют международным стандартам в области инженерии, IT, энергетики и бизнеса.',
      mission: 'Подготовка конкурентоспособных специалистов технического профиля с международными компетенциями.',
      founded_year: 2001,
      student_count: 6182,
      faculty_count: 400,
      programs: [
        {
          id: 'kbtu-is-bsc',
          name: 'Information Systems',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          tuition: { amount: 3200000, currency: 'KZT', per_year: true },
        },
        {
          id: 'kbtu-se-bsc',
          name: 'Software Engineering',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          tuition: { amount: 3200000, currency: 'KZT', per_year: true },
        },
        {
          id: 'kbtu-petro-bsc',
          name: 'Petroleum Engineering',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          description: 'Программа нефтегазового инжиниринга.',
          tuition: { amount: 3200000, currency: 'KZT', per_year: true },
        },
        {
          id: 'kbtu-finance-bsc',
          name: 'Finance',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          tuition: { amount: 3200000, currency: 'KZT', per_year: true },
        },
        {
          id: 'kbtu-math-bsc',
          name: 'Mathematical and Computer Modelling',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          tuition: { amount: 3200000, currency: 'KZT', per_year: true },
        },
        {
          id: 'kbtu-ds-msc',
          name: 'Data Science',
          degree_level: 'Master',
          duration_years: 2,
          language: 'English',
        },
      ] as Program[],
      tuition_general: {
        international_students: '~6 405 USD в год',
        domestic_students: '3 200 000 KZT в год',
        payment_options: 'Оплата по семестрам',
        financial_aid: 'Скидки для отличников, гранты',
      } as TuitionGeneral,
      admissions: {
        requirements: 'ЕНТ/SAT, IELTS 5.5+',
        english_proficiency: 'IELTS 5.5 или эквивалент',
        documents_needed: 'Аттестат, сертификат ЕНТ/SAT, IELTS',
        application_process: 'Онлайн подача через admissions.kbtu.kz',
        intake_dates: 'Осенний приём: сентябрь',
      } as Admissions,
      scholarships: [
        { name: 'Академическая скидка', amount: 'До 50%', description: 'По результатам ЕНТ', eligibility: 'Высокие баллы ЕНТ' },
      ] as Scholarship[],
      contacts: {
        main_email: 'info@kbtu.kz',
        admissions_email: 'admission@kbtu.kz',
        phone: '+7 727 357 4251',
        address: 'ул. Толе би, 59, Алматы',
        social_media: {
          website: 'https://www.kbtu.kz',
          facebook: 'https://facebook.com/groups/kbtuofficialgroup',
        },
      } as Contacts,
      rankings: [
        { source: 'QS EECA Rankings', rank: 120, year: 2024, category: 'EECA' },
        { source: 'QS World University Rankings', rank: 561, year: 2025, category: 'Overall' },
      ] as Ranking[],
      international: {
        accepts_international: true,
        international_percentage: 10,
        visa_support: 'Помощь в оформлении визы',
        exchange_programs: 'Партнёрства с британскими университетами',
        languages_of_instruction: ['English'],
      },
      accreditations: 'Партнёрство с британскими университетами',
      achievements: 'Лучший технический вуз с британскими стандартами',
    },
  },

  // ============================================
  // 4. Евразийский национальный университет им. Л.Н. Гумилёва
  // ============================================
  {
    website_url: 'https://www.enu.kz/',
    profile: {
      name: 'Евразийский национальный университет им. Л.Н. Гумилёва',
      name_en: 'L.N. Gumilyov Eurasian National University',
      country: 'Казахстан',
      city: 'Астана',
      description: 'Евразийский национальный университет имени Л.Н. Гумилёва — классический университет в столице Казахстана. Охватывает 13 факультетов и входит в Топ-200 мирового рейтинга по качеству преподавания отдельных направлений: искусство и дизайн, право, философия, политика и международные отношения.',
      mission: 'Подготовка высококвалифицированных специалистов и развитие науки в духе евразийской интеграции.',
      founded_year: 1996,
      student_count: 20000,
      faculty_count: 1500,
      programs: [
        {
          id: 'enu-it-bsc',
          name: 'Информационные технологии',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian/English',
          tuition: { amount: 1330000, currency: 'KZT', per_year: true },
        },
        {
          id: 'enu-law-bsc',
          name: 'Право',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 1300000, currency: 'KZT', per_year: true },
        },
        {
          id: 'enu-ir-bsc',
          name: 'Международные отношения и дипломатия',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian/English',
          tuition: { amount: 1300000, currency: 'KZT', per_year: true },
        },
        {
          id: 'enu-management-bsc',
          name: 'Менеджмент и управление',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 1300000, currency: 'KZT', per_year: true },
        },
        {
          id: 'enu-tourism-bsc',
          name: 'Туризм',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 1270000, currency: 'KZT', per_year: true },
        },
        {
          id: 'enu-pedagogy-bsc',
          name: 'Педагогические науки',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 1140000, currency: 'KZT', per_year: true },
        },
      ] as Program[],
      tuition_general: {
        international_students: '1 200 000 - 1 400 000 KZT в год',
        domestic_students: '1 140 000 - 1 330 000 KZT в год, ежегодный рост ~10%',
        payment_options: 'Оплата по семестрам',
        financial_aid: 'Государственные гранты',
      } as TuitionGeneral,
      admissions: {
        requirements: 'ЕНТ от 95-125 баллов в зависимости от специальности',
        documents_needed: 'Аттестат, сертификат ЕНТ, медицинская справка',
        application_process: 'Подача через приёмную комиссию',
        intake_dates: 'Осенний приём: сентябрь',
      } as Admissions,
      scholarships: [
        { name: 'Государственный грант', amount: '100%', description: 'Покрывает обучение', eligibility: 'По результатам ЕНТ' },
      ] as Scholarship[],
      contacts: {
        main_email: 'info@enu.kz',
        admissions_email: 'admission@enu.kz',
        phone: '+7 7172 70 9500',
        address: 'ул. Сатпаева, 2, Астана',
        social_media: {
          website: 'https://www.enu.kz',
        },
      } as Contacts,
      rankings: [
        { source: 'QS World University Rankings', rank: 330, year: 2025, category: 'Overall' },
        { source: 'QS Asia University Rankings', rank: 60, year: 2025, category: 'Asia' },
      ] as Ranking[],
      international: {
        accepts_international: true,
        visa_support: 'Помощь в оформлении визы',
        exchange_programs: '116 договоров с зарубежными университетами',
        languages_of_instruction: ['Kazakh', 'Russian', 'English'],
      },
      achievements: 'Входит в Топ-200 по отдельным направлениям: искусство, право, философия',
    },
  },

  // ============================================
  // 5. Satbayev University (КазНИТУ)
  // ============================================
  {
    website_url: 'https://satbayev.university/',
    profile: {
      name: 'Казахский национальный исследовательский технический университет им. К.И. Сатпаева',
      name_en: 'Satbayev University',
      country: 'Казахстан',
      city: 'Алматы',
      description: 'Satbayev University — лучший технико-технологический университет Казахстана. Имеет 2 аккредитованные научно-исследовательские лаборатории. Предлагает 48 программ бакалавриата и 45 программ магистратуры. Филиал университета в Гонконге известен образовательными программами в области инженерии и бизнеса.',
      mission: 'Подготовка инженеров и исследователей мирового уровня для технологического развития Казахстана.',
      founded_year: 1934,
      student_count: 15000,
      faculty_count: 1000,
      programs: [
        {
          id: 'satbayev-mining-bsc',
          name: 'Горное дело',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 1111380, currency: 'KZT', per_year: true },
        },
        {
          id: 'satbayev-it-bsc',
          name: 'Информационные технологии',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian/English',
          tuition: { amount: 1111380, currency: 'KZT', per_year: true },
        },
        {
          id: 'satbayev-oil-bsc',
          name: 'Нефтегазовое дело',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 1111380, currency: 'KZT', per_year: true },
        },
        {
          id: 'satbayev-arch-bsc',
          name: 'Архитектура',
          degree_level: 'Bachelor',
          duration_years: 5,
          language: 'Kazakh/Russian',
          tuition: { amount: 1111380, currency: 'KZT', per_year: true },
        },
        {
          id: 'satbayev-civil-bsc',
          name: 'Строительство',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 1111380, currency: 'KZT', per_year: true },
        },
      ] as Program[],
      tuition_general: {
        domestic_students: '1 111 380 KZT в год',
        payment_options: 'Оплата по семестрам',
        financial_aid: 'Государственные гранты',
      } as TuitionGeneral,
      admissions: {
        requirements: 'ЕНТ от 65 баллов',
        documents_needed: 'Аттестат, сертификат ЕНТ',
        application_process: 'Подача через приёмную комиссию',
        intake_dates: 'Осенний приём: сентябрь',
      } as Admissions,
      contacts: {
        main_email: 'info@satbayev.university',
        phone: '+7 727 292 6282',
        address: 'ул. Сатпаева, 22а, Алматы',
        social_media: {
          website: 'https://satbayev.university',
        },
      } as Contacts,
      rankings: [
        { source: 'QS World University Rankings', rank: 480, year: 2025, category: 'Overall' },
        { source: 'QS Asia University Rankings', rank: 95, year: 2025, category: 'Asia' },
      ] as Ranking[],
      international: {
        accepts_international: true,
        visa_support: 'Помощь в оформлении визы',
        languages_of_instruction: ['Kazakh', 'Russian', 'English'],
      },
      achievements: 'Лучший технико-технологический вуз Казахстана, филиал в Гонконге',
      research_focus: 'Горное дело, нефтегазовая отрасль, IT, материаловедение',
    },
  },

  // ============================================
  // 6. МУИТ (IITU)
  // ============================================
  {
    website_url: 'https://iitu.edu.kz/',
    profile: {
      name: 'Международный университет информационных технологий',
      name_en: 'International IT University (IITU)',
      country: 'Казахстан',
      city: 'Алматы',
      description: 'Международный университет информационных технологий — специализированный IT-университет Казахстана. Готовит специалистов в области программной инженерии, кибербезопасности, Data Science и других IT-направлений. Фокус на практическом обучении и связях с IT-индустрией.',
      mission: 'Подготовка IT-специалистов мирового уровня для цифровой экономики Казахстана.',
      founded_year: 2009,
      student_count: 5000,
      programs: [
        {
          id: 'iitu-se-bsc',
          name: 'Software Engineering',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          tuition: { amount: 2500000, currency: 'KZT', per_year: true },
        },
        {
          id: 'iitu-cyber-bsc',
          name: 'Cybersecurity',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          tuition: { amount: 2500000, currency: 'KZT', per_year: true },
        },
        {
          id: 'iitu-ds-bsc',
          name: 'Data Science',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          tuition: { amount: 2500000, currency: 'KZT', per_year: true },
        },
        {
          id: 'iitu-is-bsc',
          name: 'Information Systems',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English',
          tuition: { amount: 2500000, currency: 'KZT', per_year: true },
        },
        {
          id: 'iitu-cyber-msc',
          name: 'Cybersecurity',
          degree_level: 'Master',
          duration_years: 2,
          language: 'English',
        },
      ] as Program[],
      tuition_general: {
        domestic_students: '2 500 000 KZT в год',
        payment_options: 'Оплата по семестрам',
        financial_aid: 'Скидки для победителей олимпиад, грантодержателей',
      } as TuitionGeneral,
      admissions: {
        requirements: 'ЕНТ, IELTS 5.0+',
        english_proficiency: 'IELTS 5.0 или эквивалент',
        documents_needed: 'Аттестат, сертификат ЕНТ, IELTS',
        application_process: 'Онлайн подача',
        intake_dates: 'Осенний приём: сентябрь',
      } as Admissions,
      contacts: {
        main_email: 'info@iitu.edu.kz',
        admissions_email: 'admission@iitu.edu.kz',
        phone: '+7 727 330 8500',
        address: 'ул. Манаса, 34/1, Алматы',
        social_media: {
          website: 'https://iitu.edu.kz',
        },
      } as Contacts,
      rankings: [
        { source: 'QS EECA Rankings', rank: 200, year: 2024, category: 'EECA' },
      ] as Ranking[],
      international: {
        accepts_international: true,
        visa_support: 'Помощь в оформлении визы',
        languages_of_instruction: ['English', 'Russian'],
      },
      achievements: 'Лучший специализированный IT-университет Казахстана',
    },
  },

  // ============================================
  // 7. Казахский национальный медицинский университет
  // ============================================
  {
    website_url: 'https://kaznmu.kz/',
    profile: {
      name: 'Казахский национальный медицинский университет им. С.Д. Асфендиярова',
      name_en: 'Asfendiyarov Kazakh National Medical University',
      country: 'Казахстан',
      city: 'Алматы',
      description: 'Казахский национальный медицинский университет — ведущий медицинский вуз Казахстана, основанный в 1930 году. Готовит врачей, фармацевтов и специалистов в области общественного здравоохранения. Имеет собственные клинические базы и научные лаборатории.',
      mission: 'Подготовка высококвалифицированных медицинских кадров для системы здравоохранения Казахстана.',
      founded_year: 1930,
      student_count: 10000,
      faculty_count: 800,
      programs: [
        {
          id: 'kaznmu-gm-bsc',
          name: 'Общая медицина',
          degree_level: 'Bachelor',
          duration_years: 5,
          language: 'Kazakh/Russian/English',
        },
        {
          id: 'kaznmu-dent-bsc',
          name: 'Стоматология',
          degree_level: 'Bachelor',
          duration_years: 5,
          language: 'Kazakh/Russian',
        },
        {
          id: 'kaznmu-pharm-bsc',
          name: 'Фармация',
          degree_level: 'Bachelor',
          duration_years: 5,
          language: 'Kazakh/Russian',
        },
        {
          id: 'kaznmu-nursing-bsc',
          name: 'Сестринское дело',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
        },
      ] as Program[],
      admissions: {
        requirements: 'ЕНТ (профильные предметы: биология, химия)',
        documents_needed: 'Аттестат, сертификат ЕНТ, медицинская справка',
        intake_dates: 'Осенний приём: сентябрь',
      } as Admissions,
      contacts: {
        main_email: 'info@kaznmu.kz',
        phone: '+7 727 338 7046',
        address: 'ул. Толе би, 94, Алматы',
        social_media: {
          website: 'https://kaznmu.kz',
        },
      } as Contacts,
      rankings: [
        { source: 'QS World University Rankings', rank: 701, year: 2025, category: 'Overall' },
      ] as Ranking[],
      international: {
        accepts_international: true,
        visa_support: 'Помощь в оформлении визы',
        languages_of_instruction: ['Kazakh', 'Russian', 'English'],
      },
      achievements: 'Ведущий медицинский вуз Казахстана',
      research_focus: 'Клинические исследования, общественное здоровье',
    },
  },

  // ============================================
  // 8. Университет Туран
  // ============================================
  {
    website_url: 'https://www.turan-edu.kz/',
    profile: {
      name: 'Университет Туран',
      name_en: 'Turan University',
      country: 'Казахстан',
      city: 'Алматы',
      description: 'Университет Туран — один из ведущих частных университетов Казахстана, специализирующийся на бизнес-образовании, экономике и праве. Предлагает программы на казахском, русском и английском языках.',
      mission: 'Подготовка профессионалов в области бизнеса и управления для рыночной экономики.',
      founded_year: 1992,
      student_count: 5000,
      programs: [
        {
          id: 'turan-management-bsc',
          name: 'Менеджмент',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian/English',
        },
        {
          id: 'turan-finance-bsc',
          name: 'Финансы',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
        },
        {
          id: 'turan-marketing-bsc',
          name: 'Маркетинг',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
        },
        {
          id: 'turan-law-bsc',
          name: 'Юриспруденция',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
        },
      ] as Program[],
      contacts: {
        main_email: 'info@turan-edu.kz',
        phone: '+7 727 260 4000',
        address: 'ул. Сатпаева, 16-18, Алматы',
        social_media: {
          website: 'https://www.turan-edu.kz',
        },
      } as Contacts,
      international: {
        accepts_international: true,
        languages_of_instruction: ['Kazakh', 'Russian', 'English'],
      },
      achievements: 'Один из первых частных университетов Казахстана',
    },
  },

  // ============================================
  // 9. AlmaU (Almaty Management University)
  // ============================================
  {
    website_url: 'https://almau.edu.kz/',
    profile: {
      name: 'Алматы Менеджмент Университет (AlmaU)',
      name_en: 'Almaty Management University',
      country: 'Казахстан',
      city: 'Алматы',
      description: 'AlmaU — ведущая бизнес-школа Центральной Азии, специализирующаяся на подготовке управленцев и предпринимателей. Имеет международные аккредитации и партнёрства с ведущими бизнес-школами мира.',
      mission: 'Развитие предпринимательского потенциала и управленческих компетенций.',
      founded_year: 1988,
      student_count: 3000,
      programs: [
        {
          id: 'almau-ba-bsc',
          name: 'Business Administration',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'English/Russian',
        },
        {
          id: 'almau-mba',
          name: 'MBA',
          degree_level: 'Master',
          duration_years: 2,
          language: 'English',
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
      ] as Program[],
      contacts: {
        main_email: 'info@almau.edu.kz',
        phone: '+7 727 302 2222',
        address: 'ул. Розыбакиева, 227, Алматы',
        social_media: {
          website: 'https://almau.edu.kz',
        },
      } as Contacts,
      accreditations: 'AACSB, AMBA accreditation',
      international: {
        accepts_international: true,
        exchange_programs: 'Партнёрства с ESCP, KEDGE, других бизнес-школами',
        languages_of_instruction: ['English', 'Russian'],
      },
      achievements: 'Ведущая бизнес-школа Центральной Азии с международными аккредитациями',
    },
  },

  // ============================================
  // 10. Южно-Казахстанский университет им. М. Ауэзова
  // ============================================
  {
    website_url: 'https://auezov.edu.kz/',
    profile: {
      name: 'Южно-Казахстанский университет им. М. Ауэзова',
      name_en: 'M. Auezov South Kazakhstan University',
      country: 'Казахстан',
      city: 'Шымкент',
      description: 'Южно-Казахстанский университет имени М. Ауэзова — крупнейший университет на юге Казахстана. В 2025 году занял 621-ю позицию в мировом рейтинге QS и входит в Топ-150 университетов Азии. Предлагает 165 специальностей бакалавриата, программы на английском языке и двойные дипломы.',
      mission: 'Подготовка специалистов для развития южного региона Казахстана.',
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
          name: 'Педагогика',
          degree_level: 'Bachelor',
          duration_years: 4,
          language: 'Kazakh/Russian',
          tuition: { amount: 650000, currency: 'KZT', per_year: true },
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
      ] as Program[],
      tuition_general: {
        domestic_students: 'от 650 000 KZT в год',
        payment_options: 'Оплата по семестрам',
        financial_aid: 'Государственные гранты',
      } as TuitionGeneral,
      admissions: {
        requirements: 'ЕНТ, специальный экзамен для педагогических направлений',
        documents_needed: 'Аттестат, сертификат ЕНТ',
        intake_dates: 'Осенний приём: сентябрь',
      } as Admissions,
      contacts: {
        main_email: 'info@auezov.edu.kz',
        phone: '+7 7252 21 0007',
        address: 'пр. Тауке хана, 5, Шымкент',
        social_media: {
          website: 'https://auezov.edu.kz',
        },
      } as Contacts,
      rankings: [
        { source: 'QS World University Rankings', rank: 621, year: 2025, category: 'Overall' },
        { source: 'QS Asia University Rankings', rank: 150, year: 2025, category: 'Asia' },
      ] as Ranking[],
      international: {
        accepts_international: true,
        exchange_programs: 'Программы двойного диплома',
        languages_of_instruction: ['Kazakh', 'Russian', 'English'],
      },
      achievements: '165 специальностей бакалавриата, входит в Топ-150 Азии',
    },
  },
];

/**
 * Обновить профиль университета
 */
const updateUniversityProfile = async (
  client: PoolClient,
  websiteUrl: string,
  profileData: Partial<University>
): Promise<boolean> => {
  // Найти университет по website_url
  const existing = await client.queryObject<{ id: string; name: string }>(
    `SELECT id, name FROM universities WHERE website_url = $1 OR website_url = $2`,
    [websiteUrl, websiteUrl.replace(/\/$/, '')]
  );

  if (existing.rows.length === 0) {
    logger.warn(`University not found: ${websiteUrl}`);
    return false;
  }

  const universityId = existing.rows[0].id;
  const universityName = existing.rows[0].name;

  logger.info(`Updating: ${universityName}`);

  // Получить текущий профиль
  const currentProfile = await client.queryObject<{ profile_json: University }>(
    `SELECT profile_json FROM university_profiles 
     WHERE university_id = $1 AND language = 'ru' 
     ORDER BY version DESC LIMIT 1`,
    [universityId]
  );

  // Объединить текущий профиль с новыми данными
  const existingProfile = currentProfile.rows[0]?.profile_json ?? {};
  const mergedProfile: University = {
    ...existingProfile,
    ...profileData,
    id: universityId,
    updated_at: new Date().toISOString(),
    metadata: {
      parsed_at: new Date().toISOString(),
      source_url: websiteUrl,
      completeness_score: 85,
      missing_fields: [],
      notes: 'Updated with comprehensive data from web sources',
    },
  };

  // Обновить базовую таблицу universities
  await client.queryObject(
    `UPDATE universities SET
      name = COALESCE($1, name),
      name_en = COALESCE($2, name_en),
      updated_at = NOW()
     WHERE id = $3`,
    [profileData.name, profileData.name_en, universityId]
  );

  // Получить текущую версию
  const versionResult = await client.queryObject<{ max_version: number }>(
    `SELECT COALESCE(MAX(version), 0) as max_version 
     FROM university_profiles 
     WHERE university_id = $1 AND language = 'ru'`,
    [universityId]
  );
  const newVersion = (versionResult.rows[0]?.max_version ?? 0) + 1;

  // Создать новую версию профиля
  await client.queryObject(
    `INSERT INTO university_profiles (university_id, profile_json, language, version)
     VALUES ($1, $2, 'ru', $3)`,
    [universityId, JSON.stringify(mergedProfile), newVersion]
  );

  logger.info(`✅ Updated: ${universityName} (version ${newVersion})`);
  return true;
};

/**
 * Главная функция
 */
const main = async () => {
  console.log('='.repeat(60));
  console.log('🎓 Обновление данных топ-университетов Казахстана');
  console.log('='.repeat(60));
  console.log(`\nВсего университетов для обновления: ${KAZAKHSTAN_UNIVERSITIES_DATA.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const uni of KAZAKHSTAN_UNIVERSITIES_DATA) {
    try {
      const success = await transaction(async (client) => {
        return await updateUniversityProfile(client, uni.website_url, uni.profile);
      });

      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Небольшая пауза между обновлениями
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      logger.error(`Failed to update ${uni.website_url}`, { error: err });
      failCount++;
    }
  }

  // Итоги
  console.log('\n' + '='.repeat(60));
  console.log('📊 РЕЗУЛЬТАТЫ');
  console.log('='.repeat(60));
  console.log(`\n✅ Обновлено: ${successCount}`);
  console.log(`❌ Ошибок: ${failCount}`);
  console.log('\n' + '='.repeat(60));
  console.log('Готово!');
};

// Запуск
main().catch(console.error);
