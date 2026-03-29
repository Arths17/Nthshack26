import dynamic from 'next/dynamic'
const StrategyLibrary = dynamic(() => import('../src/pages/StrategyLibrary'), { ssr: false })
export default function StrategyLibraryPage(props) { return <StrategyLibrary {...props} /> }
