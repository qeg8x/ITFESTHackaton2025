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
    <div class="min-h-screen bg-dark-900">
      {/* Header */}
      <header class="bg-dark-800 border-b border-dark-600">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <a href="/admin" class="text-cyber-400 hover:text-cyber-300">
                ← Назад
              </a>
              <h1 class="text-2xl font-bold text-white">📋 Логи действий</h1>
            </div>
            <button
              type="button"
              onClick={logout}
              class="text-sm text-red-400 hover:text-red-300"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol class="flex items-center space-x-2 text-sm text-gray-500">
          <li><a href="/admin" class="hover:text-cyber-400">Админ</a></li>
          <li>/</li>
          <li class="text-white">Логи</li>
        </ol>
      </nav>

      {/* Content */}
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div class="bg-dark-800 rounded-lg border border-dark-600 p-4 mb-6">
          <div class="flex flex-wrap gap-4 items-center">
            <div class="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-cyber-500 focus:border-cyber-500 placeholder-gray-500"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction((e.target as HTMLSelectElement).value as FilterAction)}
              class="px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg"
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
              class="px-4 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 border border-dark-600"
            >
              🔄 Обновить
            </button>
            <button
              type="button"
              onClick={exportCSV}
              class="px-4 py-2 bg-matrix-500 text-dark-900 font-medium rounded-lg hover:bg-matrix-400"
            >
              📥 Экспорт CSV
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div class="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
            {error}
            <button type="button" onClick={() => setError(null)} class="ml-2">×</button>
          </div>
        )}

        {/* Logs Table */}
        {isLoading ? (
          <div class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-500 mx-auto"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div class="text-center py-12 text-gray-500">
            Логи не найдены
          </div>
        ) : (
          <div class="bg-dark-800 border border-dark-600 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-dark-600">
                <thead class="bg-dark-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Время
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Админ
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Действие
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Ресурс
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Статус
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Детали
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-dark-800 divide-y divide-dark-600">
                  {filteredLogs.map((log, idx) => (
                    <tr key={idx} class="hover:bg-dark-700">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(log.timestamp).toLocaleString('ru')}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-white">
                          {log.admin_name || 'Admin'}
                        </div>
                        <div class="text-xs text-gray-500">{log.admin_key_masked}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`px-2 py-1 text-xs rounded ${
                          log.action.includes('create') ? 'bg-green-500/20 text-green-400' :
                          log.action.includes('delete') ? 'bg-red-500/20 text-red-400' :
                          log.action.includes('update') ? 'bg-cyber-500/20 text-cyber-400' :
                          'bg-dark-600 text-gray-400'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {log.resource_type}
                        {log.resource_id && (
                          <span class="text-xs text-gray-500 ml-1">
                            #{log.resource_id.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        {log.success ? (
                          <span class="text-green-400">✓ OK</span>
                        ) : (
                          <span class="text-red-400">✗ Error</span>
                        )}
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500">
                        {log.details && (
                          <button
                            type="button"
                            onClick={() => alert(JSON.stringify(log.details, null, 2))}
                            class="text-cyber-400 hover:underline"
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
