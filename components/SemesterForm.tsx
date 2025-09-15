"use client"

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSemester } from '@/app/actions'
import { useToast } from './ToastProvider'

type ActionState = { ok: boolean; error?: string }

export default function SemesterForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createSemester as any, { ok: false })
  const { addToast } = useToast()

  useEffect(() => {
    if (state?.ok) {
      router.refresh()
      formRef.current?.reset()
      addToast({ title: 'Semester added', variant: 'success' })
    }
  }, [state?.ok, router])
  useEffect(() => { if (state?.error) addToast({ title: state.error, variant: 'error' }) }, [state?.error, addToast])

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="grid text-sm">
        <span className="label">Academic Year</span>
        <input className="input" name="academicYear" placeholder="2025/2026" required />
      </label>
      <label className="grid text-sm">
        <span className="label">Term</span>
        <select className="select" name="term" required defaultValue="S1">
          <option value="S1">S1</option>
          <option value="S2">S2</option>
          <option value="S3">S3</option>
        </select>
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? 'Adding...' : 'Add Semester'}</button>
      {state?.error && <span className="text-sm text-red-700">{state.error}</span>}
    </form>
  )
}
