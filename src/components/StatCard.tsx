import type { ReactNode } from 'react'

type Props = {
  label: string
  value: number | undefined
  icon: ReactNode
  loading: boolean
  error: boolean
}

export default function StatCard({ label, value, icon, loading, error }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</div>
      </div>

      {loading ? (
        <div className="mt-3 h-9 w-24 animate-pulse rounded-md bg-gray-100" />
      ) : error ? (
        <p className="mt-3 text-sm text-red-600">Couldn't load</p>
      ) : (
        <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">{value?.toLocaleString('en-IN')}</p>
      )}
    </div>
  )
}
