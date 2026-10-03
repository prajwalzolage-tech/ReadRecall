import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { NavBar } from '@/components/nav-bar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ReadRecall — Active Recall & Comprehension Coach',
  description:
    'Read timed technical articles, write recall summaries from memory, and get instant 1–10 ratings evaluated by Jev with streamed AI tutor coaching.',
  keywords: [
    'active recall',
    'reading comprehension',
    'technical articles',
    'AI feedback',
    'Jev evaluation',
    'study tool',
  ],
  manifest: '/manifest.json',
  openGraph: {
    title: 'ReadRecall — Active Recall & Comprehension Coach',
    description:
      'Timed reading, memory recall summaries, and instant Jev-powered feedback.',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#fafaf9] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        <AuthProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    reg.update();
                  }).catch(function(e) {
                    console.log('SW registration skipped', e);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
