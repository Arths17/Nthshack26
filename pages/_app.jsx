import React from "react";
import Head from "next/head";
import "../src/index.css";
import { AuthProvider } from "../src/contexts/AuthContext";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#060b18" />
        <meta name="description" content="Quanta — AI-powered paper trading terminal with live market data." />
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}

