import { useEffect, useState } from 'react'
import { ExternalLink, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAdminReports, updateAdminReport } from '../../services/adminApi'
import { getImageUrl } from '../../utils/format'

const reportStatuses = ['New', 'In review', 'Resolved', 'Dismissed']

export default function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    let active = true
    getAdminReports({ status: filter })
      .then((result) => { if (active) setReports(result.data) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load reports.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filter])

  async function changeStatus(report, status) {
    setBusyId(report._id)
    try {
      const result = await updateAdminReport(report._id, status, report.resolutionNote)
      setReports((current) => current.map((item) => item._id === report._id ? { ...item, ...result.data } : item))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update this report.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <section className="admin-section-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">A SAFER CIRCLE, TOGETHER</span><h1>Reports & concerns.</h1><p>Review community reports with care and record the outcome.</p></div></div>
      <div className="admin-list-toolbar"><div className="admin-toolbar-intro"><ShieldAlert size={17} /> Community reports</div><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter reports"><option value="">All reports</option>{reportStatuses.map((status) => <option key={status}>{status}</option>)}</select><span>{reports.length} reports</span></div>
      {error && <div className="admin-error">{error}</div>}
      {loading ? <div className="admin-loading">Looking into reports…</div> : <div className="admin-report-list">{reports.map((report) => <article className="admin-report-card" key={report._id}><div className="admin-report-product">{report.product?.images?.[0] && <img src={getImageUrl(report.product.images[0])} alt="" />}<div><span className={`status-chip status-${report.status === 'Resolved' ? 'active' : report.status === 'Dismissed' ? 'rejected' : 'pending'}`}>{report.status}</span><b>{report.product?.title || 'Listing unavailable'}</b><small>{report.product?.status || 'Removed'} listing</small></div>{report.product && <Link to={`/products/${report.product._id}`} aria-label="View listing"><ExternalLink size={14} /></Link>}</div><div className="admin-report-detail"><span>Reason · <b>{report.reason}</b></span>{report.description && <p>{report.description}</p>}<small>Reported by {report.reporter?.name || 'Member'} · {new Date(report.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</small></div><div className="admin-report-controls"><label>Resolution note<input value={report.resolutionNote || ''} maxLength={500} onChange={(event) => setReports((current) => current.map((item) => item._id === report._id ? { ...item, resolutionNote: event.target.value } : item))} placeholder="Optional note for the record" /></label><div><select value={report.status} onChange={(event) => changeStatus(report, event.target.value)} disabled={busyId === report._id} aria-label={`Update report ${report._id}`}>{reportStatuses.map((status) => <option key={status}>{status}</option>)}</select><button type="button" disabled={busyId === report._id} onClick={() => changeStatus(report, report.status)}>Save note</button></div></div></article>)}{reports.length === 0 && !error && <div className="admin-empty-small">No reports. Thank you for keeping the circle thoughtful.</div>}</div>}
    </section>
  )
}
