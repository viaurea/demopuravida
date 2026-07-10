import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Panel de Gestión · Asaf Transportation',
  description: 'Panel de conductores y documentación · Asaf Transportation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
