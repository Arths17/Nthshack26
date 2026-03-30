import React, { useEffect, useState } from 'react'

export default function DebugPage(){
  const [env, setEnv] = useState({});
  const [apiResult, setApiResult] = useState(null);

  useEffect(()=>{
    // Show presence of NEXT_PUBLIC_ and VITE_ env vars (do not print secret values)
    const keysNext = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
      'NEXT_PUBLIC_API_URL',
    ];
    const keysVite = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
      'VITE_FIREBASE_MEASUREMENT_ID',
      'VITE_API_URL',
    ];

    const foundNext = {};
    keysNext.forEach(k => { foundNext[k] = Boolean(process.env[k]); });
    const foundVite = {};
    keysVite.forEach(k => { foundVite[k] = Boolean(process.env[k]); });

    setEnv({ next: foundNext, vite: foundVite });

    // Try calling the stock endpoint; prefer an explicit API base if provided
    (async ()=>{
      try{
        const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || '';
        const fetchUrl = apiBase ? `${apiBase.replace(/\/+$/,'')}/api/stock/NVDA?timeframe=3M` : '/api/stock/NVDA?timeframe=3M';
        // eslint-disable-next-line no-console
        console.log('[Debug] Fetching URL:', fetchUrl);
        const res = await fetch(fetchUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        const text = await res.text();
        setApiResult({ url: fetchUrl, status: res.status, body: text ? text.slice(0, 2000) : '' });
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
