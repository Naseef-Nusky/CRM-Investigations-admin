import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import {
  Alert,
  Badge,
  Field,
  PageHeader,
  Panel,
  Table,
  Td,
  Tr,
  btnPrimary,
  btnSmall,
  fmtDate,
  fmtDateTime,
  inputCls,
  money,
  toIso,
  useAction,
} from '../components/ui'

const emptyForm = { serviceId: '', amount: '', details: '', enquiryId: '', followUpAt: '' }
const STATUSES = ['ISSUED', 'ACCEPTED', 'DECLINED', 'EXPIRED']

export default function Quotations() {
  const [quotations, setQuotations] = useState([])
  const [services, setServices] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [status, setStatus] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loadError, setLoadError] = useState('')
  const action = useAction()

  async function load(s = status) {
    const res = await api(`/quotations?limit=100${s ? `&status=${s}` : ''}`)
    setQuotations(res.data.quotations)
  }

  useEffect(() => {
    load().catch((err) => setLoadError(err.message))
  }, [status])

  useEffect(() => {
    api('/services?active=true&limit=200').then((r) => setServices(r.data.services)).catch(() => {})
    api('/enquiries?limit=100').then((r) => setEnquiries(r.data.enquiries)).catch(() => {})
  }, [])

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onServiceChange(serviceId) {
    const svc = services.find((s) => s.id === serviceId)
    setForm((prev) => ({
      ...prev,
      serviceId,
      amount: prev.amount === '' && svc?.standardPrice != null ? String(svc.standardPrice) : prev.amount,
    }))
  }

  async function create() {
    await action.run(async () => {
      await api('/quotations', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: form.serviceId,
          amount: Number(form.amount),
          details: form.details || null,
          enquiryId: form.enquiryId || null,
          followUpAt: toIso(form.followUpAt),
        }),
      })
      setForm(emptyForm)
      setShowForm(false)
      await load()
    })
  }

  async function setQuoteStatus(id, next) {
    await action.run(async () => {
      await api(`/quotations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) })
      await load()
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quotations" subtitle="Issued quotes and their outcome.">
        <button type="button" onClick={() => setShowForm((v) => !v)} className={btnPrimary}>
          {showForm ? 'Close' : 'New quotation'}
        </button>
      </PageHeader>
      <Alert error={loadError} />

      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-600">Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 bg-white">
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <Panel title="Create quotation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Service *">
              <select value={form.serviceId} onChange={(e) => onServiceChange(e.target.value)} className={inputCls}>
                <option value="">Select service…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount (£) *">
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Enquiry (optional)">
              <select value={form.enquiryId} onChange={(e) => set('enquiryId', e.target.value)} className={inputCls}>
                <option value="">None</option>
                {enquiries.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.client?.fullName} — {e.summary.slice(0, 60)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Follow-up">
              <input type="datetime-local" value={form.followUpAt} onChange={(e) => set('followUpAt', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Details" className="md:col-span-2">
              <textarea rows={3} value={form.details} onChange={(e) => set('details', e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="mt-4 space-y-2">
            <Alert error={action.error} />
            <button type="button" disabled={action.busy || !form.serviceId || form.amount === ''} onClick={create} className={btnPrimary}>
              {action.busy ? 'Saving…' : 'Save quotation'}
            </button>
          </div>
        </Panel>
      )}

      {!showForm && <Alert error={action.error} />}

      <Table
        columns={['Service', 'Client / enquiry', 'Amount', 'Status', 'Follow-up', 'Created', '']}
        isEmpty={quotations.length === 0}
        empty="No quotations."
      >
        {quotations.map((q) => (
          <Tr key={q.id}>
            <Td className="font-medium text-slate-900">{q.service?.name || '—'}</Td>
            <Td>
              {q.enquiry?.client ? (
                <Link to={`/clients/${q.enquiry.client.id}`} className="hover:underline">
                  {q.enquiry.client.fullName}
                </Link>
              ) : (
                '—'
              )}
              {q.enquiry?.summary && <p className="text-xs text-slate-500">{q.enquiry.summary}</p>}
              {q.details && <p className="text-xs text-slate-500 mt-0.5">{q.details}</p>}
            </Td>
            <Td>{money(q.amount)}</Td>
            <Td>
              <Badge status={q.status} />
            </Td>
            <Td>{fmtDateTime(q.followUpAt)}</Td>
            <Td>{fmtDate(q.createdAt)}</Td>
            <Td className="whitespace-nowrap">
              {q.status === 'ISSUED' && (
                <>
                  <button type="button" disabled={action.busy} onClick={() => setQuoteStatus(q.id, 'ACCEPTED')} className={btnSmall}>
                    Accept
                  </button>{' '}
                  <button type="button" disabled={action.busy} onClick={() => setQuoteStatus(q.id, 'DECLINED')} className={btnSmall}>
                    Decline
                  </button>
                </>
              )}
            </Td>
          </Tr>
        ))}
      </Table>
    </div>
  )
}
