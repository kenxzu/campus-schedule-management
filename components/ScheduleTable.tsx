"use client"

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSchedule, deleteSchedule } from '@/app/actions'

type Semester = { id: number; academicYear: string; term: 'S1'|'S2'|'S3' }
type Subject = { id: number; code: string; name: string }
type Lecturer = { code: string; name: string }
type Room = { id: number; name: string; capacity: number }

type RowData = {
  id: number
  day: string
  scheduleDate?: string | null
  start: string | Date | any
  end: string | Date | any
  capacityOverride: number | null
  subject: string
  subjectCode: string
  lecturer: string
  lecturerCode?: string
  room: string
  roomCapacity: number
  subjectId: number
  roomId: number
  semesterId: number
  classYear?: number
}

type ActionState = { ok: boolean; error?: string }

export default function ScheduleTable({
  rows,
  semesters,
  subjects,
  lecturers,
  rooms
}: {
  rows: RowData[]
  semesters: Semester[]
  subjects: Subject[]
  lecturers: Lecturer[]
  rooms: Room[]
}) {
  return (
    <div className="mt-2 overflow-x-auto rounded-md border">
      <table className="table-base w-full">
        <thead className="bg-gray-50">
          <tr>
            <th>Day</th>
            <th>Time</th>
            <th>Subject</th>
            <th>Lecturer</th>
            <th>Room</th>
            <th>Capacity</th>
            <th className="w-40">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Row key={r.id} r={r} semesters={semesters} subjects={subjects} lecturers={lecturers} rooms={rooms} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Row({ r, semesters, subjects, lecturers, rooms }: { r: RowData; semesters: Semester[]; subjects: Subject[]; lecturers: Lecturer[]; rooms: Room[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [updState, updAction, updPending] = useActionState<ActionState, FormData>(updateSchedule as any, { ok: false })
  const [delState, delAction, delPending] = useActionState<ActionState, FormData>(deleteSchedule as any, { ok: false })
  useEffect(() => { if (updState.ok) { setEditing(false); router.refresh() } }, [updState.ok, router])
  useEffect(() => { if (delState.ok) router.refresh() }, [delState.ok, router])

  const timeFmt = (t: any) => String(t).slice(0, 5)
  const effectiveCap = r.capacityOverride ?? r.roomCapacity

  if (!editing) {
    return (
      <tr className="odd:bg-white even:bg-gray-50">
        <td>{r.day}</td>
        <td>{timeFmt(r.start)} - {timeFmt(r.end)}</td>
        <td><span className="font-medium text-gray-900">{r.subjectCode}</span><span className="text-gray-500"> — {r.subject}</span></td>
        <td>{r.lecturer}</td>
        <td>{r.room}</td>
        <td>{effectiveCap}</td>
        <td>
          <div className="flex gap-2">
            <button className="btn btn-ghost" type="button" onClick={() => setEditing(true)}>Edit</button>
            <form action={delAction}>
              <input type="hidden" name="id" value={r.id} />
              <button className="btn btn-danger" disabled={delPending}>{delPending ? '...' : 'Delete'}</button>
            </form>
            {delState.error && <span className="text-sm text-red-700">{delState.error}</span>}
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="bg-yellow-50">
      <td colSpan={7}>
        <form action={updAction} className="grid gap-3 md:grid-cols-3 min-w-0">
          <input type="hidden" name="id" value={r.id} />
          <label className="grid text-sm">
            <span className="label">Semester</span>
            <select className="select" name="semesterId" defaultValue={String(r.semesterId)} required>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>{s.academicYear} - {s.term}</option>
              ))}
            </select>
          </label>
          <label className="grid text-sm">
            <span className="label">Subject</span>
            <select className="select" name="subjectId" defaultValue={String(r.subjectId)} required>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
              ))}
            </select>
          </label>
          <label className="grid text-sm">
            <span className="label">Lecturer</span>
            <select className="select" name="lecturerCode" defaultValue={(r as any).lecturerCode} required>
              {lecturers.map((l: any) => (
                <option key={l.code} value={l.code}>{l.code} — {l.name}</option>
              ))}
            </select>
          </label>
          <label className="grid text-sm">
            <span className="label">Room</span>
            <select className="select" name="roomId" defaultValue={String(r.roomId)} required>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </label>
          <label className="grid text-sm">
            <span className="label">Class Year</span>
            <select className="select" name="classYear" required defaultValue={(() => {
              const y = new Date().getFullYear();
              const before = y - 5;
              const current = (r as any).classYear as number | undefined;
              if (!current) return String(y);
              return String(current <= before ? before : current);
            })()}>
              {(() => {
                const y = new Date().getFullYear();
                const years = Array.from({ length: 6 }, (_, i) => y - i);
                const before = y - 5;
                return [
                  <option key={`before-${before}`} value={String(before)}>{`≤ ${before}`}</option>,
                  ...years.map((yy) => (
                    <option key={yy} value={String(yy)}>{yy}</option>
                  )),
                ];
              })()}
            </select>
          </label>
          {/* date field removed as requested */}
          <label className="grid text-sm">
            <span className="label">Day</span>
            <select className="select" name="day" defaultValue={String(r.day)} required>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-2 md:col-span-3 min-w-0">
            <label className="grid text-sm min-w-0">
              <span className="label">Start (1–23)</span>
              <select className="select" name="startTime" required defaultValue={timeFmt(r.start)}>
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
              <select className="select" name="endTime" required defaultValue={timeFmt(r.end)}>
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
          <label className="grid text-sm">
            <span className="label">Capacity override</span>
            <input className="input" name="capacityOverride" type="number" min={1} defaultValue={r.capacityOverride ?? ''} />
          </label>
          <div className="flex items-end gap-2 md:col-span-3">
            <button className="btn btn-primary" disabled={updPending} type="submit">{updPending ? 'Saving...' : 'Save'}</button>
            <button className="btn btn-ghost" type="button" onClick={() => setEditing(false)}>Cancel</button>
            {updState.error && <span className="text-sm text-red-700">{updState.error}</span>}
          </div>
        </form>
      </td>
    </tr>
  )
}
