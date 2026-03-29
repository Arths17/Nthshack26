import React from 'react'
import '../src/index.css'
import { AuthProvider } from '../src/contexts/AuthContext'

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

