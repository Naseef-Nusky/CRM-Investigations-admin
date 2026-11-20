import { useState } from 'react'

export const inputCls = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white'
export const btnPrimary =
  'rounded-md bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-60 hover:bg-slate-800'
export const btnSecondary =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60'
export const btnSmall =
  'rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60'

export const CASE_STATUSES = [
  'NEW_ENQUIRY',
  'QUOTED',
  'AWAITING_PAYMENT',
  'AWAITING_DOCUMENTS',
  'UNDER_VERIFICATION',
  'READY_FOR_ALLOCATION',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_REPORT',
  'MANAGEMENT_REVIEW',
  'AMENDMENTS_REQUIRED',
  'REPORT_APPROVED',
  'REPORT_SENT',
  'COMPLETED',
  'CANCELLED',
]

export const PAYMENT_STATUSES = [
  'AWAITING_PAYMENT',
  'PAYMENT_RECEIVED',
  'PART_PAYMENT',
  'OUTSTANDING_BALANCE',
  'REFUND',
  'CANCELLED',
]

export const MANAGEMENT_ROLES = ['SUPER_ADMIN', 'MANAGEMENT']
export const FINANCE_ROLES = ['SUPER_ADMIN', 'MANAGEMENT', 'ACCOUNTS']

const tones = {
  slate: 'bg-slate-100 text-slate-700',
  sky: 'bg-sky-100 text-sky-800',
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-800',
  violet: 'bg-violet-100 text-violet-800',
}

const statusTone = {
  // cases
  NEW_ENQUIRY: 'sky',
  QUOTED: 'sky',
  AWAITING_PAYMENT: 'amber',
  AWAITING_DOCUMENTS: 'amber',
  UNDER_VERIFICATION: 'amber',
  READY_FOR_ALLOCATION: 'violet',
  ASSIGNED: 'violet',
  IN_PROGRESS: 'sky',
  AWAITING_REPORT: 'amber',
  MANAGEMENT_REVIEW: 'violet',
  AMENDMENTS_REQUIRED: 'red',
  REPORT_APPROVED: 'green',
  REPORT_SENT: 'green',
  COMPLETED: 'green',
  CANCELLED: 'red',
  // payments / invoices
  PAYMENT_RECEIVED: 'green',
  PART_PAYMENT: 'amber',
  OUTSTANDING_BALANCE: 'red',
  REFUND: 'red',
  // quotations
  ISSUED: 'sky',
  ACCEPTED: 'green',
  DECLINED: 'red',
  EXPIRED: 'slate',
  // checklist
  OUTSTANDING: 'amber',
  RECEIVED: 'sky',
  UNDER_REVIEW: 'violet',
  VERIFIED: 'green',
  NOT_APPLICABLE: 'slate',
  // reports
  DRAFT: 'slate',
  SUBMITTED: 'violet',
  SENT: 'green',
  APPROVED: 'green',
}

export function label(value) {
  return value ? String(value).replaceAll('_', ' ') : '—'
}

export function Badge({ status, tone }) {
  const t = tone || statusTone[status] || 'slate'
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${tones[t]}`}>
      {label(status)}
    </span>
  )
}

export function money(value) {
  if (value === null || value === undefined || value === '') return '—'
  return `£${Number(value).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function fmtDate(value) {
  return value ? new Date(value).toLocaleDateString('en-GB') : '—'
}

export function fmtDateTime(value) {
  return value ? new Date(value).toLocaleString('en-GB') : '—'
}

export function toInputDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function toIso(value) {
  return value ? new Date(value).toISOString() : null
}

export function numOrNull(value) {
  return value === '' || value === null || value === undefined ? null : Number(value)
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  )
}

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`bg-white border border-slate-200 rounded-lg p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Field({ label: text, children, className = '' }) {
  return (
    <label className={`text-sm block ${className}`}>
      <span className="text-slate-600">{text}</span>
      {children}
    </label>
  )
}

export function Alert({ error, success }) {
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (success) return <p className="text-sm text-emerald-700">{success}</p>
  return null
}

export function Table({ columns, children, empty, isEmpty }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 border-b">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 font-medium whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
          {isEmpty && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-slate-500 text-center">
                {empty || 'Nothing to show.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export const Tr = ({ children }) => (
  <tr className="border-b border-slate-100 hover:bg-slate-50 align-top">{children}</tr>
)
export const Td = ({ children, className = '' }) => (
  <td className={`px-4 py-3 text-slate-700 ${className}`}>{children}</td>
)

export function Stat({ label: text, value, tone = 'slate' }) {
  const bg = {
    slate: 'bg-white border-slate-200',
    amber: 'bg-amber-50 border-amber-200',
    sky: 'bg-sky-50 border-sky-200',
    green: 'bg-emerald-50 border-emerald-200',
    red: 'bg-red-50 border-red-200',
  }
  return (
    <div className={`rounded-lg border p-4 ${bg[tone]}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{text}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  )
}

export function errorMessage(err) {
  const outstanding = err.payload?.details?.outstanding
  if (outstanding?.length) return `${err.message}: ${outstanding.join(', ')}`
  const fields = err.payload?.errors
  if (fields?.length) return `${err.message}: ${fields.map((f) => `${f.path} ${f.message}`).join('; ')}`
  return err.message
}

// Run an async action with shared busy/error state.
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function run(fn, successMessage = '') {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      const result = await fn()
      if (successMessage) setSuccess(successMessage)
      return result
    } catch (err) {
      setError(errorMessage(err))
      return undefined
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, success, run, setError, setSuccess }
}
