import './globals.css';
import Sidebar from '@/components/Sidebar';
import Providers from '@/components/Providers';

export const metadata = {
  title: {
    default: 'SIMASET WIKI',
    template: '%s - SIMASET WIKI'
  },
  description: 'Panduan lengkap penggunaan Sistem Informasi Manajemen Aset',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
