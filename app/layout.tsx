import './globals.css';
import type { Metadata } from 'next';
import Script from "next/script";

export const metadata: Metadata = {
  title: 'GROQCHAT — Dungeon Master Chat',
  description: 'A simple Groq-powered Dungeon Master chatbot.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://cloud.umami.is/script.js"
          strategy="afterInteractive"
          data-website-id="__UMAMI_WEBSITE_ID__"
          data-do-not-track="true"
          data-performance="true"
          data-exclude-hash="true"
          data-tag="groqchat"
        />
      </body>
    </html>
  );
}
