import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css'; // Global styles

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KampusKreatif AI - Social Media Assistant & Copywriter Mahasiswa/BEM/HIMA',
  description: 'Asisten Kreatif & Social Media Strategist khusus mahasiswa, BEM, HIMA, dan UKM untuk membuat ide konten dan copywriting/caption.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased bg-slate-50 text-slate-800 min-h-screen">
        {children}
      </body>
    </html>
  );
}
