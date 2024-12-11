/* eslint-disable import/extensions */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import Head from 'next/head';
import { cn } from '@/lib/utils';
import '../styles/css.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>CyberChipped - AI Research Engine</title>
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="description" content="Your AI research engine!" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta httpEquiv="content-language" content="en" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <main className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.variable,
      )}
      >
        <Component {...pageProps} />
      </main>
    </>
  );
}

export default MyApp;
