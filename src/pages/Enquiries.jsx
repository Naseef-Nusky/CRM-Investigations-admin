import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    clientId: '',
    serviceId: '',
    summary: '',
    source: 'CLIENT_TELEPHONE',
    notes: '',
  })

  async function load() {
    const [enq, cli, svc] = await Promise.all([
      api('/enquiries'),
      api('/clients?limit=100'),
      api('/dashboard/services'),
    ])
    setEnquiries(enq.data.enquiries)
    setClients(cli.data.clients)
    setServices(svc.data.services)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function save() {
    setError('')
    if (!form.clientId || form.summary.trim().length < 3) {
      setError('Client and summary (min 3 characters) are required')
      return
    }
    try {
      await api('/enquiries', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          serviceId: form.serviceId || null,
        }),
      })
      setShowForm(false)
      setForm({
        clientId: '',
        serviceId: '',
        summary: '',
        source: 'CLIENT_TELEPHONE',
        notes: '',
      })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Enquiries</h2>
          <p className="text-sm text-slate-600 mt-1">Track new and outstanding enquiries.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm"
        >
          {showForm ? 'Close' : 'New enquiry'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <label className="block text-sm">
            <span className="text-slate-600">Client *</span>
            <select
              value={form.clientId}
              onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Service</span>
            <select
              value={form.serviceId}
              onChange={(e) => setForm((p) => ({ ...p, serviceId: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">Not selected</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Summary *</span>
            <textarea
              value={form.summary}
              onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={save}
            className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm"
          >
            Save enquiry
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Summary</th>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((e) => (
              <tr key={e.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <Link to={`/clients/${e.client.id}`} className="hover:underline">
                    {e.client.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3">{e.summary}</td>
                <td className="px-4 py-3 text-slate-600">{e.service?.name || '—'}</td>
                <td className="px-4 py-3">{e.status}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(e.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
