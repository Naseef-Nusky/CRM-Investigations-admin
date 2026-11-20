import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import {
  Alert,
  Badge,
  Field,
  PageHeader,
  Panel,
  Stat,
  Table,
  Td,
  Tr,
  btnPrimary,
  btnSmall,
  fmtDateTime,
  inputCls,
  toIso,
  useAction,
} from '../components/ui'

const emptyForm = { title: '', dueAt: '', clientId: '', investigationId: '' }

export default function Reminders() {
  const [reminders, setReminders] = useState([])
  const [due, setDue] = useState({ overdue: [], dueToday: [], total: 0 })
  const [status, setStatus] = useState('open')
  const [clients, setClients] = useState([])
  const [cases, setCases] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loadError, setLoadError] = useState('')
  const action = useAction()

  async function load(s = status) {
    const [list, dueRes] = await Promise.all([api(`/reminders?status=${s}&limit=100`), api('/reminders/due')])
    setReminders(list.data.reminders)
    setDue(dueRes.data)
  }

  useEffect(() => {
    load().catch((err) => setLoadError(err.message))
  }, [status])

  useEffect(() => {
    api('/clients?limit=100').then((r) => setClients(r.data.clients)).catch(() => {})
    api('/investigations?limit=100').then((r) => setCases(r.data.investigations)).catch(() => {})
  }, [])

  async function create() {
    await action.run(async () => {
      await api('/reminders', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          dueAt: toIso(form.dueAt),
          clientId: form.clientId || null,
          investigationId: form.investigationId || null,
        }),
      })
      setForm(emptyForm)
      setShowForm(false)
      await load()
    })
  }

  async function complete(id) {
    await action.run(async () => {
      await api(`/reminders/${id}/complete`, { method: 'POST' })
      await load()
    })
  }

  const now = Date.now()

  return (
    <div className="space-y-6">
      <PageHeader title="Reminders" subtitle="Your follow-ups and deadlines.">
        <button type="button" onClick={() => setShowForm((v) => !v)} className={btnPrimary}>
          {showForm ? 'Close' : 'New reminder'}
        </button>
      </PageHeader>
      <Alert error={loadError} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Overdue" value={due.overdue.length} tone={due.overdue.length ? 'red' : 'slate'} />
        <Stat label="Due today" value={due.dueToday.length} tone={due.dueToday.length ? 'amber' : 'slate'} />
        <Stat label="Total due now" value={due.total} />
      </div>

      {due.total > 0 && (
        <Panel title="Due now">
          <ul className="space-y-2 text-sm">
            {[...due.overdue, ...due.dueToday].map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <p className="font-medium text-slate-900">{r.title}</p>
                  <p className="text-slate-500">
                    {fmtDateTime(r.dueAt)}
                    {r.client && ` · ${r.client.fullName}`}
                    {r.investigation && ` · ${r.investigation.reference}`}
                  </p>
                </div>
                <button type="button" disabled={action.busy} onClick={() => complete(r.id)} className={btnSmall}>
                  Complete
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {showForm && (
        <Panel title="Create reminder">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Title *" className="md:col-span-2">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Due *">
              <input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Client">
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={inputCls}>
                <option value="">None</option>
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
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.reference} — {c.client?.fullName}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-4 space-y-2">
            <Alert error={action.error} />
            <button type="button" disabled={action.busy || !form.title.trim() || !form.dueAt} onClick={create} className={btnPrimary}>
              Save reminder
            </button>
          </div>
        </Panel>
      )}

      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-600">Show</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 bg-white">
          {['open', 'overdue', 'completed', 'all'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {!showForm && <Alert error={action.error} />}

      <Table columns={['Title', 'Due', 'Client', 'Case', 'Status', '']} isEmpty={reminders.length === 0} empty="No reminders.">
        {reminders.map((r) => {
          const done = Boolean(r.completedAt)
          const overdue = !done && new Date(r.dueAt).getTime() < now
          return (
            <Tr key={r.id}>
              <Td className={`font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{r.title}</Td>
              <Td>{fmtDateTime(r.dueAt)}</Td>
              <Td>
                {r.client ? (
                  <Link to={`/clients/${r.client.id}`} className="hover:underline">
                    {r.client.fullName}
                  </Link>
                ) : (
                  '—'
                )}
              </Td>
              <Td>
                {r.investigation ? (
                  <Link to={`/cases/${r.investigation.id}`} className="hover:underline">
                    {r.investigation.reference}
                  </Link>
                ) : (
                  '—'
                )}
              </Td>
              <Td>
                <Badge status={done ? 'COMPLETED' : overdue ? 'OVERDUE' : 'OPEN'} tone={done ? 'green' : overdue ? 'red' : 'sky'} />
              </Td>
              <Td>
                {!done && (
                  <button type="button" disabled={action.busy} onClick={() => complete(r.id)} className={btnSmall}>
                    Complete
                  </button>
                )}
              </Td>
            </Tr>
          )
        })}
      </Table>
    </div>
  )
}
