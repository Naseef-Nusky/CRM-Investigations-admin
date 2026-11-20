import { useEffect, useState } from 'react'
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
  useAction,
} from '../components/ui'

const emptyCreate = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  areasCovered: '',
  specialities: '',
  availability: '',
  notes: '',
}

const profileFields = [
  ['areasCovered', 'Areas covered'],
  ['specialities', 'Specialities'],
  ['availability', 'Availability'],
]

export default function Investigators() {
  const { user } = useAuth()
  const canManage = MANAGEMENT_ROLES.includes(user?.role)
  const [investigators, setInvestigators] = useState([])
  const [loadError, setLoadError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyCreate)
  const [editing, setEditing] = useState(null)
  const [profile, setProfile] = useState({})
  const createAction = useAction()
  const editAction = useAction()

  async function load() {
    const res = await api('/investigators')
    setInvestigators(res.data.investigators)
  }

  useEffect(() => {
    load().catch((err) => setLoadError(err.message))
  }, [])

  async function create() {
    await createAction.run(async () => {
      await api('/investigators', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          phone: form.phone || null,
          areasCovered: form.areasCovered || null,
          specialities: form.specialities || null,
          availability: form.availability || null,
          notes: form.notes || null,
        }),
      })
      setForm(emptyCreate)
      setShowCreate(false)
      await load()
    })
  }

  function startEdit(i) {
    setEditing(i.id)
    setProfile({
      areasCovered: i.investigatorProfile?.areasCovered || '',
      specialities: i.investigatorProfile?.specialities || '',
      availability: i.investigatorProfile?.availability || '',
      notes: i.investigatorProfile?.notes || '',
    })
  }

  async function saveProfile() {
    await editAction.run(async () => {
      await api(`/investigators/${editing}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          areasCovered: profile.areasCovered || null,
          specialities: profile.specialities || null,
          availability: profile.availability || null,
          notes: profile.notes || null,
        }),
      })
      setEditing(null)
      await load()
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Investigators" subtitle="Field investigators, coverage and current workload.">
        {canManage && (
          <button type="button" onClick={() => setShowCreate((v) => !v)} className={btnPrimary}>
            {showCreate ? 'Close' : 'New investigator'}
          </button>
        )}
      </PageHeader>
      <Alert error={loadError} />

      {showCreate && (
        <Panel title="Create investigator">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              ['firstName', 'First name *'],
              ['lastName', 'Last name *'],
              ['email', 'Email *'],
              ['phone', 'Phone'],
              ['areasCovered', 'Areas covered'],
              ['specialities', 'Specialities'],
              ['availability', 'Availability'],
            ].map(([key, text]) => (
              <Field key={key} label={text}>
                <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputCls} />
              </Field>
            ))}
            <Field label="Temporary password * (min 12 characters)">
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Notes" className="md:col-span-2">
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <div className="mt-4 space-y-2">
            <Alert error={createAction.error} />
            <button
              type="button"
              disabled={createAction.busy || !form.firstName || !form.lastName || !form.email || form.password.length < 12}
              onClick={create}
              className={btnPrimary}
            >
              {createAction.busy ? 'Saving…' : 'Create investigator'}
            </button>
          </div>
        </Panel>
      )}

      {editing && (
        <Panel title={`Edit profile — ${investigators.find((i) => i.id === editing)?.firstName || ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profileFields.map(([key, text]) => (
              <Field key={key} label={text}>
                <input value={profile[key]} onChange={(e) => setProfile({ ...profile, [key]: e.target.value })} className={inputCls} />
              </Field>
            ))}
            <Field label="Notes" className="md:col-span-2">
              <textarea rows={2} value={profile.notes} onChange={(e) => setProfile({ ...profile, notes: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <div className="mt-4 space-y-2">
            <Alert error={editAction.error} />
            <div className="flex gap-2">
              <button type="button" disabled={editAction.busy} onClick={saveProfile} className={btnPrimary}>
                Save profile
              </button>
              <button type="button" onClick={() => setEditing(null)} className={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </Panel>
      )}

      <Table
        columns={['Name', 'Contact', 'Areas', 'Specialities', 'Availability', 'Active cases', 'Last login', ...(canManage ? [''] : [])]}
        isEmpty={investigators.length === 0}
        empty="No investigators yet."
      >
        {investigators.map((i) => (
          <Tr key={i.id}>
            <Td>
              <p className="font-medium text-slate-900">
                {i.firstName} {i.lastName}
              </p>
              {!i.isActive && <Badge status="INACTIVE" tone="slate" />}
            </Td>
            <Td>
              <p>{i.email}</p>
              <p className="text-xs text-slate-500">{i.phone || '—'}</p>
            </Td>
            <Td>{i.investigatorProfile?.areasCovered || '—'}</Td>
            <Td>{i.investigatorProfile?.specialities || '—'}</Td>
            <Td>{i.investigatorProfile?.availability || '—'}</Td>
            <Td>
              <Badge status={String(i.activeCases)} tone={i.activeCases >= 5 ? 'red' : i.activeCases >= 3 ? 'amber' : 'green'} />
            </Td>
            <Td>{fmtDate(i.lastLoginAt)}</Td>
            {canManage && (
              <Td>
                <button type="button" onClick={() => startEdit(i)} className={btnSmall}>
                  Edit profile
                </button>
              </Td>
            )}
          </Tr>
        ))}
      </Table>
    </div>
  )
}
