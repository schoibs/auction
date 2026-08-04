import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppHeader } from '../components/app-header/app-header';
import { NotificationRegion } from '../components/notification-region/notification-region';
import { AuthProvider } from '../contexts/auth-context';
import { RealtimeProvider } from '../contexts/realtime-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Auction',
  description: 'Browse and bid on virtual trading cards.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <RealtimeProvider>
            <a className="skip-link" href="#main-content">
              Skip to main content
            </a>
            <AppHeader />
            <NotificationRegion />
            {children}
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
