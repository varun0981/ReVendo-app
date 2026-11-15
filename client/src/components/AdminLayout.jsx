import { useState } from 'react'
import { Bell, Boxes, ChevronRight, LayoutDashboard, LogOut, Menu, PackageCheck, ShieldAlert, Users, X } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/useAuth'

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Listings', icon: Boxes },
  { to: '/admin/users', label: 'People', icon: Users },
  { to: '/admin/orders', label: 'Orders', icon: PackageCheck },
  { to: '/admin/reports', label: 'Reports', icon: ShieldAlert },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function signOut() {
    try {
      await logout()
      navigate('/login')
    } catch {
      toast.error('Could not sign out. Please try again.')
    }
  }

  return (
    <div className="admin-app">
      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <Link className="admin-brand" to="/"><span className="brand-mark">r<span>.</span></span><span>revendo<span>ADMIN</span></span></Link>
        <div className="admin-sidebar-label">WORKSPACE</div>
        <nav className="admin-side-nav">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}><Icon size={17} />{label}{label === 'Reports' && <span className="admin-nav-dot" />}</NavLink>)}</nav>
        <div className="admin-sidebar-bottom"><span className="admin-protected-mark"><ShieldAlert size={16} /></span><div><b>Admin workspace</b><small>Private & secure</small></div></div>
      </aside>
      {sidebarOpen && <button className="admin-sidebar-scrim" type="button" aria-label="Close admin menu" onClick={() => setSidebarOpen(false)} />}
      <div className="admin-main">
        <header className="admin-topbar"><button className="admin-menu-toggle" type="button" onClick={() => setSidebarOpen((open) => !open)} aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}>{sidebarOpen ? <X size={20} /> : <Menu size={20} />}</button><div className="admin-topbar-breadcrumb"><span>ReVendo</span><ChevronRight size={14} /><b>Admin dashboard</b></div><div className="admin-topbar-actions"><Link to="/notifications" aria-label="Notifications"><Bell size={17} /></Link><span className="admin-topbar-avatar">{user?.name?.[0] || 'A'}</span><div className="admin-topbar-user"><b>{user?.name || 'Administrator'}</b><small>Administrator</small></div><button type="button" aria-label="Sign out" onClick={signOut}><LogOut size={16} /></button></div></header>
        <div className="admin-content"><Outlet /></div>
      </div>
    </div>
  )
}
