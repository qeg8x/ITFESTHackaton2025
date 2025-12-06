/**
 * Форма входа в админ-панель
 */

import { useState } from 'preact/hooks';
import { useAdmin } from './AdminContext.tsx';

export default function AdminLogin() {
  const { login, isLoading, error, clearError } = useAdmin();
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!key.trim()) return;
    
    const success = await login(key.trim());
    if (!success && !remember) {
      setKey('');
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            🔐 Админ-панель
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Введите ключ для доступа
          </p>
        </div>

        {/* Form */}
        <form class="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error message */}
          {error && (
            <div class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-red-800">{error}</p>
                </div>
                <div class="ml-auto pl-3">
                  <button
                    type="button"
                    onClick={clearError}
                    class="inline-flex text-red-400 hover:text-red-500"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div class="rounded-md shadow-sm -space-y-px">
            {/* Admin Key Input */}
            <div class="relative">
              <label for="admin-key" class="sr-only">
                Админ-ключ
              </label>
              <input
                id="admin-key"
                name="key"
                type={showKey ? 'text' : 'password'}
                required
                class="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Введите админ-ключ"
                value={key}
                onInput={(e) => setKey((e.target as HTMLInputElement).value)}
                disabled={isLoading}
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember checkbox */}
          <div class="flex items-center">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember((e.target as HTMLInputElement).checked)}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="remember" class="ml-2 block text-sm text-gray-900">
              Запомнить ключ
            </label>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !key.trim()}
              class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg class="h-5 w-5 text-blue-500 group-hover:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                  </svg>
                </span>
              )}
              {isLoading ? 'Проверка...' : 'Войти'}
            </button>
          </div>
        </form>

        {/* Help text */}
        <p class="mt-4 text-center text-xs text-gray-500">
          Ключ задаётся в переменной окружения ADMIN_KEY
        </p>
      </div>
    </div>
  );
}
