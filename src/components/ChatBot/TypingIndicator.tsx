/**
 * Индикатор печати (три точки)
 */

/**
 * Анимированный индикатор "бот печатает"
 */
export const TypingIndicator = () => {
  return (
    <div class="flex justify-start">
      <div class="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-lg">🤖</span>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
