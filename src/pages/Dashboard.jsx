import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

function Stat({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-white border-slate-200',
    amber: 'bg-amber-50 border-amber-200',
    sky: 'bg-sky-50 border-sky-200',
  }
  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <p className="text-slate-600">Loading dashboard…</p>

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        <p className="text-slate-600 text-sm mt-1">What needs attention today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="New clients (7 days)" value={data.stats.newClients} />
        <Stat label="Open enquiries" value={data.stats.openEnquiries} tone="sky" />
        <Stat label="Calls today" value={data.stats.callsToday} />
        <Stat label="Outstanding callbacks" value={data.stats.outstandingCallbacks} tone="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Outstanding callbacks</h3>
            <Link to="/calls?callbacks=true" className="text-sm text-slate-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-3">
            {data.callbacks.length === 0 && (
              <li className="text-sm text-slate-500">No outstanding callbacks.</li>
            )}
            {data.callbacks.map((call) => (
              <li key={call.id} className="text-sm border-b border-slate-100 pb-3">
                <p className="font-medium text-slate-800">
                  {call.client?.fullName || call.personSpokenTo || 'Unknown'}
                </p>
                <p className="text-slate-500">
                  {call.telephone || '—'} · Due {new Date(call.followUpAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent calls</h3>
            <Link to="/calls" className="text-sm text-slate-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-3">
            {data.recentCalls.map((call) => (
              <li key={call.id} className="text-sm border-b border-slate-100 pb-3">
                <p className="font-medium text-slate-800">
                  {call.direction} · {call.outcome.replaceAll('_', ' ')}
                </p>
                <p className="text-slate-500">
                  {call.client?.fullName || call.personSpokenTo || 'No client'} ·{' '}
                  {new Date(call.contactedAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Recent clients</h3>
          <Link to="/clients" className="text-sm text-slate-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 border-b">
              <tr>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Phone</th>
                <th className="py-2 font-medium">Email</th>
                <th className="py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {data.recentClients.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="py-2">
                    <Link to={`/clients/${c.id}`} className="text-slate-900 hover:underline">
                      {c.fullName}
                    </Link>
                  </td>
                  <td className="py-2 text-slate-600">{c.telephone || '—'}</td>
                  <td className="py-2 text-slate-600">{c.email || '—'}</td>
                  <td className="py-2 text-slate-600">{c.enquirySource || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
