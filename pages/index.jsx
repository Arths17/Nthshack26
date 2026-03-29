import dynamic from 'next/dynamic'
// Import App as client component
const App = dynamic(() => import('../src/App'), { ssr: false })

export default function Home() {
  return <App />
}

