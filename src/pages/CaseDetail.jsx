import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, apiDownload, apiUpload } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import {
  Alert,
  Badge,
  CASE_STATUSES,
  Field,
  MANAGEMENT_ROLES,
  PAYMENT_STATUSES,
  Panel,
  Table,
  Td,
  Tr,
  btnPrimary,
  btnSecondary,
  btnSmall,
  fmtDate,
  fmtDateTime,
  inputCls,
  label,
  money,
  numOrNull,
  toIso,
  useAction,
} from '../components/ui'

const TABS = [
  ['overview', 'Overview'],
  ['workflow', 'Workflow'],
  ['checklist', 'Checklist'],
  ['payments', 'Payments'],
  ['invoices', 'Invoices'],
  ['documents', 'Documents'],
  ['evidence', 'Evidence'],
  ['progress', 'Progress'],
  ['reports', 'Reports'],
]

const CHECKLIST_STATUSES = ['OUTSTANDING', 'RECEIVED', 'UNDER_REVIEW', 'VERIFIED', 'NOT_APPLICABLE']
const DOC_CATEGORIES = ['instruction_form', 'confidentiality', 'questionnaire', 'id', 'payment', 'additional']

const TRANSITIONS = {
  NEW_ENQUIRY: ['QUOTED', 'AWAITING_PAYMENT', 'AWAITING_DOCUMENTS', 'UNDER_VERIFICATION', 'READY_FOR_ALLOCATION', 'CANCELLED'],
  QUOTED: ['NEW_ENQUIRY', 'AWAITING_PAYMENT', 'AWAITING_DOCUMENTS', 'UNDER_VERIFICATION', 'READY_FOR_ALLOCATION', 'CANCELLED'],
  AWAITING_PAYMENT: ['AWAITING_DOCUMENTS', 'UNDER_VERIFICATION', 'READY_FOR_ALLOCATION', 'CANCELLED'],
  AWAITING_DOCUMENTS: ['AWAITING_PAYMENT', 'UNDER_VERIFICATION', 'READY_FOR_ALLOCATION', 'CANCELLED'],
  UNDER_VERIFICATION: ['AWAITING_PAYMENT', 'AWAITING_DOCUMENTS', 'READY_FOR_ALLOCATION', 'CANCELLED'],
  READY_FOR_ALLOCATION: ['AWAITING_DOCUMENTS', 'UNDER_VERIFICATION', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'READY_FOR_ALLOCATION', 'CANCELLED'],
  IN_PROGRESS: ['AWAITING_REPORT', 'MANAGEMENT_REVIEW', 'CANCELLED'],
  AWAITING_REPORT: ['IN_PROGRESS', 'MANAGEMENT_REVIEW', 'CANCELLED'],
  MANAGEMENT_REVIEW: ['REPORT_APPROVED', 'AMENDMENTS_REQUIRED'],
  AMENDMENTS_REQUIRED: ['AWAITING_REPORT', 'MANAGEMENT_REVIEW'],
  REPORT_APPROVED: ['MANAGEMENT_REVIEW', 'REPORT_SENT'],
  REPORT_SENT: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: ['NEW_ENQUIRY'],
}

function Row({ name, children }) {
  return (
    <div>
      <dt className="text-slate-500">{name}</dt>
      <dd className="text-slate-800">{children}</dd>
    </div>
  )
}

export default function CaseDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const isManagement = MANAGEMENT_ROLES.includes(user?.role)
  const canDeliver = isManagement || user?.role === 'OFFICE_ADMIN'
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await api(`/investigations/${id}`)
    setData(res.data)
  }, [id])

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [load])

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <p className="text-slate-600">Loading case…</p>

  const { investigation: inv, readiness } = data
  const shared = { inv, readiness, reload: load, isManagement, canDeliver, user }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/cases" className="text-sm text-slate-600 hover:underline">
          ← Cases
        </Link>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <h2 className="text-2xl font-semibold text-slate-900">{inv.reference}</h2>
          <Badge status={inv.status} />
        </div>
        <p className="text-sm text-slate-600 mt-1">
          <Link to={`/clients/${inv.client.id}`} className="hover:underline">
            {inv.client.fullName}
          </Link>{' '}
          · {inv.service?.name || 'No service'}
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map(([key, text]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm -mb-px border-b-2 ${
              tab === key
                ? 'border-slate-900 text-slate-900 font-medium'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview {...shared} />}
      {tab === 'workflow' && <Workflow {...shared} />}
      {tab === 'checklist' && <Checklist {...shared} />}
      {tab === 'payments' && <Payments {...shared} />}
      {tab === 'invoices' && <Invoices {...shared} />}
      {tab === 'documents' && <Documents {...shared} />}
      {tab === 'evidence' && <Evidence {...shared} />}
      {tab === 'progress' && <Progress {...shared} />}
      {tab === 'reports' && <Reports {...shared} />}
    </div>
  )
}

