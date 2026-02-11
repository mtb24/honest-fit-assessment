import type { CandidateProfile } from '@/data/types'
import { exportProfileToJson } from '@/lib/profileSerialization'
import { Button } from '@/components/ui/button'

type ExportProfileButtonProps = {
  profile: CandidateProfile
}

export function ExportProfileButton({ profile }: ExportProfileButtonProps) {
  const handleExport = () => {
    const json = exportProfileToJson(profile)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${profile.name.replace(/\s+/g, '_').toLowerCase()}_profile.json`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      Export profile JSON
    </Button>
  )
}
