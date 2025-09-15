"use server"

import { db } from '@/lib/db'
import { and, eq, lt, gt, ne } from 'drizzle-orm'
import { dayEnum, lecturers, rooms, schedules, semesters, subjects, termEnum } from '@/db/schema'
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
  const name = String(formData.get('name') || '').trim()
  if (!name) return { ok: false, error: 'Name required' }
  try {
    await db.insert(lecturers).values({ name }).onConflictDoNothing()
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
  if (!code || !name) return { ok: false, error: 'Code and name required' }
  try {
    await db.insert(subjects).values({ code, name }).onConflictDoNothing()
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
  const lecturerId = Number(formData.get('lecturerId'))
  const roomId = Number(formData.get('roomId'))
  const day = String(formData.get('day') || '') as typeof dayEnum.enumValues[number]
  const startTime = String(formData.get('startTime') || '') // HH:MM
  const endTime = String(formData.get('endTime') || '')
  const capacityOverrideRaw = formData.get('capacityOverride')
  const capacityOverride = capacityOverrideRaw ? Number(capacityOverrideRaw) : null

  if (
    !semesterId || !subjectId || !lecturerId || !roomId ||
    !['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(day) ||
    !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)
  ) {
    return { ok: false as const, error: 'Invalid schedule input' }
  }
  if (startTime >= endTime) return { ok: false as const, error: 'Start must be before end' }
  if (capacityOverride !== null && (!Number.isFinite(capacityOverride) || capacityOverride <= 0)) {
    return { ok: false as const, error: 'Invalid capacity override' }
  }

  // Conflict check: same room, same semester, same day, overlapping time
  // Overlap when existing.start < newEnd AND existing.end > newStart
  const endTimeParam = `${endTime}:00`.slice(0, 8)
  const startTimeParam = `${startTime}:00`.slice(0, 8)

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
    return { ok: false as const, error: 'Time conflict: room already booked' }
  }

  // Optional: prevent lecturer double-booking at same time
  const lecturerOverlap = await db
    .select({ id: schedules.id })
    .from(schedules)
    .where(
      and(
        eq(schedules.semesterId, semesterId),
        eq(schedules.lecturerId, lecturerId),
        eq(schedules.day, day),
        lt(schedules.startTime, endTimeParam as any),
        gt(schedules.endTime, startTimeParam as any)
      )
    )

  if (lecturerOverlap.length > 0) {
    return { ok: false as const, error: 'Time conflict: lecturer already scheduled' }
  }

  try {
    await db.insert(schedules).values({
      semesterId,
      subjectId,
      lecturerId,
      roomId,
      day,
      startTime: startTimeParam as any,
      endTime: endTimeParam as any,
      capacityOverride: capacityOverride ?? null
    })
    revalidatePath('/')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Failed to create schedule' }
  }
}

// Updates
export async function updateLecturer(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const id = Number(formData.get('id'))
  const name = String(formData.get('name') || '').trim()
  if (!id || !name) return { ok: false as const, error: 'Invalid input' }
  try {
    await db.update(lecturers).set({ name }).where(eq(lecturers.id, id))
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
  if (!id || !code || !name) return { ok: false as const, error: 'Invalid input' }
  try {
    await db.update(subjects).set({ code, name }).where(eq(subjects.id, id))
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
  const lecturerId = Number(formData.get('lecturerId'))
  const roomId = Number(formData.get('roomId'))
  const day = String(formData.get('day') || '') as typeof dayEnum.enumValues[number]
  const startTime = String(formData.get('startTime') || '')
  const endTime = String(formData.get('endTime') || '')
  const capacityOverrideRaw = formData.get('capacityOverride')
  const capacityOverride = capacityOverrideRaw ? Number(capacityOverrideRaw) : null

  if (
    !id || !semesterId || !subjectId || !lecturerId || !roomId ||
    !['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].includes(day) ||
    !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)
  ) {
    return { ok: false as const, error: 'Invalid schedule input' }
  }
  if (startTime >= endTime) return { ok: false as const, error: 'Start must be before end' }
  if (capacityOverride !== null && (!Number.isFinite(capacityOverride) || capacityOverride <= 0)) {
    return { ok: false as const, error: 'Invalid capacity override' }
  }

  const endTimeParam = `${endTime}:00`.slice(0, 8)
  const startTimeParam = `${startTime}:00`.slice(0, 8)

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
        eq(schedules.lecturerId, lecturerId),
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
      lecturerId,
      roomId,
      day,
      startTime: startTimeParam as any,
      endTime: endTimeParam as any,
      capacityOverride: capacityOverride ?? null
    }).where(eq(schedules.id, id))
    revalidatePath('/')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Failed to update schedule' }
  }
}

// Deletes
export async function deleteLecturer(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
) {
  const id = Number(formData.get('id'))
  if (!id) return { ok: false as const, error: 'Invalid id' }
  try {
    await db.delete(lecturers).where(eq(lecturers.id, id))
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
