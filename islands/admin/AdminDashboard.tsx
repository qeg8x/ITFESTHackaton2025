/**
 * Главная админ-панель
 */

import { useState, useEffect } from 'preact/hooks';
import { useAdmin, useAdminAPI } from './AdminContext.tsx';
import type { University } from '../../src/types/university.ts';

type Tab = 'universities' | 'logs' | 'settings';

interface Stats {
  total: number;
  avgCompleteness: number;
  lastUpdated: string | null;
}

export default function AdminDashboard() {
  const { adminInfo, logout } = useAdmin();
  const { fetchWithAuth } = useAdminAPI();
  
  const [activeTab, setActiveTab] = useState<Tab>('universities');
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<Stats>({ total: 0, avgCompleteness: 0, lastUpdated: null });
  const [_selectedId, _setSelectedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Загрузить университеты
  const loadUniversities = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      
      const response = await fetchWithAuth(`/api/admin/universities?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUniversities(data.data || []);
        
        // Calculate stats
        const total = data.pagination?.total || data.data?.length || 0;
        const completenessSum = (data.data || []).reduce(
          (acc: number, u: University) => acc + (u.metadata?.completeness_score || 0),
          0
        );
        setStats({
          total,
          avgCompleteness: total > 0 ? Math.round(completenessSum / total) : 0,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        setError(data.error || 'Failed to load universities');
      }
    } catch (_err) {
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUniversities();
  }, []);

  // Обработка поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUniversities();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Удалить университет
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить университет "${name}"?`)) return;

    setActionLoading(id);
    try {
      const response = await fetchWithAuth(`/api/admin/universities?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSuccessMessage(`Университет "${name}" удалён`);
        loadUniversities();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete');
      }
    } catch {
      setError('Connection error');
    } finally {
      setActionLoading(null);
    }
  };

  // Запустить обновление
  const handleUpdateNow = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetchWithAuth(`/api/admin/update-now?university_id=${id}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setSuccessMessage('Обновление запущено');
        setTimeout(loadUniversities, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to trigger update');
      }
    } catch {
      setError('Connection error');
    } finally {
      setActionLoading(null);
    }
  };

  // Скрыть сообщения
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div class="min-h-screen bg-gray-100">
      {/* Header */}
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <a 
                href="/"
                class="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                🏠 На главную
              </a>
              <h1 class="text-2xl font-bold text-gray-900">
                🎓 Админ-панель
              </h1>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-500">
                {adminInfo?.name || 'Admin'}
              </span>
              <button
                type="button"
                onClick={logout}
                class="text-sm text-red-600 hover:text-red-800"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('universities')}
              class={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'universities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📚 Университеты
            </button>
            <a
              href="/admin/logs"
              class="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700"
            >
              📋 Логи
            </a>
            <a
              href="/admin/settings"
              class="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700"
            >
              ⚙️ Настройки
            </a>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Messages */}
        {error && (
          <div class="mb-4 rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="text-sm text-red-700">{error}</div>
              <button type="button" onClick={() => setError(null)} class="ml-auto text-red-500">×</button>
            </div>
          </div>
        )}
        {successMessage && (
          <div class="mb-4 rounded-md bg-green-50 p-4">
            <div class="text-sm text-green-700">{successMessage}</div>
          </div>
        )}

        {activeTab === 'universities' && (
          <>
            {/* Stats */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="bg-white rounded-lg shadow p-6">
                <div class="text-sm text-gray-500">Всего университетов</div>
                <div class="text-3xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div class="bg-white rounded-lg shadow p-6">
                <div class="text-sm text-gray-500">Средняя заполненность</div>
                <div class="text-3xl font-bold text-blue-600">{stats.avgCompleteness}%</div>
              </div>
              <div class="bg-white rounded-lg shadow p-6">
                <div class="text-sm text-gray-500">Последнее обновление</div>
                <div class="text-lg font-medium text-gray-900">
                  {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString('ru') : '—'}
                </div>
              </div>
            </div>

            {/* Search & Actions */}
            <div class="flex justify-between items-center mb-4">
              <div class="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Поиск университетов..."
                  value={search}
                  onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div class="flex gap-2">
                <button
                  type="button"
                  onClick={loadUniversities}
                  class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  🔄 Обновить
                </button>
                <a
                  href="/admin/universities/new"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ➕ Добавить
                </a>
              </div>
            </div>

            {/* Universities List */}
            {isLoading ? (
              <div class="text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p class="mt-4 text-gray-500">Загрузка...</p>
              </div>
            ) : universities.length === 0 ? (
              <div class="text-center py-12 text-gray-500">
                Университеты не найдены
              </div>
            ) : (
              <div class="bg-white shadow rounded-lg overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Название
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Страна / Город
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Программ
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Заполненность
                      </th>
                      <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    {universities.map((uni) => (
                      <tr key={uni.id} class="hover:bg-gray-50">
                        <td class="px-6 py-4">
                          <div class="font-medium text-gray-900">{uni.name}</div>
                          {uni.name_en && (
                            <div class="text-sm text-gray-500">{uni.name_en}</div>
                          )}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">
                          {uni.country}, {uni.city}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900">
                          {uni.programs?.length || 0}
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center">
                            <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                class="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${uni.metadata?.completeness_score || 0}%` }}
                              ></div>
                            </div>
                            <span class="text-sm text-gray-600">
                              {uni.metadata?.completeness_score || 0}%
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4 text-right text-sm font-medium">
                          <div class="flex justify-end gap-2">
                            <a
                              href={`/admin/universities/${uni.id}`}
                              class="text-blue-600 hover:text-blue-900"
                            >
                              ✏️
                            </a>
                            <button
                              type="button"
                              onClick={() => handleUpdateNow(uni.id)}
                              disabled={actionLoading === uni.id}
                              class="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              {actionLoading === uni.id ? '⏳' : '🔄'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(uni.id, uni.name)}
                              disabled={actionLoading === uni.id}
                              class="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'logs' && (
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium mb-4">📋 Логи обновлений</h3>
            <p class="text-gray-500">Функционал в разработке...</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium mb-4">⚙️ Настройки</h3>
            <p class="text-gray-500">Функционал в разработке...</p>
          </div>
        )}
      </main>
    </div>
  );
}
