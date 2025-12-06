import { Head } from '$fresh/runtime.ts';
import MainPage from '../islands/MainPage.tsx';

/**
 * Главная страница приложения "Цифровой университет"
 * Использует tab-based интерфейс с AI-поиском, базой, сравнением и чатом
 */
export default function Home() {
  return (
    <>
      <Head>
        <title>Цифровой университет — Платформа выбора вуза</title>
        <meta name="description" content="Найдите идеальный университет: программы, стоимость, требования к поступлению. Данные обновляются автоматически с помощью AI." />
        <meta property="og:title" content="Цифровой университет" />
        <meta property="og:description" content="Платформа для выбора университета и сравнения образовательных программ" />
        <meta property="og:image" content="/og-image.png" />
      </Head>
      <MainPage />
    </>
  );
}
