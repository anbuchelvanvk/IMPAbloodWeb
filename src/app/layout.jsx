import './globals.css';
import { Suspense } from 'react';
import AppProviders from '../components/AppProviders';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: "IMPA",
  description: 'Blood donation platform'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <div className="flex-col" style={{ minHeight: '100vh' }}>
            <Suspense fallback={<div style={{ height: '64px', background: 'white', borderBottom: '1px solid var(--border)' }} />}>
              <Navbar />
            </Suspense>
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
