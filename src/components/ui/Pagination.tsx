import Button from './Button'

type Props = {
  page: number
  // Unknown until the total count loads
  totalPages: number | undefined
  hasNext: boolean
  loading: boolean
  onPrev: () => void
  onNext: () => void
}

export default function Pagination({ page, totalPages, hasNext, loading, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-gray-500">
        Page {page}
        {totalPages !== undefined && ` of ${totalPages}`}
      </p>
      <div className="flex gap-2">
        <Button onClick={onPrev} disabled={page === 1 || loading}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={!hasNext || loading}>
          {loading ? 'Loading…' : 'Next'}
        </Button>
      </div>
    </div>
  )
}
