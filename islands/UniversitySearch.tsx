/**
 * Компонент поиска и создания университета
 */

import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { useLanguage } from '../src/contexts/LanguageContext.tsx';

interface SearchResultItem {
  id: string;
  name: string;
  name_en?: string;
  country: string;
  city: string;
  programs_count: number;
  completeness: number;
}

interface ExistingUniversity {
  id: string;
  name: string;
  country: string;
  city: string;
  website_url: string;
}

interface AIVerifyResult {
  found: boolean;
  confidence: number;
  official_name: string | null;
  country: string | null;
  city: string | null;
  website: string | null;
  reasoning: string;
  alternatives: string[];
  existing_university: ExistingUniversity | null;
}

interface CreatedUniversity {
  id: string;
  name: string;
  country: string;
  city: string;
}

type SearchState = 'idle' | 'searching' | 'verifying' | 'creating' | 'success' | 'error';

export default function UniversitySearch() {
  const { t } = useLanguage();
  const query = useSignal('');
  const state = useSignal<SearchState>('idle');
  const dbResults = useSignal<SearchResultItem[]>([]);
  const aiResult = useSignal<AIVerifyResult | null>(null);
  const createdUni = useSignal<CreatedUniversity | null>(null);
  const error = useSignal<string | null>(null);
  const showModal = useSignal(false);

  useEffect(() => {
    if (query.value.length < 2) { dbResults.value = []; return; }
    const timer = setTimeout(async () => {
      state.value = 'searching';
      try {
        const res = await fetch(`/api/search/universities?name=${encodeURIComponent(query.value)}`);
        const data = await res.json();
        dbResults.value = data.results || [];
      } catch { dbResults.value = []; }
      state.value = 'idle';
    }, 300);
    return () => clearTimeout(timer);
  }, [query.value]);

  const handleSearch = async () => {
    if (query.value.length < 2) return;
    error.value = null; aiResult.value = null;
    if (dbResults.value.length > 0) return;
    state.value = 'verifying';
    try {
      const res = await fetch(`/api/search/verify?name=${encodeURIComponent(query.value)}`);
      const data = await res.json();
      if (res.ok) { aiResult.value = data; state.value = data.found ? 'idle' : 'error'; if (!data.found) error.value = 'Not found'; }
      else { error.value = data.error || 'Failed'; state.value = 'error'; }
    } catch { error.value = 'Connection error'; state.value = 'error'; }
  };

  const handleCreate = async () => {
    if (!aiResult.value?.found) return;
    state.value = 'creating'; error.value = null;
    try {
      const res = await fetch('/api/search/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ search_result: aiResult.value }) });
      const data = await res.json();
      if (res.ok && data.success) { createdUni.value = data.university; state.value = 'success'; showModal.value = true; }
      else { error.value = data.error || 'Failed'; state.value = 'error'; }
    } catch { error.value = 'Connection error'; state.value = 'error'; }
  };

  const handleClear = () => { query.value = ''; dbResults.value = []; aiResult.value = null; error.value = null; state.value = 'idle'; };

  return (
    <div class="w-full max-w-2xl mx-auto">
      <div class="relative">
        <input 
          type="text" 
          value={query.value} 
          onInput={(e) => { query.value = (e.target as HTMLInputElement).value; }} 
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
          placeholder={t('search.placeholder')} 
          class="w-full px-4 py-3 pr-24 text-lg bg-dark-800 border-2 border-dark-600 rounded-xl text-white placeholder:text-gray-500 focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/20 transition-all" 
        />
        {query.value && (
          <button type="button" onClick={handleClear} class="absolute right-20 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">✕</button>
        )}
        <button 
          type="button" 
          onClick={handleSearch} 
          disabled={query.value.length < 2 || state.value === 'verifying'} 
          class="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-cyber-500 text-dark-900 font-medium rounded-lg hover:bg-cyber-400 hover:shadow-glow disabled:opacity-50 transition-all"
        >
          {state.value === 'searching' || state.value === 'verifying' ? '⏳' : '🔍'}
        </button>
        {state.value === 'verifying' && (
          <div class="absolute left-0 right-0 -bottom-8 text-center text-sm text-cyber-400 animate-pulse">{t('search.verifying')}</div>
        )}
      </div>
      
      {/* DB Results */}
      {dbResults.value.length > 0 && (
        <div class="mt-6 space-y-3">
          <h3 class="text-sm text-gray-500">{t('search.found')} ({dbResults.value.length})</h3>
          {dbResults.value.map((r) => (
            <a key={r.id} href={`/universities/${r.id}`} class="block p-4 bg-dark-800 border border-dark-600 rounded-xl hover:border-cyber-500/50 hover:shadow-glow transition-all">
              <h4 class="font-semibold text-white">{r.name}</h4>
              <p class="text-sm text-gray-500">📍 {r.country}, {r.city}</p>
            </a>
          ))}
        </div>
      )}
      
      {/* AI Found Result - Существует в базе */}
      {aiResult.value && dbResults.value.length === 0 && aiResult.value.found && aiResult.value.existing_university && (
        <div class="mt-6 p-6 bg-neon-500/10 border border-neon-500/30 rounded-xl">
          <h3 class="font-semibold text-neon-400">✅ {t('searchResults.alreadyInDatabase')}</h3>
          <p class="text-white text-lg mt-2">{aiResult.value.existing_university.name}</p>
          <p class="text-sm text-gray-400">📍 {aiResult.value.existing_university.country}, {aiResult.value.existing_university.city}</p>
          {aiResult.value.website && (
            <p class="text-sm text-gray-500 mt-1">🌐 {aiResult.value.website}</p>
          )}
          <div class="mt-4 p-3 bg-neon-500/10 border border-neon-500/20 rounded-lg text-sm text-neon-400">
            🎉 {t('searchResults.universityExists')}
          </div>
          <a 
            href={`/universities/${aiResult.value.existing_university.id}`}
            class="mt-4 w-full py-3 bg-neon-500 text-dark-900 font-semibold rounded-lg hover:bg-neon-400 hover:shadow-glow transition-all flex items-center justify-center gap-2"
          >
            <span>📖</span> {t('common.openProfile')}
          </a>
        </div>
      )}

      {/* AI Found Result - Нет в базе, предложение добавить */}
      {aiResult.value && dbResults.value.length === 0 && aiResult.value.found && !aiResult.value.existing_university && (
        <div class="mt-6 p-6 bg-cyber-500/10 border border-cyber-500/30 rounded-xl">
          <h3 class="font-semibold text-cyber-400">🎓 {t('search.found')}!</h3>
          <p class="text-white">{aiResult.value.official_name}</p>
          {aiResult.value.country && (
            <p class="text-sm text-gray-400">📍 {aiResult.value.country}{aiResult.value.city && `, ${aiResult.value.city}`}</p>
          )}
          {aiResult.value.website && (
            <p class="text-sm text-gray-500 mt-1">🌐 {aiResult.value.website}</p>
          )}
          <p class="text-sm text-gray-500 mt-2 italic">{aiResult.value.reasoning}</p>
          <p class="text-xs text-cyber-500">{t('search.confidence')}: {aiResult.value.confidence}%</p>
          <div class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-400">⚠️ {t('searchResults.notInDatabase')}</div>
          <button 
            type="button" 
            onClick={handleCreate} 
            disabled={state.value === 'creating'} 
            class="mt-4 w-full py-3 bg-cyber-500 text-dark-900 font-semibold rounded-lg hover:bg-cyber-400 hover:shadow-glow disabled:opacity-50 transition-all"
          >
            {state.value === 'creating' ? t('search.creating') : `➕ ${t('search.addToDatabase')}`}
          </button>
        </div>
      )}
      
      {/* AI Not Found */}
      {aiResult.value && !aiResult.value.found && (
        <div class="mt-6 p-6 bg-dark-800 border border-dark-600 rounded-xl">
          <h3 class="font-semibold text-white">🔍 {t('search.notFound')}</h3>
          <p class="text-gray-400">{aiResult.value.reasoning}</p>
          {aiResult.value.alternatives?.length > 0 && (
            <div class="mt-4">
              <p class="text-sm font-medium text-gray-300">{t('search.alternatives')}:</p>
              <div class="flex flex-wrap gap-2 mt-2">
                {aiResult.value.alternatives.map((alt: string) => (
                  <button key={alt} type="button" onClick={() => { query.value = alt; }} class="px-3 py-1 bg-dark-700 border border-dark-600 rounded-full text-sm text-gray-300 hover:border-cyber-500/50 hover:text-cyber-400 transition-all">{alt}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Error */}
      {error.value && state.value === 'error' && !aiResult.value && (
        <div class="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">{error.value}</div>
      )}
      
      {/* Success Modal */}
      {showModal.value && createdUni.value && (
        <div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-dark-800 border border-dark-600 rounded-2xl shadow-elevated-dark max-w-md w-full p-6 text-center">
            <span class="text-5xl">🎉</span>
            <h2 class="text-xl font-bold mt-4 text-white">{t('search.created')}</h2>
            <p class="text-gray-400 mt-2">{createdUni.value.name}</p>
            <div class="mt-4 p-4 bg-dark-700 rounded-lg text-left text-sm">
              <p class="text-gray-300"><strong class="text-white">{t('filters.country')}:</strong> {createdUni.value.country}</p>
              <p class="text-gray-300"><strong class="text-white">{t('profile.address')}:</strong> {createdUni.value.city}</p>
            </div>
            <div class="mt-6 flex gap-3">
              <button type="button" onClick={() => { showModal.value = false; }} class="flex-1 py-2 border border-dark-600 rounded-lg text-gray-300 hover:bg-dark-700 transition-colors">{t('common.close')}</button>
              <a href={`/universities/${createdUni.value.id}`} class="flex-1 py-2 bg-cyber-500 text-dark-900 font-medium rounded-lg hover:bg-cyber-400 text-center transition-colors">{t('common.open')}</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
