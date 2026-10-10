import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LMS | Learn with structure',
  description: 'A focused home for discovering courses and learning online.',
};

/** The app shell stays intentionally small; role-aware navigation belongs to each product area. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
