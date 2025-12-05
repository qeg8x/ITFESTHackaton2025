import { Head } from '$fresh/runtime.ts';
import HomePage from '../islands/HomePage.tsx';

/**
 * Главная страница приложения "Цифровой университет"
 * Использует интерактивный island с поиском и просмотром профиля
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
      <HomePage />
    </>
  );
}
