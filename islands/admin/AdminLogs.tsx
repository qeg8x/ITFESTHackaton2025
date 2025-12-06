/**
 * Страница логов админ-действий
 */

import { useState, useEffect } from 'preact/hooks';
import { useAdmin, useAdminAPI } from './AdminContext.tsx';

interface LogEntry {
  id?: string;
  admin_key_masked: string;
  admin_name?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  success: boolean;
  timestamp: string;
}

type FilterAction = 'all' | 'create' | 'update' | 'delete' | 'view';

export default function AdminLogs() {
  const { logout } = useAdmin();
  const { fetchWithAuth } = useAdminAPI();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<FilterAction>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      // Используем API для получения логов из update_logs
      const response = await fetchWithAuth('/api/admin/universities?limit=1');
      if (response.ok) {
        // Пока заглушка - в реальности нужен отдельный API
        setLogs([
          {
            admin_key_masked: 'dev-...key',
            admin_name: 'Admin',
            action: 'view_data',
            resource_type: 'universities',
            success: true,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setError('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'all' && !log.action.includes(filterAction)) {
      return false;
    }
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(searchLower) ||
        log.resource_type.toLowerCase().includes(searchLower) ||
        log.admin_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Время', 'Админ', 'Действие', 'Ресурс', 'ID', 'Статус'];
    const rows = filteredLogs.map((log) => [
      new Date(log.timestamp).toLocaleString('ru'),
      log.admin_name || log.admin_key_masked,
      log.action,
      log.resource_type,
      log.resource_id || '',
      log.success ? 'OK' : 'Error',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div class="min-h-screen bg-gray-100">
      {/* Header */}
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <a href="/admin" class="text-blue-600 hover:text-blue-800">
                ← Назад
              </a>
              <h1 class="text-2xl font-bold text-gray-900">📋 Логи действий</h1>
            </div>
            <button
              type="button"
              onClick={logout}
              class="text-sm text-red-600 hover:text-red-800"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol class="flex items-center space-x-2 text-sm text-gray-500">
          <li><a href="/admin" class="hover:text-blue-600">Админ</a></li>
          <li>/</li>
          <li class="text-gray-900">Логи</li>
        </ol>
      </nav>

      {/* Content */}
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="flex flex-wrap gap-4 items-center">
            <div class="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction((e.target as HTMLSelectElement).value as FilterAction)}
              class="px-4 py-2 border rounded-lg"
            >
              <option value="all">Все действия</option>
              <option value="create">Создание</option>
              <option value="update">Обновление</option>
              <option value="delete">Удаление</option>
              <option value="view">Просмотр</option>
            </select>
            <button
              type="button"
              onClick={loadLogs}
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              🔄 Обновить
            </button>
            <button
              type="button"
              onClick={exportCSV}
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📥 Экспорт CSV
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div class="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
            <button type="button" onClick={() => setError(null)} class="ml-2">×</button>
          </div>
        )}

        {/* Logs Table */}
        {isLoading ? (
          <div class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div class="text-center py-12 text-gray-500">
            Логи не найдены
          </div>
        ) : (
          <div class="bg-white shadow rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Время
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Админ
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Действие
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ресурс
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Статус
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Детали
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log, idx) => (
                    <tr key={idx} class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString('ru')}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">
                          {log.admin_name || 'Admin'}
                        </div>
                        <div class="text-xs text-gray-500">{log.admin_key_masked}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`px-2 py-1 text-xs rounded ${
                          log.action.includes('create') ? 'bg-green-100 text-green-800' :
                          log.action.includes('delete') ? 'bg-red-100 text-red-800' :
                          log.action.includes('update') ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.resource_type}
                        {log.resource_id && (
                          <span class="text-xs text-gray-400 ml-1">
                            #{log.resource_id.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        {log.success ? (
                          <span class="text-green-600">✓ OK</span>
                        ) : (
                          <span class="text-red-600">✗ Error</span>
                        )}
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500">
                        {log.details && (
                          <button
                            type="button"
                            onClick={() => alert(JSON.stringify(log.details, null, 2))}
                            class="text-blue-600 hover:underline"
                          >
                            Показать
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
