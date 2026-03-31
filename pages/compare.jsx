import dynamic from 'next/dynamic'
const ComparePage = dynamic(() => import('../src/pages/ComparePage'), { ssr: false })
export default function Compare(props) { return <ComparePage {...props} /> }
