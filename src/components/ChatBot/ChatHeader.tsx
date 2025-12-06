/**
 * Шапка чата
 */

interface ChatHeaderProps {
  onClear: () => void;
  language?: string;
}

/**
 * Header чат-окна
 */
export const ChatHeader = ({ onClear, language = 'ru' }: ChatHeaderProps) => {
  const title = language === 'ru'
    ? 'Чат-помощник'
    : language === 'kk'
    ? 'Чат көмекші'
    : 'Chat Assistant';

  const subtitle = language === 'ru'
    ? 'Спросите меня об университетах'
    : language === 'kk'
    ? 'Университеттер туралы сұраңыз'
    : 'Ask me about universities';

  const clearText = language === 'ru'
    ? 'Очистить'
    : language === 'kk'
    ? 'Тазалау'
    : 'Clear';

  return (
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg">
          🎓
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">{title}</h3>
          <p class="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        class="text-sm text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
      >
        {clearText}
      </button>
    </div>
  );
};

export default ChatHeader;
