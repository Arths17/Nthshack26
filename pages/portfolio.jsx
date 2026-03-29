import dynamic from 'next/dynamic'
const PortfolioPage = dynamic(() => import('../src/pages/PortfolioPage'), { ssr: false })
export default function Portfolio(props) { return <PortfolioPage {...props} /> }
