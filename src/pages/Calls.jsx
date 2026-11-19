import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

const OUTCOMES = [
  'NEW_ENQUIRY',
  'QUOTATION_DISCUSSED',
  'SERVICE_AGREED',
  'PAYMENT_DISCUSSED',
  'PAYMENT_CONFIRMED',
  'AWAITING_CLIENT_DECISION',
  'SERVICE_DECLINED',
  'FOLLOW_UP_REQUIRED',
  'INVESTIGATION_UPDATE',
  'GENERAL_ENQUIRY',
  'NO_ANSWER',
  'VOICEMAIL_LEFT',
]

const emptyForm = {
  direction: 'INCOMING',
  telephone: '',
  personSpokenTo: '',
  clientId: '',
  purpose: '',
  servicesDiscussed: '',
  notes: '',
  actionsAgreed: '',
  followUpAt: '',
  outcome: 'GENERAL_ENQUIRY',
  contactOrigin: 'CLIENT_TELEPHONE',
}

export default function Calls() {
  const [searchParams] = useSearchParams()
  const [calls, setCalls] = useState([])
  const [clients, setClients] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  async function load() {
    const callbacks = searchParams.get('callbacks') === 'true'
    const query = new URLSearchParams()
    if (q) query.set('q', q)
    if (callbacks) query.set('callbacks', 'true')
    const res = await api(`/calls?${query.toString()}`)
    setCalls(res.data.calls)
  }

  useEffect(() => {
    Promise.all([
      load(),
      api('/clients?limit=100').then((res) => setClients(res.data.clients)),
    ]).catch((err) => setError(err.message))
  }, [searchParams])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setError('')
    if (!form.outcome) {
      setError('Outcome is required')
      return
    }
    try {
      const body = {
        ...form,
        clientId: form.clientId || null,
        followUpAt: form.followUpAt ? new Date(form.followUpAt).toISOString() : null,
      }
      await api('/calls', { method: 'POST', body: JSON.stringify(body) })
      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Call management</h2>
          <p className="text-sm text-slate-600 mt-1">
            Full telephone history, including enquiries that never convert.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm"
        >
          {showForm ? 'Close' : 'Log call'}
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
          placeholder="Search calls…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md border border-slate-300 px-4 py-2 text-sm bg-white">
          Search
        </button>
      </form>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold">Log a call</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-slate-600">Direction</span>
              <select
                value={form.direction}
                onChange={(e) => updateField('direction', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="INCOMING">Incoming</option>
                <option value="OUTGOING">Outgoing</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Outcome *</span>
              <select
                value={form.outcome}
                onChange={(e) => updateField('outcome', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              >
                {OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Client</span>
              <select
                value={form.clientId}
                onChange={(e) => updateField('clientId', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="">No client linked</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Telephone</span>
              <input
                value={form.telephone}
                onChange={(e) => updateField('telephone', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Person spoken to</span>
              <input
                value={form.personSpokenTo}
                onChange={(e) => updateField('personSpokenTo', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Follow-up date/time</span>
              <input
                type="datetime-local"
                value={form.followUpAt}
                onChange={(e) => updateField('followUpAt', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="text-slate-600">Purpose</span>
              <input
                value={form.purpose}
                onChange={(e) => updateField('purpose', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="text-slate-600">Services discussed</span>
              <input
                value={form.servicesDiscussed}
                onChange={(e) => updateField('servicesDiscussed', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="text-slate-600">Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="text-slate-600">Actions agreed</span>
              <input
                value={form.actionsAgreed}
                onChange={(e) => updateField('actionsAgreed', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={save}
            className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm"
          >
            Save call
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Direction</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Outcome</th>
              <th className="px-4 py-3 font-medium">Handler</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => (
              <tr key={call.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-slate-600">
                  {new Date(call.contactedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">{call.direction}</td>
                <td className="px-4 py-3">
                  {call.client ? (
                    <Link to={`/clients/${call.client.id}`} className="hover:underline">
                      {call.client.fullName}
                    </Link>
                  ) : (
                    call.personSpokenTo || '—'
                  )}
                </td>
                <td className="px-4 py-3">{call.outcome.replaceAll('_', ' ')}</td>
                <td className="px-4 py-3 text-slate-600">
                  {call.handler?.firstName} {call.handler?.lastName}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
