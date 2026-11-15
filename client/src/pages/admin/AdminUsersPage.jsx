import { useEffect, useState } from 'react'
import { Search, ShieldCheck, UserRound, UserRoundX } from 'lucide-react'
import { getAdminUsers, updateAdminUser } from '../../services/adminApi'
import { getImageUrl } from '../../utils/format'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    let active = true
    getAdminUsers({ search, status, limit: 100 })
      .then((result) => { if (active) setUsers(result.data) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load accounts.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [search, status])

  async function toggleStatus(person) {
    setBusyId(person._id)
    try {
      const result = await updateAdminUser(person._id, person.accountStatus === 'Active' ? 'Suspended' : 'Active')
      setUsers((current) => current.map((item) => item._id === person._id ? { ...item, accountStatus: result.data.accountStatus } : item))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update this account.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <section className="admin-section-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">THE PEOPLE MAKING IT GO AROUND</span><h1>People & accounts.</h1><p>Keep an eye on account health and member verification.</p></div></div>
      <div className="admin-list-toolbar"><label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or number" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by account status"><option value="">All account statuses</option><option>Active</option><option>Suspended</option></select><span>{users.length} accounts</span></div>
      {error && <div className="admin-error">{error}</div>}
      {loading ? <div className="admin-loading">Finding members…</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>PERSON</th><th>CONTACT</th><th>VERIFICATION</th><th>ROLE</th><th>JOINED</th><th>STATUS</th><th></th></tr></thead><tbody>{users.map((person) => <tr key={person._id}><td><div className="admin-person-cell"><span className="admin-person-avatar">{person.profileImage ? <img src={getImageUrl(person.profileImage)} alt="" /> : person.name[0]}</span><b>{person.name}</b></div></td><td><span>{person.email}</span><small>{person.phone}</small></td><td><span className={person.emailVerified ? 'verify-good' : 'verify-wait'}>{person.emailVerified ? <ShieldCheck size={13} /> : <UserRound size={13} />} Email</span><span className={person.phoneVerified ? 'verify-good' : 'verify-wait'}>{person.phoneVerified ? <ShieldCheck size={13} /> : <UserRound size={13} />} Phone</span></td><td><span className={`admin-role role-${person.role.toLowerCase()}`}>{person.role}</span></td><td>{new Date(person.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td><td><span className={`status-chip status-${person.accountStatus.toLowerCase()}`}>{person.accountStatus}</span></td><td>{person.role !== 'Admin' && <button className={`admin-row-action${person.accountStatus === 'Active' ? ' danger' : ''}`} type="button" disabled={busyId === person._id} onClick={() => toggleStatus(person)}>{person.accountStatus === 'Active' ? <><UserRoundX size={14} /> Suspend</> : <><ShieldCheck size={14} /> Restore</>}</button>}</td></tr>)}</tbody></table>{users.length === 0 && !error && <div className="admin-empty-small">No accounts match your search.</div>}</div>}
    </section>
  )
}
