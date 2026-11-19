import Button from '../../components/ui/Button'
import { useCopyReportMessage, useUserProjectCount } from './useUsers'

// Copies a short text version of the report, easier to read on a phone than the Excel file.
// Admin and sales only: callers check the role.
export default function CopyReportMessageButton({ userId }: { userId: string }) {
  const projects = useUserProjectCount(userId)
  const copy = useCopyReportMessage()

  return (
    <Button
      // "Copied" shows for 2 seconds
      onClick={() => copy.mutate(userId, { onSuccess: () => setTimeout(copy.reset, 2000) })}
      disabled={projects.isPending || projects.data === 0 || copy.isPending}
    >
      {copy.isPending
        ? 'Copying…'
        : copy.isSuccess
          ? 'Copied ✓'
          : copy.isError
            ? "Couldn't copy, try again"
            : 'Copy WhatsApp message'}
    </Button>
  )
}
