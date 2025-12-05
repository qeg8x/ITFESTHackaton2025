import { Head } from '$fresh/runtime.ts';

/**
 * Главная страница приложения "Цифровой университет"
 */
export default function Home() {
  return (
    <>
      <Head>
        <title>Цифровой университет</title>
        <meta name="description" content="Платформа для выбора университета" />
      </Head>
      <div class="min-h-screen bg-gray-50">
        <header class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 py-6">
            <h1 class="text-3xl font-bold text-gray-900">
              🎓 Цифровой университет
            </h1>
          </div>
        </header>
        <main class="max-w-7xl mx-auto px-4 py-8">
          <div class="text-center py-12">
            <h2 class="text-2xl font-semibold text-gray-700 mb-4">
              Добро пожаловать!
            </h2>
            <p class="text-gray-600 mb-8">
              Платформа для выбора университета и просмотра профилей вузов
            </p>
            <a
              href="/universities"
              class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Смотреть университеты →
            </a>
          </div>
        </main>
      </div>
    </>
  );
}
