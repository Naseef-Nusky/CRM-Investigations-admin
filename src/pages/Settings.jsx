import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import {
  Alert,
  Badge,
  Field,
  MANAGEMENT_ROLES,
  PageHeader,
  Panel,
  Table,
  Td,
  Tr,
  btnPrimary,
  btnSecondary,
  btnSmall,
  fmtDate,
  inputCls,
  label,
  useAction,
} from '../components/ui'

const ROLES = ['SUPER_ADMIN', 'MANAGEMENT', 'OFFICE_ADMIN', 'ACCOUNTS', 'INVESTIGATOR']

export default function Settings() {
  const { user } = useAuth()
  const isSuper = user?.role === 'SUPER_ADMIN'
  const isManagement = MANAGEMENT_ROLES.includes(user?.role)
  const tabs = [
    ['security', 'Security / 2FA'],
    ...(isSuper ? [['users', 'Users']] : []),
    ['templates', 'Email templates'],
    ['cognito', 'Cognito forms'],
    ['services', 'Services'],
  ]
  const [tab, setTab] = useState(tabs[0][0])

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Users, templates and integrations." />
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map(([key, text]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm -mb-px border-b-2 ${
              tab === key ? 'border-slate-900 text-slate-900 font-medium' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {text}
          </button>
        ))}
      </div>
      {tab === 'security' && <SecurityTab />}
      {tab === 'users' && isSuper && <UsersTab />}
      {tab === 'templates' && <TemplatesTab canEdit={isManagement} />}
      {tab === 'cognito' && <CognitoTab canEdit={isManagement} />}
      {tab === 'services' && (
        <Panel title="Services">
          <p className="text-sm text-slate-600">Manage service names, pricing, required forms and specialities.</p>
          <Link to="/services" className={`${btnPrimary} inline-block mt-3`}>
            Open services
          </Link>
        </Panel>
      )}
    </div>
  )
}

