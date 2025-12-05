import { Head } from '$fresh/runtime.ts';
import UniversitySelector from '../../islands/UniversitySelector.tsx';

/**
 * Страница списка университетов
 * GET /universities
 */
export default function UniversitiesPage() {
  return (
    <>
      <Head>
        <title>Выбор университета | Цифровой университет</title>
        <meta name="description" content="Выберите университет для просмотра подробной информации" />
      </Head>

      <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Header */}
        <header class="bg-white shadow-sm">
          <div class="max-w-5xl mx-auto px-4 py-4">
            <a href="/" class="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
              <span class="text-2xl">🎓</span>
              <span class="font-semibold">Цифровой университет</span>
            </a>
          </div>
        </header>

        {/* Main content */}
        <main class="max-w-5xl mx-auto px-4 py-12">
          <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">
              Найдите свой университет
            </h1>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto">
              Исследуйте профили университетов, сравнивайте программы и найдите идеальное место для обучения
            </p>
          </div>

          {/* Search */}
          <div class="flex justify-center mb-12">
            <UniversitySelector placeholder="Начните вводить название университета..." />
          </div>

          {/* Features */}
          <div class="grid md:grid-cols-3 gap-8 mt-16">
            <div class="text-center p-6">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-3xl">🔍</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Удобный поиск</h3>
              <p class="text-gray-600">
                Быстрый поиск по названию, городу или стране
              </p>
            </div>

            <div class="text-center p-6">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-3xl">📊</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Полная информация</h3>
              <p class="text-gray-600">
                Программы, стоимость, требования и контакты
              </p>
            </div>

            <div class="text-center p-6">
              <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-3xl">🤖</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">AI помощник</h3>
              <p class="text-gray-600">
                Актуальные данные с официальных сайтов
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer class="border-t border-gray-200 mt-16">
          <div class="max-w-5xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
            <p>© 2024 Цифровой университет. Хакатон MVP.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
