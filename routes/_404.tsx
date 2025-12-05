import { Head } from '$fresh/runtime.ts';

/**
 * Страница 404 - Не найдено
 */
export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>404 - Страница не найдена | Цифровой университет</title>
      </Head>

      <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div class="text-center max-w-lg animate-fadeIn">
          {/* Illustration */}
          <div class="mb-8">
            <div class="inline-flex items-center justify-center w-32 h-32 rounded-full bg-blue-100 mb-4">
              <span class="text-6xl">🔍</span>
            </div>
          </div>

          {/* Error code */}
          <h1 class="text-8xl font-bold text-blue-600 mb-4">404</h1>

          {/* Message */}
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">
            Страница не найдена
          </h2>
          <p class="text-gray-600 mb-8">
            К сожалению, запрашиваемая страница не существует или была перемещена.
            Возможно, вы перешли по устаревшей ссылке.
          </p>

          {/* Actions */}
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              class="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              На главную
            </a>
            <a
              href="/universities"
              class="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Найти университет
            </a>
          </div>

          {/* Help text */}
          <p class="mt-8 text-sm text-gray-500">
            Если вы уверены, что страница должна существовать,{' '}
            <a href="mailto:support@example.com" class="text-blue-600 hover:underline">
              сообщите нам
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
