import type { ButtonHTMLAttributes } from 'react'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  variant?: 'secondary' | 'danger'
}

const variants = {
  secondary: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  danger: 'border-red-200 bg-white text-red-700 hover:bg-red-50',
}

export default function Button({ variant = 'secondary', ...props }: Props) {
  return (
    <button
      {...props}
      className={`rounded-lg border px-3 py-1.5 text-sm font-medium whitespace-nowrap disabled:opacity-50 ${variants[variant]}`}
    />
  )
}
