import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { Badge, CASE_STATUSES, money } from '../components/ui'

function Stat({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-white border-slate-200',
    amber: 'bg-amber-50 border-amber-200',
    sky: 'bg-sky-50 border-sky-200',
    green: 'bg-emerald-50 border-emerald-200',
    red: 'bg-red-50 border-red-200',
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

      {(data.payments || data.quotations || data.stats.dueReminders !== undefined) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.payments && (
            <>
              <Stat label="Revenue today" value={money(data.payments.revenueToday)} tone="green" />
              <Stat label="Revenue this month" value={money(data.payments.revenueMonth)} />
              <Stat
                label={`Outstanding invoices (${data.payments.outstandingInvoices?.count ?? 0})`}
                value={money(data.payments.outstandingInvoices?.total ?? 0)}
                tone="amber"
              />
              <Stat label="Pending payments" value={data.payments.pendingPayments} tone="amber" />
            </>
          )}
          {data.quotations && (
            <>
              <Stat label="Quotes issued" value={data.quotations.ISSUED} tone="sky" />
              <Stat label="Quotes accepted" value={data.quotations.ACCEPTED} tone="green" />
              <Stat label="Quotes declined" value={data.quotations.DECLINED} />
            </>
          )}
          {data.stats.dueReminders !== undefined && (
            <Stat label="Reminders due" value={data.stats.dueReminders} tone={data.stats.dueReminders ? 'red' : 'slate'} />
          )}
          {data.stats.readyForAllocation !== undefined && (
            <Stat label="Ready for allocation" value={data.stats.readyForAllocation} tone="sky" />
          )}
          {data.stats.awaitingManagementReview !== undefined && (
            <Stat label="Awaiting review" value={data.stats.awaitingManagementReview} tone="amber" />
          )}
        </div>
      )}

      {data.caseStatusCounts && (
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Case pipeline</h3>
            <Link to="/cases" className="text-sm text-slate-600 hover:underline">
              View cases
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {CASE_STATUSES.map((status) => (
              <Link
                key={status}
                to={`/cases?status=${status}`}
                className="rounded-md border border-slate-200 p-3 hover:bg-slate-50"
              >
                <p className="text-xl font-semibold text-slate-900">{data.caseStatusCounts[status] || 0}</p>
                <div className="mt-1">
                  <Badge status={status} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data.investigatorWorkload?.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Investigator workload</h3>
            <Link to="/investigators" className="text-sm text-slate-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {data.investigatorWorkload.map((i) => (
              <li key={i.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-800">
                  {i.name}
                  {i.availability && <span className="text-slate-500"> · {i.availability}</span>}
                </span>
                <span className="text-slate-700">{i.activeCases} active</span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
