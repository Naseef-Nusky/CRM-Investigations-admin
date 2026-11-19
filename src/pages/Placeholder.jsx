export default function Placeholder({ title, phase }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-8">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="text-slate-600 mt-2 text-sm">
        This module is planned for Phase {phase}. Navigation is ready so the CRM shell matches
        the full operating platform.
      </p>
    </div>
  )
}
