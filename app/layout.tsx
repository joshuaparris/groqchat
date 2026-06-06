import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GROQCHAT — Dungeon Master Chat',
  description: 'A simple Groq-powered Dungeon Master chatbot.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
