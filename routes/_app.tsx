import { type PageProps } from '$fresh/server.ts';

/**
 * Корневой layout приложения
 * Содержит общие meta tags, стили и структуру
 */
export default function App({ Component }: PageProps) {
  return (
    <html lang="ru" class="scroll-smooth">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* SEO */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Цифровой университет" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Tailwind CSS via twind - стили генерируются автоматически */}
        
        {/* Custom styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
          }
          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          
          /* Animations */
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          
          /* Focus styles */
          *:focus-visible {
            outline: 2px solid #2563eb;
            outline-offset: 2px;
          }
        `}} />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body class="bg-gray-50 text-gray-900 antialiased min-h-screen">
        <Component />
      </body>
    </html>
  );
}
