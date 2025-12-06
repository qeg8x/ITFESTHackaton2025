/**
 * Страница настроек админ-панели
 */

import { useState } from 'preact/hooks';
import { useAdmin, useAdminAPI } from './AdminContext.tsx';

export default function AdminSettings() {
  const { adminInfo, logout } = useAdmin();
  const { fetchWithAuth } = useAdminAPI();

  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [workerEnabled, setWorkerEnabled] = useState(true);
  const [workerInterval, setWorkerInterval] = useState(24);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const testOllama = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetchWithAuth('/api/parser');
      const data = await response.json();
      if (data.ollama_available) {
        setTestResult('✓ Ollama доступна');
      } else {
        setTestResult('✗ Ollama недоступна');
      }
    } catch {
      setTestResult('✗ Ошибка соединения');
    } finally {
      setIsTesting(false);
    }
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
              <h1 class="text-2xl font-bold text-gray-900">⚙️ Настройки</h1>
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
          <li class="text-gray-900">Настройки</li>
        </ol>
      </nav>

      {/* Content */}
      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Admin Info */}
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-medium mb-4">👤 Текущий админ</h2>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Имя:</span>
              <span class="ml-2 font-medium">{adminInfo?.name || 'Admin'}</span>
            </div>
            <div>
              <span class="text-gray-500">Email:</span>
              <span class="ml-2">{adminInfo?.email || '—'}</span>
            </div>
            <div>
              <span class="text-gray-500">Права:</span>
              <span class="ml-2">
                {adminInfo?.permissions?.join(', ') || 'full_access'}
              </span>
            </div>
          </div>
        </div>

        {/* Ollama Settings */}
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-medium mb-4">🤖 Ollama AI</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">URL сервера</label>
              <div class="mt-1 flex gap-2">
                <input
                  type="url"
                  value={ollamaUrl}
                  onInput={(e) => setOllamaUrl((e.target as HTMLInputElement).value)}
                  class="flex-1 p-2 border rounded"
                  placeholder="http://localhost:11434"
                />
                <button
                  type="button"
                  onClick={testOllama}
                  disabled={isTesting}
                  class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isTesting ? '...' : 'Тест'}
                </button>
              </div>
              {testResult && (
                <p class={`mt-2 text-sm ${testResult.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult}
                </p>
              )}
            </div>
            <p class="text-xs text-gray-500">
              Настраивается через переменную окружения OLLAMA_URL
            </p>
          </div>
        </div>

        {/* Worker Settings */}
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-medium mb-4">🔄 Автообновление</h2>
          <div class="space-y-4">
            <div class="flex items-center">
              <input
                id="worker-enabled"
                type="checkbox"
                checked={workerEnabled}
                onChange={(e) => setWorkerEnabled((e.target as HTMLInputElement).checked)}
                class="h-4 w-4 text-blue-600 rounded"
              />
              <label for="worker-enabled" class="ml-2 text-sm text-gray-700">
                Включить фоновое обновление
              </label>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">
                Интервал обновления (часы)
              </label>
              <input
                type="number"
                value={workerInterval}
                onInput={(e) => setWorkerInterval(parseInt((e.target as HTMLInputElement).value))}
                min={1}
                max={168}
                class="mt-1 w-32 p-2 border rounded"
              />
            </div>
            <p class="text-xs text-gray-500">
              Настраивается через переменные UPDATE_WORKER_ENABLED и UPDATE_INTERVAL_HOURS
            </p>
          </div>
        </div>

        {/* Database Info */}
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-medium mb-4">🗄️ База данных</h2>
          <div class="text-sm text-gray-600">
            <p>PostgreSQL подключение настраивается через DATABASE_URL</p>
            <p class="mt-2 text-xs text-gray-400">
              Пример: postgresql://user:pass@localhost:5432/digital_university
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div class="bg-white rounded-lg shadow p-6 border-2 border-red-200">
          <h2 class="text-lg font-medium mb-4 text-red-600">⚠️ Опасная зона</h2>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-medium">Очистить кэш парсера</p>
                <p class="text-sm text-gray-500">Удалит все закэшированные промпты</p>
              </div>
              <button
                type="button"
                class="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                onClick={() => alert('Функция в разработке')}
              >
                Очистить
              </button>
            </div>
            <div class="flex justify-between items-center">
              <div>
                <p class="font-medium">Пересканировать все сайты</p>
                <p class="text-sm text-gray-500">Запустит парсинг всех университетов</p>
              </div>
              <button
                type="button"
                class="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                onClick={() => alert('Функция в разработке')}
              >
                Запустить
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
