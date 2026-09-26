import './globals.css';
import type { Metadata, Viewport } from 'next';
import Shell from '@/components/Shell';
import ThemeProvider from '@/components/ThemeProvider';
import { FollowProvider } from '@/contexts/FollowContext';
import OfflineServiceWorker from '@/components/OfflineServiceWorker';
import { fetchSeoSettings } from '@/lib/api/settingsApi';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSeoSettings();
  return {
    title: settings?.seoTitle || 'Frianzo',
    description: settings?.seoDescription || 'Frianzo — share your moments',
    keywords: settings?.seoKeywords || undefined,
  };
}

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
        <OfflineServiceWorker />
        <ThemeProvider>
          <FollowProvider>
            <Shell>{children}</Shell>
          </FollowProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
