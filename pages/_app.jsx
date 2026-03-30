import React from 'react'
import '../src/index.css'
import { AuthProvider } from '../src/contexts/AuthContext'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <SpeedInsights />
    </AuthProvider>
  )
}

