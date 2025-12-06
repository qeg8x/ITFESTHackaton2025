/**
 * Скрипт обновления логотипов университетов
 * Запуск: ~/.deno/bin/deno run -A scripts/update-logos.ts
 */

import 'https://deno.land/std@0.208.0/dotenv/load.ts';
import { query } from '../src/config/database.ts';
import { logger } from '../src/utils/logger.ts';

/**
 * Маппинг университетов и их логотипов
 */
const UNIVERSITY_LOGOS: Record<string, string> = {
  // Казахстанские университеты
  'https://www.kaznu.kz/': 'https://www.kaznu.kz/content/images/logo.png',
  'https://nu.edu.kz/': 'https://nu.edu.kz/wp-content/themes/flavor/assets/images/logo.svg',
  'https://www.kbtu.kz/': 'https://kbtu.kz/images/logo.svg',
  'https://www.enu.kz/': 'https://www.enu.kz/images/logo.png',
  'https://satbayev.university/': 'https://satbayev.university/storage/pages/December2021/logo-satbayev.png',
  'https://kaznmu.kz/': 'https://kaznmu.kz/wp-content/uploads/2020/07/logo.png',
  'https://iitu.edu.kz/': 'https://iitu.edu.kz/wp-content/themes/flavor/assets/images/logo.svg',
  'https://www.turan-edu.kz/': 'https://www.turan-edu.kz/images/logo.png',
  'https://almau.edu.kz/': 'https://almau.edu.kz/wp-content/uploads/2023/01/logo.png',
  'https://auezov.edu.kz/': 'https://auezov.edu.kz/images/logo.png',
  
  // Мировые университеты
  'https://www.cam.ac.uk/': 'https://www.cam.ac.uk/sites/www.cam.ac.uk/files/logo.svg',
  'https://www.nus.edu.sg/': 'https://www.nus.edu.sg/images/default-source/logo/nus-logo.png',
};

/**
 * Главная функция
 */
const main = async () => {
  console.log('='.repeat(60));
  console.log('🖼️  Обновление логотипов университетов');
  console.log('='.repeat(60));

  let updatedCount = 0;

  for (const [websiteUrl, logoUrl] of Object.entries(UNIVERSITY_LOGOS)) {
    try {
      const result = await query<{ name: string }>(
        `UPDATE universities 
         SET logo_url = $1, updated_at = NOW() 
         WHERE website_url = $2 AND (logo_url IS NULL OR logo_url = '')
         RETURNING name`,
        [logoUrl, websiteUrl]
      );

      if (result.length > 0) {
        logger.info(`✅ Updated logo for: ${result[0].name}`);
        updatedCount++;
      }
    } catch (err) {
      logger.error(`Failed to update logo for ${websiteUrl}`, { error: err });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Обновлено логотипов: ${updatedCount}`);
  console.log('='.repeat(60));
};

main().catch(console.error);
