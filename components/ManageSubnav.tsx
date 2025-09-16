"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/manage/semesters', label: 'Semesters' },
  { href: '/manage/lecturers', label: 'Lecturers' },
  { href: '/manage/subjects', label: 'Subjects' },
  { href: '/manage/rooms', label: 'Rooms' }
]

export default function ManageSubnav() {
  const pathname = usePathname()
  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b pb-2">
      {items.map((it) => {
        const active = pathname === it.href
        return (
          <Link
            key={it.href}
            href={it.href}
            className={active ? 'btn btn-dark' : 'btn btn-ghost'}
          >
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
