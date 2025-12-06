/**
 * Batch-процессор для массового сканирования 3D-туров
 */

import { query } from '../../../lib/db.ts';
import { getWebScraperService } from './web-scraper.service.ts';
import { getOllamaService } from './ollama.service.ts';
import { getLinkValidatorService } from './link-validator.service.ts';
import { getTourService } from '../tour.service.ts';
import type { ThreeDTourProvider, ThreeDTourSource } from '../../types/university.ts';

/**
 * Результат обработки университета
 */
export interface ProcessingResult {
  universityId: string;
  universityName: string;
  status: 'success' | 'no_tours' | 'no_valid_tours' | 'failed';
  toursFound: number;
  sources: ThreeDTourProvider[];
  error?: string;
}

/**
 * Результат batch-обработки
 */
export interface BatchResult {
  total: number;
  successful: number;
  failed: number;
  noTours: number;
  results: ProcessingResult[];
  startTime: Date;
  endTime: Date;
  durationMs: number;
}

/**
 * Университет из БД
 */
interface UniversityRecord {
  id: string;
  name: string;
  website_url: string;
  city?: string;
  country?: string;
}

/**
 * Batch-процессор для сканирования туров
 */
export class BatchProcessorService {
  private scraper = getWebScraperService();
  private ollama = getOllamaService();
  private validator = getLinkValidatorService();
  private tourService = getTourService();

  /**
   * Обработать все университеты
   */
  async processAll(options?: {
    limit?: number;
    skipExisting?: boolean;
    useAI?: boolean;
  }): Promise<BatchResult> {
    const startTime = new Date();
    const limit = options?.limit || 100;
    const skipExisting = options?.skipExisting ?? true;
    const useAI = options?.useAI ?? true;

    console.log('🎬 Начинаю поиск 3D-туров...');
    console.log(`📊 Лимит: ${limit}, Пропуск существующих: ${skipExisting}, AI: ${useAI}`);
    console.log('═'.repeat(60));

    // Получить университеты
    let queryText = `
      SELECT id, name, website_url, city, country 
      FROM universities 
      WHERE is_active = true
    `;

    if (skipExisting) {
      queryText += ` AND ("3d_tour" IS NULL OR jsonb_array_length("3d_tour"->'available_sources') = 0)`;
    }

    queryText += ` ORDER BY name LIMIT $1`;

    const universities = await query<UniversityRecord>(queryText, [limit]);

    console.log(`📋 Найдено университетов для обработки: ${universities.length}\n`);

    const results: ProcessingResult[] = [];
    let successful = 0;
    let failed = 0;
    let noTours = 0;

    for (let i = 0; i < universities.length; i++) {
      const uni = universities[i];
      console.log(`\n[${i + 1}/${universities.length}] ${uni.name}`);
      console.log('─'.repeat(50));

      try {
        const result = await this.processUniversity(uni, useAI);
        results.push(result);

        if (result.status === 'success') {
          successful++;
          console.log(`✅ Найдено ${result.toursFound} туров: ${result.sources.join(', ')}`);
        } else if (result.status === 'no_tours' || result.status === 'no_valid_tours') {
          noTours++;
          console.log(`⚠️  Туры не найдены`);
        } else {
          failed++;
          console.log(`❌ Ошибка: ${result.error}`);
        }

        // Пауза между университетами
        if (i < universities.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          universityId: uni.id,
          universityName: uni.name,
          status: 'failed',
          toursFound: 0,
          sources: [],
          error: errorMsg,
        });
        console.log(`❌ Ошибка: ${errorMsg}`);
      }
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    console.log('\n' + '═'.repeat(60));
    console.log('✅ ОБРАБОТКА ЗАВЕРШЕНА!');
    console.log('═'.repeat(60));
    console.log(`📊 Результаты:`);
    console.log(`   Всего: ${universities.length}`);
    console.log(`   Успешно: ${successful}`);
    console.log(`   Без туров: ${noTours}`);
    console.log(`   Ошибок: ${failed}`);
    console.log(`   Время: ${Math.round(durationMs / 1000)} сек`);

    return {
      total: universities.length,
      successful,
      failed,
      noTours,
      results,
      startTime,
      endTime,
      durationMs,
    };
  }

