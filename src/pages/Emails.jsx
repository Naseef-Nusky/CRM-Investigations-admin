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
  btnSecondary,
  btnSmall,
  fmtDateTime,
  inputCls,
  useAction,
} from '../components/ui'

const emptyForm = { recipient: '', subject: '', body: '', clientId: '', investigationId: '', templateKey: '' }

export default function Emails() {
  const [emails, setEmails] = useState([])
  const [templates, setTemplates] = useState([])
  const [clients, setClients] = useState([])
  const [cases, setCases] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [open, setOpen] = useState(null)
  const [loadError, setLoadError] = useState('')
  const action = useAction()

  async function load() {
    const res = await api('/emails?limit=100')
    setEmails(res.data.emails)
  }

  useEffect(() => {
    load().catch((err) => setLoadError(err.message))
    api('/email-templates').then((r) => setTemplates(r.data.templates)).catch(() => {})
    api('/clients?limit=100').then((r) => setClients(r.data.clients)).catch(() => {})
    api('/investigations?limit=100').then((r) => setCases(r.data.investigations)).catch(() => {})
  }, [])

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onClientChange(clientId) {
    const client = clients.find((c) => c.id === clientId)
    setForm((prev) => ({
      ...prev,
      clientId,
      investigationId: '',
      recipient: client?.email || prev.recipient,
    }))
  }

  function onCaseChange(investigationId) {
    const c = cases.find((x) => x.id === investigationId)
    const client = clients.find((x) => x.id === c?.client?.id)
    setForm((prev) => ({
      ...prev,
      investigationId,
      clientId: c?.client?.id || prev.clientId,
      recipient: client?.email || prev.recipient,
    }))
  }

  async function preview() {
    await action.run(async () => {
      const res = await api('/emails/preview', {
        method: 'POST',
        body: JSON.stringify({
          templateKey: form.templateKey,
          clientId: form.clientId || null,
          investigationId: form.investigationId || null,
        }),
      })
      setForm((prev) => ({ ...prev, subject: res.data.subject, body: res.data.body }))
    })
  }

  async function send() {
    await action.run(async () => {
      const res = await api('/emails', {
        method: 'POST',
        body: JSON.stringify({
          recipient: form.recipient || null,
          subject: form.subject,
          body: form.body,
          clientId: form.clientId || null,
          investigationId: form.investigationId || null,
          templateKey: form.templateKey || null,
        }),
      })
      setForm(emptyForm)
      setShowForm(false)
      await load()
      return res
    }, 'Email recorded')
  }

  const visibleCases = cases.filter((c) => !form.clientId || c.client?.id === form.clientId)

  return (
    <div className="space-y-6">
      <PageHeader title="Emails" subtitle="Correspondence log and composer.">
        <button type="button" onClick={() => setShowForm((v) => !v)} className={btnPrimary}>
          {showForm ? 'Close' : 'Compose'}
        </button>
      </PageHeader>
      <Alert error={loadError} success={!showForm ? action.success : ''} />

      {showForm && (
        <Panel title="Compose email">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Client">
              <select value={form.clientId} onChange={(e) => onClientChange(e.target.value)} className={inputCls}>
                <option value="">None</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Case">
              <select value={form.investigationId} onChange={(e) => onCaseChange(e.target.value)} className={inputCls}>
                <option value="">None</option>
                {visibleCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.reference} — {c.client?.fullName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Recipient">
              <input type="email" value={form.recipient} onChange={(e) => set('recipient', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Template">
              <div className="flex gap-2">
                <select value={form.templateKey} onChange={(e) => set('templateKey', e.target.value)} className={inputCls}>
                  <option value="">No template</option>
                  {templates
                    .filter((t) => t.isActive)
                    .map((t) => (
                      <option key={t.id} value={t.key}>
                        {t.name}
                      </option>
                    ))}
                </select>
                <button type="button" disabled={!form.templateKey || action.busy} onClick={preview} className={`${btnSecondary} mt-1 whitespace-nowrap`}>
                  Preview
                </button>
              </div>
            </Field>
            <Field label="Subject *" className="md:col-span-2">
              <input value={form.subject} onChange={(e) => set('subject', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Body *" className="md:col-span-2">
              <textarea rows={10} value={form.body} onChange={(e) => set('body', e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="mt-4 space-y-2">
            <Alert error={action.error} />
            <button type="button" disabled={action.busy || !form.subject || !form.body} onClick={send} className={btnPrimary}>
              {action.busy ? 'Sending…' : 'Send'}
            </button>
          </div>
        </Panel>
      )}

      <Table columns={['Date', 'Direction', 'Subject', 'Recipient', 'Client', 'Case', 'Template']} isEmpty={emails.length === 0} empty="No emails logged.">
        {emails.map((e) => (
          <Tr key={e.id}>
            <Td className="whitespace-nowrap">{fmtDateTime(e.sentAt)}</Td>
            <Td>
              <Badge status={e.direction} tone={e.direction === 'OUTBOUND' ? 'sky' : 'slate'} />
            </Td>
            <Td>
              <button type="button" onClick={() => setOpen(open === e.id ? null : e.id)} className="text-left font-medium text-slate-900 hover:underline">
                {e.subject}
              </button>
              {open === e.id && (
                <div className="mt-2 text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-md p-3">
                  {e.body || '(no body)'}
                  <div className="mt-2">
                    <button type="button" onClick={() => setOpen(null)} className={btnSmall}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </Td>
            <Td>{e.recipient || '—'}</Td>
            <Td>
              {e.client ? (
                <Link to={`/clients/${e.client.id}`} className="hover:underline">
                  {e.client.fullName}
                </Link>
              ) : (
                '—'
              )}
            </Td>
            <Td>
              {e.investigation ? (
                <Link to={`/cases/${e.investigation.id}`} className="hover:underline">
                  {e.investigation.reference}
                </Link>
              ) : (
                '—'
              )}
            </Td>
            <Td>{e.templateKey || '—'}</Td>
          </Tr>
        ))}
      </Table>
    </div>
  )
}
