import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'TermsKit — ToS & Policy Acceptance Tracking',
    template: '%s | TermsKit',
  },
  description: 'Track who accepted your Terms of Service. One API call. Hosted gate pages. Re-acceptance campaigns. Built for indie SaaS.',
  metadataBase: new URL('https://termskit.threestack.io'),
  openGraph: {
    title: 'TermsKit — ToS & Policy Acceptance Tracking',
    description: 'Track who accepted your Terms of Service. One API call. Built for indie SaaS.',
    url: 'https://termskit.threestack.io',
    siteName: 'TermsKit',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TermsKit',
    description: 'Track who accepted your Terms of Service. One API call.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-950 text-white antialiased font-sans">{children}</body>
    </html>
  );
}
