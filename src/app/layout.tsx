import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import { AppProvider } from '@/lib/appContext';

export const metadata: Metadata = {
  title: 'SRV Admin Panel',
  description: 'SRV Electricals Admin Panel — Manage electricians, dealers, products and rewards',
  icons: [
    { rel: 'icon', url: '/srv-logo.jpeg' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