/* ---------------------------------- Overview --------------------------------- */

function Overview({ inv, reload }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const action = useAction()

  function startEdit() {
    setForm({
      quotedPrice: inv.quotedPrice ?? '',
      agreedPrice: inv.agreedPrice ?? '',
      instructions: inv.instructions || '',
      managementNotes: inv.managementNotes || '',
      expectedCompletionDate: inv.expectedCompletionDate ? inv.expectedCompletionDate.slice(0, 10) : '',
    })
    setEditing(true)
  }

  async function save() {
    await action.run(async () => {
      await api(`/investigations/${inv.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          quotedPrice: numOrNull(form.quotedPrice),
          agreedPrice: numOrNull(form.agreedPrice),
          instructions: form.instructions || null,
          managementNotes: form.managementNotes || null,
          expectedCompletionDate: toIso(form.expectedCompletionDate),
        }),
      })
      setEditing(false)
      await reload()
    })
  }

  const investigator = inv.assignedInvestigator
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Panel
        title="Case details"
        className="lg:col-span-1"
        action={
          !editing && (
            <button type="button" onClick={startEdit} className={btnSmall}>
              Edit
            </button>
          )
        }
      >
        {editing ? (
          <div className="space-y-3">
            <Field label="Quoted price (£)">
              <input type="number" min="0" step="0.01" value={form.quotedPrice} onChange={(e) => setForm({ ...form, quotedPrice: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Agreed price (£)">
              <input type="number" min="0" step="0.01" value={form.agreedPrice} onChange={(e) => setForm({ ...form, agreedPrice: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Expected completion">
              <input type="date" value={form.expectedCompletionDate} onChange={(e) => setForm({ ...form, expectedCompletionDate: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Instructions">
              <textarea rows={4} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Management notes">
              <textarea rows={3} value={form.managementNotes} onChange={(e) => setForm({ ...form, managementNotes: e.target.value })} className={inputCls} />
            </Field>
            <Alert error={action.error} />
            <div className="flex gap-2">
              <button type="button" onClick={save} disabled={action.busy} className={btnPrimary}>
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <dl className="space-y-3 text-sm">
            <Row name="Service">{inv.service?.name || '—'}</Row>
            <Row name="Quoted price">{money(inv.quotedPrice)}</Row>
            <Row name="Agreed price">{money(inv.agreedPrice)}</Row>
            <Row name="Investigator">
              {investigator ? `${investigator.firstName} ${investigator.lastName}` : 'Not allocated'}
            </Row>
            <Row name="Created">{fmtDate(inv.createdAt)}</Row>
            <Row name="Start date">{fmtDate(inv.startDate)}</Row>
            <Row name="Expected completion">{fmtDate(inv.expectedCompletionDate)}</Row>
            <Row name="Completed">{fmtDate(inv.completionDate)}</Row>
            {inv.allocationException && <Row name="Allocation exception">{inv.allocationException}</Row>}
          </dl>
        )}
      </Panel>

      <div className="lg:col-span-2 space-y-4">
        <Panel title="Instructions">
          <p className="text-sm text-slate-800 whitespace-pre-wrap">{inv.instructions || 'No instructions recorded.'}</p>
        </Panel>
        {inv.managementNotes && (
          <Panel title="Management notes">
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{inv.managementNotes}</p>
          </Panel>
        )}
        <Panel title="Client">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Row name="Name">
              <Link to={`/clients/${inv.client.id}`} className="hover:underline">
                {inv.client.fullName}
              </Link>
            </Row>
            <Row name="Phone">{inv.client.telephone || '—'}</Row>
            <Row name="Email">{inv.client.email || '—'}</Row>
            <Row name="Address">
              {[inv.client.addressLine1, inv.client.city, inv.client.postcode].filter(Boolean).join(', ') || '—'}
            </Row>
          </dl>
        </Panel>
        {inv.callLogs?.length > 0 && (
          <Panel title="Related calls">
            <ul className="space-y-2 text-sm">
              {inv.callLogs.slice(0, 5).map((c) => (
                <li key={c.id} className="border-b border-slate-100 pb-2">
                  <p className="font-medium">
                    {c.direction} · {label(c.outcome)}
                  </p>
                  <p className="text-slate-500">
                    {fmtDateTime(c.contactedAt)} · {c.handler?.firstName} {c.handler?.lastName}
                  </p>
                  {c.notes && <p className="text-slate-700">{c.notes}</p>}
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------- Workflow --------------------------------- */

function Workflow({ inv, readiness, reload, isManagement, user }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <StatusChange inv={inv} reload={reload} user={user} />
      <MarkReady inv={inv} readiness={readiness} reload={reload} />
      <Allocate inv={inv} readiness={readiness} reload={reload} isManagement={isManagement} />
      <SendForms inv={inv} reload={reload} />
    </div>
  )
}

function StatusChange({ inv, reload, user }) {
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [force, setForce] = useState(false)
  const action = useAction()
  const options = force ? CASE_STATUSES.filter((s) => s !== 'ASSIGNED' && s !== inv.status) : TRANSITIONS[inv.status] || []

  async function submit() {
    await action.run(async () => {
      await api(`/investigations/${inv.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note: note || undefined, force: force || undefined }),
      })
      setStatus('')
      setNote('')
      await reload()
    }, 'Status updated')
  }

  return (
    <Panel title="Change status">
      <p className="text-sm text-slate-600 mb-3">
        Current: <Badge status={inv.status} />. Allocation to an investigator uses the Allocate form.
      </p>
      <div className="space-y-3">
        <Field label="New status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            {options
              .filter((s) => s !== 'ASSIGNED')
              .map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Note (optional)">
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </Field>
        {user?.role === 'SUPER_ADMIN' && (
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
            Force (override transition rules)
          </label>
        )}
        <Alert error={action.error} success={action.success} />
        <button type="button" disabled={!status || action.busy} onClick={submit} className={btnPrimary}>
          Update status
        </button>
      </div>
    </Panel>
  )
}

