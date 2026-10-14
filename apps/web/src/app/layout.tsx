import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FAFAF7',
};

export const metadata: Metadata = {
  title: 'GenZ IITian | High-Performance Academic Platform',
  description: 'Targeted academic cohorts, live problem solving batches, and proctored exam prep for IIT Madras BS Degree.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GenZ IITian',
  },
  formatDetection: {
    telephone: false,
  },
};

/** The app shell stays intentionally small; role-aware navigation belongs to each product area. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full w-full max-w-[100vw] overflow-x-hidden bg-[#FAFAF7] dark:bg-[#111110] text-[#1A1A19] dark:text-[#F5F3EF] font-sans selection:bg-[#FDF0EB] selection:text-[#E05A33]">
        {children}
      </body>
    </html>
  );
}
