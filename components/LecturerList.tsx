"use client"

import { useState } from 'react'
import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateLecturer, deleteLecturer } from '@/app/actions'

type Lecturer = { id: number; name: string }
type ActionState = { ok: boolean; error?: string }

export default function LecturerList({ items }: { items: Lecturer[] }) {
  return (
    <ul className="mt-3 divide-y divide-gray-100 text-sm text-gray-800">
      {items.map((l) => (
        <Row key={l.id} item={l} />
      ))}
    </ul>
  )
}

function Row({ item }: { item: Lecturer }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [updState, updAction, updPending] = useActionState<ActionState, FormData>(updateLecturer as any, { ok: false })
  const [delState, delAction, delPending] = useActionState<ActionState, FormData>(deleteLecturer as any, { ok: false })
  const editRef = useRef<HTMLFormElement>(null)
  const delRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (updState.ok) { setEditing(false); router.refresh() }
  }, [updState.ok, router])
  useEffect(() => { if (delState.ok) router.refresh() }, [delState.ok, router])

  if (editing) {
    return (
      <li className="py-2">
        <form ref={editRef} action={updAction} className="flex items-end gap-2">
          <input type="hidden" name="id" value={item.id} />
          <label className="grid text-sm">
            <span className="label">Name</span>
            <input className="input" name="name" defaultValue={item.name} required />
          </label>
          <button className="btn" disabled={updPending} type="submit">{updPending ? 'Saving...' : 'Save'}</button>
          <button className="btn" type="button" onClick={() => setEditing(false)}>Cancel</button>
          {updState.error && <span className="text-sm text-red-700">{updState.error}</span>}
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between py-2">
      <span>{item.name}</span>
      <div className="flex gap-2">
        <button className="btn" onClick={() => setEditing(true)} type="button">Edit</button>
        <form ref={delRef} action={delAction}>
          <input type="hidden" name="id" value={item.id} />
          <button className="btn" disabled={delPending}>{delPending ? 'Deleting...' : 'Delete'}</button>
        </form>
        {delState.error && <span className="text-sm text-red-700">{delState.error}</span>}
      </div>
    </li>
  )
}

