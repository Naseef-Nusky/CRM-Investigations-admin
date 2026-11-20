import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/clients', label: 'Clients' },
  { to: '/calls', label: 'Calls' },
  { to: '/enquiries', label: 'Enquiries' },
  { to: '/services', label: 'Services' },
  { to: '/quotations', label: 'Quotations' },
  { to: '/cases', label: 'Cases' },
  { to: '/investigators', label: 'Investigators' },
  { to: '/finance', label: 'Finance' },
  { to: '/emails', label: 'Emails' },
  { to: '/reminders', label: 'Reminders' },
  { to: '/settings', label: 'Settings' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function runSearch(e) {
    e.preventDefault()
    if (q.trim().length < 2) {
      setResults(null)
      return
    }
    setSearching(true)
    try {
      const res = await api(`/dashboard/search?q=${encodeURIComponent(q.trim())}`)
      setResults(res.data)
    } catch {
      setResults({ clients: [], investigations: [], calls: [] })
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0">
        <div className="px-5 py-6 border-b border-slate-700">
          <p className="text-xs uppercase tracking-widest text-slate-400">Bespoke</p>
          <h1 className="text-lg font-semibold leading-tight mt-1">Investigation CRM</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-700 text-sm">
          <p className="font-medium">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">{user?.role?.replaceAll('_', ' ')}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 text-xs text-slate-300 hover:text-white underline"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto min-w-0">
        <div className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur border-b border-slate-200 px-6 py-3">
          <form onSubmit={runSearch} className="max-w-6xl mx-auto flex gap-2 relative">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                if (e.target.value.trim().length < 2) setResults(null)
              }}
              placeholder="Search clients, cases, phone, email…"
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm"
              disabled={searching}
            >
              {searching ? '…' : 'Search'}
            </button>
            {results && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm max-h-80 overflow-auto">
                <p className="text-xs uppercase text-slate-500 mb-2">Clients</p>
                {(results.clients || []).length === 0 && (
                  <p className="text-slate-500 mb-2">No clients</p>
                )}
                {(results.clients || []).map((c) => (
                  <Link
                    key={c.id}
                    to={`/clients/${c.id}`}
                    onClick={() => setResults(null)}
                    className="block py-1.5 hover:underline"
                  >
                    {c.fullName} · {c.telephone || c.email || '—'}
                  </Link>
                ))}
                <p className="text-xs uppercase text-slate-500 mt-3 mb-2">Cases</p>
                {(results.investigations || []).length === 0 && (
                  <p className="text-slate-500 mb-2">No cases</p>
                )}
                {(results.investigations || []).map((i) => (
                  <Link
                    key={i.id}
                    to={`/cases/${i.id}`}
                    onClick={() => setResults(null)}
                    className="block py-1.5 hover:underline"
                  >
                    {i.reference} · {i.client?.fullName} · {i.status}
                  </Link>
                ))}
                <p className="text-xs uppercase text-slate-500 mt-3 mb-2">Calls</p>
                {(results.calls || []).slice(0, 5).map((call) => (
                  <p key={call.id} className="py-1 text-slate-600">
                    {call.personSpokenTo || call.telephone} · {call.outcome} ·{' '}
                    {call.client?.fullName || '—'}
                  </p>
                ))}
              </div>
            )}
          </form>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
