"use client"

import { useState, useEffect, useRef } from 'react'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSubject, deleteSubject } from '@/app/actions'
import { useToast } from './ToastProvider'

type Subject = { id: number; code: string; name: string; paidCredit: number; academicCredit: number }
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
  const { addToast } = useToast()
  const editRef = useRef<HTMLFormElement>(null)

  useEffect(() => { if (updState.ok) { setEditing(false); router.refresh(); addToast({ title: 'Subject updated', variant: 'success' }) } }, [updState.ok, router, addToast])
  useEffect(() => { if (delState.ok) { router.refresh(); addToast({ title: 'Subject deleted', variant: 'success' }) } }, [delState.ok, router, addToast])
  useEffect(() => { if (updState.error) addToast({ title: updState.error, variant: 'error' }) }, [updState.error, addToast])
  useEffect(() => { if (delState.error) addToast({ title: delState.error, variant: 'error' }) }, [delState.error, addToast])

  if (editing) {
    return (
      <li className="py-2">
        <form ref={editRef} action={updAction} className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 items-end">
          <input type="hidden" name="id" value={item.id} />
          <label className="grid text-sm">
            <span className="label">Code</span>
            <input className="input" name="code" defaultValue={item.code} required />
          </label>
          <label className="grid text-sm">
            <span className="label">Name</span>
            <input className="input" name="name" defaultValue={item.name} required />
          </label>
          <label className="grid text-sm">
            <span className="label">Paid Credit (1-4)</span>
            <input className="input" name="paidCredit" type="number" min={1} max={4} defaultValue={item.paidCredit} required />
          </label>
          <label className="grid text-sm">
            <span className="label">Academic Credit (1-4)</span>
            <input className="input" name="academicCredit" type="number" min={1} max={4} defaultValue={item.academicCredit} required />
          </label>
          <div className="flex items-end gap-2 md:col-span-4">
          <button className="btn btn-primary" disabled={updPending} type="submit">{updPending ? 'Saving...' : 'Save'}</button>
          <button className="btn btn-ghost" type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
          {updState.error && <span className="text-sm text-red-700">{updState.error}</span>}
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between py-2">
      <span>
        <span className="font-medium text-gray-900">{item.code}</span>
        <span className="text-gray-500"> — {item.name}</span>
        <span className="ml-2 text-gray-500">({item.paidCredit}/{item.academicCredit} cr)</span>
      </span>
      <div className="flex gap-2">
        <button className="btn btn-ghost" onClick={() => setEditing(true)} type="button">Edit</button>
        <form action={delAction}>
          <input type="hidden" name="id" value={item.id} />
          <button className="btn btn-danger" disabled={delPending}>{delPending ? 'Deleting...' : 'Delete'}</button>
        </form>
        {delState.error && <span className="text-sm text-red-700">{delState.error}</span>}
      </div>
    </li>
  )
}
