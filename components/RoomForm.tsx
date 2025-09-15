"use client"

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createRoom } from '@/app/actions'
import { useToast } from './ToastProvider'

type ActionState = { ok: boolean; error?: string }

export default function RoomForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createRoom as any, { ok: false })
  const { addToast } = useToast()

  useEffect(() => {
    if (state?.ok) {
      router.refresh()
      formRef.current?.reset()
      addToast({ title: 'Room added', variant: 'success' })
    }
  }, [state?.ok, router])
  useEffect(() => { if (state?.error) addToast({ title: state.error, variant: 'error' }) }, [state?.error, addToast])

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="grid text-sm">
        <span className="label">Name</span>
        <input className="input" name="name" placeholder="Room A" required />
      </label>
      <label className="grid text-sm">
        <span className="label">Capacity</span>
        <input className="input" name="capacity" type="number" min={1} placeholder="30" required />
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? 'Adding...' : 'Add Room'}</button>
      {state?.error && <span className="text-sm text-red-700">{state.error}</span>}
    </form>
  )
}
