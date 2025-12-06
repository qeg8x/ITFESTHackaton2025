import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import type { University } from '../src/types/university.ts';
import { ProgramsList } from '../components/ProgramsList.tsx';
import { ProfileSkeleton } from '../components/Loading.tsx';
import { ErrorMessage } from '../components/ErrorMessage.tsx';
import { UniversityMapStatic } from '../src/components/UniversityMap.tsx';
import Tour3DSection from './Tour3DSection.tsx';
import { LanguageProvider, useLanguage } from '../src/contexts/LanguageContext.tsx';

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
 * Wrapper с LanguageProvider для island
 */
export default function UniversityProfile(props: UniversityProfileProps) {
  return (
    <LanguageProvider>
      <UniversityProfileInner {...props} />
    </LanguageProvider>
  );
}

/**
 * Внутренний компонент профиля университета
 */
function UniversityProfileInner({
  universityId,
  initialData,
}: UniversityProfileProps) {
  const { t, language } = useLanguage();
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
        onRetry={() => globalThis.location.reload()}
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
      <section class="bg-dark-800 rounded-xl border border-dark-600 p-6">
        <div class="flex flex-col md:flex-row items-start gap-6">
          {/* Logo */}
          <div class="w-24 h-24 bg-gradient-to-br from-cyber-500/20 to-neon-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-dark-600">
            {p.logo_url ? (
              <img src={p.logo_url} alt={p.name} class="w-20 h-20 object-contain" />
            ) : (
              <span class="text-4xl">🎓</span>
            )}
          </div>

          {/* Basic Info */}
          <div class="flex-1">
            <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">
              {p.name}
            </h1>
            {p.name_en && (
              <p class="text-gray-400 mb-3">{p.name_en}</p>
            )}
            <div class="flex flex-wrap gap-3 text-sm">
              <span class="inline-flex items-center gap-1 px-3 py-1 bg-dark-700 text-gray-300 rounded-full border border-dark-600">
                📍 {p.city}, {p.country}
              </span>
              {p.website_url && (
                <a
                  href={p.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-cyber-500/20 text-cyber-400 rounded-full hover:bg-cyber-500/30 transition-colors border border-cyber-500/30"
                >
                  🌐 {t('university.website')}
                </a>
              )}
            </div>
          </div>

          {/* Ratings */}
          {p.ratings && p.ratings.length > 0 && (
            <div class="flex flex-col items-end gap-2">
              {p.ratings.slice(0, 2).map((rating, i) => (
                <div key={i} class="text-right">
                  <div class="text-2xl font-bold text-cyber-400">#{rating.rank}</div>
                  <div class="text-xs text-gray-500">{rating.source} {rating.year}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Description */}
      {p.description && (
        <section class="bg-dark-800 rounded-xl border border-dark-600 p-6">
          <h2 class="text-xl font-semibold text-white mb-4">{t('profile.about')}</h2>
          <p class="text-gray-300 leading-relaxed">{p.description}</p>
          {p.mission && (
            <div class="mt-4 p-4 bg-cyber-500/10 rounded-lg border-l-4 border-cyber-500">
              <h3 class="font-medium text-cyber-400 mb-1">{t('university.mission')}</h3>
              <p class="text-gray-300">{p.mission}</p>
            </div>
          )}
        </section>
      )}

      {/* Programs */}
      {p.programs && p.programs.length > 0 && (
        <section class="bg-dark-800 rounded-xl border border-dark-600 p-6">
          <h2 class="text-xl font-semibold text-white mb-4">
            {t('university.educationalPrograms')}
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
          <section class="bg-dark-800 rounded-xl border border-dark-600 p-6">
            <h2 class="text-xl font-semibold text-white mb-4">
              📋 {t('profile.admissions')}
            </h2>
            {p.admissions.requirements && (
              <div class="mb-4">
                <h3 class="font-medium text-gray-300 mb-2">{t('university.requirements')}</h3>
                <p class="text-gray-400">{p.admissions.requirements}</p>
              </div>
            )}
            {p.admissions.start_date && (
              <div>
                <h3 class="font-medium text-gray-300 mb-2">{t('university.deadline')}</h3>
                <p class="text-gray-400">{p.admissions.start_date}</p>
              </div>
            )}
          </section>
        )}

        {/* Tuition */}
        {p.tuition && p.tuition.amount != null && (
          <section class="bg-dark-800 rounded-xl border border-dark-600 p-6">
            <h2 class="text-xl font-semibold text-white mb-4">
              💰 {t('university.tuitionFee')}
            </h2>
            <div class="text-3xl font-bold text-neon-400">
              {new Intl.NumberFormat('ru-RU').format(p.tuition.amount)} {p.tuition.currency ?? 'USD'}
            </div>
            <p class="text-gray-500 mt-1">
              {p.tuition.per_year ? t('university.perYear') : t('programs.duration')}
            </p>
          </section>
        )}
      </div>

      {/* Scholarships */}
      {p.scholarships && p.scholarships.length > 0 && (
        <section class="bg-dark-800 rounded-xl border border-dark-600 p-6">
          <h2 class="text-xl font-semibold text-white mb-4">
            🎁 {t('university.scholarshipsAndGrants')}
          </h2>
          <div class="grid md:grid-cols-2 gap-4">
            {p.scholarships.map((scholarship, i) => (
              <div key={i} class="border border-dark-600 bg-dark-700/50 rounded-lg p-4">
                <h3 class="font-medium text-white">{scholarship.name}</h3>
                {scholarship.amount && (
                  <p class="text-neon-400 font-semibold mt-1">
                    {scholarship.amount}% {t('university.coverage')}
                  </p>
                )}
                {scholarship.description && (
                  <p class="text-gray-400 text-sm mt-2">{scholarship.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contacts */}
      {p.contacts && (p.contacts.email || p.contacts.phone || p.contacts.address) && (
        <section class="bg-dark-800 rounded-xl border border-dark-600 p-6">
          <h2 class="text-xl font-semibold text-white mb-4">
            📞 {t('profile.contacts')}
          </h2>
          <div class="grid md:grid-cols-3 gap-4">
            {p.contacts.email && (
              <a
                href={`mailto:${p.contacts.email}`}
                class="flex items-center gap-3 p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors border border-dark-600"
              >
                <span class="text-xl">✉️</span>
                <div>
                  <div class="text-xs text-gray-500">{t('profile.email')}</div>
                  <div class="text-cyber-400">{p.contacts.email}</div>
                </div>
              </a>
            )}
            {p.contacts.phone && (
              <a
                href={`tel:${p.contacts.phone}`}
                class="flex items-center gap-3 p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors border border-dark-600"
              >
                <span class="text-xl">📱</span>
                <div>
                  <div class="text-xs text-gray-500">{t('profile.phone')}</div>
                  <div class="text-cyber-400">{p.contacts.phone}</div>
                </div>
              </a>
            )}
            {p.contacts.address && (
              <div class="flex items-center gap-3 p-3 bg-dark-700 rounded-lg border border-dark-600">
                <span class="text-xl">🏢</span>
                <div>
                  <div class="text-xs text-gray-500">{t('profile.address')}</div>
                  <div class="text-gray-300">{p.contacts.address}</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3D Tour */}
      <Tour3DSection 
        universityId={universityId} 
        universityName={p.name}
        latitude={p.latitude}
        longitude={p.longitude}
        translations={{
          title: t('streetView.title'),
          openFullscreen: t('streetView.openFullscreen'),
          loading: t('streetView.loading'),
          hint: t('streetView.hint'),
        }}
      />

      {/* Map */}
      {p.latitude && p.longitude && (
        <section class="bg-dark-800 rounded-xl border border-dark-600 p-6">
          <UniversityMapStatic
            latitude={p.latitude}
            longitude={p.longitude}
            name={p.name}
            address={p.contacts?.address}
          />
        </section>
      )}

      {/* Last updated */}
      {p.updated_at && (
        <div class="text-center text-sm text-gray-400">
          {t('common.lastUpdated')}: {new Date(p.updated_at).toLocaleDateString(language.value === 'ru' ? 'ru-RU' : language.value === 'kk' ? 'kk-KZ' : 'en-US')}
        </div>
      )}
    </div>
  );
}
