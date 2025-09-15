"use client"

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSubject } from '@/app/actions'

type ActionState = { ok: boolean; error?: string }

export default function SubjectForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createSubject as any, { ok: false })

  useEffect(() => {
    if (state?.ok) {
      router.refresh()
      formRef.current?.reset()
    }
  }, [state?.ok, router])

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="grid text-sm">
        <span className="label">Code</span>
        <input className="input" name="code" placeholder="CS101" required />
      </label>
      <label className="grid text-sm">
        <span className="label">Name</span>
        <input className="input" name="name" placeholder="Intro to CS" required />
      </label>
      <button className="btn" type="submit" disabled={pending}>{pending ? 'Adding...' : 'Add Subject'}</button>
      {state?.error && <span className="text-sm text-red-700">{state.error}</span>}
    </form>
  )
}
