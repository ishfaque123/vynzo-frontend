import './globals.css';
import Shell from '@/components/Shell';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata = {
  title: 'Vynzo',
  description: 'Vynzo — share your moments',
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
