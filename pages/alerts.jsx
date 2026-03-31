import dynamic from 'next/dynamic'
const AlertsPage = dynamic(() => import('../src/pages/AlertsPage'), { ssr: false })
export default function Alerts(props) { return <AlertsPage {...props} /> }
