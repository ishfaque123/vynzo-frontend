import './globals.css';
import type { Viewport } from 'next';
import Shell from '@/components/Shell';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata = {
  title: 'Frianzo',
  description: 'Frianzo — share your moments',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <Shell>{children}</Shell>
        </ThemeProvider>
      </body>
    </html>
  );
}
