import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import {
  Alert,
  Badge,
  CASE_STATUSES,
  Field,
  PageHeader,
  Panel,
  Table,
  Td,
  Tr,
  btnPrimary,
  btnSecondary,
  fmtDate,
  inputCls,
  label,
  money,
  numOrNull,
  useAction,
} from '../components/ui'

const emptyForm = { clientId: '', serviceId: '', quotedPrice: '', agreedPrice: '', instructions: '' }

export default function Cases() {
  const [searchParams] = useSearchParams()
  const prefillClient = searchParams.get('clientId') || ''
  const [cases, setCases] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ ...emptyForm, clientId: prefillClient })
  const [showForm, setShowForm] = useState(Boolean(prefillClient))
  const [loadError, setLoadError] = useState('')
  const action = useAction()

  async function load(s = status, search = q) {
    const query = new URLSearchParams({ limit: '100' })
    if (s) query.set('status', s)
    if (search) query.set('q', search)
    const res = await api(`/investigations?${query}`)
    setCases(res.data.investigations)
  }

  useEffect(() => {
    load().catch((err) => setLoadError(err.message))
  }, [status])

  useEffect(() => {
    api('/clients?limit=100').then((r) => setClients(r.data.clients)).catch(() => {})
    api('/services?active=true&limit=200').then((r) => setServices(r.data.services)).catch(() => {})
  }, [])

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onServiceChange(serviceId) {
    const svc = services.find((s) => s.id === serviceId)
    setForm((prev) => ({
      ...prev,
      serviceId,
      quotedPrice: prev.quotedPrice === '' && svc?.standardPrice != null ? String(svc.standardPrice) : prev.quotedPrice,
    }))
  }

  async function create() {
    await action.run(async () => {
      await api('/investigations', {
        method: 'POST',
        body: JSON.stringify({
          clientId: form.clientId,
          serviceId: form.serviceId || null,
          quotedPrice: numOrNull(form.quotedPrice),
          agreedPrice: numOrNull(form.agreedPrice),
          instructions: form.instructions || null,
        }),
      })
      setForm(emptyForm)
      setShowForm(false)
      await load()
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Cases" subtitle="Investigation cases from enquiry to completion.">
        <button type="button" onClick={() => setShowForm((v) => !v)} className={btnPrimary}>
          {showForm ? 'Close' : 'Create case'}
        </button>
      </PageHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          load().catch((err) => setLoadError(err.message))
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search reference, client, service…"
          className="flex-1 min-w-48 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
          <option value="">All statuses</option>
          {CASE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <button type="submit" className={btnSecondary}>
          Search
        </button>
      </form>
      <Alert error={loadError} />

      {showForm && (
        <Panel title="Create case">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Client *">
              <select value={form.clientId} onChange={(e) => set('clientId', e.target.value)} className={inputCls}>
                <option value="">Select client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
                {prefillClient && !clients.some((c) => c.id === prefillClient) && (
                  <option value={prefillClient}>Selected client</option>
                )}
              </select>
            </Field>
            <Field label="Service">
              <select value={form.serviceId} onChange={(e) => onServiceChange(e.target.value)} className={inputCls}>
                <option value="">Select service…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quoted price (£)">
              <input type="number" min="0" step="0.01" value={form.quotedPrice} onChange={(e) => set('quotedPrice', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Agreed price (£)">
              <input type="number" min="0" step="0.01" value={form.agreedPrice} onChange={(e) => set('agreedPrice', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Instructions" className="md:col-span-2">
              <textarea rows={3} value={form.instructions} onChange={(e) => set('instructions', e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="mt-4 space-y-2">
            <Alert error={action.error} />
            <button type="button" disabled={action.busy || !form.clientId} onClick={create} className={btnPrimary}>
              {action.busy ? 'Creating…' : 'Create case'}
            </button>
          </div>
        </Panel>
      )}

      <Table
        columns={['Reference', 'Client', 'Service', 'Status', 'Investigator', 'Agreed', 'Updated']}
        isEmpty={cases.length === 0}
        empty="No cases found."
      >
        {cases.map((c) => (
          <Tr key={c.id}>
            <Td>
              <Link to={`/cases/${c.id}`} className="font-medium text-slate-900 hover:underline">
                {c.reference}
              </Link>
            </Td>
            <Td>{c.client?.fullName || '—'}</Td>
            <Td>{c.service?.name || '—'}</Td>
            <Td>
              <Badge status={c.status} />
            </Td>
            <Td>
              {c.assignedInvestigator ? `${c.assignedInvestigator.firstName} ${c.assignedInvestigator.lastName}` : '—'}
            </Td>
            <Td>{money(c.agreedPrice)}</Td>
            <Td>{fmtDate(c.updatedAt)}</Td>
          </Tr>
        ))}
      </Table>
    </div>
  )
}
