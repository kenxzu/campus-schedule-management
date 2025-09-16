// placeholder to re-add actions
"use server"

import { db } from '@/lib/db'
import { and, eq, lt, gt, ne } from 'drizzle-orm'
import { dayEnum, lecturers, rooms, schedules, semesters, subjects } from '@/db/schema'
import { revalidatePath } from 'next/cache'

export async function createSemester(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const academicYear = String(formData.get('academicYear') || '').trim()
  const term = String(formData.get('term') || '') as 'S1' | 'S2' | 'S3'
  if (!academicYear || !['S1', 'S2', 'S3'].includes(term)) {
    return { ok: false, error: 'Invalid semester input' }
  }
  try {
    await db.insert(semesters).values({ academicYear, term }).onConflictDoNothing()
    revalidatePath('/')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: 'Failed to create semester' }
  }
}

export async function createLecturer(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const code = String(formData.get('code') || '').trim()
  const name = String(formData.get('name') || '').trim()
  if (!code || !name) return { ok: false, error: 'Code and name required' }
  try {
    const inserted = await db
      .insert(lecturers)
      .values({ code, name })
      .onConflictDoNothing()
      .returning({ code: lecturers.code })
    // If conflict happened, nothing is returned
    if (inserted.length === 0) {
      return { ok: false, error: 'Lecturer with same code or name already exists' }
    }
    revalidatePath('/')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Failed to create lecturer' }
  }
}

export async function createSubject(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const code = String(formData.get('code') || '').trim()
  const name = String(formData.get('name') || '').trim()
  const paidCredit = Number(formData.get('paidCredit') || 0)
  const academicCredit = Number(formData.get('academicCredit') || 0)
  const inRange = (n: number) => Number.isFinite(n) && n >= 1 && n <= 4
  if (!code || !name || !inRange(paidCredit) || !inRange(academicCredit)) {
    return { ok: false, error: 'Code, name, credits 1-4 required' }
  }
  try {
    await db.insert(subjects).values({ code, name, paidCredit, academicCredit }).onConflictDoNothing()
    revalidatePath('/')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Failed to create subject' }
  }
}

export async function createRoom(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const name = String(formData.get('name') || '').trim()
  const capacity = Number(formData.get('capacity') || 0)
  if (!name || !Number.isFinite(capacity) || capacity <= 0) {
    return { ok: false, error: 'Invalid room input' }
  }
  try {
    await db.insert(rooms).values({ name, capacity }).onConflictDoNothing()
    revalidatePath('/')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Failed to create room' }
  }
}

