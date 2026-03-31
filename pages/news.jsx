import dynamic from 'next/dynamic'
const NewsPage = dynamic(() => import('../src/pages/NewsPage'), { ssr: false })
export default function News(props) { return <NewsPage {...props} /> }
