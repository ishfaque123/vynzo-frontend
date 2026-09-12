import './globals.css';
import type { Viewport } from 'next';
import Script from 'next/script';
import Shell from '@/components/Shell';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata = {
  title: 'Friendzo',
  description: 'Friendzo — share your moments',
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
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8689135580842158"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <ThemeProvider>
          <Shell>{children}</Shell>
        </ThemeProvider>
      </body>
    </html>
  );
}
