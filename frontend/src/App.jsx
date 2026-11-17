import { useEffect, useState } from 'react';
import { Activity, ChartNoAxesCombined, Search, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const API = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const fmt = (value, digits=2) => value == null ? 'N/A' : Number(value).toLocaleString(undefined, {maximumFractionDigits:digits});

function Plot({data, lines, title, height=280}) {
  return <section className="panel"><h3>{title}</h3><div style={{width:'100%',height}}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{top:8,right:15,left:0,bottom:5}}>
        <CartesianGrid stroke="#27364b" strokeDasharray="3 3" />
        <XAxis dataKey="date" stroke="#aebbd4" minTickGap={45} tickFormatter={v=>v.slice(5)} />
        <YAxis stroke="#aebbd4" domain={['auto','auto']} width={65} tickFormatter={v=>fmt(v,1)}/>
        <Tooltip contentStyle={{background:'#172337',border:'1px solid #38506b'}} />
        <Legend />
        {lines.map(({key,color,name})=><Line key={key} type="monotone" dataKey={key} name={name} stroke={color} dot={false} strokeWidth={2} connectNulls={false} />)}
      </LineChart>
    </ResponsiveContainer>
  </div></section>;
}

export default function App() {
  const [health,setHealth] = useState('Checking...');
  const [ticker,setTicker] = useState('AAPL');
  const [period,setPeriod] = useState('1y');
  const [result,setResult] = useState(null);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(false);
  useEffect(()=>{
    const controller = new AbortController();
    fetch(`${API}/health`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Health check failed');return r.json()})
      .then(d=>setHealth(d.status==='ok'?'Connected':'Unexpected response'))
      .catch(e=>{if(e.name!=='AbortError')setHealth('Offline')});
    return ()=>controller.abort();
  },[]);
  async function search(e) {
    e.preventDefault();setError('');setResult(null);
    const symbol=ticker.trim().toUpperCase();
    if(!/^[A-Z0-9^][A-Z0-9.^-]{0,19}$/.test(symbol)){setError('Enter a valid ticker, such as AAPL or RELIANCE.NS');return;}
    setLoading(true);
    try {
      const response=await fetch(`${API}/api/v1/stocks/${encodeURIComponent(symbol)}?period=${period}`);
      const data=await response.json();
      if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:`Request failed: HTTP ${response.status}`);
      setResult(data);
    } catch(e) {setError(e instanceof TypeError?'Cannot reach FastAPI. Check port 8000 and CORS.':e.message)}
    finally {setLoading(false)}
  }
  const indicators=result?.indicators;
  return <main className="shell">
    <header><div className="brand"><ChartNoAxesCombined size={30}/><span>Agent<span className="accent">Vest</span></span></div><span className="tag">Major Project · Phase 3</span></header>
    <section className="hero"><p className="eyebrow">MULTI-AGENT INVESTMENT RESEARCH</p><h1>Financial intelligence,<br/><span className="accent">built on evidence.</span></h1>
      <p>Explore historical stock prices and technical indicators. News, financial filings, and AI synthesis will be added in subsequent phases.</p>
      <form onSubmit={search}><Search size={20}/><input aria-label="Stock ticker" value={ticker} onChange={e=>setTicker(e.target.value)} placeholder="AAPL or RELIANCE.NS" required />
        <select aria-label="History period" value={period} onChange={e=>setPeriod(e.target.value)}><option value="6mo">6 months</option><option value="1y">1 year</option><option value="2y">2 years</option><option value="5y">5 years</option></select>
        <button type="submit" disabled={loading}>{loading?'Loading...':'Analyze stock'}</button></form>
      {error&&<div className="error" role="alert">{error}</div>}
    </section>
    {result&&<section className="results">
      <div className="result-heading"><div><p className="eyebrow">STOCK ANALYSIS</p><h2>{result.symbol} <span className="subtle">· {result.as_of}</span></h2></div><span className="trend">{result.trend.replace('_',' ')}</span></div>
      <p className="subtle">Prices are adjusted historical values. Currency is not verified by this data source; check the listing currency before interpreting amounts.</p>
      <div className="metrics">
        {[["Last close",fmt(result.price)],["Daily change",`${fmt(result.change)} (${fmt(result.change_percent)}%)`],["Period return",`${fmt(result.period_return_percent)}%`],["Annualized volatility",`${fmt(result.annualized_volatility_percent)}%`],["RSI (14)",fmt(indicators.rsi14)],["SMA (50)",fmt(indicators.sma50)]].map(([label,value])=><article key={label}><small>{label}</small><strong>{value}</strong></article>)}
      </div>
      <Plot data={result.history} title="Price, moving averages & Bollinger Bands" lines={[{key:'close',name:'Close',color:'#68e0bc'},{key:'sma20',name:'SMA 20',color:'#ffca74'},{key:'sma50',name:'SMA 50',color:'#92a9ff'},{key:'bb_upper',name:'Upper band',color:'#ad8ad6'},{key:'bb_lower',name:'Lower band',color:'#ad8ad6'}]}/>
      <div className="chart-grid"><Plot data={result.history} title="RSI (14)" height={230} lines={[{key:'rsi14',name:'RSI',color:'#ffca74'}]}/><Plot data={result.history} title="MACD" height={230} lines={[{key:'macd',name:'MACD',color:'#68e0bc'},{key:'macd_signal',name:'Signal',color:'#ffca74'}]}/></div>
      <section className="panel"><h3>Technical research summary</h3><ul>{result.summary.map((s,i)=><li key={i}>{s}</li>)}</ul><p className="subtle">{result.disclaimer}</p></section>
    </section>}
    <section className="cards"><article><Activity/><h3>Price Analysis</h3><p>Technical indicators and risk metrics</p><small>Phase 3 · Implemented</small></article><article><Search/><h3>News Intelligence</h3><p>Financial headlines and sentiment</p><small>Phase 4</small></article><article><ShieldCheck/><h3>Report Research</h3><p>Evidence-backed financial report Q&A</p><small>Phase 5</small></article></section>
    <footer>Backend status: <span className={health==='Connected'?'good':'muted'}>{health}</span> · Historical technical research only, not financial advice.</footer>
  </main>;
}
