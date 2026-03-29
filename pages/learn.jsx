import dynamic from 'next/dynamic'
const LearnPage = dynamic(() => import('../src/pages/LearnPage'), { ssr: false })
export default function Learn(props) { return <LearnPage {...props} /> }
