import React from "react";
import Head from "next/head";
import "../src/index.css";
import { AuthProvider } from "../src/contexts/AuthContext";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Quanta — AI Trading Terminal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <meta name="theme-color" content="#030712" />
        <meta name="description" content="Institutional-grade analysis for everyone. Live market data, AI-powered verdicts, and paper trading — built for traders who mean business." />
        <meta name="keywords" content="trading, stocks, AI, paper trading, market analysis, investing, finance" />
        <meta property="og:title" content="Quanta — AI Trading Terminal" />
        <meta property="og:description" content="Institutional-grade analysis for everyone. Live market data, AI-powered verdicts, and paper trading." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Quanta — AI Trading Terminal" />
        <meta name="twitter:description" content="Institutional-grade analysis for everyone. Live market data, AI-powered verdicts, and paper trading." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}

