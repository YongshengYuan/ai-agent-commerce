import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI-Agent Shop',
  description: 'AI-Agent友好的跨境电商',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
