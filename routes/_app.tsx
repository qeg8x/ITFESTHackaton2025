import { type PageProps } from '$fresh/server.ts';

/**
 * Корневой layout приложения
 * Тёмная технологическая тема
 */
export default function App({ Component }: PageProps) {
  return (
    <html lang="ru" class="scroll-smooth">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* SEO */}
        <meta name="theme-color" content="#0a0f1a" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Цифровой университет" />
        <meta name="color-scheme" content="dark" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Custom styles - Dark Tech Theme */}
        <style dangerouslySetInnerHTML={{ __html: `
          html {
            color-scheme: dark;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0a0f1a;
            color: #f3f4f6;
          }
          
          /* Grid background pattern */
          .bg-grid {
            background-image: 
              linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px);
            background-size: 40px 40px;
          }
          
          /* Custom scrollbar - Dark */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #111827;
          }
          ::-webkit-scrollbar-thumb {
            background: #374151;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #0891b2;
          }
          
          /* Scrollbar Firefox */
          * {
            scrollbar-width: thin;
            scrollbar-color: #374151 #111827;
          }
          
          /* Selection */
          ::selection {
            background: rgba(6, 182, 212, 0.3);
            color: white;
          }
          
          /* Text gradient */
          .text-gradient {
            background: linear-gradient(to right, #22d3ee, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          /* Glow effects */
          .shadow-glow {
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
          }
          .shadow-glow-sm {
            box-shadow: 0 0 10px rgba(6, 182, 212, 0.15);
          }
          
          /* Animations */
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite linear;
            background: linear-gradient(90deg, #1a2332 25%, #243044 50%, #1a2332 75%);
            background-size: 200% 100%;
          }
          
          /* Focus styles - cyber glow */
          *:focus-visible {
            outline: 2px solid #06b6d4;
            outline-offset: 2px;
          }
        `}} />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body class="bg-dark-900 text-gray-100 antialiased min-h-screen">
        <Component />
      </body>
    </html>
  );
}