function MarkReady({ inv, readiness, reload }) {
  const [exception, setException] = useState('')
  const action = useAction()
  const incomplete = !readiness.checklistComplete

  async function submit() {
    await action.run(async () => {
      await api(`/investigations/${inv.id}/ready`, {
        method: 'POST',
        body: JSON.stringify(incomplete && exception ? { allocationException: exception } : {}),
      })
      setException('')
      await reload()
    }, 'Marked ready for allocation')
  }

  return (
    <Panel title="Ready for allocation">
      {readiness.checklistComplete ? (
        <p className="text-sm text-emerald-700 mb-3">All mandatory checklist items are complete.</p>
      ) : (
        <div className="text-sm bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
          <p className="font-medium text-amber-900">Outstanding mandatory items:</p>
          <ul className="list-disc ml-5 text-amber-800">
            {readiness.outstandingItems.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          {readiness.allocationException && (
            <p className="mt-2 text-amber-900">Exception on record: {readiness.allocationException}</p>
          )}
        </div>
      )}
      {incomplete && (
        <Field label="Allocation exception reason (min 10 characters)" className="mb-3">
          <textarea rows={2} value={exception} onChange={(e) => setException(e.target.value)} className={inputCls} />
        </Field>
      )}
      <Alert error={action.error} success={action.success} />
      <button
        type="button"
        disabled={action.busy || inv.status === 'READY_FOR_ALLOCATION' || (incomplete && !exception && !readiness.allocationException)}
        onClick={submit}
        className={`${btnPrimary} mt-2`}
      >
        Mark ready
      </button>
    </Panel>
  )
}

function Allocate({ inv, readiness, reload, isManagement }) {
  const [investigators, setInvestigators] = useState([])
  const [investigatorId, setInvestigatorId] = useState('')
  const [expected, setExpected] = useState('')
  const [notes, setNotes] = useState('')
  const [exception, setException] = useState('')
  const [reason, setReason] = useState('')
  const action = useAction()
  const assigned = Boolean(inv.assignedInvestigatorId)

  useEffect(() => {
    if (!isManagement) return
    api('/investigators?active=true')
      .then((r) => setInvestigators(r.data.investigators))
      .catch(() => {})
  }, [isManagement])

  if (!isManagement) {
    return (
      <Panel title="Allocate investigator">
        <p className="text-sm text-slate-500">Only management can allocate or reassign investigators.</p>
      </Panel>
    )
  }

  async function submit() {
    await action.run(async () => {
      if (assigned) {
        await api(`/investigations/${inv.id}/reassign`, {
          method: 'POST',
          body: JSON.stringify({ investigatorId, reason }),
        })
      } else {
        const body = { investigatorId }
        if (expected) body.expectedCompletionDate = toIso(expected)
        if (notes) body.notes = notes
        if (!readiness.checklistComplete && exception) body.allocationException = exception
        await api(`/investigations/${inv.id}/allocate`, { method: 'POST', body: JSON.stringify(body) })
      }
      setInvestigatorId('')
      setReason('')
      setNotes('')
      await reload()
    }, assigned ? 'Case reassigned' : 'Investigator allocated')
  }

  return (
    <Panel title={assigned ? 'Reassign investigator' : 'Allocate investigator'}>
      {assigned && (
        <p className="text-sm text-slate-600 mb-3">
          Currently assigned to {inv.assignedInvestigator?.firstName} {inv.assignedInvestigator?.lastName}.
        </p>
      )}
      <div className="space-y-3">
        <Field label="Investigator">
          <select value={investigatorId} onChange={(e) => setInvestigatorId(e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            {investigators
              .filter((i) => i.id !== inv.assignedInvestigatorId)
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.firstName} {i.lastName} — {i.activeCases} active
                  {i.investigatorProfile?.availability ? ` · ${i.investigatorProfile.availability}` : ''}
                </option>
              ))}
          </select>
        </Field>
        {assigned ? (
          <Field label="Reason for reassignment *">
            <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} />
          </Field>
        ) : (
          <>
            <Field label="Expected completion">
              <input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Notes">
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
            </Field>
            {!readiness.checklistComplete && inv.status !== 'READY_FOR_ALLOCATION' && (
              <Field label="Allocation exception (checklist incomplete, min 10 chars)">
                <textarea rows={2} value={exception} onChange={(e) => setException(e.target.value)} className={inputCls} />
              </Field>
            )}
          </>
        )}
        <Alert error={action.error} success={action.success} />
        <button type="button" disabled={!investigatorId || action.busy || (assigned && reason.length < 3)} onClick={submit} className={btnPrimary}>
          {assigned ? 'Reassign' : 'Allocate'}
        </button>
      </div>
    </Panel>
  )
}

