import type { DailyCount } from '../data/types'

type Props = {
  data: DailyCount[] | undefined
  loading: boolean
  error: boolean
}

function formatDay(date: Date) {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function SignupsChart({ data, loading, error }: Props) {
  // Round the top of the axis up to a multiple of 4 so the middle gridline is a whole number
  const top = Math.max(4, Math.ceil(Math.max(0, ...(data ?? []).map((d) => d.count)) / 4) * 4)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Signups</h2>
          <p className="text-sm text-gray-500">New users per day, last 30 days</p>
        </div>
        {data && (
          <p className="text-right">
            <span className="block text-2xl font-semibold text-gray-900">
              {data.reduce((sum, d) => sum + d.count, 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-gray-500">total</span>
          </p>
        )}
      </div>

      {loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-lg bg-gray-100" />
      ) : error || !data ? (
        <p className="mt-6 flex h-48 items-center justify-center text-sm text-red-600">Couldn't load signups</p>
      ) : (
        <>
          <div className="relative mt-6 h-48">
            {[top, top / 2, 0].map((tick) => (
              <div
                key={tick}
                className="absolute inset-x-0 flex items-center gap-2"
                style={{ bottom: `${(tick / top) * 100}%` }}
              >
                <span className="w-6 translate-y-1/2 text-right text-xs text-gray-400">{tick}</span>
                <div className="h-px flex-1 translate-y-1/2 bg-gray-100" />
              </div>
            ))}

            <div className="absolute inset-y-0 right-0 left-8 flex items-end gap-0.5">
              {data.map((d) => (
                <div key={d.date.toISOString()} className="group relative flex h-full flex-1 items-end justify-center">
                  <div
                    className="w-full max-w-6 rounded-t bg-brand-600 group-hover:bg-brand-800"
                    style={{ height: `${(d.count / top) * 100}%` }}
                  />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
                    {formatDay(d.date)}: <span className="font-semibold">{d.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 ml-8 flex justify-between text-xs text-gray-400">
            <span>{formatDay(data[0].date)}</span>
            <span>Today</span>
          </div>

          <table className="sr-only">
            <caption>New users per day</caption>
            <tbody>
              {data.map((d) => (
                <tr key={d.date.toISOString()}>
                  <td>{formatDay(d.date)}</td>
                  <td>{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
