import { WATCHLIST_SYMBOLS, TRADING } from "./constants";

export const f2 = n => n!=null ? n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : "—";
export const fB = n => !n?"—":n>=1e12?`$${(n/1e12).toFixed(2)}T`:n>=1e9?`$${(n/1e9).toFixed(1)}B`:`$${(n/1e6).toFixed(0)}M`;
export const fV = n => !n?"—":n>=1e9?`${(n/1e9).toFixed(1)}B`:n>=1e6?`${(n/1e6).toFixed(1)}M`:`${(n/1e3).toFixed(0)}K`;
export const sma = (arr,n) => arr.map((_,i)=>i<n-1?null:arr.slice(i-n+1,i+1).reduce((s,v)=>s+(v?.close??0),0)/n);

export const SYMBOLS = WATCHLIST_SYMBOLS;
