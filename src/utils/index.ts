/**
 * Экспорт утилит
 */

export {
  logger,
  log,
  debug,
  info,
  warn,
  error,
  type LogLevel,
} from './logger.ts';

export {
  htmlToMarkdown,
  stripHtmlTags,
  normalizeText,
  extractMainContent,
  computeHash,
} from './markdown.converter.ts';

export {
  callOllama,
  callOllamaForJson,
  checkOllamaHealth,
  getAvailableModels,
  OllamaError,
} from './ollama.client.ts';