export async function createSchedule(
  _prevState: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const semesterId = Number(formData.get('semesterId'))
  const subjectId = Number(formData.get('subjectId'))
  const lecturerCode = String(formData.get('lecturerId') || formData.get('lecturerCode') || '')
  const roomId = Number(formData.get('roomId'))
  const day = String(formData.get('day') || '') as typeof dayEnum.enumValues[number]
  const startTime = String(formData.get('startTime') || '')
  const endTime = String(formData.get('endTime') || '')
  const capacityOverrideRaw = formData.get('capacityOverride')
  const capacityOverride = capacityOverrideRaw ? Number(capacityOverrideRaw) : null
  const classYearRaw = formData.get('classYear')
  const classYear = classYearRaw ? Number(classYearRaw) : NaN

  const parseHM = (s: string) => {
    const parts = s.split(':')
    if (parts.length < 2) return null
    const h = Number(parts[0])
    const m = Number(parts[1])
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null
    return h * 60 + m
  }
  const toHHMMSS = (s: string) => {
    const parts = s.split(':')
    const h = String(parts[0] ?? '').padStart(2, '0')
    const m = String(parts[1] ?? '').padStart(2, '0')
    return `${h}:${m}:00`
  }

  if (!semesterId || !subjectId || !lecturerCode || !roomId || !['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].includes(day)) {
    return { ok: false, error: 'Invalid schedule input' }
  }
  const startMin = parseHM(startTime)
  const endMin = parseHM(endTime)
  if (startMin == null || endMin == null) return { ok: false, error: 'Invalid time format' }
  if (startMin >= endMin) return { ok: false, error: 'Start must be before end' }
  if (capacityOverride !== null && (!Number.isFinite(capacityOverride) || capacityOverride <= 0)) {
    return { ok: false, error: 'Invalid capacity override' }
  }
  if (!Number.isFinite(classYear)) return { ok: false, error: 'Invalid class year' }

  const endTimeParam = toHHMMSS(endTime)
  const startTimeParam = toHHMMSS(startTime)

  const overlap = await db
    .select({ id: schedules.id })
    .from(schedules)
    .where(
      and(
        eq(schedules.semesterId, semesterId),
        eq(schedules.roomId, roomId),
        eq(schedules.day, day),
        lt(schedules.startTime, endTimeParam as any),
        gt(schedules.endTime, startTimeParam as any)
      )
    )

  if (overlap.length > 0) {
    return { ok: false, error: 'Time conflict: room already booked' }
  }

  const lecturerOverlap = await db
    .select({ id: schedules.id })
    .from(schedules)
    .where(
      and(
        eq(schedules.semesterId, semesterId),
        eq(schedules.lecturerCode, lecturerCode),
        eq(schedules.day, day),
        lt(schedules.startTime, endTimeParam as any),
        gt(schedules.endTime, startTimeParam as any)
      )
    )

  if (lecturerOverlap.length > 0) {
    return { ok: false, error: 'Time conflict: lecturer already scheduled' }
  }

  try {
    await db.insert(schedules).values({
      semesterId,
      subjectId,
      lecturerCode,
      roomId,
      day,
      startTime: startTimeParam as any,
      endTime: endTimeParam as any,
      capacityOverride: capacityOverride ?? null,
      classYear
    })
    revalidatePath('/')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Failed to create schedule' }
  }
}

export async function updateLecturer(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const code = String(formData.get('code') || '').trim()
  const name = String(formData.get('name') || '').trim()
  if (!code || !name) return { ok: false as const, error: 'Invalid input' }
  try {
    await db.update(lecturers).set({ name }).where(eq(lecturers.code, code))
    revalidatePath('/')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Failed to update lecturer' }
  }
}

export async function updateSubject(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const id = Number(formData.get('id'))
  const code = String(formData.get('code') || '').trim()
  const name = String(formData.get('name') || '').trim()
  const paidCredit = Number(formData.get('paidCredit') || 0)
  const academicCredit = Number(formData.get('academicCredit') || 0)
  const inRange = (n: number) => Number.isFinite(n) && n >= 1 && n <= 4
  if (!id || !code || !name || !inRange(paidCredit) || !inRange(academicCredit)) {
    return { ok: false as const, error: 'Invalid input' }
  }
  try {
    await db.update(subjects).set({ code, name, paidCredit, academicCredit }).where(eq(subjects.id, id))
    revalidatePath('/')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Failed to update subject' }
  }
}

export async function updateRoom(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const id = Number(formData.get('id'))
  const name = String(formData.get('name') || '').trim()
  const capacity = Number(formData.get('capacity') || 0)
  if (!id || !name || !Number.isFinite(capacity) || capacity <= 0) {
    return { ok: false as const, error: 'Invalid input' }
  }
  try {
    await db.update(rooms).set({ name, capacity }).where(eq(rooms.id, id))
    revalidatePath('/')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Failed to update room' }
  }
}

export async function updateSemester(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const id = Number(formData.get('id'))
  const academicYear = String(formData.get('academicYear') || '').trim()
  const term = String(formData.get('term') || '') as 'S1' | 'S2' | 'S3'
  if (!id || !academicYear || !['S1', 'S2', 'S3'].includes(term)) {
    return { ok: false as const, error: 'Invalid input' }
  }
  try {
    await db.update(semesters).set({ academicYear, term }).where(eq(semesters.id, id))
    revalidatePath('/')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Failed to update semester' }
  }
}

export async function updateSchedule(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const id = Number(formData.get('id'))
  const semesterId = Number(formData.get('semesterId'))
  const subjectId = Number(formData.get('subjectId'))
  const lecturerCode = String(formData.get('lecturerId') || formData.get('lecturerCode') || '')
  const roomId = Number(formData.get('roomId'))
  const day = String(formData.get('day') || '') as typeof dayEnum.enumValues[number]
  const startTime = String(formData.get('startTime') || '')
  const endTime = String(formData.get('endTime') || '')
  const capacityOverrideRaw = formData.get('capacityOverride')
  const capacityOverride = capacityOverrideRaw ? Number(capacityOverrideRaw) : null
  const classYearRaw = formData.get('classYear')
  const classYear = classYearRaw ? Number(classYearRaw) : NaN

  if (!id || !semesterId || !subjectId || !lecturerCode || !roomId) {
    return { ok: false as const, error: 'Invalid schedule input' }
  }
  if (!['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].includes(day)) {
    return { ok: false as const, error: 'Invalid day' }
  }
  const parseHM = (s: string) => {
    const parts = s.split(':')
    if (parts.length < 2) return null
    const h = Number(parts[0])
    const m = Number(parts[1])
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null
    return h * 60 + m
  }
  const toHHMMSS = (s: string) => {
    const parts = s.split(':')
    const h = String(parts[0] ?? '').padStart(2, '0')
    const m = String(parts[1] ?? '').padStart(2, '0')
    return `${h}:${m}:00`
  }
  const startMin = parseHM(startTime)
  const endMin = parseHM(endTime)
  if (startMin == null || endMin == null) return { ok: false as const, error: 'Invalid time format' }
  if (startMin >= endMin) return { ok: false as const, error: 'Start must be before end' }
  if (capacityOverride !== null && (!Number.isFinite(capacityOverride) || capacityOverride <= 0)) {
    return { ok: false as const, error: 'Invalid capacity override' }
  }
  if (!Number.isFinite(classYear)) {
    return { ok: false as const, error: 'Invalid class year' }
  }

  const endTimeParam = toHHMMSS(endTime)
  const startTimeParam = toHHMMSS(startTime)

  const overlap = await db
    .select({ id: schedules.id })
    .from(schedules)
    .where(
      and(
        ne(schedules.id, id),
        eq(schedules.semesterId, semesterId),
        eq(schedules.roomId, roomId),
        eq(schedules.day, day),
        lt(schedules.startTime, endTimeParam as any),
        gt(schedules.endTime, startTimeParam as any)
      )
    )

  if (overlap.length > 0) {
    return { ok: false as const, error: 'Time conflict: room already booked' }
  }

  const lecturerOverlap = await db
    .select({ id: schedules.id })
    .from(schedules)
    .where(
      and(
        ne(schedules.id, id),
        eq(schedules.semesterId, semesterId),
        eq(schedules.lecturerCode, lecturerCode),
        eq(schedules.day, day),
        lt(schedules.startTime, endTimeParam as any),
        gt(schedules.endTime, startTimeParam as any)
      )
    )

  if (lecturerOverlap.length > 0) {
    return { ok: false as const, error: 'Time conflict: lecturer already scheduled' }
  }

  try {
    await db.update(schedules).set({
      semesterId,
      subjectId,
      lecturerCode,
      roomId,
      day,
      startTime: startTimeParam as any,
      endTime: endTimeParam as any,
      capacityOverride: capacityOverride ?? null,
      classYear
    }).where(eq(schedules.id, id))
    revalidatePath('/')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Failed to update schedule' }
  }
}

export async function deleteLecturer(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const code = String(formData.get('code') || '').trim()
  if (!code) return { ok: false as const, error: 'Invalid code' }
  try {
    await db.delete(lecturers).where(eq(lecturers.code, code))
    revalidatePath('/')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Unable to delete (in use?)' }
  }
}

export async function deleteSubject(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const id = Number(formData.get('id'))
  if (!id) return { ok: false as const, error: 'Invalid id' }
  try {
    await db.delete(subjects).where(eq(subjects.id, id))
    revalidatePath('/')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Unable to delete (in use?)' }
  }
}

export async function deleteRoom(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const id = Number(formData.get('id'))
  if (!id) return { ok: false as const, error: 'Invalid id' }
  try {
    await db.delete(rooms).where(eq(rooms.id, id))
    revalidatePath('/')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Unable to delete (in use?)' }
  }
}

export async function deleteSemester(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const id = Number(formData.get('id'))
  if (!id) return { ok: false as const, error: 'Invalid id' }
  try {
    await db.delete(semesters).where(eq(semesters.id, id))
    revalidatePath('/')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Unable to delete (in use?)' }
  }
}

export async function deleteSchedule(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const id = Number(formData.get('id'))
  if (!id) return { ok: false as const, error: 'Invalid id' }
  try {
    await db.delete(schedules).where(eq(schedules.id, id))
    revalidatePath('/')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Failed to delete schedule' }
  }
}
