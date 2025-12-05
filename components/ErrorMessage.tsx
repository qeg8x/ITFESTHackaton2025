/**
 * Компонент отображения ошибки
 */

interface ErrorMessageProps {
  /** Заголовок ошибки */
  title?: string;
  /** Сообщение об ошибке */
  message: string;
  /** Callback для повторной попытки */
  onRetry?: () => void;
  /** Полноэкранный режим */
  fullScreen?: boolean;
}

/**
 * Сообщение об ошибке
 */
export const ErrorMessage = ({
  title = 'Произошла ошибка',
  message,
  onRetry,
  fullScreen = false,
}: ErrorMessageProps) => {
  const content = (
    <div class="text-center p-6">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
        <svg
          class="w-8 h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p class="text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Попробовать снова
        </button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div class="min-h-[400px] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div class="bg-red-50 border border-red-200 rounded-lg">
      {content}
    </div>
  );
};

/**
 * Сообщение "Не найдено"
 */
export const NotFound = ({
  message = 'Запрашиваемый ресурс не найден',
}: {
  message?: string;
}) => (
  <div class="text-center p-6">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
      <svg
        class="w-8 h-8 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3 class="text-lg font-semibold text-gray-900 mb-2">Не найдено</h3>
    <p class="text-gray-600">{message}</p>
  </div>
);

export default ErrorMessage;