function SendForms({ inv, reload }) {
  const [forms, setForms] = useState([])
  const [selected, setSelected] = useState([])
  const [message, setMessage] = useState('')
  const action = useAction()

  useEffect(() => {
    const q = inv.serviceId ? `?serviceId=${inv.serviceId}` : ''
    api(`/cognito/forms${q}`)
      .then((r) => setForms(r.data.forms))
      .catch(() => {})
  }, [inv.serviceId])

  function toggle(key) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  async function submit() {
    await action.run(async () => {
      await api('/cognito/send-forms', {
        method: 'POST',
        body: JSON.stringify({
          investigationId: inv.id,
          formKeys: selected.length ? selected : undefined,
          message: message || undefined,
        }),
      })
      setSelected([])
      setMessage('')
      await reload()
    }, `Forms emailed to ${inv.client.email || 'client'}`)
  }

  return (
    <Panel title="Send Cognito forms">
      {forms.length === 0 ? (
        <p className="text-sm text-slate-500">No active forms configured (add them under Settings).</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Emails form links to {inv.client.email || 'the client (no email on file)'}. Leave all unticked to send every form.
          </p>
          <ul className="space-y-1 text-sm">
            {forms.map((f) => (
              <li key={f.id}>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.includes(f.formKey)} onChange={() => toggle(f.formKey)} />
                  {f.name}
                </label>
              </li>
            ))}
          </ul>
          <Field label="Message (optional)">
            <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} className={inputCls} />
          </Field>
          <Alert error={action.error} success={action.success} />
          <button type="button" disabled={action.busy} onClick={submit} className={btnPrimary}>
            Send forms
          </button>
        </div>
      )}
    </Panel>
  )
}

