import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'

export default function ClientDetail() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/clients/${id}`)
      .then((res) => setClient(res.data.client))
      .catch((err) => setError(err.message))
  }, [id])

  if (error) return <p className="text-red-600">{error}</p>
  if (!client) return <p className="text-slate-600">Loading client…</p>

  return (
    <div className="space-y-6">
      <div>
        <Link to="/clients" className="text-sm text-slate-600 hover:underline">
          ← Clients
        </Link>
        <h2 className="text-2xl font-semibold text-slate-900 mt-2">{client.fullName}</h2>
        <p className="text-sm text-slate-600 mt-1">
          {client.telephone || 'No phone'} · {client.email || 'No email'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="bg-white border border-slate-200 rounded-lg p-5 lg:col-span-1">
          <h3 className="font-semibold mb-3">Profile</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Address</dt>
              <dd className="text-slate-800">
                {[client.addressLine1, client.city, client.postcode].filter(Boolean).join(', ') ||
                  '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Source</dt>
              <dd className="text-slate-800">{client.enquirySource || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Owner</dt>
              <dd className="text-slate-800">
                {client.owner
                  ? `${client.owner.firstName} ${client.owner.lastName}`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Notes</dt>
              <dd className="text-slate-800 whitespace-pre-wrap">{client.notes || '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Call history</h3>
          <ul className="space-y-3 text-sm">
            {client.callLogs.length === 0 && (
              <li className="text-slate-500">No calls recorded.</li>
            )}
            {client.callLogs.map((call) => (
              <li key={call.id} className="border-b border-slate-100 pb-3">
                <p className="font-medium">
                  {call.direction} · {call.outcome.replaceAll('_', ' ')}
                </p>
                <p className="text-slate-500">
                  {new Date(call.contactedAt).toLocaleString()} ·{' '}
                  {call.handler?.firstName} {call.handler?.lastName}
                </p>
                {call.notes && <p className="mt-1 text-slate-700">{call.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="font-semibold mb-3">Enquiries</h3>
        <ul className="space-y-3 text-sm">
          {client.enquiries.length === 0 && (
            <li className="text-slate-500">No enquiries.</li>
          )}
          {client.enquiries.map((e) => (
            <li key={e.id} className="border-b border-slate-100 pb-3">
              <p className="font-medium">{e.summary}</p>
              <p className="text-slate-500">
                {e.status} · {e.service?.name || 'No service'} ·{' '}
                {new Date(e.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
