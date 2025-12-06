/**
 * Скрипт для применения SQL миграций
 */

import 'https://deno.land/std@0.208.0/dotenv/load.ts';
import { query } from '../src/config/database.ts';

const migrationFile = Deno.args[0] || 'sql/007_extend_translations.sql';

console.log(`📦 Применение миграции: ${migrationFile}`);

try {
  // Читаем SQL файл
  const sql = await Deno.readTextFile(migrationFile);
  
  // Разбиваем на отдельные команды (по точке с запятой)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Найдено ${statements.length} команд\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    // Пропускаем комментарии
    if (stmt.startsWith('--') || stmt.startsWith('/*')) continue;
    
    try {
      await query(stmt);
      console.log(`✅ [${i + 1}/${statements.length}] OK`);
    } catch (err) {
      // Игнорируем ошибки "уже существует"
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('already exists') || errMsg.includes('уже существует')) {
        console.log(`⏭️  [${i + 1}/${statements.length}] Уже существует, пропускаем`);
      } else {
        console.error(`❌ [${i + 1}/${statements.length}] Ошибка:`, errMsg);
        console.error(`   SQL: ${stmt.substring(0, 100)}...`);
      }
    }
  }

  console.log('\n✅ Миграция завершена!');
  Deno.exit(0);
} catch (err) {
  console.error('❌ Ошибка чтения файла:', err);
  Deno.exit(1);
}
