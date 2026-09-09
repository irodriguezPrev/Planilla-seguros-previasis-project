import type { Metadata } from 'next';
import {AppProviders} from '@/features/context/AppProviders';
import { Navbar } from '@/core/components/common/Navbar';
import { Footer } from '@/core/components/common/Footer';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'PREVIASIS Medicina Prepagada S.A. | Solicitud de Afiliación Digital',
  description: 'Plataforma oficial de afiliación digital y emisión de pólizas autorizada por Sudeaseg (Providencia Nº SAA-09-1585).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
        <AppProviders>
          <Navbar />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {children}
            </main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
