import './globals.css';
import Shell from '@/components/Shell';

export const metadata = {
  title: 'Vynzo',
  description: 'Vynzo — share your moments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
