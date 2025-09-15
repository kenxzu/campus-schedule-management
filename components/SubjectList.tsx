"use client"

import { useState, useEffect, useRef } from 'react'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSubject, deleteSubject } from '@/app/actions'

type Subject = { id: number; code: string; name: string }
type ActionState = { ok: boolean; error?: string }

export default function SubjectList({ items }: { items: Subject[] }) {
  return (
    <ul className="mt-3 divide-y divide-gray-100 text-sm text-gray-800">
      {items.map((s) => (
        <Row key={s.id} item={s} />
      ))}
    </ul>
  )
}

function Row({ item }: { item: Subject }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [updState, updAction, updPending] = useActionState<ActionState, FormData>(updateSubject as any, { ok: false })
  const [delState, delAction, delPending] = useActionState<ActionState, FormData>(deleteSubject as any, { ok: false })
  const editRef = useRef<HTMLFormElement>(null)

  useEffect(() => { if (updState.ok) { setEditing(false); router.refresh() } }, [updState.ok, router])
  useEffect(() => { if (delState.ok) router.refresh() }, [delState.ok, router])

  if (editing) {
    return (
      <li className="py-2">
        <form ref={editRef} action={updAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={item.id} />
          <label className="grid text-sm">
            <span className="label">Code</span>
            <input className="input" name="code" defaultValue={item.code} required />
          </label>
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
      <span><span className="font-medium text-gray-900">{item.code}</span><span className="text-gray-500"> — {item.name}</span></span>
      <div className="flex gap-2">
        <button className="btn" onClick={() => setEditing(true)} type="button">Edit</button>
        <form action={delAction}>
          <input type="hidden" name="id" value={item.id} />
          <button className="btn" disabled={delPending}>{delPending ? 'Deleting...' : 'Delete'}</button>
        </form>
        {delState.error && <span className="text-sm text-red-700">{delState.error}</span>}
      </div>
    </li>
  )
}

