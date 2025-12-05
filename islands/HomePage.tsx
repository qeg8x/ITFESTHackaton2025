import { useSignal, useComputed } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import type { University } from '../src/types/university.ts';
import { ProgramsList } from '../components/ProgramsList.tsx';
import { ProfileSkeleton } from '../components/Loading.tsx';

/**
 * Университет для списка
 */
interface UniversityItem {
  id: string;
  name: string;
  name_en?: string;
  country: string;
  city: string;
  logo_url?: string;
}

/**
 * Интерактивная главная страница
 * Выбор университета + просмотр профиля на одной странице
 */
export default function HomePage() {
  // State
  const searchQuery = useSignal('');
  const universities = useSignal<UniversityItem[]>([]);
  const selectedId = useSignal<string | null>(null);
  const profile = useSignal<University | null>(null);
  const isLoadingList = useSignal(true);
  const isLoadingProfile = useSignal(false);
  const isDropdownOpen = useSignal(false);
  const error = useSignal<string | null>(null);

  // Filtered universities
  const filteredUniversities = useComputed(() => {
    const query = searchQuery.value.toLowerCase();
    if (!query) return universities.value;
    return universities.value.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.name_en?.toLowerCase().includes(query) ||
        u.city.toLowerCase().includes(query)
    );
  });

  // Load universities list
  useEffect(() => {
    const fetchList = async () => {
      try {
        const response = await fetch('/api/universities?limit=100');
        if (!response.ok) throw new Error('Ошибка загрузки');
        const data = await response.json();
        universities.value = data.data;
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Ошибка';
      } finally {
        isLoadingList.value = false;
      }
    };
    fetchList();
  }, []);

  // Load profile when selected
  useEffect(() => {
    if (!selectedId.value) {
      profile.value = null;
      return;
    }

    const fetchProfile = async () => {
      isLoadingProfile.value = true;
      try {
        const response = await fetch(`/api/universities/${selectedId.value}`);
        if (!response.ok) throw new Error('Ошибка загрузки профиля');
        const data = await response.json();
        profile.value = data.profile ?? data;
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Ошибка';
      } finally {
        isLoadingProfile.value = false;
      }
    };
    fetchProfile();
  }, [selectedId.value]);

  // Select university
  const handleSelect = (university: UniversityItem) => {
    selectedId.value = university.id;
    searchQuery.value = university.name;
    isDropdownOpen.value = false;
  };

  // Clear selection
  const handleClear = () => {
    selectedId.value = null;
    searchQuery.value = '';
    profile.value = null;
  };

  return (
    <div class="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
      {/* Header */}
      <header class="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-3xl">🎓</span>
              <div>
                <h1 class="text-xl font-bold text-gray-900">Цифровой университет</h1>
                <p class="text-xs text-gray-500 hidden sm:block">Платформа выбора вуза</p>
              </div>
            </div>
            
            <nav class="flex items-center gap-4">
              <a href="/universities" class="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Каталог
              </a>
              <a 
                href="/api/debug?action=health" 
                target="_blank"
                class="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                API
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero + Search */}
      <section class="py-12 md:py-20">
        <div class="max-w-4xl mx-auto px-4 text-center">
          <h2 class="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Найдите свой <span class="text-blue-600">идеальный</span> университет
          </h2>
          <p class="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Исследуйте профили вузов, сравнивайте программы и делайте осознанный выбор
          </p>

          {/* Search */}
          <div class="relative max-w-xl mx-auto">
            <div class="relative">
              <input
                type="text"
                value={searchQuery.value}
                onInput={(e) => {
                  searchQuery.value = (e.target as HTMLInputElement).value;
                  isDropdownOpen.value = true;
                  if (!searchQuery.value) selectedId.value = null;
                }}
                onFocus={() => (isDropdownOpen.value = true)}
                placeholder="Начните вводить название университета..."
                class="w-full px-5 py-4 pl-14 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm"
              />
              <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                {isLoadingList.value ? (
                  <div class="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                ) : (
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
              
              {selectedId.value && (
                <button
                  type="button"
                  onClick={handleClear}
                  class="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Dropdown */}
            {isDropdownOpen.value && !isLoadingList.value && filteredUniversities.value.length > 0 && !selectedId.value && (
              <div class="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                {filteredUniversities.value.slice(0, 10).map((university) => (
                  <button
                    type="button"
                    key={university.id}
                    onClick={() => handleSelect(university)}
                    class="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-0"
                  >
                    <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {university.logo_url ? (
                        <img src={university.logo_url} alt="" class="w-8 h-8 object-contain" />
                      ) : (
                        <span class="text-lg">🎓</span>
                      )}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-gray-900 truncate">{university.name}</div>
                      <div class="text-sm text-gray-500">{university.city}, {university.country}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {isDropdownOpen.value && searchQuery.value && filteredUniversities.value.length === 0 && !isLoadingList.value && (
              <div class="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-6 text-center text-gray-500">
                Университеты не найдены
              </div>
            )}

            {/* Overlay */}
            {isDropdownOpen.value && (
              <div class="fixed inset-0 z-40" onClick={() => (isDropdownOpen.value = false)} />
            )}
          </div>

          {/* Quick stats */}
          <div class="flex justify-center gap-8 mt-8 text-sm text-gray-500">
            <div class="flex items-center gap-2">
              <span class="text-blue-600 font-semibold">{universities.value.length}</span>
              <span>университетов</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-green-600 font-semibold">5</span>
              <span>стран</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-purple-600 font-semibold">AI</span>
              <span>обновление</span>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Section */}
      {selectedId.value && (
        <section class="pb-16">
          <div class="max-w-5xl mx-auto px-4">
            {isLoadingProfile.value ? (
              <ProfileSkeleton />
            ) : profile.value ? (
              <div class="animate-fadeIn">
                <ProfileView profile={profile.value} />
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* Features (show when no university selected) */}
      {!selectedId.value && (
        <section class="py-16 bg-white">
          <div class="max-w-5xl mx-auto px-4">
            <h3 class="text-2xl font-bold text-gray-900 text-center mb-12">
              Почему Цифровой университет?
            </h3>
            <div class="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon="🔍"
                title="Умный поиск"
                description="Быстрый поиск по названию, городу или стране"
              />
              <FeatureCard
                icon="📊"
                title="Полная информация"
                description="Программы, стоимость, требования и контакты"
              />
              <FeatureCard
                icon="🤖"
                title="AI обновление"
                description="Данные автоматически обновляются с сайтов вузов"
              />
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer class="bg-gray-900 text-gray-400 py-12">
        <div class="max-w-5xl mx-auto px-4">
          <div class="flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🎓</span>
              <div>
                <div class="text-white font-semibold">Цифровой университет</div>
                <div class="text-sm">MVP v1.0 • Хакатон 2024</div>
              </div>
            </div>
            
            <div class="flex items-center gap-6 text-sm">
              <a href="/universities" class="hover:text-white transition-colors">Каталог</a>
              <a href="/api/debug?action=health" class="hover:text-white transition-colors">API</a>
              <span class="text-gray-600">|</span>
              <span>Fresh + Deno + PostgreSQL</span>
            </div>
          </div>
          
          <div class="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            © {new Date().getFullYear()} Цифровой университет. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Feature card component
 */
const FeatureCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <div class="text-center p-6 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors">
    <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
      <span class="text-3xl">{icon}</span>
    </div>
    <h4 class="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
    <p class="text-gray-600">{description}</p>
  </div>
);

/**
 * Profile view component
 */
const ProfileView = ({ profile: p }: { profile: University }) => (
  <div class="space-y-6">
    {/* Header */}
    <div class="bg-white rounded-2xl shadow-sm p-6 md:p-8">
      <div class="flex flex-col md:flex-row items-start gap-6">
        <div class="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          {p.logo_url ? (
            <img src={p.logo_url} alt={p.name} class="w-16 h-16 object-contain" />
          ) : (
            <span class="text-4xl">🎓</span>
          )}
        </div>
        <div class="flex-1">
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900">{p.name}</h2>
          {p.name_en && <p class="text-gray-500 mt-1">{p.name_en}</p>}
          <div class="flex flex-wrap gap-2 mt-3">
            <span class="px-3 py-1 bg-gray-100 rounded-full text-sm">📍 {p.city}, {p.country}</span>
            {p.website_url && (
              <a
                href={p.website_url}
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                🌐 Сайт
              </a>
            )}
          </div>
        </div>
        {p.ratings && p.ratings.length > 0 && (
          <div class="text-right">
            <div class="text-3xl font-bold text-blue-600">#{p.ratings[0].rank}</div>
            <div class="text-xs text-gray-500">{p.ratings[0].source} {p.ratings[0].year}</div>
          </div>
        )}
      </div>
    </div>

    {/* Description */}
    {p.description && (
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Об университете</h3>
        <p class="text-gray-700 leading-relaxed">{p.description}</p>
        {p.mission && (
          <div class="mt-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
            <p class="text-blue-800 font-medium">Миссия:</p>
            <p class="text-blue-700 mt-1">{p.mission}</p>
          </div>
        )}
      </div>
    )}

    {/* Programs */}
    {p.programs && p.programs.length > 0 && (
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          Образовательные программы ({p.programs.length})
        </h3>
        <ProgramsList programs={p.programs} />
      </div>
    )}

    {/* Grid sections */}
    <div class="grid md:grid-cols-2 gap-6">
      {/* Admissions */}
      {p.admissions?.requirements && (
        <div class="bg-white rounded-2xl shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">📋 Поступление</h3>
          <p class="text-gray-700">{p.admissions.requirements}</p>
        </div>
      )}

      {/* Tuition */}
      {p.tuition && (
        <div class="bg-white rounded-2xl shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">💰 Стоимость</h3>
          <div class="text-3xl font-bold text-green-600">
            {new Intl.NumberFormat('ru-RU').format(p.tuition.amount)} {p.tuition.currency}
          </div>
          <p class="text-gray-500">{p.tuition.per_year ? 'в год' : 'за весь период'}</p>
        </div>
      )}

      {/* Contacts */}
      {p.contacts && (p.contacts.email || p.contacts.phone) && (
        <div class="bg-white rounded-2xl shadow-sm p-6 md:col-span-2">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📞 Контакты</h3>
          <div class="grid sm:grid-cols-3 gap-4">
            {p.contacts.email && (
              <a href={`mailto:${p.contacts.email}`} class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span>✉️</span>
                <span class="text-blue-600 truncate">{p.contacts.email}</span>
              </a>
            )}
            {p.contacts.phone && (
              <a href={`tel:${p.contacts.phone}`} class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span>📱</span>
                <span class="text-blue-600">{p.contacts.phone}</span>
              </a>
            )}
            {p.contacts.address && (
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span>🏢</span>
                <span class="text-gray-700 truncate">{p.contacts.address}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);
