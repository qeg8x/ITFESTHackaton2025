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
    <div class="flex items-center justify-between px-4 py-3 border-b border-dark-600 bg-dark-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-cyber-500 to-neon-500 rounded-full flex items-center justify-center text-dark-900 text-lg">
          🎓
        </div>
        <div>
          <h3 class="font-semibold text-white">{title}</h3>
          <p class="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        class="text-sm text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
      >
        {clearText}
      </button>
    </div>
  );
};

export default ChatHeader;
