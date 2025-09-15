"use client"

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { updateRoom, deleteRoom } from '@/app/actions'

type Room = { id: number; name: string; capacity: number }
type ActionState = { ok: boolean; error?: string }

export default function RoomList({ items }: { items: Room[] }) {
  return (
    <ul className="mt-3 divide-y divide-gray-100 text-sm text-gray-800">
      {items.map((r) => (
        <Row key={r.id} item={r} />
      ))}
    </ul>
  )
}

function Row({ item }: { item: Room }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [updState, updAction, updPending] = useActionState<any, FormData>(updateRoom as any, { ok: false })
  const [delState, delAction, delPending] = useActionState<any, FormData>(deleteRoom as any, { ok: false })

  useEffect(() => { if (updState?.ok) { setEditing(false); router.refresh() } }, [updState?.ok, router])
  useEffect(() => { if (delState?.ok) router.refresh() }, [delState?.ok, router])

  if (editing) {
    return (
      <li className="py-2">
        <form action={updAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={item.id} />
          <label className="grid text-sm">
            <span className="label">Name</span>
            <input className="input" name="name" defaultValue={item.name} required />
          </label>
          <label className="grid text-sm">
            <span className="label">Capacity</span>
            <input className="input" name="capacity" type="number" min={1} defaultValue={item.capacity} required />
          </label>
          <button className="btn" disabled={updPending} type="submit">{updPending ? 'Saving...' : 'Save'}</button>
          <button className="btn" type="button" onClick={() => setEditing(false)}>Cancel</button>
          {updState?.error && <span className="text-sm text-red-700">{updState.error}</span>}
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between py-1">
      <span>{item.name} <span className="text-gray-500">— capacity {item.capacity}</span></span>
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

