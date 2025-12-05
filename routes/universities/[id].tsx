import { Head } from '$fresh/runtime.ts';
import { Handlers, PageProps } from '$fresh/server.ts';
import UniversityProfile from '../../islands/UniversityProfile.tsx';
import { getUniversityWithProfile } from '../../src/services/universities.service.ts';
import type { University } from '../../src/types/university.ts';

/**
 * Данные страницы
 */
interface PageData {
  id: string;
  name: string;
  profile: University | null;
  error?: string;
}

/**
 * Серверная загрузка данных
 */
export const handler: Handlers<PageData> = {
  async GET(_req, ctx) {
    const { id } = ctx.params;

    // Валидация UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return ctx.render({
        id,
        name: 'Ошибка',
        profile: null,
        error: 'Неверный формат ID университета',
      });
    }

    try {
      const university = await getUniversityWithProfile(id);

      if (!university) {
        return ctx.render({
          id,
          name: 'Не найден',
          profile: null,
          error: 'Университет не найден',
        });
      }

      return ctx.render({
        id,
        name: university.name,
        profile: university.profile,
      });
    } catch (err) {
      console.error('Failed to load university:', err);
      return ctx.render({
        id,
        name: 'Ошибка',
        profile: null,
        error: 'Не удалось загрузить данные',
      });
    }
  },
};

/**
 * Страница профиля университета
 * GET /universities/:id
 */
export default function UniversityPage({ data }: PageProps<PageData>) {
  const { id, name, profile, error } = data;

  return (
    <>
      <Head>
        <title>{name} | Цифровой университет</title>
        <meta
          name="description"
          content={profile?.description ?? `Профиль университета ${name}`}
        />
      </Head>

      <div class="min-h-screen bg-gray-50">
        {/* Header */}
        <header class="bg-white shadow-sm sticky top-0 z-40">
          <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a
              href="/universities"
              class="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Назад к поиску</span>
            </a>

            <a href="/" class="flex items-center gap-2">
              <span class="text-xl">🎓</span>
              <span class="font-semibold text-gray-700 hidden sm:inline">Цифровой университет</span>
            </a>
          </div>
        </header>

        {/* Main content */}
        <main class="max-w-5xl mx-auto px-4 py-8">
          {error ? (
            <div class="bg-white rounded-xl shadow-sm p-12 text-center">
              <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
                <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">{error}</h1>
              <p class="text-gray-600 mb-6">
                Попробуйте вернуться к поиску и выбрать другой университет
              </p>
              <a
                href="/universities"
                class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Вернуться к поиску
              </a>
            </div>
          ) : (
            <UniversityProfile universityId={id} initialData={profile ?? undefined} />
          )}
        </main>

        {/* Footer */}
        <footer class="border-t border-gray-200 mt-8">
          <div class="max-w-5xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
            <p>© 2024 Цифровой университет. Данные обновляются автоматически.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
