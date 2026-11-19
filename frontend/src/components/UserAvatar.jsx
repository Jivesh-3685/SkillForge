import { useState } from 'react'

export default function UserAvatar({ user, size = 'md', className = '' }) {
  const [imgFailed, setImgFailed] = useState(false)

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-12 h-12 text-base font-bold',
  }

  const selectedSize = sizeClasses[size] || sizeClasses.md
  const initial = (
    user?.displayName ||
    user?.display_name ||
    user?.email ||
    'U'
  )[0].toUpperCase()

  if (user?.photoURL && !imgFailed) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName || 'User Avatar'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setImgFailed(true)}
        className={`${selectedSize} rounded-full object-cover border border-emerald-500/40 shadow-xs flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${selectedSize} rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-gray-950 font-bold flex items-center justify-center border border-emerald-400/50 shadow-xs flex-shrink-0 select-none ${className}`}
      title={user?.displayName || user?.email || 'User'}
    >
      {initial}
    </div>
  )
}
