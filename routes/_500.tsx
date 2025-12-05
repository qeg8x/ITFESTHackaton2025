import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';

/**
 * Страница 500 - Ошибка сервера
 */
export default function ErrorPage({ error }: PageProps) {
  const isDev = Deno.env.get('DENO_ENV') === 'development';

  return (
    <>
      <Head>
        <title>500 - Ошибка сервера | Цифровой университет</title>
      </Head>

      <div class="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
        <div class="text-center max-w-lg animate-fadeIn">
          {/* Illustration */}
          <div class="mb-8">
            <div class="inline-flex items-center justify-center w-32 h-32 rounded-full bg-red-100 mb-4">
              <span class="text-6xl">⚠️</span>
            </div>
          </div>

          {/* Error code */}
          <h1 class="text-8xl font-bold text-red-600 mb-4">500</h1>

          {/* Message */}
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">
            Внутренняя ошибка сервера
          </h2>
          <p class="text-gray-600 mb-8">
            Произошла непредвиденная ошибка. Наша команда уже работает над её устранением.
            Пожалуйста, попробуйте позже.
          </p>

          {/* Dev error details */}
          {isDev && error && (
            <div class="mb-8 text-left bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <p class="text-red-400 font-mono text-sm mb-2">
                {error instanceof Error ? error.message : String(error)}
              </p>
              {error instanceof Error && error.stack && (
                <pre class="text-gray-400 font-mono text-xs whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          {/* Actions */}
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => globalThis.location.reload()}
              class="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Обновить страницу
            </button>
            <a
              href="/"
              class="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              На главную
            </a>
          </div>

          {/* Status */}
          <div class="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Система работает, ошибка временная
          </div>
        </div>
      </div>
    </>
  );
}
