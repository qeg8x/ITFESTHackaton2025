/**
 * Компонент поля ввода чата
 */

import { useRef, useEffect } from 'preact/hooks';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  language?: string;
}

/**
 * Поле ввода сообщения
 */
export const ChatInput = ({
  value,
  onChange,
  onSend,
  disabled = false,
  language = 'ru',
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Placeholder по языку
  const placeholder = language === 'ru'
    ? 'Задайте вопрос об университетах...'
    : language === 'kk'
    ? 'Университеттер туралы сұрақ қойыңыз...'
    : 'Ask about universities...';

  // Автоизменение высоты textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  // Обработка клавиш
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div class="border-t border-gray-200 p-3 bg-white">
      <div class="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          class="flex-1 px-4 py-2.5 border border-gray-200 rounded-2xl resize-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-gray-50 disabled:text-gray-400 text-sm"
          style={{ maxHeight: '120px' }}
        />

        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          class={`p-2.5 rounded-full transition-all ${
            disabled || !value.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
          }`}
        >
          {disabled ? (
            <div class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>

      <p class="text-xs text-gray-400 mt-2 text-center">
        {language === 'ru'
          ? 'Enter — отправить, Shift+Enter — новая строка'
          : language === 'kk'
          ? 'Enter — жіберу, Shift+Enter — жаңа жол'
          : 'Enter to send, Shift+Enter for new line'}
      </p>
    </div>
  );
};

export default ChatInput;
