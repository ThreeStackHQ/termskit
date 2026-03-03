import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TermsKit',
  description: 'ToS & Policy Acceptance Tracking API for indie SaaS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
