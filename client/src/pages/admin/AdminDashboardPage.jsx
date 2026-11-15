import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Boxes, CircleDollarSign, PackageCheck, ShieldAlert, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getAdminDashboard } from '../../services/adminApi'
import { formatPrice, getImageUrl } from '../../utils/format'

const chartOptions = [
  { value: 'listings', label: 'Listings', key: 'listingsByDay', color: '#e8794c' },
  { value: 'people', label: 'People', key: 'usersByDay', color: '#748b73' },
  { value: 'orders', label: 'Orders', key: 'ordersByDay', color: '#758ca0' },
]

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [chart, setChart] = useState('listings')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [today] = useState(() => new Date())

  useEffect(() => {
    let active = true
    getAdminDashboard()
      .then((result) => { if (active) setData(result) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load dashboard insights.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const selectedChart = chartOptions.find((option) => option.value === chart)
  const chartData = useMemo(() => {
    const source = data?.charts?.[selectedChart?.key] || []
    return source.map((point) => ({ day: point._id, count: point.count }))
  }, [data, selectedChart])

  if (loading) return <div className="admin-loading">Pulling together your marketplace snapshot…</div>
  if (error) return <div className="admin-error">{error}<button type="button" onClick={() => window.location.reload()}>Refresh</button></div>
  if (!data) return null

  const statCards = [
    { label: 'People in the circle', value: data.stats.totalUsers, icon: Users, tone: 'sage', note: 'Total accounts' },
    { label: 'All listings', value: data.stats.totalProducts, icon: Boxes, tone: 'peach', note: `${data.stats.activeListings} live right now` },
    { label: 'Passed along', value: data.stats.soldProducts, icon: CircleDollarSign, tone: 'blue', note: 'Pre-loved, re-loved' },
    { label: 'Orders placed', value: data.stats.totalOrders, icon: PackageCheck, tone: 'lavender', note: 'Cash on delivery demo' },
  ]

  return (
    <div className="admin-dashboard">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">YOUR MARKETPLACE, AT A GLANCE</span><h1>A little good is going around.</h1><p>Here’s what’s happening across ReVendo today.</p></div><span className="admin-today">{today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
      <div className="admin-stats-grid">{statCards.map(({ label, value, icon: Icon, tone, note }) => <article className={`admin-stat-card ${tone}`} key={label}><div><span>{label}</span><Icon size={18} /></div><b>{value.toLocaleString('en-IN')}</b><small>{note}</small></article>)}</div>
      <div className="admin-dash-grid">
        <section className="admin-panel admin-chart-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">LAST 14 DAYS</span><h2>Small steps, real impact.</h2></div><div className="admin-chart-tabs">{chartOptions.map((option) => <button type="button" className={chart === option.value ? 'active' : ''} onClick={() => setChart(option.value)} key={option.value}>{option.label}</button>)}</div></div><div className="admin-chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 7, bottom: 0, left: -18 }}><defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={selectedChart.color} stopOpacity={0.24} /><stop offset="95%" stopColor={selectedChart.color} stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#eeece5" strokeDasharray="3 4" /><XAxis dataKey="day" tickFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} tick={{ fontSize: 9, fill: '#8a8e87' }} axisLine={false} tickLine={false} minTickGap={20} /><YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#8a8e87' }} axisLine={false} tickLine={false} /><Tooltip labelFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'medium' })} contentStyle={{ border: '1px solid #e8e5dd', borderRadius: 2, fontSize: 10 }} /><Area type="monotone" dataKey="count" name={selectedChart.label} stroke={selectedChart.color} strokeWidth={2} fill="url(#activityFill)" activeDot={{ r: 4 }} /></AreaChart></ResponsiveContainer></div><div className="admin-chart-caption"><span><span style={{ backgroundColor: selectedChart.color }} />{selectedChart.label} over time</span><span>Updated just now</span></div></section>
        <section className="admin-panel admin-review-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">NEEDS A KIND EYE</span><h2>Open reports</h2></div><span className="admin-report-count"><ShieldAlert size={15} />{data.stats.pendingReports}</span></div><p>Every report is a chance to keep the marketplace thoughtful and safe.</p><Link className="admin-panel-link" to="/admin/reports">Review reports <ArrowRight size={15} /></Link><div className="admin-safety-note"><ShieldAlert size={17} /><span>Listings waiting for approval are not visible to shoppers.</span></div></section>
      </div>
      <div className="admin-dash-grid admin-bottom-grid">
        <section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">NEW TO THE CIRCLE</span><h2>Recent people</h2></div><Link to="/admin/users">All people <ArrowRight size={14} /></Link></div>{data.recentUsers.length === 0 ? <div className="admin-empty-small">New members will appear here.</div> : <div className="admin-recent-list">{data.recentUsers.map((person) => <div className="admin-person-row" key={person._id}><span className="admin-person-avatar">{person.profileImage ? <img src={getImageUrl(person.profileImage)} alt="" /> : person.name[0]}</span><div><b>{person.name}</b><small>{person.email}</small></div><span className="admin-date">{new Date(person.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></div>)}</div>}</section>
        <section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">JUST LISTED</span><h2>Fresh listings</h2></div><Link to="/admin/products">All listings <ArrowRight size={14} /></Link></div>{data.recentListings.length === 0 ? <div className="admin-empty-small">Fresh finds will appear here.</div> : <div className="admin-recent-list">{data.recentListings.map((product) => <div className="admin-product-row" key={product._id}><img src={getImageUrl(product.images?.[0])} alt="" /><div><b>{product.title}</b><small>{product.seller?.name || 'ReVendo seller'} · {product.status}</small></div><span>{formatPrice(product.price)}</span></div>)}</div>}</section>
      </div>
    </div>
  )
}
