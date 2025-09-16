"use client"

import { useActionState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSchedule } from '@/app/actions'
import { useToast } from './ToastProvider'

type Semester = { id: number; academicYear: string; term: 'S1' | 'S2' | 'S3' }
type Subject = { id: number; code: string; name: string }
type Lecturer = { id: number; name: string }
type Room = { id: number; name: string }

type Props = {
  semesters: Semester[]
  subjects: Subject[]
  lecturers: Lecturer[]
  rooms: Room[]
  defaultSemesterId: number
  defaultDate?: string
}

type ActionState = { ok: boolean; error?: string }

export default function ScheduleForm({ semesters, subjects, lecturers, rooms, defaultSemesterId }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createSchedule as any, { ok: false })
  
  function onSemesterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    try {
      const url = new URL(window.location.href)
      const params = url.searchParams
      params.set('semesterId', val)
      // preserve selected date
      const dateEl = (formRef.current?.querySelector('input[name="scheduleDate"]') as HTMLInputElement | null)
      if (dateEl?.value) params.set('scheduleDate', dateEl.value)
      router.replace(`${url.pathname}?${params.toString()}`)
    } catch {
      // noop
    }
  }
  // removed date persistence since date is not used
  const { addToast } = useToast()

  useEffect(() => {
    if (state?.ok) {
      // refresh data and reset only non-semester fields
      router.refresh()
      const form = formRef.current
      if (form) {
        const keep = new FormData(form)
        const semesterId = keep.get('semesterId') as string
        const day = (keep.get('day') as string) || ''
        const startTime = (keep.get('startTime') as string) || ''
        const endTime = (keep.get('endTime') as string) || ''
        form.reset()
        if (semesterId) {
          const sel = form.querySelector('select[name="semesterId"]') as HTMLSelectElement | null
          if (sel) sel.value = semesterId
        }
        const daySel = form.querySelector('select[name="day"]') as HTMLSelectElement | null
        if (daySel && day) daySel.value = day
        const startSel = form.querySelector('select[name="startTime"]') as HTMLSelectElement | null
        if (startSel && startTime) startSel.value = startTime
        const endSel = form.querySelector('select[name="endTime"]') as HTMLSelectElement | null
        if (endSel && endTime) endSel.value = endTime
      }
      addToast({ title: 'Schedule added', variant: 'success' })
    }
  }, [state?.ok, router])
  useEffect(() => { if (state?.error) addToast({ title: state.error, variant: 'error' }) }, [state?.error, addToast])

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 md:grid-cols-3">
      <label className="grid text-sm min-w-0">
        <span className="label">Semester</span>
        <select className="select" name="semesterId" required defaultValue={String(defaultSemesterId)} onChange={onSemesterChange}>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.academicYear} - {s.term}
            </option>
          ))}
        </select>
      </label>
      <label className="grid text-sm min-w-0">
        <span className="label">Subject</span>
        <select className="select" name="subjectId" required>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid text-sm min-w-0">
        <span className="label">Lecturer</span>
        <select className="select" name="lecturerId" required>
          {lecturers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid text-sm min-w-0">
        <span className="label">Room</span>
        <select className="select" name="roomId" required>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid text-sm min-w-0">
        <span className="label">Day</span>
        <select className="select" name="day" required defaultValue="Mon">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </label>
      {/* date field removed as requested */}
      <div className="grid gap-2 sm:grid-cols-2 md:col-span-3 min-w-0">
        <label className="grid text-sm min-w-0">
          <span className="label">Start (1–23)</span>
          <select className="select" name="startTime" required defaultValue={"08:00"}>
            {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => {
              const hh = String(h).padStart(2, '0')
              return (
                <option key={hh} value={`${hh}:00`}>
                  {hh}:00
                </option>
              )
            })}
          </select>
        </label>
        <label className="grid text-sm min-w-0">
          <span className="label">End (1–23)</span>
          <select className="select" name="endTime" required defaultValue={"10:00"}>
            {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => {
              const hh = String(h).padStart(2, '0')
              return (
                <option key={hh} value={`${hh}:00`}>
                  {hh}:00
                </option>
              )
            })}
          </select>
        </label>
      </div>
      <label className="grid text-sm min-w-0 md:col-span-3">
        <span className="label">Capacity override (optional)</span>
        <input className="input" name="capacityOverride" type="number" min={1} placeholder="leave blank to use room capacity" />
      </label>
      <div className="flex items-end gap-2 md:col-span-3">
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? 'Adding...' : 'Add Schedule'}</button>
        {state?.error && <span className="text-sm text-red-700">{state.error}</span>}
      </div>
    </form>
  )
}
