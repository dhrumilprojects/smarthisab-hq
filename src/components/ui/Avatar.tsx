const sizes = {
  md: 'size-8 text-sm',
  lg: 'size-12 text-lg',
}

// Profile photo, or the first letter of the name when there's no photo
export default function Avatar({
  name,
  photoUrl,
  size = 'md',
}: {
  name: string
  photoUrl?: string | null
  size?: keyof typeof sizes
}) {
  if (photoUrl) {
    return <img src={photoUrl} alt="" referrerPolicy="no-referrer" className={`shrink-0 rounded-full ${sizes[size]}`} />
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-800 ${sizes[size]}`}
    >
      {name[0]?.toUpperCase()}
    </div>
  )
}
