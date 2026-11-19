import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

const emptyForm = {
  fullName: '',
  telephone: '',
  email: '',
  addressLine1: '',
  city: '',
  postcode: '',
  enquirySource: '',
  notes: '',
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [q, setQ] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [duplicates, setDuplicates] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load(search = q) {
    const res = await api(`/clients?q=${encodeURIComponent(search)}`)
    setClients(res.data.clients)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save(force = false) {
    setError('')
    setDuplicates([])
    if (!form.fullName.trim()) {
      setError('Full name is required')
      return
    }
    setSaving(true)
    try {
      const path = force ? '/clients?force=true' : '/clients'
      await api(path, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          email: form.email || null,
        }),
      })
      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (err) {
      if (err.status === 409 && err.payload?.data?.duplicates) {
        setDuplicates(err.payload.data.duplicates)
        setError(err.message)
      } else {
        setError(err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Clients</h2>
          <p className="text-sm text-slate-600 mt-1">Central client database</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm"
        >
          {showForm ? 'Close' : 'New client'}
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          load().catch((err) => setError(err.message))
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md border border-slate-300 px-4 py-2 text-sm bg-white">
          Search
        </button>
      </form>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold">Create client</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              ['fullName', 'Full name *'],
              ['telephone', 'Telephone'],
              ['email', 'Email'],
              ['addressLine1', 'Address'],
              ['city', 'City'],
              ['postcode', 'Postcode'],
              ['enquirySource', 'Enquiry source'],
            ].map(([key, label]) => (
              <label key={key} className="text-sm">
                <span className="text-slate-600">{label}</span>
                <input
                  value={form[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
            ))}
            <label className="text-sm md:col-span-2">
              <span className="text-slate-600">Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {duplicates.length > 0 && (
            <div className="text-sm bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="font-medium text-amber-900">Possible duplicates:</p>
              <ul className="mt-1 list-disc ml-5 text-amber-800">
                {duplicates.map((d) => (
                  <li key={d.id}>
                    {d.fullName} · {d.telephone || '—'} · {d.email || '—'}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => save(true)}
                className="mt-2 text-amber-900 underline"
              >
                Create anyway
              </button>
            </div>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => save(false)}
            className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save client'}
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Activity</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/clients/${c.id}`} className="font-medium text-slate-900 hover:underline">
                    {c.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.telephone || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{c.email || '—'}</td>
                <td className="px-4 py-3 text-slate-600">
                  {c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : '—'}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {c._count?.callLogs || 0} calls · {c._count?.enquiries || 0} enquiries
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
