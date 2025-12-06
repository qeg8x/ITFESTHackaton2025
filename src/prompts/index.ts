/**
 * Модуль загрузки промптов для Ollama
 */

import { logger } from '../utils/logger.ts';

/**
 * Путь к файлам промптов
 */
const PROMPTS_DIR = new URL('.', import.meta.url).pathname;

/**
 * Кэш загруженных промптов
 */
const promptCache = new Map<string, string>();

/**
 * Загрузить промпт из файла
 * @param name - имя промпта (без расширения)
 * @returns текст промпта
 */
export const loadPrompt = async (name: string): Promise<string> => {
  // Проверить кэш
  if (promptCache.has(name)) {
    return promptCache.get(name)!;
  }
  
  const filePath = `${PROMPTS_DIR}${name}.prompt.md`;
  
  try {
    const content = await Deno.readTextFile(filePath);
    promptCache.set(name, content);
    logger.debug('Prompt loaded', { name, length: content.length });
    return content;
  } catch (err) {
    logger.error('Failed to load prompt', { name, filePath, error: err });
    throw new Error(`Prompt "${name}" not found at ${filePath}`);
  }
};

/**
 * Получить промпт для парсинга университетов (v2)
 */
export const getUniversityParserPrompt = async (): Promise<string> => {
  return await loadPrompt('university-parser-v2');
};

/**
 * Создать полный промпт с контекстом сайта
 * @param websiteContent - контент сайта (markdown)
 * @param sourceUrl - URL источника
 * @returns готовый промпт для Ollama
 */
export const buildParserPrompt = async (
  websiteContent: string,
  sourceUrl: string
): Promise<string> => {
  const basePrompt = await getUniversityParserPrompt();
  
  return `${basePrompt}

---
SOURCE URL: ${sourceUrl}
WEBSITE CONTENT TO PARSE:
---

${websiteContent}

---
END OF WEBSITE CONTENT

Return ONLY valid JSON based on the content above:`;
};

/**
 * Очистить кэш промптов
 */
export const clearPromptCache = (): void => {
  promptCache.clear();
  logger.debug('Prompt cache cleared');
};
