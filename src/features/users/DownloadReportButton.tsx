import Button from '../../components/ui/Button'
import { useDownloadReport, useUserProjectCount } from './useUsers'

type Props = {
  user: { id: string; name: string }
  // Just a download icon, for table rows
  iconOnly?: boolean
}

// Excel file of the user's projects, income and expenses, for their weekly report.
// Admin and sales only: callers check the role.
export default function DownloadReportButton({ user, iconOnly }: Props) {
  const projects = useUserProjectCount(user.id)
  const download = useDownloadReport()

  const noProjects = projects.data === 0
  const label = noProjects
    ? 'No projects yet'
    : download.isPending
      ? 'Preparing…'
      : download.isError
        ? 'Download failed, try again'
        : 'Download report'
  const disabled = projects.isPending || noProjects || download.isPending

  if (!iconOnly) {
    return (
      <Button onClick={() => download.mutate(user)} disabled={disabled}>
        {label}
      </Button>
    )
  }

  return (
    <button
      onClick={() => download.mutate(user)}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent ${
        download.isError ? 'text-red-600' : 'text-gray-500 hover:text-gray-900'
      } ${download.isPending ? 'animate-pulse' : ''}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
      </svg>
    </button>
  )
}
