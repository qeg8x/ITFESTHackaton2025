/**
 * Обновлённая главная страница с AI поиском
 */

import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import UniversitySearch from './UniversitySearch.tsx';

interface Stats {
  total: number;
  countries: number;
  programs: number;
}

export default function HomePageV2() {
  const stats = useSignal<Stats>({ total: 0, countries: 0, programs: 0 });

  // Load stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/universities?limit=1000');
        if (response.ok) {
          const data = await response.json();
          const universities = data.data || [];
          const countries = new Set(universities.map((u: { country: string }) => u.country));
          const programs = universities.reduce((acc: number, u: { programs_count?: number }) => 
            acc + (u.programs_count || 0), 0);
          
          stats.value = {
            total: universities.length,
            countries: countries.size,
            programs,
          };
        }
      } catch {
        // ignore
      }
    };
    fetchStats();
  }, []);

  return (
    <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header class="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <a href="/" class="flex items-center gap-2">
              <span class="text-2xl">🎓</span>
              <span class="font-bold text-xl text-gray-900">Цифровой университет</span>
            </a>
            <nav class="flex items-center gap-6">
              <a href="/universities" class="text-gray-600 hover:text-gray-900 transition-colors">
                Все университеты
              </a>
              <a href="/admin" class="text-gray-600 hover:text-gray-900 transition-colors">
                Админ
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section class="py-16 md:py-24 text-center">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Найдите <span class="text-blue-600">тот самый</span> университет
          </h1>
          <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Умный поиск с AI-проверкой. Если университета нет в базе — 
            мы проверим его существование и добавим автоматически.
          </p>

          {/* Search Component */}
          <div class="max-w-2xl mx-auto">
            <UniversitySearch />
          </div>

          {/* Stats */}
          {stats.value.total > 0 && (
            <div class="mt-12 flex justify-center gap-8 md:gap-16">
              <div class="text-center">
                <div class="text-3xl md:text-4xl font-bold text-blue-600">{stats.value.total}</div>
                <div class="text-sm text-gray-500">университетов</div>
              </div>
              <div class="text-center">
                <div class="text-3xl md:text-4xl font-bold text-blue-600">{stats.value.countries}</div>
                <div class="text-sm text-gray-500">стран</div>
              </div>
              <div class="text-center">
                <div class="text-3xl md:text-4xl font-bold text-blue-600">{stats.value.programs}+</div>
                <div class="text-sm text-gray-500">программ</div>
              </div>
            </div>
          )}
        </section>

        {/* Features */}
        <section class="py-16 border-t border-gray-100">
          <h2 class="text-2xl font-bold text-center text-gray-900 mb-12">
            Как это работает
          </h2>
          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center p-6">
              <div class="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span class="text-3xl">🔍</span>
              </div>
              <h3 class="font-semibold text-lg mb-2">Поиск</h3>
              <p class="text-gray-600">
                Введите название университета. Мы найдём его в нашей базе данных.
              </p>
            </div>
            <div class="text-center p-6">
              <div class="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span class="text-3xl">🤖</span>
              </div>
              <h3 class="font-semibold text-lg mb-2">AI-проверка</h3>
              <p class="text-gray-600">
                Если университета нет в базе, AI проверит его существование и соберёт информацию.
              </p>
            </div>
            <div class="text-center p-6">
              <div class="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span class="text-3xl">📊</span>
              </div>
              <h3 class="font-semibold text-lg mb-2">Полные данные</h3>
              <p class="text-gray-600">
                Программы, стоимость, контакты — вся информация в одном месте.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section class="py-16 text-center">
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12">
            <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">
              Не нашли нужный университет?
            </h2>
            <p class="text-blue-100 mb-6 max-w-xl mx-auto">
              Просто введите его название — наш AI проверит существование и добавит в базу данных
            </p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                globalThis.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              class="inline-block px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Начать поиск
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer class="bg-gray-50 border-t border-gray-100 py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-xl">🎓</span>
              <span class="font-semibold text-gray-900">Цифровой университет</span>
            </div>
            <p class="text-sm text-gray-500">
              Данные обновляются автоматически с помощью AI
            </p>
            <div class="flex gap-4">
              <a href="/admin" class="text-sm text-gray-500 hover:text-gray-700">
                Админ-панель
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
