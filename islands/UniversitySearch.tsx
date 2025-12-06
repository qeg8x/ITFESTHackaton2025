/**
 * Компонент поиска и создания университета
 */

import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

interface SearchResultItem {
  id: string;
  name: string;
  name_en?: string;
  country: string;
  city: string;
  programs_count: number;
  completeness: number;
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
}

interface CreatedUniversity {
  id: string;
  name: string;
  country: string;
  city: string;
}

type SearchState = 'idle' | 'searching' | 'verifying' | 'creating' | 'success' | 'error';

export default function UniversitySearch() {
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
        <input type="text" value={query.value} onInput={(e) => { query.value = (e.target as HTMLInputElement).value; }} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Введите название университета..." class="w-full px-4 py-3 pr-24 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
        {query.value && <button type="button" onClick={handleClear} class="absolute right-20 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>}
        <button type="button" onClick={handleSearch} disabled={query.value.length < 2 || state.value === 'verifying'} class="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{state.value === 'searching' || state.value === 'verifying' ? '⏳' : '🔍'}</button>
        {state.value === 'verifying' && <div class="absolute left-0 right-0 -bottom-8 text-center text-sm text-blue-600 animate-pulse">Проверяем...</div>}
      </div>
      {dbResults.value.length > 0 && <div class="mt-6 space-y-3"><h3 class="text-sm text-gray-500">Найдено ({dbResults.value.length})</h3>{dbResults.value.map((r) => <a key={r.id} href={`/universities/${r.id}`} class="block p-4 bg-white border rounded-xl hover:border-blue-300 hover:shadow-md"><h4 class="font-semibold">{r.name}</h4><p class="text-sm text-gray-600">📍 {r.country}, {r.city}</p></a>)}</div>}
      {aiResult.value && dbResults.value.length === 0 && aiResult.value.found && <div class="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-xl"><h3 class="font-semibold text-blue-900">🎓 Найден!</h3><p class="text-blue-700">{aiResult.value.official_name}</p>{aiResult.value.country && <p class="text-sm text-blue-600">📍 {aiResult.value.country}{aiResult.value.city && `, ${aiResult.value.city}`}</p>}<p class="text-sm text-blue-600 mt-2 italic">{aiResult.value.reasoning}</p><p class="text-xs text-blue-500">Уверенность: {aiResult.value.confidence}%</p><div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">⚠️ Нет в базе</div><button type="button" onClick={handleCreate} disabled={state.value === 'creating'} class="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{state.value === 'creating' ? 'Добавление...' : '➕ Добавить'}</button></div>}
      {aiResult.value && !aiResult.value.found && <div class="mt-6 p-6 bg-gray-50 border rounded-xl"><h3 class="font-semibold">🔍 Не найден</h3><p class="text-gray-600">{aiResult.value.reasoning}</p>{aiResult.value.alternatives?.length > 0 && <div class="mt-4"><p class="text-sm font-medium">Возможно:</p><div class="flex flex-wrap gap-2 mt-2">{aiResult.value.alternatives.map((alt: string) => <button key={alt} type="button" onClick={() => { query.value = alt; }} class="px-3 py-1 bg-white border rounded-full text-sm hover:bg-gray-50">{alt}</button>)}</div></div>}</div>}
      {error.value && state.value === 'error' && !aiResult.value && <div class="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error.value}</div>}
      {showModal.value && createdUni.value && <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center"><span class="text-5xl">🎉</span><h2 class="text-xl font-bold mt-4">Добавлен!</h2><p class="text-gray-600 mt-2">{createdUni.value.name}</p><div class="mt-4 p-4 bg-gray-50 rounded-lg text-left text-sm"><p><strong>Страна:</strong> {createdUni.value.country}</p><p><strong>Город:</strong> {createdUni.value.city}</p></div><div class="mt-6 flex gap-3"><button type="button" onClick={() => { showModal.value = false; }} class="flex-1 py-2 border rounded-lg hover:bg-gray-50">Закрыть</button><a href={`/universities/${createdUni.value.id}`} class="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center">Открыть</a></div></div></div>}
    </div>
  );
}
