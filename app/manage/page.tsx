import { db } from '@/lib/db'
import { lecturers, rooms, schedules, semesters, subjects } from '@/db/schema'
import { eq } from 'drizzle-orm'

import SemesterForm from '../../components/SemesterForm'
import LecturerForm from '../../components/LecturerForm'
import SubjectForm from '../../components/SubjectForm'
import RoomForm from '../../components/RoomForm'
import SemesterList from '../../components/SemesterList'
import LecturerList from '../../components/LecturerList'
import SubjectList from '../../components/SubjectList'
import RoomList from '../../components/RoomList'
// schedules moved to dedicated route /schedules
import Collapsible from '../../components/Collapsible'
import Reveal from '../../components/Reveal'

export default async function ManagePage() {
  const [allSemesters, allLecturers, allSubjects, allRooms] = await Promise.all([
    db.select().from(semesters).orderBy(semesters.academicYear, semesters.term),
    db.select().from(lecturers).orderBy(lecturers.name),
    db.select().from(subjects).orderBy(subjects.code),
    db.select().from(rooms).orderBy(rooms.name)
  ])

  const selectedSemesterId = allSemesters[0]?.id ?? 0

  const scheduleRows = selectedSemesterId
    ? await db
        .select({
          id: schedules.id,
          day: schedules.day,
          start: schedules.startTime,
          end: schedules.endTime,
          capacityOverride: schedules.capacityOverride,
          subject: subjects.name,
          subjectCode: subjects.code,
          lecturer: lecturers.name,
          room: rooms.name,
          roomCapacity: rooms.capacity,
          subjectId: schedules.subjectId,
          lecturerId: schedules.lecturerId,
          roomId: schedules.roomId,
          semesterId: schedules.semesterId
        })
        .from(schedules)
        .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
        .innerJoin(lecturers, eq(schedules.lecturerId, lecturers.id))
        .innerJoin(rooms, eq(schedules.roomId, rooms.id))
        .where(eq(schedules.semesterId, selectedSemesterId))
        .orderBy(schedules.day, schedules.startTime)
    : []

  return (
    <div className="grid gap-6">
      <Reveal>
      <section className="card">
        <h2 className="section-title">Semesters</h2>
        <Collapsible title="Add Semester" defaultOpen className="mt-3">
          <SemesterForm />
        </Collapsible>
        <Collapsible title="All Semesters" defaultOpen className="mt-3">
          <SemesterList items={allSemesters} />
        </Collapsible>
      </section>
      </Reveal>

      <Reveal>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="section-title">Lecturers</h2>
          <Collapsible title="Add Lecturer" defaultOpen className="mt-3">
            <LecturerForm />
          </Collapsible>
          <Collapsible title="All Lecturers" defaultOpen className="mt-3">
            <LecturerList items={allLecturers} />
          </Collapsible>
        </div>
        <div className="card">
          <h2 className="section-title">Subjects</h2>
          <Collapsible title="Add Subject" defaultOpen className="mt-3">
            <SubjectForm />
          </Collapsible>
          <Collapsible title="All Subjects" defaultOpen className="mt-3">
            <SubjectList items={allSubjects} />
          </Collapsible>
        </div>
      </section>
      </Reveal>

      <Reveal>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="section-title">Rooms</h2>
          <Collapsible title="Add Room" defaultOpen className="mt-3">
            <RoomForm />
          </Collapsible>
          <Collapsible title="All Rooms" defaultOpen className="mt-3">
            <RoomList items={allRooms} />
          </Collapsible>
        </div>
        <div className="card">
          <h2 className="section-title">Schedules</h2>
          <p className="text-sm text-gray-600">Manage schedules on the Schedules page.</p>
          <p className="mt-2 text-sm"><a className="text-gray-900 underline" href="/schedules">Go to Schedules →</a></p>
        </div>
      </section>
      </Reveal>
    </div>
  )
}

