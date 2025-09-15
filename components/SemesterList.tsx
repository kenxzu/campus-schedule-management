"use client"

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSemester, deleteSemester } from '@/app/actions'

type Semester = { id: number; academicYear: string; term: 'S1' | 'S2' | 'S3' }
type ActionState = { ok: boolean; error?: string }

export default function SemesterList({ items }: { items: Semester[] }) {
  return (
    <ul className="mt-3 divide-y divide-gray-100 text-sm text-gray-800">
      {items.map((s) => (
        <Row key={s.id} item={s} />
      ))}
    </ul>
  )
}

function Row({ item }: { item: Semester }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [updState, updAction, updPending] = useActionState<any, FormData>(updateSemester as any, { ok: false })
  const [delState, delAction, delPending] = useActionState<any, FormData>(deleteSemester as any, { ok: false })

  useEffect(() => { if (updState?.ok) { setEditing(false); router.refresh() } }, [updState?.ok, router])
  useEffect(() => { if (delState?.ok) router.refresh() }, [delState?.ok, router])

  if (editing) {
    return (
      <li className="py-2">
        <form action={updAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={item.id} />
          <label className="grid text-sm">
            <span className="label">Academic Year</span>
            <input className="input" name="academicYear" defaultValue={item.academicYear} required />
          </label>
          <label className="grid text-sm">
            <span className="label">Term</span>
            <select className="select" name="term" defaultValue={item.term} required>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
              <option value="S3">S3</option>
            </select>
          </label>
          <button className="btn" disabled={updPending} type="submit">{updPending ? 'Saving...' : 'Save'}</button>
          <button className="btn" type="button" onClick={() => setEditing(false)}>Cancel</button>
          {updState?.error && <span className="text-sm text-red-700">{updState.error}</span>}
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between py-2">
      <span>{item.academicYear} — {item.term}</span>
      <div className="flex gap-2">
        <button className="btn" onClick={() => setEditing(true)} type="button">Edit</button>
        <form action={delAction}>
          <input type="hidden" name="id" value={item.id} />
          <button className="btn" disabled={delPending}>{delPending ? 'Deleting...' : 'Delete'}</button>
        </form>
        {delState?.error && <span className="text-sm text-red-700">{delState.error}</span>}
      </div>
    </li>
  )
}

