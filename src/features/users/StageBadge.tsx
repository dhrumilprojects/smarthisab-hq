import Badge from '../../components/ui/Badge'
import type { CrmStage } from '../../data/types'
import { STAGES } from './crmLabels'

export default function StageBadge({ stage }: { stage: CrmStage }) {
  const { label, tone } = STAGES.find((s) => s.id === stage)!
  return <Badge tone={tone}>{label}</Badge>
}
