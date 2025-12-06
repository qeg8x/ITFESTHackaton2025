/**
 * Главная страница админ-панели
 */

import { Head } from '$fresh/runtime.ts';
import AdminWrapper from '../../islands/admin/AdminWrapper.tsx';

export default function AdminPage() {
  return (
    <>
      <Head>
        <title>Админ-панель | Цифровой университет</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminWrapper page="dashboard" />
    </>
  );
}
