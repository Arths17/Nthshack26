import dynamic from 'next/dynamic'
const ScreenerPage = dynamic(() => import('../src/pages/ScreenerPage'), { ssr: false })
export default function Screener(props) { return <ScreenerPage {...props} /> }
