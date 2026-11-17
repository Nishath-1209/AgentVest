import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
const API = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const COLORS = { positive: '#68e0bc', negative: '#ff9090', neutral: '#ffca74' };
export default function NewsPanel({ symbol }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!symbol) return;
    const controller = new AbortController();
    setLoading(true); setError(''); setData(null);
    fetch(`${API}/api/v1/news/${encodeURIComponent(symbol)}?days=7`, { signal: controller.signal })
      .then(async r => { const body = await r.json(); if (!r.ok) throw new Error(body.detail || `HTTP ${r.status}`); return body; })
      .then(setData)
      .catch(e => { if (e.name !== 'AbortError') setError(e.message || 'News request failed'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [symbol]);
  const pie = data ? Object.entries(data.distribution).map(([name, value]) => ({ name, value })) : [];
  return <section className="panel news-panel">
    <h3>Financial News Intelligence · {symbol}</h3>
    <p className="subtle">Last 7 days · Finnhub headlines · FinBERT sentiment. Classification is not a forecast.</p>
    {loading && <p role="status">Fetching headlines and analyzing sentiment (first model load may take several minutes)...</p>}
    {error && <div className="error" role="alert">{error}</div>}
    {data && <>
      <div className="news-stats"><div><small>Overall sentiment</small><strong>{data.overall_sentiment.replace('_', ' ')}</strong></div><div><small>Articles analyzed</small><strong>{data.count}</strong></div><div><small>Sentiment balance</small><strong>{data.sentiment_score == null ? 'N/A' : data.sentiment_score.toFixed(2)}</strong></div></div>
      {data.count > 0 && <div style={{ width: '100%', height: 240 }}><ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" nameKey="name" outerRadius={78} label>{pie.map(entry => <Cell key={entry.name} fill={COLORS[entry.name]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>}
      {data.count === 0 && <p>No eligible company news was returned for this period.</p>}
      <div className="news-articles">{data.articles.map((a, i) => <article key={`${a.url}-${i}`}>
        <div className="news-meta"><span>{a.source} · {new Date(a.published_at).toLocaleDateString()}</span><span className={`sentiment ${a.sentiment}`}>{a.sentiment} · {Math.round(a.confidence * 100)}%</span></div>
        <h4><a href={a.url} target="_blank" rel="noopener noreferrer">{a.headline}</a></h4>
        {a.summary && <p>{a.summary.slice(0, 320)}{a.summary.length > 320 ? '…' : ''}</p>}
      </article>)}</div>
    </>}
  </section>;
}
