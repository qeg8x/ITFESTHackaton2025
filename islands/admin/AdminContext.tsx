/**
 * Контекст админ-аутентификации
 */

import { createContext } from 'preact';
import { useContext, useState, useEffect, useCallback } from 'preact/hooks';
import { JSX } from 'preact';

/**
 * Информация об админе
 */
interface AdminInfo {
  name: string;
  email?: string;
  permissions: string[];
}

/**
 * Контекст админа
 */
interface AdminContextType {
  adminKey: string | null;
  adminInfo: AdminInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

const STORAGE_KEY = 'admin_key';

/**
 * Provider для админ контекста
 */
export const AdminProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузить ключ из localStorage при инициализации
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      validateKey(stored);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Проверить ключ на сервере
  const validateKey = async (key: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/universities?limit=1', {
        headers: { 'X-Admin-Key': key },
      });

      if (response.ok) {
        setAdminKey(key);
        setAdminInfo({ name: 'Admin', permissions: ['full_access'] });
        localStorage.setItem(STORAGE_KEY, key);
        setIsLoading(false);
        return true;
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid admin key');
        localStorage.removeItem(STORAGE_KEY);
        setIsLoading(false);
        return false;
      }
    } catch (_err) {
      setError('Connection error');
      setIsLoading(false);
      return false;
    }
  };

  const login = useCallback(async (key: string): Promise<boolean> => {
    return await validateKey(key);
  }, []);

  const logout = useCallback(() => {
    setAdminKey(null);
    setAdminInfo(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AdminContext.Provider
      value={{
        adminKey,
        adminInfo,
        isAuthenticated: !!adminKey,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

/**
 * Hook для использования админ контекста
 */
export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};

/**
 * API helper с админ-ключом
 */
export const useAdminAPI = () => {
  const { adminKey } = useAdmin();

  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers);
      if (adminKey) {
        headers.set('X-Admin-Key', adminKey);
      }
      headers.set('Content-Type', 'application/json');

      const response = await fetch(url, {
        ...options,
        headers,
      });

      return response;
    },
    [adminKey]
  );

  return { fetchWithAuth };
};
