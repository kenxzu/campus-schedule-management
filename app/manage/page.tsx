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
import ScheduleForm from '../../components/ScheduleForm'
import ScheduleTable from '../../components/ScheduleTable'

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
      <section className="card">
        <h2 className="section-title">Semesters</h2>
        <SemesterForm />
        <SemesterList items={allSemesters} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="section-title">Lecturers</h2>
          <LecturerForm />
          <LecturerList items={allLecturers} />
        </div>
        <div className="card">
          <h2 className="section-title">Subjects</h2>
          <SubjectForm />
          <SubjectList items={allSubjects} />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="section-title">Rooms</h2>
          <RoomForm />
          <RoomList items={allRooms} />
        </div>
        <div className="card">
          <h2 className="section-title">Schedules</h2>
          <ScheduleForm
            semesters={allSemesters}
            subjects={allSubjects}
            lecturers={allLecturers}
            rooms={allRooms}
            defaultSemesterId={selectedSemesterId}
          />
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700">Manage Schedules</h3>
            {scheduleRows.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No schedules yet.</p>
            ) : (
              <ScheduleTable
                rows={scheduleRows as any}
                semesters={allSemesters}
                subjects={allSubjects}
                lecturers={allLecturers}
                rooms={allRooms}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

