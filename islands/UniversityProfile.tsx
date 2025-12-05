import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import type { University } from '../src/types/university.ts';
import { ProgramsList } from '../components/ProgramsList.tsx';
import { ProfileSkeleton } from '../components/Loading.tsx';
import { ErrorMessage } from '../components/ErrorMessage.tsx';

/**
 * Props для профиля университета
 */
interface UniversityProfileProps {
  /** ID университета */
  universityId: string;
  /** Начальные данные (SSR) */
  initialData?: University;
}

/**
 * Компонент полного профиля университета
 */
export default function UniversityProfile({
  universityId,
  initialData,
}: UniversityProfileProps) {
  const profile = useSignal<University | null>(initialData ?? null);
  const isLoading = useSignal(!initialData);
  const error = useSignal<string | null>(null);

  // Загрузка данных
  useEffect(() => {
    if (initialData) return;

    const fetchProfile = async () => {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await fetch(`/api/universities/${universityId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Университет не найден');
          }
          throw new Error('Не удалось загрузить данные');
        }

        const data = await response.json();
        profile.value = data.profile ?? data;
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Ошибка загрузки';
      } finally {
        isLoading.value = false;
      }
    };

    fetchProfile();
  }, [universityId]);

  // Loading state
  if (isLoading.value) {
    return <ProfileSkeleton />;
  }

  // Error state
  if (error.value) {
    return (
      <ErrorMessage
        message={error.value}
        onRetry={() => window.location.reload()}
        fullScreen
      />
    );
  }

  // No data
  if (!profile.value) {
    return <ErrorMessage message="Данные профиля недоступны" fullScreen />;
  }

  const p = profile.value;

  return (
    <div class="space-y-6">
      {/* Header */}
      <section class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex flex-col md:flex-row items-start gap-6">
          {/* Logo */}
          <div class="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            {p.logo_url ? (
              <img src={p.logo_url} alt={p.name} class="w-20 h-20 object-contain" />
            ) : (
              <span class="text-4xl">🎓</span>
            )}
          </div>

          {/* Basic Info */}
          <div class="flex-1">
            <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {p.name}
            </h1>
            {p.name_en && (
              <p class="text-gray-500 mb-3">{p.name_en}</p>
            )}
            <div class="flex flex-wrap gap-3 text-sm">
              <span class="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                📍 {p.city}, {p.country}
              </span>
              {p.website_url && (
                <a
                  href={p.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                >
                  🌐 Сайт университета
                </a>
              )}
            </div>
          </div>

          {/* Ratings */}
          {p.ratings && p.ratings.length > 0 && (
            <div class="flex flex-col items-end gap-2">
              {p.ratings.slice(0, 2).map((rating, i) => (
                <div key={i} class="text-right">
                  <div class="text-2xl font-bold text-blue-600">#{rating.rank}</div>
                  <div class="text-xs text-gray-500">{rating.source} {rating.year}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Description */}
      {p.description && (
        <section class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Об университете</h2>
          <p class="text-gray-700 leading-relaxed">{p.description}</p>
          {p.mission && (
            <div class="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h3 class="font-medium text-blue-900 mb-1">Миссия</h3>
              <p class="text-blue-800">{p.mission}</p>
            </div>
          )}
        </section>
      )}

      {/* Programs */}
      {p.programs && p.programs.length > 0 && (
        <section class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Образовательные программы
            <span class="ml-2 text-sm font-normal text-gray-500">
              ({p.programs.length})
            </span>
          </h2>
          <ProgramsList programs={p.programs} />
        </section>
      )}

      <div class="grid md:grid-cols-2 gap-6">
        {/* Admissions */}
        {p.admissions && (
          <section class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              📋 Поступление
            </h2>
            {p.admissions.requirements && (
              <div class="mb-4">
                <h3 class="font-medium text-gray-700 mb-2">Требования</h3>
                <p class="text-gray-600">{p.admissions.requirements}</p>
              </div>
            )}
            {p.admissions.start_date && (
              <div>
                <h3 class="font-medium text-gray-700 mb-2">Начало приема</h3>
                <p class="text-gray-600">{p.admissions.start_date}</p>
              </div>
            )}
          </section>
        )}

        {/* Tuition */}
        {p.tuition && (
          <section class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              💰 Стоимость обучения
            </h2>
            <div class="text-3xl font-bold text-green-600">
              {new Intl.NumberFormat('ru-RU').format(p.tuition.amount)} {p.tuition.currency}
            </div>
            <p class="text-gray-500 mt-1">
              {p.tuition.per_year ? 'в год' : 'за весь период'}
            </p>
          </section>
        )}
      </div>

      {/* Scholarships */}
      {p.scholarships && p.scholarships.length > 0 && (
        <section class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            🎁 Стипендии и гранты
          </h2>
          <div class="grid md:grid-cols-2 gap-4">
            {p.scholarships.map((scholarship, i) => (
              <div key={i} class="border border-gray-200 rounded-lg p-4">
                <h3 class="font-medium text-gray-900">{scholarship.name}</h3>
                {scholarship.amount && (
                  <p class="text-green-600 font-semibold mt-1">
                    {scholarship.amount}% покрытие
                  </p>
                )}
                {scholarship.description && (
                  <p class="text-gray-600 text-sm mt-2">{scholarship.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contacts */}
      {p.contacts && (p.contacts.email || p.contacts.phone || p.contacts.address) && (
        <section class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            📞 Контакты
          </h2>
          <div class="grid md:grid-cols-3 gap-4">
            {p.contacts.email && (
              <a
                href={`mailto:${p.contacts.email}`}
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span class="text-xl">✉️</span>
                <div>
                  <div class="text-xs text-gray-500">Email</div>
                  <div class="text-blue-600">{p.contacts.email}</div>
                </div>
              </a>
            )}
            {p.contacts.phone && (
              <a
                href={`tel:${p.contacts.phone}`}
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span class="text-xl">📱</span>
                <div>
                  <div class="text-xs text-gray-500">Телефон</div>
                  <div class="text-blue-600">{p.contacts.phone}</div>
                </div>
              </a>
            )}
            {p.contacts.address && (
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span class="text-xl">🏢</span>
                <div>
                  <div class="text-xs text-gray-500">Адрес</div>
                  <div class="text-gray-700">{p.contacts.address}</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Last updated */}
      {p.updated_at && (
        <div class="text-center text-sm text-gray-400">
          Обновлено: {new Date(p.updated_at).toLocaleDateString('ru-RU')}
        </div>
      )}
    </div>
  );
}
