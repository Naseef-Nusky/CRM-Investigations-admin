import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, apiDownload } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import {
  Alert,
  Badge,
  FINANCE_ROLES,
  Field,
  PAYMENT_STATUSES,
  PageHeader,
  Panel,
  Stat,
  Table,
  Td,
  Tr,
  btnPrimary,
  btnSecondary,
  btnSmall,
  fmtDate,
  inputCls,
  label,
  money,
  useAction,
} from '../components/ui'

export default function Finance() {
  const { user } = useAuth()
  const canSeeSummary = FINANCE_ROLES.includes(user?.role)
  const [period, setPeriod] = useState('daily')
  const [summary, setSummary] = useState(null)
  const [payments, setPayments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [cases, setCases] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ clientId: '', investigationId: '', amount: '', method: '', terminalReference: '', status: 'PAYMENT_RECEIVED', notes: '' })
  const [loadError, setLoadError] = useState('')
  const action = useAction()
  const exportAction = useAction()

  async function loadLists() {
    const [p, i] = await Promise.all([api('/payments?limit=50'), api('/invoices?limit=50')])
    setPayments(p.data.payments)
    setInvoices(i.data.invoices)
  }

  async function loadSummary(per = period) {
    if (!canSeeSummary) return
    const res = await api(`/finance/summary?period=${per}`)
    setSummary(res.data)
  }

  useEffect(() => {
    loadLists().catch((err) => setLoadError(err.message))
    api('/clients?limit=100').then((r) => setClients(r.data.clients)).catch(() => {})
    api('/investigations?limit=100').then((r) => setCases(r.data.investigations)).catch(() => {})
  }, [])

  useEffect(() => {
    loadSummary().catch((err) => setLoadError(err.message))
  }, [period])

  const clientCases = cases.filter((c) => !form.clientId || c.client?.id === form.clientId)

  async function createPayment() {
    await action.run(async () => {
      await api('/payments', {
        method: 'POST',
        body: JSON.stringify({
          clientId: form.clientId,
          investigationId: form.investigationId || null,
          amount: Number(form.amount),
          method: form.method || null,
          terminalReference: form.terminalReference || null,
          status: form.status,
          notes: form.notes || null,
        }),
      })
      setForm({ ...form, amount: '', terminalReference: '', notes: '', investigationId: '' })
      setShowForm(false)
      await Promise.all([loadLists(), loadSummary()])
    }, 'Payment recorded')
  }

  async function invoiceStatus(inv, paymentStatus) {
    await action.run(async () => {
      await api(`/invoices/${inv.id}/payment-status`, { method: 'PATCH', body: JSON.stringify({ paymentStatus }) })
      await Promise.all([loadLists(), loadSummary()])
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Finance" subtitle="Revenue, payments and invoices.">
        {canSeeSummary && (
          <>
            <button type="button" onClick={() => exportAction.run(() => apiDownload('/finance/export?type=payments', 'payments.csv'))} className={btnSecondary}>
              Export payments CSV
            </button>
            <button type="button" onClick={() => exportAction.run(() => apiDownload('/finance/export?type=invoices', 'invoices.csv'))} className={btnSecondary}>
              Export invoices CSV
            </button>
          </>
        )}
        <button type="button" onClick={() => setShowForm((v) => !v)} className={btnPrimary}>
          {showForm ? 'Close' : 'Record payment'}
        </button>
      </PageHeader>
      <Alert error={loadError || exportAction.error} success={action.success} />

      {summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Revenue today" value={money(summary.snapshot.today.total)} tone="green" />
            <Stat label="Revenue this week" value={money(summary.snapshot.week.total)} />
            <Stat label="Revenue this month" value={money(summary.snapshot.month.total)} />
            <Stat label={`Outstanding (${summary.outstandingInvoices.count} invoices)`} value={money(summary.outstandingInvoices.total)} tone="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel
              title={`Revenue — ${money(summary.totalRevenue)} (${summary.paymentCount} payments)`}
              action={
                <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs bg-white">
                  <option value="daily">Daily (30 days)</option>
                  <option value="weekly">Weekly (12 weeks)</option>
                  <option value="monthly">Monthly (12 months)</option>
                </select>
              }
            >
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-500 border-b text-left">
                    <tr>
                      <th className="py-2 font-medium">Period</th>
                      <th className="py-2 font-medium">Payments</th>
                      <th className="py-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.revenue.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-3 text-slate-500">
                          No revenue in this range.
                        </td>
                      </tr>
                    )}
                    {[...summary.revenue].reverse().map((r) => (
                      <tr key={r.period} className="border-b border-slate-100">
                        <td className="py-2">{r.period}</td>
                        <td className="py-2">{r.count}</td>
                        <td className="py-2 text-right">{money(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="Revenue by service">
              <table className="w-full text-sm">
                <thead className="text-slate-500 border-b text-left">
                  <tr>
                    <th className="py-2 font-medium">Service</th>
                    <th className="py-2 font-medium">Payments</th>
                    <th className="py-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byService.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-slate-500">
                        No data.
                      </td>
                    </tr>
                  )}
                  {summary.byService.map((s) => (
                    <tr key={s.service} className="border-b border-slate-100">
                      <td className="py-2">{s.service}</td>
                      <td className="py-2">{s.count}</td>
                      <td className="py-2 text-right">{money(s.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-slate-500 mt-3">
                Refunds in range: {money(summary.refunds.total)} ({summary.refunds.count})
              </p>
            </Panel>
          </div>

          <Panel title="Outstanding invoices">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-500 border-b">
                  <tr>
                    <th className="py-2 font-medium">Invoice</th>
                    <th className="py-2 font-medium">Client</th>
                    <th className="py-2 font-medium">Case</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.outstandingInvoices.invoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-3 text-slate-500">
                        Nothing outstanding.
                      </td>
                    </tr>
                  )}
                  {summary.outstandingInvoices.invoices.map((i) => (
                    <tr key={i.id} className="border-b border-slate-100">
                      <td className="py-2">{i.invoiceNumber}</td>
                      <td className="py-2">{i.client?.fullName}</td>
                      <td className="py-2">
                        {i.investigation ? (
                          <Link to={`/cases/${i.investigation.id}`} className="hover:underline">
                            {i.investigation.reference}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2">
                        <Badge status={i.paymentStatus} />
                      </td>
                      <td className="py-2 text-right">{money(i.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {showForm && (
        <Panel title="Record payment">
          <p className="text-xs text-slate-500 mb-3">Never enter card numbers — record the terminal reference only.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Client *">
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, investigationId: '' })} className={inputCls}>
                <option value="">Select client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Case">
              <select value={form.investigationId} onChange={(e) => setForm({ ...form, investigationId: e.target.value })} className={inputCls}>
                <option value="">None</option>
                {clientCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.reference} — {c.client?.fullName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount (£) *">
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Method">
              <input value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Terminal reference">
              <input value={form.terminalReference} onChange={(e) => setForm({ ...form, terminalReference: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes" className="md:col-span-3">
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <div className="mt-4 space-y-2">
            <Alert error={action.error} />
            <button type="button" disabled={action.busy || !form.clientId || !form.amount} onClick={createPayment} className={btnPrimary}>
              Save payment
            </button>
          </div>
        </Panel>
      )}

      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900">Recent payments</h3>
        <Table columns={['Date', 'Client', 'Case', 'Amount', 'Status', 'Method', 'Recorded by']} isEmpty={payments.length === 0} empty="No payments yet.">
          {payments.map((p) => (
            <Tr key={p.id}>
              <Td>{fmtDate(p.receivedAt)}</Td>
              <Td>
                <Link to={`/clients/${p.client.id}`} className="hover:underline">
                  {p.client.fullName}
                </Link>
              </Td>
              <Td>
                {p.investigation ? (
                  <Link to={`/cases/${p.investigation.id}`} className="hover:underline">
                    {p.investigation.reference}
                  </Link>
                ) : (
                  '—'
                )}
              </Td>
              <Td>{money(p.amount)}</Td>
              <Td>
                <Badge status={p.status} />
              </Td>
              <Td>{p.method || '—'}</Td>
              <Td>{p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}` : '—'}</Td>
            </Tr>
          ))}
        </Table>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900">Invoices</h3>
        <Alert error={action.error} />
        <Table columns={['Invoice', 'Date', 'Client', 'Case', 'Amount', 'Payment status', '']} isEmpty={invoices.length === 0} empty="No invoices yet.">
          {invoices.map((i) => (
            <Tr key={i.id}>
              <Td className="font-medium text-slate-900">{i.invoiceNumber}</Td>
              <Td>{fmtDate(i.createdAt)}</Td>
              <Td>{i.client?.fullName}</Td>
              <Td>
                {i.investigation ? (
                  <Link to={`/cases/${i.investigation.id}`} className="hover:underline">
                    {i.investigation.reference}
                  </Link>
                ) : (
                  '—'
                )}
              </Td>
              <Td>{money(i.amount)}</Td>
              <Td>
                <select value={i.paymentStatus} onChange={(e) => invoiceStatus(i, e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs bg-white">
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </Td>
              <Td>
                <button type="button" onClick={() => action.run(() => apiDownload(`/invoices/${i.id}/download`, `${i.invoiceNumber}.pdf`))} className={btnSmall}>
                  Download
                </button>
              </Td>
            </Tr>
          ))}
        </Table>
      </section>
    </div>
  )
}
