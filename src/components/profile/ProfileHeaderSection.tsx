type ProfileHeaderSectionProps = {
  name: string
  headline: string
  subHeadline: string
}

export function ProfileHeaderSection({
  name,
  headline,
  subHeadline,
}: ProfileHeaderSectionProps) {
  return (
    <header className="relative mb-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{name}</h1>
      <p className="mt-1 text-base text-slate-600">{headline}</p>
      <p className="mt-1 text-base text-slate-600">{subHeadline}</p>
    </header>
  )
}
