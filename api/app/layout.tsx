import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meshtastic API',
  description: 'REST API for Meshtastic MQTT data with JWT authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
