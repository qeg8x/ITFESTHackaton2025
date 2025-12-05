import { logger } from './logger.ts';

/**
 * HTML теги которые нужно полностью удалить вместе с содержимым
 */
const REMOVE_TAGS_WITH_CONTENT = [
  'script',
  'style',
  'noscript',
  'iframe',
  'svg',
  'canvas',
  'video',
  'audio',
  'nav',
  'footer',
  'header',
  'aside',
  'form',
  'button',
  'input',
  'select',
  'textarea',
];

/**
 * Удалить HTML теги вместе с содержимым
 * @param html - исходный HTML
 * @param tags - теги для удаления
 * @returns очищенный HTML
 */
const removeTagsWithContent = (html: string, tags: string[]): string => {
  let result = html;
  
  for (const tag of tags) {
    // Удаляем открывающий и закрывающий тег с содержимым
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    result = result.replace(regex, '');
    
    // Удаляем самозакрывающиеся теги
    const selfClosingRegex = new RegExp(`<${tag}[^>]*\\/?>`, 'gi');
    result = result.replace(selfClosingRegex, '');
  }
  
  return result;
};

/**
 * Удалить все HTML теги, оставив только текст
 * @param html - HTML строка
 * @returns чистый текст
 */
export const stripHtmlTags = (html: string): string => {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ');
};

/**
 * Нормализовать текст
 * @param text - исходный текст
 * @returns нормализованный текст
 */
export const normalizeText = (text: string): string => {
  return text
    // Убрать множественные пробелы
    .replace(/[ \t]+/g, ' ')
    // Убрать множественные переносы строк
    .replace(/\n{3,}/g, '\n\n')
    // Убрать пробелы в начале и конце строк
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    // Убрать пустые строки в начале и конце
    .trim();
};

/**
 * Извлечь основной контент из HTML (попытка найти main/article/content)
 * @param html - полный HTML
 * @returns HTML основного контента
 */
export const extractMainContent = (html: string): string => {
  // Попробовать найти main контент
  const mainPatterns = [
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*main[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of mainPatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].length > 500) {
      logger.debug('Found main content via pattern');
      return match[1];
    }
  }

  // Если не нашли - вернуть body или весь HTML
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
};

/**
 * Конвертировать HTML в Markdown
 * @param html - HTML строка
 * @returns Markdown строка
 */
export const htmlToMarkdown = (html: string): string => {
  logger.debug('Converting HTML to Markdown', { htmlLength: html.length });

  try {
    // 1. Извлечь основной контент
    let content = extractMainContent(html);

    // 2. Удалить теги с содержимым
    content = removeTagsWithContent(content, REMOVE_TAGS_WITH_CONTENT);

    // 3. Конвертировать заголовки
    content = content
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
      .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n')
      .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n##### $1\n')
      .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n###### $1\n');

    // 4. Конвертировать параграфы
    content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');

    // 5. Конвертировать переносы строк
    content = content.replace(/<br\s*\/?>/gi, '\n');

    // 6. Конвертировать списки
    content = content
      .replace(/<ul[^>]*>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '\n')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');

    // 7. Конвертировать ссылки
    content = content.replace(
      /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
      '[$2]($1)'
    );

    // 8. Конвертировать жирный и курсив
    content = content
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');

    // 9. Конвертировать таблицы (базово)
    content = content
      .replace(/<table[^>]*>/gi, '\n')
      .replace(/<\/table>/gi, '\n')
      .replace(/<tr[^>]*>/gi, '| ')
      .replace(/<\/tr>/gi, ' |\n')
      .replace(/<th[^>]*>([\s\S]*?)<\/th>/gi, '$1 | ')
      .replace(/<td[^>]*>([\s\S]*?)<\/td>/gi, '$1 | ');

    // 10. Удалить оставшиеся теги
    content = stripHtmlTags(content);

    // 11. Нормализовать текст
    content = normalizeText(content);

    // 12. Ограничить длину (для LLM)
    const maxLength = 15000;
    if (content.length > maxLength) {
      logger.warn('Content too long, truncating', {
        original: content.length,
        truncated: maxLength,
      });
      content = content.substring(0, maxLength) + '\n\n[... content truncated ...]';
    }

    logger.debug('HTML converted to Markdown', { markdownLength: content.length });

    return content;
  } catch (err) {
    logger.error('Failed to convert HTML to Markdown', err);
    throw err;
  }
};

/**
 * Вычислить SHA-256 хэш строки
 * @param text - строка для хэширования
 * @returns hex строка хэша
 */
export const computeHash = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};