function SecurityTab() {
  const { user } = useAuth()
  const [setup, setSetup] = useState(null)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function startSetup() {
    setError('')
    setMessage('')
    try {
      const res = await api('/auth/2fa/setup', { method: 'POST', body: '{}' })
      setSetup(res.data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function enable() {
    setError('')
    try {
      await api('/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      setMessage('Two-factor authentication enabled')
      setSetup(null)
      setCode('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function disable() {
    setError('')
    try {
      await api('/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      setMessage('Two-factor authentication disabled')
      setCode('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Panel title="Two-factor authentication">
      <p className="text-sm text-slate-600 mb-3">
        Status: {user?.twoFactorEnabled ? 'Enabled' : 'Not enabled'} — use an authenticator app
        (Google Authenticator, Authy, etc.).
      </p>
      {!user?.twoFactorEnabled && (
        <button type="button" onClick={startSetup} className={btnSecondary}>
          Set up 2FA
        </button>
      )}
      {setup && (
        <div className="mt-4 space-y-3 text-sm">
          <img src={setup.qrCodeDataUrl} alt="2FA QR code" className="w-40 h-40 border" />
          <p className="font-mono text-xs break-all">{setup.secret}</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Confirm with 6-digit code"
            className={inputCls}
          />
          <button type="button" onClick={enable} className={btnPrimary}>
            Enable 2FA
          </button>
        </div>
      )}
      {user?.twoFactorEnabled && (
        <div className="mt-4 space-y-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Authenticator code to disable"
            className={inputCls}
          />
          <button type="button" onClick={disable} className={btnSecondary}>
            Disable 2FA
          </button>
        </div>
      )}
      <Alert success={message} error={error} />
    </Panel>
  )
}

/* ----------------------------------- Users ----------------------------------- */

const emptyUser = { firstName: '', lastName: '', email: '', phone: '', role: 'OFFICE_ADMIN', password: '' }

function UsersTab() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyUser)
  const [showForm, setShowForm] = useState(false)
  const [loadError, setLoadError] = useState('')
  const action = useAction()

  async function load() {
    const res = await api('/auth/users')
    setUsers(res.data.users)
  }

  useEffect(() => {
    load().catch((err) => setLoadError(err.message))
  }, [])

  async function create() {
    await action.run(async () => {
      await api('/auth/users', {
        method: 'POST',
        body: JSON.stringify({ ...form, phone: form.phone || null }),
      })
      setForm(emptyUser)
      setShowForm(false)
      await load()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowForm((v) => !v)} className={btnPrimary}>
          {showForm ? 'Close' : 'New user'}
        </button>
      </div>
      <Alert error={loadError} />
      {showForm && (
        <Panel title="Create user">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              ['firstName', 'First name *'],
              ['lastName', 'Last name *'],
              ['email', 'Email *'],
              ['phone', 'Phone'],
            ].map(([key, text]) => (
              <Field key={key} label={text}>
                <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputCls} />
              </Field>
            ))}
            <Field label="Role *">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {label(r)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Password * (min 12 characters)">
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <div className="mt-4 space-y-2">
            <Alert error={action.error} />
            <button
              type="button"
              disabled={action.busy || !form.firstName || !form.lastName || !form.email || form.password.length < 12}
              onClick={create}
              className={btnPrimary}
            >
              Create user
            </button>
          </div>
        </Panel>
      )}
      <Table columns={['Name', 'Email', 'Role', 'Status', 'Last login']} isEmpty={users.length === 0} empty="No users.">
        {users.map((u) => (
          <Tr key={u.id}>
            <Td className="font-medium text-slate-900">
              {u.firstName} {u.lastName}
            </Td>
            <Td>{u.email}</Td>
            <Td>{label(u.role)}</Td>
            <Td>
              <Badge status={u.isActive ? 'ACTIVE' : 'INACTIVE'} tone={u.isActive ? 'green' : 'slate'} />
            </Td>
            <Td>{fmtDate(u.lastLoginAt)}</Td>
          </Tr>
        ))}
      </Table>
    </div>
  )
}

/* ------------------------------ Email templates ------------------------------ */

const emptyTemplate = { key: '', name: '', subject: '', body: '', isActive: true }

function TemplatesTab({ canEdit }) {
  const [templates, setTemplates] = useState([])
  const [form, setForm] = useState(emptyTemplate)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [open, setOpen] = useState(null)
  const action = useAction()

  async function load() {
    const res = await api('/email-templates')
    setTemplates(res.data.templates)
  }

  useEffect(() => {
    load().catch((err) => setLoadError(err.message))
  }, [])

  function startEdit(t) {
    setEditingId(t.id)
    setForm({ key: t.key, name: t.name, subject: t.subject, body: t.body, isActive: t.isActive })
    setShowForm(true)
  }

  async function save() {
    await action.run(async () => {
      const body = editingId ? { name: form.name, subject: form.subject, body: form.body, isActive: form.isActive } : form
      await api(editingId ? `/email-templates/${editingId}` : '/email-templates', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      })
      setShowForm(false)
      setEditingId(null)
      setForm(emptyTemplate)
      await load()
    })
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm(emptyTemplate)
              setShowForm((v) => !v)
            }}
            className={btnPrimary}
          >
            {showForm ? 'Close' : 'New template'}
          </button>
        </div>
      )}
      <Alert error={loadError} />
      {showForm && (
        <Panel title={editingId ? 'Edit template' : 'Create template'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Key * (lowercase, numbers, underscores)">
              <input value={form.key} disabled={Boolean(editingId)} onChange={(e) => setForm({ ...form, key: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Name *">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Subject *" className="md:col-span-2">
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Body *" className="md:col-span-2">
              <textarea rows={8} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={inputCls} />
            </Field>
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
          </div>
          <div className="mt-4 space-y-2">
            <Alert error={action.error} />
            <div className="flex gap-2">
              <button type="button" disabled={action.busy || !form.key || !form.name || !form.subject || !form.body} onClick={save} className={btnPrimary}>
                Save template
              </button>
              <button type="button" onClick={() => setShowForm(false)} className={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </Panel>
      )}
      <Table columns={['Name', 'Key', 'Subject', 'Status', '']} isEmpty={templates.length === 0} empty="No templates.">
        {templates.map((t) => (
          <Tr key={t.id}>
            <Td className="font-medium text-slate-900">{t.name}</Td>
            <Td>
              <code className="text-xs">{t.key}</code>
            </Td>
            <Td>
              {t.subject}
              {open === t.id && <pre className="mt-2 text-xs whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-md p-3">{t.body}</pre>}
            </Td>
            <Td>
              <Badge status={t.isActive ? 'ACTIVE' : 'INACTIVE'} tone={t.isActive ? 'green' : 'slate'} />
            </Td>
            <Td className="whitespace-nowrap">
              <button type="button" onClick={() => setOpen(open === t.id ? null : t.id)} className={btnSmall}>
                {open === t.id ? 'Hide' : 'View'}
              </button>{' '}
              {canEdit && (
                <button type="button" onClick={() => startEdit(t)} className={btnSmall}>
                  Edit
                </button>
              )}
            </Td>
          </Tr>
        ))}
      </Table>
    </div>
  )
}

/* ------------------------------- Cognito forms ------------------------------- */

const emptyConfig = { name: '', formKey: '', formUrl: '', serviceId: '', isActive: true }

function CognitoTab({ canEdit }) {
  const [configs, setConfigs] = useState([])
  const [services, setServices] = useState([])
  const [form, setForm] = useState(emptyConfig)
  const [showForm, setShowForm] = useState(false)
  const [loadError, setLoadError] = useState('')
  const action = useAction()

  async function load() {
    const res = await api('/cognito')
    setConfigs(res.data.configs)
  }

  useEffect(() => {
    load().catch((err) => setLoadError(err.message))
    api('/services?limit=200').then((r) => setServices(r.data.services)).catch(() => {})
  }, [])

  async function create() {
    await action.run(async () => {
      await api('/cognito', {
        method: 'POST',
        body: JSON.stringify({ ...form, serviceId: form.serviceId || null }),
      })
      setForm(emptyConfig)
      setShowForm(false)
      await load()
    })
  }

  async function toggle(c) {
    await action.run(async () => {
      await api(`/cognito/${c.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !c.isActive }) })
      await load()
    })
  }

  const serviceName = (id) => services.find((s) => s.id === id)?.name || 'All services'

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <button type="button" onClick={() => setShowForm((v) => !v)} className={btnPrimary}>
            {showForm ? 'Close' : 'New form'}
          </button>
        </div>
      )}
      <Alert error={loadError} />
      {showForm && (
        <Panel title="Add Cognito form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Name *">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Form key * (letters, numbers, - _)">
              <input value={form.formKey} onChange={(e) => setForm({ ...form, formKey: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Form URL *" className="md:col-span-2">
              <input value={form.formUrl} onChange={(e) => setForm({ ...form, formUrl: e.target.value })} placeholder="https://www.cognitoforms.com/…" className={inputCls} />
            </Field>
            <Field label="Service (blank = all)">
              <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className={inputCls}>
                <option value="">All services</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <label className="text-sm flex items-center gap-2 mt-6">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
          </div>
          <div className="mt-4 space-y-2">
            <Alert error={action.error} />
            <button type="button" disabled={action.busy || !form.name || !form.formKey || !form.formUrl} onClick={create} className={btnPrimary}>
              Save form
            </button>
          </div>
        </Panel>
      )}
      {!showForm && <Alert error={action.error} />}
      <Table columns={['Name', 'Key', 'Service', 'URL', 'Status', ...(canEdit ? [''] : [])]} isEmpty={configs.length === 0} empty="No forms configured.">
        {configs.map((c) => (
          <Tr key={c.id}>
            <Td className="font-medium text-slate-900">{c.name}</Td>
            <Td>
              <code className="text-xs">{c.formKey}</code>
            </Td>
            <Td>{serviceName(c.serviceId)}</Td>
            <Td className="max-w-xs truncate">
              <a href={c.formUrl} target="_blank" rel="noreferrer" className="hover:underline">
                {c.formUrl}
              </a>
            </Td>
            <Td>
              <Badge status={c.isActive ? 'ACTIVE' : 'INACTIVE'} tone={c.isActive ? 'green' : 'slate'} />
            </Td>
            {canEdit && (
              <Td>
                <button type="button" onClick={() => toggle(c)} className={btnSmall}>
                  {c.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </Td>
            )}
          </Tr>
        ))}
      </Table>
    </div>
  )
}