/* ---------------------------------- Checklist -------------------------------- */

function Checklist({ inv, readiness, reload }) {
  const [newLabel, setNewLabel] = useState('')
  const [mandatory, setMandatory] = useState(false)
  const action = useAction()

  async function setStatus(itemId, status) {
    await action.run(async () => {
      await api(`/investigations/${inv.id}/checklist/${itemId}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      await reload()
    })
  }

  async function addItem() {
    await action.run(async () => {
      await api(`/investigations/${inv.id}/checklist`, {
        method: 'POST',
        body: JSON.stringify({ label: newLabel, isMandatory: mandatory }),
      })
      setNewLabel('')
      await reload()
    })
  }

  return (
    <Panel title="Verification checklist">
      <p className={`text-sm mb-4 ${readiness.checklistComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
        {readiness.checklistComplete
          ? 'All mandatory items complete.'
          : `${readiness.outstandingItems.length} mandatory item(s) outstanding.`}
      </p>
      <ul className="divide-y divide-slate-100">
        {inv.checklist.map((item) => (
          <li key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div>
              <span className="font-medium text-slate-800">{item.label}</span>
              {!item.isMandatory && <span className="ml-2 text-xs text-slate-500">optional</span>}
            </div>
            <div className="flex items-center gap-2">
              <Badge status={item.status} />
              <select
                value={item.status}
                disabled={action.busy}
                onChange={(e) => setStatus(item.id, e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs bg-white"
              >
                {CHECKLIST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
        {inv.checklist.length === 0 && <li className="py-3 text-sm text-slate-500">No checklist items.</li>}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Add checklist item…"
          className="flex-1 min-w-48 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="text-sm flex items-center gap-1">
          <input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} />
          Mandatory
        </label>
        <button type="button" disabled={newLabel.trim().length < 2 || action.busy} onClick={addItem} className={btnSecondary}>
          Add
        </button>
      </div>
      <div className="mt-2">
        <Alert error={action.error} />
      </div>
    </Panel>
  )
}

/* ---------------------------------- Payments --------------------------------- */

function Payments({ inv, reload }) {
  const [form, setForm] = useState({
    amount: inv.agreedPrice ?? '',
    method: '',
    terminalReference: '',
    status: 'PAYMENT_RECEIVED',
    notes: '',
  })
  const action = useAction()
  const received = (inv.payments || [])
    .filter((p) => p.status === 'PAYMENT_RECEIVED' || p.status === 'PART_PAYMENT')
    .reduce((sum, p) => sum + p.amount, 0)

  async function submit() {
    await action.run(async () => {
      await api('/payments', {
        method: 'POST',
        body: JSON.stringify({
          clientId: inv.clientId,
          investigationId: inv.id,
          amount: Number(form.amount),
          method: form.method || null,
          terminalReference: form.terminalReference || null,
          status: form.status,
          notes: form.notes || null,
        }),
      })
      setForm({ ...form, amount: '', terminalReference: '', notes: '' })
      await reload()
    }, 'Payment recorded')
  }

  return (
    <div className="space-y-4">
      <Panel title="Record payment">
        <p className="text-sm text-slate-600 mb-3">
          Agreed {money(inv.agreedPrice)} · Received {money(received)}. Never enter card numbers — terminal reference only.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Amount (£) *">
            <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Method">
            <input value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} placeholder="Card terminal, bank transfer…" className={inputCls} />
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
          <Field label="Notes" className="md:col-span-2">
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <div className="mt-3 space-y-2">
          <Alert error={action.error} success={action.success} />
          <button type="button" disabled={action.busy || !form.amount} onClick={submit} className={btnPrimary}>
            Save payment
          </button>
        </div>
      </Panel>
      <Table columns={['Date', 'Amount', 'Status', 'Method', 'Reference', 'Notes']} isEmpty={!inv.payments?.length} empty="No payments recorded.">
        {(inv.payments || []).map((p) => (
          <Tr key={p.id}>
            <Td>{fmtDate(p.receivedAt)}</Td>
            <Td>{money(p.amount)}</Td>
            <Td>
              <Badge status={p.status} />
            </Td>
            <Td>{p.method || '—'}</Td>
            <Td>{p.terminalReference || '—'}</Td>
            <Td>{p.notes || '—'}</Td>
          </Tr>
        ))}
      </Table>
    </div>
  )
}

/* ---------------------------------- Invoices --------------------------------- */

function Invoices({ inv, reload }) {
  const [amount, setAmount] = useState(inv.agreedPrice ?? '')
  const action = useAction()

  async function create() {
    await action.run(async () => {
      await api('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          clientId: inv.clientId,
          investigationId: inv.id,
          amount: numOrNull(amount) ?? undefined,
        }),
      })
      await reload()
    }, 'Invoice created')
  }

  async function download(i) {
    await action.run(() => apiDownload(`/invoices/${i.id}/download`, `${i.invoiceNumber}.pdf`))
  }

  async function setPaymentStatus(i, paymentStatus) {
    await action.run(async () => {
      await api(`/invoices/${i.id}/payment-status`, { method: 'PATCH', body: JSON.stringify({ paymentStatus }) })
      await reload()
    })
  }

  return (
    <div className="space-y-4">
      <Panel title="Create invoice">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Amount (£)">
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
          </Field>
          <button type="button" disabled={action.busy} onClick={create} className={btnPrimary}>
            Create invoice
          </button>
        </div>
        <div className="mt-2">
          <Alert error={action.error} success={action.success} />
        </div>
      </Panel>
      <Table columns={['Invoice', 'Date', 'Amount', 'Payment status', '']} isEmpty={!inv.invoices?.length} empty="No invoices.">
        {(inv.invoices || []).map((i) => (
          <Tr key={i.id}>
            <Td className="font-medium text-slate-900">{i.invoiceNumber}</Td>
            <Td>{fmtDate(i.createdAt)}</Td>
            <Td>{money(i.amount)}</Td>
            <Td>
              <select
                value={i.paymentStatus}
                onChange={(e) => setPaymentStatus(i, e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs bg-white"
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </Td>
            <Td>
              <button type="button" onClick={() => download(i)} className={btnSmall}>
                Download PDF
              </button>
            </Td>
          </Tr>
        ))}
      </Table>
    </div>
  )
}

/* ---------------------------------- Documents -------------------------------- */

function Documents({ inv }) {
  const [documents, setDocuments] = useState([])
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [inputKey, setInputKey] = useState(0)
  const action = useAction()

  const loadDocs = useCallback(async () => {
    const res = await api(`/documents?investigationId=${inv.id}&limit=100`)
    setDocuments(res.data.documents)
  }, [inv.id])

  useEffect(() => {
    loadDocs().catch(() => {})
  }, [loadDocs])

  async function upload() {
    await action.run(async () => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('investigationId', inv.id)
      fd.append('clientId', inv.clientId)
      if (title) fd.append('title', title)
      if (category) fd.append('category', category)
      await apiUpload('/documents', fd)
      setFile(null)
      setTitle('')
      setInputKey((k) => k + 1)
      await loadDocs()
    }, 'Document uploaded')
  }

  return (
    <div className="space-y-4">
      <Panel title="Upload document">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="File *">
            <input key={inputKey} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className={inputCls} />
          </Field>
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Category (auto-ticks checklist)">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              <option value="">None</option>
              {DOC_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-3 space-y-2">
          <Alert error={action.error} success={action.success} />
          <button type="button" disabled={!file || action.busy} onClick={upload} className={btnPrimary}>
            {action.busy ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </Panel>
      <Table columns={['Title', 'Category', 'Uploaded', '']} isEmpty={documents.length === 0} empty="No documents.">
        {documents.map((d) => (
          <Tr key={d.id}>
            <Td className="font-medium text-slate-900">{d.title}</Td>
            <Td>{label(d.category)}</Td>
            <Td>{fmtDateTime(d.createdAt)}</Td>
            <Td>
              <button type="button" onClick={() => action.run(() => apiDownload(`/documents/${d.id}/download`, d.title))} className={btnSmall}>
                Download
              </button>
            </Td>
          </Tr>
        ))}
      </Table>
    </div>
  )
}

/* ---------------------------------- Evidence --------------------------------- */

function Evidence({ inv, reload }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [inputKey, setInputKey] = useState(0)
  const action = useAction()

  async function upload() {
    await action.run(async () => {
      const fd = new FormData()
      fd.append('file', file)
      if (title) fd.append('title', title)
      if (notes) fd.append('notes', notes)
      await apiUpload(`/investigations/${inv.id}/evidence`, fd)
      setFile(null)
      setTitle('')
      setNotes('')
      setInputKey((k) => k + 1)
      await reload()
    }, 'Evidence uploaded')
  }

  return (
    <div className="space-y-4">
      <Panel title="Add evidence">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="File *">
            <input key={inputKey} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className={inputCls} />
          </Field>
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Notes">
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <div className="mt-3 space-y-2">
          <Alert error={action.error} success={action.success} />
          <button type="button" disabled={!file || action.busy} onClick={upload} className={btnPrimary}>
            {action.busy ? 'Uploading…' : 'Upload evidence'}
          </button>
        </div>
      </Panel>
      <Table columns={['Title', 'Type', 'Notes', 'Added', '']} isEmpty={!inv.evidence?.length} empty="No evidence uploaded.">
        {(inv.evidence || []).map((e) => (
          <Tr key={e.id}>
            <Td className="font-medium text-slate-900">{e.title}</Td>
            <Td>{e.mimeType || '—'}</Td>
            <Td>{e.notes || '—'}</Td>
            <Td>{fmtDateTime(e.createdAt)}</Td>
            <Td>
              <button
                type="button"
                onClick={() => action.run(() => apiDownload(`/investigations/${inv.id}/evidence/${e.id}/download`, e.title))}
                className={btnSmall}
              >
                Download
              </button>
            </Td>
          </Tr>
        ))}
      </Table>
    </div>
  )
}

/* ---------------------------------- Progress --------------------------------- */

function Progress({ inv, reload }) {
  const [content, setContent] = useState('')
  const action = useAction()

  async function add() {
    await action.run(async () => {
      await api(`/investigations/${inv.id}/progress`, { method: 'POST', body: JSON.stringify({ content }) })
      setContent('')
      await reload()
    })
  }

  return (
    <div className="space-y-4">
      <Panel title="Add progress note">
        <textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} className={inputCls} />
        <div className="mt-3 space-y-2">
          <Alert error={action.error} />
          <button type="button" disabled={!content.trim() || action.busy} onClick={add} className={btnPrimary}>
            Add note
          </button>
        </div>
      </Panel>
      <Panel title="Timeline">
        <ul className="space-y-3 text-sm">
          {inv.progressNotes.length === 0 && <li className="text-slate-500">No progress notes yet.</li>}
          {inv.progressNotes.map((n) => (
            <li key={n.id} className="border-b border-slate-100 pb-3">
              <p className="text-slate-500">
                {fmtDateTime(n.notedAt)} · {n.author ? `${n.author.firstName} ${n.author.lastName}` : 'System'}
              </p>
              <p className="text-slate-800 whitespace-pre-wrap mt-1">{n.content}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

/* ----------------------------------- Reports --------------------------------- */

function Reports({ inv, reload, isManagement, canDeliver }) {
  const [content, setContent] = useState('')
  const [comments, setComments] = useState({})
  const [recipient, setRecipient] = useState('')
  const [editing, setEditing] = useState({})
  const action = useAction()

  function doAction(report, path, body, message) {
    return action.run(async () => {
      await api(`/reports/${report.id}/${path}`, { method: 'POST', body: JSON.stringify(body || {}) })
      setComments((c) => ({ ...c, [report.id]: '' }))
      await reload()
    }, message)
  }

  async function createDraft() {
    await action.run(async () => {
      await api('/reports', { method: 'POST', body: JSON.stringify({ investigationId: inv.id, content }) })
      setContent('')
      await reload()
    }, 'Draft created')
  }

  async function saveContent(report) {
    await action.run(async () => {
      await api(`/reports/${report.id}`, { method: 'PATCH', body: JSON.stringify({ content: editing[report.id] }) })
      setEditing((e) => {
        const next = { ...e }
        delete next[report.id]
        return next
      })
      await reload()
    }, 'Report saved')
  }

  return (
    <div className="space-y-4">
      <Alert error={action.error} success={action.success} />
      {isManagement && (
        <Panel title="New report draft">
          <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Report content…" className={inputCls} />
          <button type="button" disabled={action.busy} onClick={createDraft} className={`${btnPrimary} mt-3`}>
            Create draft
          </button>
        </Panel>
      )}
      {inv.reports.length === 0 && <p className="text-sm text-slate-500">No reports yet.</p>}
      {inv.reports.map((r) => {
        const draftEditable = isManagement && ['DRAFT', 'AMENDMENTS_REQUIRED'].includes(r.status)
        return (
          <Panel
            key={r.id}
            title={`Version ${r.version}`}
            action={
              <div className="flex items-center gap-2">
                <Badge status={r.status} />
                {r.pdfPath && (
                  <button type="button" onClick={() => action.run(() => apiDownload(`/reports/${r.id}/download`, `${inv.reference}-v${r.version}.pdf`))} className={btnSmall}>
                    PDF
                  </button>
                )}
              </div>
            }
          >
            <p className="text-xs text-slate-500 mb-2">
              Submitted {fmtDateTime(r.submittedAt)} · Approved {fmtDateTime(r.approvedAt)} · Sent {fmtDateTime(r.sentAt)}
            </p>
            {editing[r.id] !== undefined ? (
              <div className="space-y-2">
                <textarea rows={6} value={editing[r.id]} onChange={(e) => setEditing({ ...editing, [r.id]: e.target.value })} className={inputCls} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => saveContent(r)} disabled={action.busy} className={btnPrimary}>
                    Save
                  </button>
                  <button type="button" onClick={() => setEditing({})} className={btnSecondary}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{r.content || 'No content.'}</p>
            )}
            {r.managementComments && (
              <p className="mt-3 text-sm bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-900">
                Management comments: {r.managementComments}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {draftEditable && editing[r.id] === undefined && (
                <button type="button" onClick={() => setEditing({ [r.id]: r.content || '' })} className={btnSmall}>
                  Edit content
                </button>
              )}
              {draftEditable && (
                <button type="button" disabled={action.busy} onClick={() => doAction(r, 'submit', {}, 'Report submitted')} className={btnSmall}>
                  Submit for review
                </button>
              )}
              {canDeliver && r.status === 'APPROVED' && (
                <>
                  <input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={inv.client.email || 'Recipient email'}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    disabled={action.busy}
                    onClick={() => doAction(r, 'send', recipient ? { recipient } : {}, 'Report marked as sent')}
                    className={btnSmall}
                  >
                    Mark sent
                  </button>
                </>
              )}
              {canDeliver && r.status === 'SENT' && inv.status !== 'COMPLETED' && (
                <button type="button" disabled={action.busy} onClick={() => doAction(r, 'complete', {}, 'Case completed')} className={btnSmall}>
                  Complete case
                </button>
              )}
            </div>

            {isManagement && r.status === 'SUBMITTED' && (
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <Field label="Review comments (required for reject / amend)">
                  <textarea
                    rows={2}
                    value={comments[r.id] || ''}
                    onChange={(e) => setComments({ ...comments, [r.id]: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={action.busy} onClick={() => doAction(r, 'approve', comments[r.id] ? { comments: comments[r.id] } : {}, 'Report approved')} className={btnPrimary}>
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={action.busy || (comments[r.id] || '').length < 3}
                    onClick={() => doAction(r, 'request-amendments', { comments: comments[r.id] }, 'Amendments requested')}
                    className={btnSecondary}
                  >
                    Request amendments
                  </button>
                  <button
                    type="button"
                    disabled={action.busy || (comments[r.id] || '').length < 3}
                    onClick={() => doAction(r, 'reject', { comments: comments[r.id] }, 'Report rejected')}
                    className={btnSecondary}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </Panel>
        )
      })}
    </div>
  )
}
