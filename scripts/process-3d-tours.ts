#!/usr/bin/env -S deno run --allow-all

/**
 * Скрипт для массового сканирования 3D-туров университетов
 * 
 * Использование:
 *   deno run --allow-all scripts/process-3d-tours.ts
 *   deno run --allow-all scripts/process-3d-tours.ts --limit=10
 *   deno run --allow-all scripts/process-3d-tours.ts --no-ai
 *   deno run --allow-all scripts/process-3d-tours.ts --include-existing
 */

import { getBatchProcessorService } from '../src/services/tour-scanner/batch-processor.service.ts';

/**
 * Парсинг аргументов командной строки
 */
const parseArgs = (): {
  limit: number;
  skipExisting: boolean;
  useAI: boolean;
  help: boolean;
} => {
  const args = Deno.args;
  
  let limit = 50;
  let skipExisting = true;
  let useAI = true;
  let help = false;

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--no-ai') {
      useAI = false;
    } else if (arg === '--include-existing') {
      skipExisting = false;
    }
  }

  return { limit, skipExisting, useAI, help };
};

/**
 * Вывод справки
 */
const showHelp = () => {
  console.log(`
🎬 Сканер 3D-туров университетов

Использование:
  deno run --allow-all scripts/process-3d-tours.ts [опции]

Опции:
  --limit=N           Лимит университетов для обработки (по умолчанию: 50)
  --no-ai             Отключить AI анализ (только regex)
  --include-existing  Обрабатывать университеты с существующими турами
  --help, -h          Показать эту справку

Примеры:
  deno run --allow-all scripts/process-3d-tours.ts --limit=10
  deno run --allow-all scripts/process-3d-tours.ts --no-ai --limit=5

Требования:
  - DATABASE_URL в переменных окружения
  - Ollama запущена на localhost:11434 (для AI режима)
`);
};

/**
 * Главная функция
 */
const main = async () => {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    Deno.exit(0);
  }

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        🎬 СКАНЕР 3D-ТУРОВ УНИВЕРСИТЕТОВ                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Проверить DATABASE_URL
  const dbUrl = Deno.env.get('DATABASE_URL');
  if (!dbUrl) {
    console.error('❌ ERROR: DATABASE_URL не установлен');
    console.error('   Установите переменную окружения DATABASE_URL');
    Deno.exit(1);
  }

  console.log('✅ DATABASE_URL установлен');

  // Проверить Ollama (если используется AI)
  if (options.useAI) {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        console.log('✅ Ollama доступна');
      } else {
        console.log('⚠️  Ollama недоступна, AI анализ будет пропущен');
        options.useAI = false;
      }
    } catch {
      console.log('⚠️  Ollama недоступна, AI анализ будет пропущен');
      options.useAI = false;
    }
  }

  console.log('');

  try {
    const processor = getBatchProcessorService();
    
    const result = await processor.processAll({
      limit: options.limit,
      skipExisting: options.skipExisting,
      useAI: options.useAI,
    });

    // Сохранить отчёт
    const report = processor.generateReport(result);
    const reportPath = `docs/3D_TOUR_RESULTS_${new Date().toISOString().split('T')[0]}.md`;
    
    try {
      await Deno.writeTextFile(reportPath, report);
      console.log(`\n📄 Отчёт сохранён: ${reportPath}`);
    } catch {
      console.log('\n📄 Отчёт:');
      console.log(report);
    }

    console.log('\n✨ Обработка завершена!');
    Deno.exit(result.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error);
    Deno.exit(1);
  }
};

// Запуск
await main();
