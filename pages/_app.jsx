import React from 'react'
import '../src/index.css'
import { AuthProvider } from '../src/contexts/AuthContext'
import { Analytics } from '@vercel/analytics/next'

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Analytics />
    </AuthProvider>
  )
}