  /**
   * Обработать один университет
   */
  async processUniversity(
    university: UniversityRecord,
    useAI: boolean = true
  ): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      universityId: university.id,
      universityName: university.name,
      status: 'failed',
      toursFound: 0,
      sources: [],
    };

    try {
      // 1. Скрейпинг сайта
      console.log('   🔍 Скрейпинг сайта...');
      let html: string;
      try {
        html = await this.scraper.fetchPage(university.website_url);
      } catch (error) {
        result.error = `Не удалось загрузить сайт: ${error instanceof Error ? error.message : 'Unknown'}`;
        return result;
      }

      // 2. Поиск ссылок на карты (регулярками)
      console.log('   🔗 Поиск ссылок на карты...');
      const mapUrls = this.scraper.findMapUrls(html);

      // 3. AI анализ (опционально)
      let aiTours: Array<{
        url: string;
        source: ThreeDTourProvider | 'other';
        latitude?: number;
        longitude?: number;
      }> = [];

      if (useAI) {
        console.log('   🤖 AI анализ...');
        const ollamaAvailable = await this.ollama.checkAvailability();
        
        if (ollamaAvailable) {
          const aiResult = await this.ollama.findTourLinks(html, university.name);
          aiTours = aiResult.found_tours
            .filter(t => t.source !== 'other')
            .map(t => ({
              url: t.url,
              source: t.source as ThreeDTourProvider,
              latitude: t.latitude,
              longitude: t.longitude,
            }));
        } else {
          console.log('   ⚠️  Ollama недоступна, используем только regex');
        }
      }

      // 4. Объединить результаты
      const allUrls = [
        ...mapUrls.filter(u => u.source !== 'other').map(u => ({
          url: u.url,
          source: u.source as ThreeDTourProvider,
        })),
        ...aiTours.filter(t => t.source !== 'other'),
      ];

      // Убрать дубликаты
      const uniqueUrls = Array.from(
        new Map(allUrls.map(u => [u.url, u])).values()
      );

      if (uniqueUrls.length === 0) {
        result.status = 'no_tours';
        return result;
      }

      console.log(`   📋 Найдено ${uniqueUrls.length} потенциальных ссылок`);

      // 5. Валидация ссылок
      console.log('   ✓ Валидация ссылок...');
      const validated = await this.validator.filterValidLinks(uniqueUrls);

      if (validated.length === 0) {
        result.status = 'no_valid_tours';
        return result;
      }

      console.log(`   ✅ Валидных ссылок: ${validated.length}`);

      // 6. Извлечь координаты
      for (const link of validated) {
        if (!link.latitude || !link.longitude) {
          const coords = await this.ollama.extractCoordinates(link.url);
          if (coords) {
            link.latitude = coords.lat;
            link.longitude = coords.lng;
          }
        }
      }

      // 7. Сохранить в БД
      console.log('   💾 Сохранение в БД...');
      
      const googleTour = validated.find(v => v.source === 'google');
      const yandexTour = validated.find(v => v.source === 'yandex');
      const twogisTour = validated.find(v => v.source === '2gis');

      const tourData: {
        google_maps?: ThreeDTourSource;
        yandex_panorama?: ThreeDTourSource;
        twogis?: ThreeDTourSource;
      } = {};

      if (googleTour) {
        tourData.google_maps = {
          source: 'google',
          url: googleTour.url,
          latitude: googleTour.latitude || 0,
          longitude: googleTour.longitude || 0,
          available: true,
          last_validated: new Date(),
        };
      }

      if (yandexTour) {
        tourData.yandex_panorama = {
          source: 'yandex',
          url: yandexTour.url,
          latitude: yandexTour.latitude || 0,
          longitude: yandexTour.longitude || 0,
          available: true,
          last_validated: new Date(),
        };
      }

      if (twogisTour) {
        tourData.twogis = {
          source: '2gis',
          url: twogisTour.url,
          latitude: twogisTour.latitude || 0,
          longitude: twogisTour.longitude || 0,
          available: true,
          last_validated: new Date(),
        };
      }

      await this.tourService.updateTour(university.id, tourData as Partial<import('../../types/university.ts').UniversityThreeDTour>);

      result.status = 'success';
      result.toursFound = validated.length;
      result.sources = [...new Set(validated.map(v => v.source as ThreeDTourProvider))];

      return result;
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  /**
   * Сгенерировать отчёт
   */
  generateReport(batchResult: BatchResult): string {
    const lines: string[] = [
      '# 🎬 Отчёт по сканированию 3D-туров',
      '',
      `**Дата:** ${batchResult.startTime.toLocaleString('ru-RU')}`,
      `**Длительность:** ${Math.round(batchResult.durationMs / 1000)} секунд`,
      '',
      '## 📊 Статистика',
      '',
      `| Метрика | Значение |`,
      `|---------|----------|`,
      `| Всего обработано | ${batchResult.total} |`,
      `| Успешно | ${batchResult.successful} |`,
      `| Без туров | ${batchResult.noTours} |`,
      `| Ошибки | ${batchResult.failed} |`,
      '',
      '## 📋 Детальные результаты',
      '',
      '| # | Университет | Статус | Источники |',
      '|---|-------------|--------|-----------|',
    ];

    batchResult.results.forEach((r, i) => {
      const status = r.status === 'success' ? '✅' : r.status === 'failed' ? '❌' : '⚠️';
      const sources = r.sources.length > 0 ? r.sources.join(', ') : '—';
      lines.push(`| ${i + 1} | ${r.universityName} | ${status} | ${sources} |`);
    });

    lines.push('');
    lines.push('---');
    lines.push('*Сгенерировано автоматически*');

    return lines.join('\n');
  }
}

// Singleton instance
let processorInstance: BatchProcessorService | null = null;

/**
 * Получить экземпляр процессора
 */
export const getBatchProcessorService = (): BatchProcessorService => {
  if (!processorInstance) {
    processorInstance = new BatchProcessorService();
  }
  return processorInstance;
};
