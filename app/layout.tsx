import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Noviq Academy Admin',
  description: 'Admin portal for Noviq Academy.',
  openGraph: {
    title: 'Noviq Academy Admin',
    description: 'Admin portal for Noviq Academy.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noviq Academy Admin',
    description: 'Admin portal for Noviq Academy.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
