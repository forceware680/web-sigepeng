import './globals.css';
import Sidebar from '@/components/Sidebar';
import Providers from '@/components/Providers';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

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
    <html lang="id" className={inter.variable}>
      <body className={inter.className}>
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
