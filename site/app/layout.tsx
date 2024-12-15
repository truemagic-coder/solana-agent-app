/* eslint-disable import/extensions */

'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import '../styles/css.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Solana Agent</title>
        <meta name="description" content="Your Solana Agent!" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta httpEquiv="content-language" content="en" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="msapplication-TileColor" content="#111827" />
        <meta name="theme-color" content="#111827" />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.variable,
      )}
      >
        <main>{children}</main>
      </body>
    </html>
  );
}
