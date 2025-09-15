"use client"

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSubject } from '@/app/actions'
import { useToast } from './ToastProvider'

type ActionState = { ok: boolean; error?: string }

export default function SubjectForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createSubject as any, { ok: false })
  const { addToast } = useToast()

  useEffect(() => {
    if (state?.ok) {
      router.refresh()
      formRef.current?.reset()
      addToast({ title: 'Subject added', variant: 'success' })
    }
  }, [state?.ok, router])
  useEffect(() => { if (state?.error) addToast({ title: state.error, variant: 'error' }) }, [state?.error, addToast])

  return (
    <form ref={formRef} action={formAction} className="grid gap-2 sm:grid-cols-2">
      <label className="grid text-sm min-w-0">
        <span className="label">Code</span>
        <input className="input" name="code" placeholder="CS101" required />
      </label>
      <label className="grid text-sm min-w-0">
        <span className="label">Name</span>
        <input className="input" name="name" placeholder="Intro to CS" required />
      </label>
      <label className="grid text-sm min-w-0">
        <span className="label">Paid Credit (1-4)</span>
        <input className="input" name="paidCredit" type="number" min={1} max={4} defaultValue={1} required />
      </label>
      <label className="grid text-sm min-w-0">
        <span className="label">Academic Credit (1-4)</span>
        <input className="input" name="academicCredit" type="number" min={1} max={4} defaultValue={1} required />
      </label>
      <div className="flex items-end gap-2 sm:col-span-2">
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? 'Adding...' : 'Add Subject'}</button>
        {state?.error && <span className="text-sm text-red-700">{state.error}</span>}
      </div>
    </form>
  )
}
