import React, { useEffect, useState } from 'react'

export default function DebugPage(){
  const [env, setEnv] = useState({});
  const [apiResult, setApiResult] = useState(null);

  useEffect(()=>{
    // Show which NEXT_PUBLIC_ env vars are defined (presence only)
    const keys = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'NEXT_PUBLIC_API_URL',
    ];
    const found = {};
    keys.forEach(k => { found[k] = Boolean(process.env[k]); });
    setEnv(found);

    // Try calling the stock endpoint on same origin
    (async ()=>{
      try{
        const res = await fetch('/api/stock/NVDA?timeframe=3M');
        const text = await res.text();
        setApiResult({ status: res.status, body: text.slice(0, 2000) });
      }catch(e){
        setApiResult({ error: String(e) });
      }
    })();
  },[]);

  return (
    <div style={{padding:20,fontFamily:'system-ui,Arial'}}>
      <h1>Debug</h1>
      <h2>Public env presence</h2>
      <pre>{JSON.stringify(env,null,2)}</pre>
      <h2>/api/stock/NVDA fetch</h2>
      <pre>{JSON.stringify(apiResult,null,2)}</pre>
      <p>Note: This page is temporary for debugging deployment env and backend reachability.</p>
    </div>
  )
}
