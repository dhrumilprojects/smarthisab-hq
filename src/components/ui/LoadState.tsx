import type { ReactNode } from 'react'

type Props<T> = {
  // undefined while loading
  data: T[] | undefined
  error: boolean
  errorMessage: string
  emptyMessage: string
  children: (data: T[]) => ReactNode
}

// Loading, error and empty states for a list. Renders children only when there's data to show.
export default function LoadState<T>({ data, error, errorMessage, emptyMessage, children }: Props<T>) {
  if (error) return <p className="p-5 text-sm text-red-600">{errorMessage}</p>

  if (!data) {
    return (
      <div className="space-y-3 p-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  if (data.length === 0) return <p className="p-5 text-sm text-gray-500">{emptyMessage}</p>

  return children(data)
}
