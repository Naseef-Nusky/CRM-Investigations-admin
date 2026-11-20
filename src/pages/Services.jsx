import { useEffect, useState } from 'react'
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
  inputCls,
  money,
  numOrNull,
  useAction,
} from '../components/ui'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  name: '',
  description: '',
  standardPrice: '',
  requiredForms: '',
  specialities: '',
  isActive: true,
}

export default function Services() {
  const { user } = useAuth()
  const canEdit = ['SUPER_ADMIN', 'MANAGEMENT'].includes(user?.role)
  const [services, setServices] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loadError, setLoadError] = useState('')
  const action = useAction()

  async function load() {
    const res = await api('/services?limit=200')
    setServices(res.data.services)
  }

  useEffect(() => {
    load().catch((err) => setLoadError(err.message))
  }, [])

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function startEdit(s) {
    setEditingId(s.id)
    setForm({
      name: s.name,
      description: s.description || '',
      standardPrice: s.standardPrice ?? '',
      requiredForms: s.requiredForms || '',
      specialities: s.specialities || '',
      isActive: s.isActive,
    })
    setShowForm(true)
  }

  async function save() {
    await action.run(async () => {
      const body = {
        name: form.name.trim(),
        description: form.description || null,
        standardPrice: numOrNull(form.standardPrice),
        requiredForms: form.requiredForms || null,
        specialities: form.specialities || null,
        isActive: form.isActive,
      }
      await api(editingId ? `/services/${editingId}` : '/services', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      })
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await load()
    })
  }

  async function toggleActive(s) {
    await action.run(async () => {
      await api(`/services/${s.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !s.isActive }) })
      await load()
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Services" subtitle="Investigation services, pricing and required forms.">
        {canEdit && (
          <button type="button" onClick={showForm ? () => setShowForm(false) : startCreate} className={btnPrimary}>
            {showForm ? 'Close' : 'New service'}
          </button>
        )}
      </PageHeader>
      <Alert error={loadError} />

      {showForm && (
        <Panel title={editingId ? 'Edit service' : 'Create service'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Name *">
              <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Standard price (£)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.standardPrice}
                onChange={(e) => set('standardPrice', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Required forms (comma separated)">
              <input
                value={form.requiredForms}
                onChange={(e) => set('requiredForms', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Specialities (comma separated)">
              <input
                value={form.specialities}
                onChange={(e) => set('specialities', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className={inputCls}
              />
            </Field>
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
              Active
            </label>
          </div>
          <div className="mt-4 space-y-2">
            <Alert error={action.error} />
            <button type="button" disabled={action.busy || !form.name.trim()} onClick={save} className={btnPrimary}>
              {action.busy ? 'Saving…' : 'Save service'}
            </button>
          </div>
        </Panel>
      )}

      <Table
        columns={['Name', 'Price', 'Required forms', 'Specialities', 'Status', ...(canEdit ? [''] : [])]}
        isEmpty={services.length === 0}
        empty="No services yet."
      >
        {services.map((s) => (
          <Tr key={s.id}>
            <Td>
              <p className="font-medium text-slate-900">{s.name}</p>
              {s.description && <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>}
            </Td>
            <Td>{money(s.standardPrice)}</Td>
            <Td>{s.requiredForms || '—'}</Td>
            <Td>{s.specialities || '—'}</Td>
            <Td>
              <Badge status={s.isActive ? 'ACTIVE' : 'INACTIVE'} tone={s.isActive ? 'green' : 'slate'} />
            </Td>
            {canEdit && (
              <Td className="whitespace-nowrap">
                <button type="button" onClick={() => startEdit(s)} className={btnSmall}>
                  Edit
                </button>{' '}
                <button type="button" onClick={() => toggleActive(s)} className={btnSmall}>
                  {s.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </Td>
            )}
          </Tr>
        ))}
      </Table>
      {!canEdit && <p className="text-xs text-slate-500">Only management can edit services.</p>}
    </div>
  )
}
