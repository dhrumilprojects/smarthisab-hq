// Profile photo, or the first letter of the name when there's no photo
export default function Avatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  if (photoUrl) {
    return <img src={photoUrl} alt="" referrerPolicy="no-referrer" className="size-8 shrink-0 rounded-full" />
  }

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-800">
      {name[0]?.toUpperCase()}
    </div>
  )
}
