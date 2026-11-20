import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { Badge, btnPrimary, fmtDate, money } from '../components/ui'

function ServiceDiscussions({ clientId, initial }) {
  const [items, setItems] = useState(initial)
  const [services, setServices] = useState([])
  const [form, setForm] = useState({
    serviceId: '',
    decision: 'DISCUSSED',
    quotedPrice: '',
    agreedPrice: '',
    notes: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    api('/services')
      .then((res) => setServices(res.data.services || []))
      .catch(() => {})
  }, [])

  async function save() {
    setError('')
    if (!form.serviceId) {
      setError('Select a service')
      return
    }
    try {
      const res = await api('/discussions', {
        method: 'POST',
        body: JSON.stringify({
          clientId,
          serviceId: form.serviceId,
          decision: form.decision,
          quotedPrice: form.quotedPrice ? Number(form.quotedPrice) : null,
          agreedPrice: form.agreedPrice ? Number(form.agreedPrice) : null,
          notes: form.notes || null,
        }),
      })
      setItems((prev) => [res.data.discussion, ...prev])
      setForm({
        serviceId: '',
        decision: 'DISCUSSED',
        quotedPrice: '',
        agreedPrice: '',
        notes: '',
      })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <ul className="space-y-2">
        {items.length === 0 && <li className="text-slate-500">No service discussions yet.</li>}
        {items.map((d) => (
          <li key={d.id} className="border-b border-slate-100 pb-2 flex flex-wrap gap-2 justify-between">
            <span>
              {d.service?.name || 'Service'} · <Badge status={d.decision} />
            </span>
            <span className="text-slate-500">
              {d.quotedPrice != null && `Quoted ${money(d.quotedPrice)} `}
              {d.agreedPrice != null && `Agreed ${money(d.agreedPrice)}`}
            </span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <select
          value={form.serviceId}
          onChange={(e) => setForm((p) => ({ ...p, serviceId: e.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="">Select service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={form.decision}
          onChange={(e) => setForm((p) => ({ ...p, decision: e.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          {['DISCUSSED', 'QUOTED', 'ACCEPTED', 'DECLINED'].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <input
          placeholder="Quoted price"
          value={form.quotedPrice}
          onChange={(e) => setForm((p) => ({ ...p, quotedPrice: e.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="Agreed price"
          value={form.agreedPrice}
          onChange={(e) => setForm((p) => ({ ...p, agreedPrice: e.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <button type="button" onClick={save} className={btnPrimary}>
        Add discussion
      </button>
    </div>
  )
}

export default function ClientDetail() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [payments, setPayments] = useState(null)
  const [invoices, setInvoices] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/clients/${id}`)
      .then((res) => setClient(res.data.client))
      .catch((err) => setError(err.message))
    api(`/payments?clientId=${id}&limit=50`)
      .then((res) => setPayments(res.data.payments))
      .catch(() => setPayments([]))
    api(`/invoices?clientId=${id}&limit=50`)
      .then((res) => setInvoices(res.data.invoices))
      .catch(() => setInvoices([]))
  }, [id])

  if (error) return <p className="text-red-600">{error}</p>
  if (!client) return <p className="text-slate-600">Loading client…</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/clients" className="text-sm text-slate-600 hover:underline">
            ← Clients
          </Link>
          <h2 className="text-2xl font-semibold text-slate-900 mt-2">{client.fullName}</h2>
          <p className="text-sm text-slate-600 mt-1">
            {client.telephone || 'No phone'} · {client.email || 'No email'}
          </p>
        </div>
        <Link to={`/cases?clientId=${client.id}`} className={btnPrimary}>
          New case
        </Link>
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Services discussed / quoted / agreed / declined</h3>
        </div>
        <ServiceDiscussions clientId={client.id} initial={client.serviceDiscussions || []} />
      </section>

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

      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="font-semibold mb-3">Cases</h3>
        <ul className="space-y-3 text-sm">
          {(client.investigations || []).length === 0 && <li className="text-slate-500">No cases.</li>}
          {(client.investigations || []).map((c) => (
            <li key={c.id} className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link to={`/cases/${c.id}`} className="font-medium text-slate-900 hover:underline">
                  {c.reference}
                </Link>
                <p className="text-slate-500">
                  {c.service?.name || 'No service'} · {money(c.agreedPrice)} · {fmtDate(c.createdAt)}
                </p>
              </div>
              <Badge status={c.status} />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="font-semibold mb-3">Payments</h3>
          <ul className="space-y-3 text-sm">
            {payments === null && <li className="text-slate-500">Loading…</li>}
            {payments?.length === 0 && <li className="text-slate-500">No payments.</li>}
            {payments?.map((p) => (
              <li key={p.id} className="border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{money(p.amount)}</p>
                  <p className="text-slate-500">
                    {fmtDate(p.receivedAt)}
                    {p.investigation && ` · ${p.investigation.reference}`}
                  </p>
                </div>
                <Badge status={p.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="font-semibold mb-3">Invoices</h3>
          <ul className="space-y-3 text-sm">
            {invoices === null && <li className="text-slate-500">Loading…</li>}
            {invoices?.length === 0 && <li className="text-slate-500">No invoices.</li>}
            {invoices?.map((i) => (
              <li key={i.id} className="border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {i.invoiceNumber} · {money(i.amount)}
                  </p>
                  <p className="text-slate-500">{fmtDate(i.createdAt)}</p>
                </div>
                <Badge status={i.paymentStatus} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
